const response = require("../http/response");

class ProjectsController {
  constructor({ projectsService }) {
    this.projectsService = projectsService;
  }

  list = async (req, res, next) => {
    try {
      const projects = await this.projectsService.list(req.auth.userId);
      response.success(res, { status: 200, data: { projects } });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const { name, description } = req.validated.body;
      const project = await this.projectsService.create({ ownerId: req.auth.userId, name, description });
      response.success(res, { status: 201, data: project });
    } catch (err) {
      next(err);
    }
  };

  getDetails = async (req, res, next) => {
    try {
      const { id: projectId } = req.validated.params;
      const out = await this.projectsService.getDetails({ projectId, userId: req.auth.userId });
      response.success(res, { status: 200, data: out });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id: projectId } = req.validated.params;
      const { name, description } = req.validated.body;
      const project = await this.projectsService.update({
        projectId,
        userId: req.auth.userId,
        name,
        description,
      });
      response.success(res, { status: 200, data: project });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const { id: projectId } = req.validated.params;
      await this.projectsService.delete({ projectId, userId: req.auth.userId });
      response.noContent(res);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = ProjectsController;
