const response = require("../http/response");
const { asString, requiredField, failIf } = require("../http/validate");

class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  register = async (req, res, next) => {
    try {
      const fields = {};
      const name = requiredField(fields, "name", req.body?.name, asString);
      const email = requiredField(fields, "email", req.body?.email, asString);
      const password = requiredField(fields, "password", req.body?.password, asString);
      failIf(fields);
      const out = await this.authService.register({ name, email, password });
      response.success(res, { status: 200, data: out });
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const fields = {};
      const email = requiredField(fields, "email", req.body?.email, asString);
      const password = requiredField(fields, "password", req.body?.password, asString);
      failIf(fields);
      const out = await this.authService.login({ email, password });
      response.success(res, { status: 200, data: out });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = AuthController;

