const response = require("../http/response");
const {
  asString,
  oneOf,
  uuidLike,
  dateOnly,
  optionalTextOrNull,
  requiredField,
  failIf,
} = require("../http/validate");

class TasksController {
  constructor({ tasksService }) {
    this.tasksService = tasksService;
  }

  getTaskIdParam(req) {
    return req.params?.id ?? req.params?.taskId;
  }

  listByProject = async (req, res, next) => {
    try {
      const fields = {};
      const projectId = requiredField(fields, "id", req.params?.id, uuidLike);
      failIf(fields);

      const status = oneOf(req.query?.status, ["todo", "in_progress", "done"]);
      const assigneeId = req.query?.assignee ? uuidLike(req.query.assignee) : null;

      const page = req.query?.page ? Number.parseInt(String(req.query.page), 10) : null;
      const limit = req.query?.limit ? Number.parseInt(String(req.query.limit), 10) : null;

      const tasks = await this.tasksService.list({
        projectId,
        userId: req.auth.userId,
        status,
        assigneeId,
        page: Number.isFinite(page) && page > 0 ? page : null,
        limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : null,
      });

      response.success(res, { status: 200, data: { tasks } });
    } catch (err) {
      next(err);
    }
  };

  createForProject = async (req, res, next) => {
    try {
      const fields = {};
      const projectId = requiredField(fields, "id", req.params?.id, uuidLike);
      const title = requiredField(fields, "title", req.body?.title, asString);
      failIf(fields);

      const desc = optionalTextOrNull(req.body?.description);
      const description = desc.kind === "skip" ? undefined : desc.value === "" ? null : desc.value;

      const status = oneOf(req.body?.status, ["todo", "in_progress", "done"]) || "todo";
      const priority = oneOf(req.body?.priority, ["low", "medium", "high"]) || "medium";

      const assigneeRaw =
        req.body?.assignee_id !== undefined ? req.body?.assignee_id : req.body?.assignee;
      const assigneeId =
        assigneeRaw === undefined ? undefined : assigneeRaw === null ? null : uuidLike(assigneeRaw);
      const dueDateStr = req.body?.due_date === undefined ? undefined : req.body?.due_date === null ? null : dateOnly(req.body?.due_date);
      const dueDate = dueDateStr ? new Date(`${dueDateStr}T00:00:00.000Z`) : dueDateStr === null ? null : undefined;

      const task = await this.tasksService.create({
        projectId,
        userId: req.auth.userId,
        title,
        description,
        status,
        priority,
        assigneeId,
        dueDate,
      });

      response.success(res, { status: 201, data: task });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const fields = {};
      const taskId = requiredField(fields, "id", this.getTaskIdParam(req), uuidLike);
      failIf(fields);

      const patch = {};

      if (req.body?.title !== undefined) patch.title = asString(req.body?.title);

      if (req.body?.description !== undefined) {
        const d = optionalTextOrNull(req.body?.description);
        patch.description = d.value === "" ? null : d.value;
      }

      if (req.body?.status !== undefined) patch.status = oneOf(req.body?.status, ["todo", "in_progress", "done"]);
      if (req.body?.priority !== undefined) patch.priority = oneOf(req.body?.priority, ["low", "medium", "high"]);

      if (req.body?.assignee_id !== undefined || req.body?.assignee !== undefined) {
        const raw = req.body?.assignee_id !== undefined ? req.body?.assignee_id : req.body?.assignee;
        patch.assignee_id = raw === null ? null : uuidLike(raw);
      }

      if (req.body?.due_date !== undefined) {
        if (req.body?.due_date === null) {
          patch.due_date = null;
        } else {
          const s = dateOnly(req.body?.due_date);
          patch.due_date = s ? new Date(`${s}T00:00:00.000Z`) : null;
        }
      }

      const task = await this.tasksService.update({
        taskId,
        userId: req.auth.userId,
        patch,
      });
      response.success(res, { status: 200, data: task });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const fields = {};
      const taskId = requiredField(fields, "id", this.getTaskIdParam(req), uuidLike);
      failIf(fields);
      await this.tasksService.delete({ taskId, userId: req.auth.userId });
      response.noContent(res);
    } catch (err) {
      next(err);
    }
  };

  stats = async (req, res, next) => {
    try {
      const fields = {};
      const projectId = requiredField(fields, "id", req.params?.id, uuidLike);
      failIf(fields);
      const stats = await this.tasksService.stats({ projectId, userId: req.auth.userId });
      response.success(res, { status: 200, data: { stats } });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = TasksController;

