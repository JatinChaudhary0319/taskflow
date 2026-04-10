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

const router = express.Router();

router.get("/", projectsController.list);
router.post("/", projectsController.create);
router.patch("/:id", projectsController.update);
router.delete("/:id", projectsController.delete);
router.get("/:id", projectsController.getDetails);

router.get("/:id/tasks", tasksController.listByProject);
router.post("/:id/tasks", tasksController.createForProject);
router.get("/:id/stats", tasksController.stats);

module.exports = router;
