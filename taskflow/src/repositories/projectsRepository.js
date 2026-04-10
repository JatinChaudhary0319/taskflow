class ProjectsRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async listAccessible(userId) {
    const result = await this.pool.query(
      `
      select distinct p.id, p.name, p.description, p.owner_id, p.created_at
      from projects p
      left join tasks t on t.project_id = p.id
      where p.owner_id = $1 or t.assignee_id = $1 or t.creator_id = $1
      order by p.created_at desc
      `,
      [userId],
    );
    return result.rows;
  }

  async create({ ownerId, name, description }) {
    const result = await this.pool.query(
      "insert into projects (name, description, owner_id) values ($1, $2, $3) returning id, name, description, owner_id, created_at",
      [name, description ?? null, ownerId],
    );
    return result.rows[0];
  }

  async getAccessible(projectId, userId) {
    const result = await this.pool.query(
      `
      select p.id, p.name, p.description, p.owner_id, p.created_at
      from projects p
      where p.id = $1
        and (
          p.owner_id = $2
          or exists (select 1 from tasks t where t.project_id = p.id and (t.assignee_id = $2 or t.creator_id = $2))
        )
      `,
      [projectId, userId],
    );
    return result.rows[0] || null;
  }

  async getById(projectId) {
    const result = await this.pool.query(
      "select id, name, description, owner_id, created_at from projects where id = $1",
      [projectId],
    );
    return result.rows[0] || null;
  }

  async updateOwned({ projectId, ownerId, name, description }) {
    const fields = [];
    const values = [];
    let i = 1;
    if (name !== undefined) {
      fields.push(`name = $${i++}`);
      values.push(name);
    }
    if (description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(description);
    }
    values.push(projectId, ownerId);
    const result = await this.pool.query(
      `update projects set ${fields.join(", ")} where id = $${i++} and owner_id = $${i++} returning id, name, description, owner_id, created_at`,
      values,
    );
    return result.rows[0] || null;
  }

  async deleteOwned({ projectId, ownerId }) {
    const result = await this.pool.query(
      "delete from projects where id = $1 and owner_id = $2",
      [projectId, ownerId],
    );
    return result.rowCount > 0;
  }
}

module.exports = ProjectsRepository;

