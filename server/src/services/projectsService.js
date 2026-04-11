const { ForbiddenError, NotFoundError, ValidationError } = require("../http/errors");
const workspaceHub = require("../realtime/workspaceHub");
const { notifyProjectWorkspace } = require("../realtime/workspaceNotify");

class ProjectsService {
  constructor({ projectsRepository, tasksRepository }) {
    this.projectsRepository = projectsRepository;
    this.tasksRepository = tasksRepository;
  }

  async list(userId) {
    return this.projectsRepository.listAccessible(userId);
  }

  async create({ ownerId, name, description }) {
    const fields = {};
    if (!name) fields.name = "is required";
    if (Object.keys(fields).length) throw new ValidationError(fields);
    const project = await this.projectsRepository.create({ ownerId, name, description: description ?? null });
    workspaceHub.broadcastMany([ownerId], { type: "workspace_changed", projectId: project.id });
    return project;
  }

  async getDetails({ projectId, userId }) {
    const project = await this.projectsRepository.getAccessible(projectId, userId);
    if (!project) throw new NotFoundError();
    const tasks = await this.tasksRepository.listByProjectAccessible({
      projectId,
      userId,
      status: null,
      assigneeId: null,
      page: null,
      limit: null,
    });
    return { ...project, tasks };
  }

  async update({ projectId, userId, name, description }) {
    const existing = await this.projectsRepository.getById(projectId);
    if (!existing) throw new NotFoundError();
    if (existing.owner_id !== userId) throw new ForbiddenError();
    if (name === undefined && description === undefined) {
      throw new ValidationError({ body: "no fields to update" });
    }
    const updated = await this.projectsRepository.updateOwned({
      projectId,
      ownerId: userId,
      name,
      description,
    });
    if (!updated) throw new ForbiddenError();
    await notifyProjectWorkspace(this.projectsRepository, projectId);
    return updated;
  }

  async delete({ projectId, userId }) {
    const existing = await this.projectsRepository.getById(projectId);
    if (!existing) throw new NotFoundError();
    if (existing.owner_id !== userId) throw new ForbiddenError();
    const stakeholderIds = await this.projectsRepository.listProjectStakeholderUserIds(projectId);
    const ok = await this.projectsRepository.deleteOwned({ projectId, ownerId: userId });
    if (!ok) throw new ForbiddenError();
    workspaceHub.broadcastMany(stakeholderIds, { type: "project_deleted", projectId });
    return true;
  }
}

module.exports = ProjectsService;

