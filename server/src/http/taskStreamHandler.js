const { UnauthenticatedError, NotFoundError } = require("./errors");
const ProjectsRepository = require("../repositories/projectsRepository");
const taskHub = require("../realtime/taskHub");

function createTaskStreamHandler({ tokens, pool }) {
  return async (req, res, next) => {
    try {
      const projectId = req.validated.params.id;
      const rawToken = req.validated.query.token;
      let claims;
      try {
        claims = tokens.verify(rawToken);
      } catch {
        throw new UnauthenticatedError();
      }
      if (!claims?.user_id || !claims?.email) throw new UnauthenticatedError();

      const projectsRepository = new ProjectsRepository({ pool });
      const project = await projectsRepository.getAccessible(projectId, claims.user_id);
      if (!project) throw new NotFoundError();

      res.status(200);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      if (typeof res.flushHeaders === "function") res.flushHeaders();

      res.write(":ok\n\n");

      const ping = setInterval(() => {
        try {
          if (!res.writableEnded) res.write(":ping\n\n");
        } catch {
          clearInterval(ping);
        }
      }, 25000);

      taskHub.subscribe(projectId, res);

      req.on("close", () => clearInterval(ping));
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { createTaskStreamHandler };
