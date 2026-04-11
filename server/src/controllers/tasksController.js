const response = require("../http/response");

class TasksController {
  constructor({ tasksService }) {
    this.tasksService = tasksService;
  }

  listByProject = async (req, res, next) => {
    try {
      const { id: projectId } = req.validated.params;
      const { status, assigneeId, page, limit } = req.validated.query;

      const tasks = await this.tasksService.list({
        projectId,
        userId: req.auth.userId,
        status,
        assigneeId,
        page,
        limit,
      });

      response.success(res, { status: 200, data: { tasks } });
    } catch (err) {
      next(err);
    }
  };

  createForProject = async (req, res, next) => {
    try {
      const { id: projectId } = req.validated.params;
      const { title, description, status, priority, assigneeId, dueDate } = req.validated.body;

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
      const { id: taskId } = req.validated.params;
      const patch = req.validated.body;

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
      const { id: taskId } = req.validated.params;
      await this.tasksService.delete({ taskId, userId: req.auth.userId });
      response.noContent(res);
    } catch (err) {
      next(err);
    }
  };

  stats = async (req, res, next) => {
    try {
      const { id: projectId } = req.validated.params;
      const stats = await this.tasksService.stats({ projectId, userId: req.auth.userId });
      response.success(res, { status: 200, data: { stats } });
    } catch (err) {
      next(err);
    }
  };

  reorder = async (req, res, next) => {
    try {
      const { id: projectId } = req.validated.params;
      const { columns } = req.validated.body;
      await this.tasksService.reorder({ projectId, userId: req.auth.userId, columns });
      response.noContent(res);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = TasksController;
