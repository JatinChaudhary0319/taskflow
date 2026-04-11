const { ForbiddenError, NotFoundError, ValidationError } = require("../http/errors");
const taskHub = require("../realtime/taskHub");
const { notifyProjectWorkspace } = require("../realtime/workspaceNotify");

class TasksService {
  constructor({ projectsRepository, tasksRepository }) {
    this.projectsRepository = projectsRepository;
    this.tasksRepository = tasksRepository;
  }

  emit(projectId, payload) {
    taskHub.broadcast(projectId, payload);
  }

  async list({ projectId, userId, status, assigneeId, page, limit }) {
    const project = await this.projectsRepository.getAccessible(projectId, userId);
    if (!project) throw new NotFoundError();
    return this.tasksRepository.listByProjectAccessible({ projectId, userId, status, assigneeId, page, limit });
  }

  async create({ projectId, userId, title, description, status, priority, assigneeId, dueDate }) {
    const project = await this.projectsRepository.getAccessible(projectId, userId);
    if (!project) throw new NotFoundError();

    const fields = {};
    if (!title) fields.title = "is required";
    if (Object.keys(fields).length) throw new ValidationError(fields);

    const st = status || "todo";
    const task = await this.tasksRepository.create({
      projectId,
      creatorId: userId,
      title,
      description: description ?? null,
      status: st,
      priority: priority || "medium",
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ?? null,
    });
    this.emit(projectId, { type: "task_created", task, actorUserId: userId });
    await notifyProjectWorkspace(this.projectsRepository, projectId);
    return task;
  }

  async update({ taskId, userId, patch }) {
    const existing = await this.tasksRepository.getById(taskId);
    if (!existing) throw new NotFoundError();

    const project = await this.projectsRepository.getAccessible(existing.project_id, userId);
    if (!project) throw new NotFoundError();

    const nextPatch = { ...patch };
    if (
      nextPatch.status !== undefined &&
      nextPatch.status !== existing.status &&
      nextPatch.sort_order === undefined
    ) {
      nextPatch.sort_order = await this.tasksRepository.getNextSortOrder(existing.project_id, nextPatch.status);
    }

    const fields = Object.keys(nextPatch);
    if (fields.length === 0) throw new ValidationError({ body: "no fields to update" });

    const updated = await this.tasksRepository.update(taskId, nextPatch);
    if (!updated) throw new NotFoundError();
    this.emit(existing.project_id, { type: "task_updated", task: updated, actorUserId: userId });
    await notifyProjectWorkspace(this.projectsRepository, existing.project_id, [
      existing.assignee_id,
      existing.creator_id,
    ]);
    return updated;
  }

  async delete({ taskId, userId }) {
    const existing = await this.tasksRepository.getById(taskId);
    if (!existing) throw new NotFoundError();
    const meta = await this.tasksRepository.getProjectOwnerAndTaskMeta(taskId);
    if (!meta) throw new NotFoundError();
    const isAllowed = meta.owner_id === userId || meta.creator_id === userId;
    if (!isAllowed) throw new ForbiddenError();
    const projectId = existing.project_id;
    const ok = await this.tasksRepository.delete(taskId);
    if (!ok) throw new NotFoundError();
    this.emit(projectId, { type: "task_deleted", taskId, actorUserId: userId });
    await notifyProjectWorkspace(this.projectsRepository, projectId, [
      meta.owner_id,
      meta.assignee_id,
      meta.creator_id,
    ]);
    return true;
  }

  async stats({ projectId, userId }) {
    const project = await this.projectsRepository.getAccessible(projectId, userId);
    if (!project) throw new NotFoundError();
    return this.tasksRepository.stats(projectId, userId);
  }

  async reorder({ projectId, userId, columns }) {
    const project = await this.projectsRepository.getAccessible(projectId, userId);
    if (!project) throw new NotFoundError();
    try {
      await this.tasksRepository.reorderByColumns({ projectId, columns });
    } catch (e) {
      if (e.code === "REORDER_MISMATCH") {
        throw new ValidationError({ columns: "must list every task in the project exactly once" });
      }
      throw e;
    }
    this.emit(projectId, { type: "tasks_reordered", actorUserId: userId });
    await notifyProjectWorkspace(this.projectsRepository, projectId);
    return true;
  }
}

module.exports = TasksService;
