const response = require("../http/response");

class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  register = async (req, res, next) => {
    try {
      const { name, email, password } = req.validated.body;
      const out = await this.authService.register({ name, email, password });
      response.success(res, { status: 201, data: out });
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.validated.body;
      const out = await this.authService.login({ email, password });
      response.success(res, { status: 200, data: out });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = AuthController;
