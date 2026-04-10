class UsersRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async create({ name, email, passwordHash }) {
    const result = await this.pool.query(
      "insert into users (name, email, password) values ($1, $2, $3) returning id, name, email, created_at",
      [name, email, passwordHash],
    );
    return result.rows[0];
  }

  async getByEmailWithPassword(email) {
    const result = await this.pool.query(
      "select id, name, email, created_at, password from users where email = $1",
      [email],
    );
    return result.rows[0] || null;
  }

  async getById(id) {
    const result = await this.pool.query(
      "select id, name, email, created_at from users where id = $1",
      [id],
    );
    return result.rows[0] || null;
  }
}

module.exports = UsersRepository;

