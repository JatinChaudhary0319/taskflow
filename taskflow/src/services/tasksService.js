const { ForbiddenError, NotFoundError, ValidationError } = require("../http/errors");

class TasksService {
  constructor({ projectsRepository, tasksRepository }) {
    this.projectsRepository = projectsRepository;
    this.tasksRepository = tasksRepository;
  }

  async list({ projectId, userId, status, assigneeId, page, limit }) {
    const project = await this.projectsRepository.getAccessible(projectId, userId);
    if (!project) throw new NotFoundError();
    return this.tasksRepository.listByProjectAccessible({ projectId, userId, status, assigneeId, page, limit });
  }

  async create({ projectId, creatorId, userId, title, description, status, priority, assigneeId, dueDate }) {
    const project = await this.projectsRepository.getAccessible(projectId, userId);
    if (!project) throw new NotFoundError();

    const fields = {};
    if (!title) fields.title = "is required";
    if (Object.keys(fields).length) throw new ValidationError(fields);

    return this.tasksRepository.create({
      projectId,
      creatorId,
      title,
      description: description ?? null,
      status: status || "todo",
      priority: priority || "medium",
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ?? null,
    });
  }

  async update({ taskId, userId, patch }) {
    const existing = await this.tasksRepository.getById(taskId);
    if (!existing) throw new NotFoundError();

    const project = await this.projectsRepository.getAccessible(existing.project_id, userId);
    if (!project) throw new NotFoundError();

    const fields = Object.keys(patch);
    if (fields.length === 0) throw new ValidationError({ body: "no fields to update" });

    const updated = await this.tasksRepository.update(taskId, patch);
    if (!updated) throw new NotFoundError();
    return updated;
  }

  async delete({ taskId, userId }) {
    const meta = await this.tasksRepository.getProjectOwnerAndTaskCreator(taskId);
    if (!meta) throw new NotFoundError();
    const isAllowed = meta.owner_id === userId || meta.creator_id === userId;
    if (!isAllowed) throw new ForbiddenError();
    const ok = await this.tasksRepository.delete(taskId);
    if (!ok) throw new NotFoundError();
    return true;
  }

  async stats({ projectId, userId }) {
    const project = await this.projectsRepository.getAccessible(projectId, userId);
    if (!project) throw new NotFoundError();
    return this.tasksRepository.stats(projectId, userId);
  }
}

module.exports = TasksService;

