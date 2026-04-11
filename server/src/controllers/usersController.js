const response = require("../http/response");

class UsersController {
  constructor({ usersService }) {
    this.usersService = usersService;
  }

  list = async (_req, res, next) => {
    try {
      const users = await this.usersService.listDirectory();
      response.success(res, { status: 200, data: { users } });
    } catch (err) {
      next(err);
    }
  };
}

module.exports = UsersController;
