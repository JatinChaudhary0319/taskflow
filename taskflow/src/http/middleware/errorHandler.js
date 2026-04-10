const response = require("../response");

function errorHandler() {
  return (err, req, res, _next) => {
    response.fail(res, { err, logger: req.log });
  };
}

module.exports = errorHandler;

