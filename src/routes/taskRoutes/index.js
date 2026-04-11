const express = require("express");

const pool = require("../../config/db");

const ProjectsRepository = require("../../repositories/projectsRepository");

const TasksService = require("../../services/tasksService");
const TasksController = require("../../controllers/tasksController");
const TasksRepository = require("../../repositories/tasksRepository");

const { validateRequest, parseTaskIdParam, parseTaskPatchBody } = require("../../http/middleware/validateRequest");

const tasksController = () => {
  const projectsRepository = new ProjectsRepository({ pool });
  const tasksRepository = new TasksRepository({ pool });
  const tasksService = new TasksService({
    projectsRepository,
    tasksRepository,
  });
  return new TasksController({ tasksService });
};

const controller = tasksController();

const router = express.Router();

router.patch(
  "/:id",
  validateRequest({ params: parseTaskIdParam, body: parseTaskPatchBody }),
  controller.update,
);
router.delete("/:id", validateRequest({ params: parseTaskIdParam }), controller.delete);

module.exports = router;
