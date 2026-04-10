const express = require("express");

const pool = require("../../config/db");

const ProjectsService = require("../../services/projectsService");
const ProjectsController = require("../../controllers/projectsController");
const ProjectsRepository = require("../../repositories/projectsRepository");

const TasksService = require("../../services/tasksService");
const TasksController = require("../../controllers/tasksController");
const TasksRepository = require("../../repositories/tasksRepository");

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
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.delete);
router.get("/:id", controller.getDetails);

router.get("/:id/tasks", controllerTask.listByProject);
router.post("/:id/tasks", controllerTask.createForProject);
router.get("/:id/stats", controllerTask.stats);

module.exports = router;
