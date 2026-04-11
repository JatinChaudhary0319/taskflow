const { UnauthenticatedError } = require("./errors");
const workspaceHub = require("../realtime/workspaceHub");

function createWorkspaceStreamHandler({ tokens }) {
  return async (req, res, next) => {
    try {
      const rawToken = req.validated.query.token;
      let claims;
      try {
        claims = tokens.verify(rawToken);
      } catch {
        throw new UnauthenticatedError();
      }
      if (!claims?.user_id || !claims?.email) throw new UnauthenticatedError();

      const userId = claims.user_id;

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

      workspaceHub.subscribe(userId, res);

      req.on("close", () => clearInterval(ping));
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { createWorkspaceStreamHandler };
