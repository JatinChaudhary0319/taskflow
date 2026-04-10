const bcrypt = require("bcryptjs");

const { ValidationError, UnauthenticatedError } = require("../http/errors");

class AuthService {
  constructor({ usersRepository, tokens, bcryptCost }) {
    this.usersRepository = usersRepository;
    this.tokens = tokens;
    this.bcryptCost = bcryptCost;
  }

  async register({ name, email, password }) {
    const fields = {};
    if (!name) fields.name = "is required";
    if (!email) fields.email = "is required";
    if (!password) fields.password = "is required";
    if (Object.keys(fields).length) throw new ValidationError(fields);

    const passwordHash = await bcrypt.hash(password, this.bcryptCost);
    const user = await this.usersRepository.create({ name, email, passwordHash });
    const token = this.tokens.issue({ userId: user.id, email: user.email });
    return {
      token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }

  async login({ email, password }) {
    const fields = {};
    if (!email) fields.email = "is required";
    if (!password) fields.password = "is required";
    if (Object.keys(fields).length) throw new ValidationError(fields);

    const row = await this.usersRepository.getByEmailWithPassword(email);
    if (!row) throw new UnauthenticatedError();
    const ok = await bcrypt.compare(password, row.password);
    if (!ok) throw new UnauthenticatedError();
    const token = this.tokens.issue({ userId: row.id, email: row.email });
    return {
      token,
      user: { id: row.id, name: row.name, email: row.email },
    };
  }
}

module.exports = AuthService;

