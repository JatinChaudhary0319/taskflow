const response = require("../http/response");
const { asString, optionalTextOrNull, requiredField, failIf, uuidLike } = require("../http/validate");

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
      const fields = {};
      const name = requiredField(fields, "name", req.body?.name, asString);
      failIf(fields);
      const d = optionalTextOrNull(req.body?.description);
      const description = d.kind === "skip" ? undefined : d.value === "" ? null : d.value;
      const project = await this.projectsService.create({ ownerId: req.auth.userId, name, description });
      response.success(res, { status: 201, data: { project } });
    } catch (err) {
      next(err);
    }
  };

  getDetails = async (req, res, next) => {
    try {
      const fields = {};
      const projectId = requiredField(fields, "id", req.params?.id, uuidLike);
      failIf(fields);
      const out = await this.projectsService.getDetails({ projectId, userId: req.auth.userId });
      response.success(res, { status: 200, data: out });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const fields = {};
      const projectId = requiredField(fields, "id", req.params?.id, uuidLike);
      failIf(fields);
      const name = req.body?.name === undefined ? undefined : asString(req.body?.name);
      const d = optionalTextOrNull(req.body?.description);
      const description = d.kind === "skip" ? undefined : d.value === "" ? null : d.value;
      const project = await this.projectsService.update({
        projectId,
        userId: req.auth.userId,
        name,
        description,
      });
      response.success(res, { status: 200, data: { project } });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const fields = {};
      const projectId = requiredField(fields, "id", req.params?.id, uuidLike);
      failIf(fields);
      await this.projectsService.delete({ projectId, userId: req.auth.userId });
      response.success(res, { status: 200, data: { ok: true } });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = ProjectsController;

