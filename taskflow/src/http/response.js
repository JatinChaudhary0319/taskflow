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

  fail(res, { err, logger }) {
    if (err instanceof ValidationError) {
      return this.success(res, {
        status: 400,
        data: { error: "validation failed", fields: err.fields },
      });
    }
    if (err instanceof UnauthenticatedError) {
      return this.success(res, { status: 401, data: { error: "unauthenticated" } });
    }
    if (err instanceof ForbiddenError) {
      return this.success(res, { status: 403, data: { error: "forbidden" } });
    }
    if (err instanceof NotFoundError) {
      return this.success(res, { status: 404, data: { error: "not found" } });
    }

    if (logger) logger.error({ err }, "request failed");
    return this.success(res, { status: 500, data: { error: "internal server error" } });
  }
}

module.exports = new Response();

