const { NotFoundError } = require("../errors");

function notFound() {
  return (_req, _res, next) => next(new NotFoundError());
}

module.exports = notFound;

