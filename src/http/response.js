const {
  ValidationError,
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
} = require("./errors");

class Response {
  success(res, { status = 200, data }) {
    res.status(status);
    res.type("application/json");
    res.send(data);
  }

  /** 204 No Content — no response body. */
  noContent(res) {
    res.status(204).send();
  }

  /** 500 with standard JSON body; use for unexpected failures (e.g. health DB check). */
  serverError(res, { err, logger }) {
    if (logger) logger.error({ err }, "request failed");
    res.status(500);
    res.type("application/json");
    return res.send({ error: "internal server error" });
  }

  fail(res, { err, logger }) {
    res.type("application/json");
    if (err instanceof ValidationError) {
      res.status(400);
      return res.send({ error: "validation failed", fields: err.fields });
    }
    if (err instanceof UnauthenticatedError) {
      res.status(401);
      return res.send({ error: "unauthorized" });
    }
    if (err instanceof ForbiddenError) {
      res.status(403);
      return res.send({ error: "forbidden" });
    }
    if (err instanceof NotFoundError) {
      res.status(404);
      return res.send({ error: "not found" });
    }

    return this.serverError(res, { err, logger });
  }
}

module.exports = new Response();
