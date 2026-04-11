const express = require("express");

const pool = require("../../config/db");

const ProjectsService = require("../../services/projectsService");
const ProjectsController = require("../../controllers/projectsController");
const ProjectsRepository = require("../../repositories/projectsRepository");

const TasksService = require("../../services/tasksService");
const TasksController = require("../../controllers/tasksController");
const TasksRepository = require("../../repositories/tasksRepository");

const {
  validateRequest,
  parseProjectCreateBody,
  parseProjectUpdateBody,
  parseProjectIdParam,
  parseTaskListQuery,
  parseTaskCreateBody,
  parseTaskReorderBody,
} = require("../../http/middleware/validateRequest");

const projectsController = () => {
  const projectsRepository = new ProjectsRepository({ pool });
  const tasksRepository = new TasksRepository({ pool });
  const projectsService = new ProjectsService({
    projectsRepository,
    tasksRepository,
  });
  return new ProjectsController({ projectsService });
};

const tasksController = () => {
  const projectsRepository = new ProjectsRepository({ pool });
  const tasksRepository = new TasksRepository({ pool });
  const tasksService = new TasksService({
    projectsRepository,
    tasksRepository,
  });
  return new TasksController({ tasksService });
};

const controller = projectsController();
const controllerTask = tasksController();

const router = express.Router();

router.get("/", controller.list);
router.post("/", validateRequest({ body: parseProjectCreateBody }), controller.create);
router.patch(
  "/:id",
  validateRequest({ params: parseProjectIdParam, body: parseProjectUpdateBody }),
  controller.update,
);
router.delete("/:id", validateRequest({ params: parseProjectIdParam }), controller.delete);
router.get("/:id/stats", validateRequest({ params: parseProjectIdParam }), controllerTask.stats);
router.get("/:id", validateRequest({ params: parseProjectIdParam }), controller.getDetails);

router.get(
  "/:id/tasks",
  validateRequest({ params: parseProjectIdParam, query: parseTaskListQuery }),
  controllerTask.listByProject,
);
router.post(
  "/:id/tasks/reorder",
  validateRequest({ params: parseProjectIdParam, body: parseTaskReorderBody }),
  controllerTask.reorder,
);
router.post(
  "/:id/tasks",
  validateRequest({ params: parseProjectIdParam, body: parseTaskCreateBody }),
  controllerTask.createForProject,
);

module.exports = router;
