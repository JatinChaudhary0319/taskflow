class TasksRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  async listByProjectAccessible({ projectId, userId, status, assigneeId, page, limit }) {
    const where = [
      "t.project_id = $1",
      `(p.owner_id = $2 or t.assignee_id = $2)`,
    ];
    const values = [projectId, userId];
    let i = 3;

    if (status) {
      where.push(`t.status = $${i++}`);
      values.push(status);
    }
    if (assigneeId) {
      where.push(`t.assignee_id = $${i++}`);
      values.push(assigneeId);
    }

    let paging = "";
    if (limit != null) {
      paging += ` limit $${i++}`;
      values.push(limit);
    }
    if (page != null && limit != null) {
      const offset = (page - 1) * limit;
      paging += ` offset $${i++}`;
      values.push(offset);
    }

    const result = await this.pool.query(
      `
      select t.id, t.title, t.description, t.status, t.priority, t.project_id, t.assignee_id, t.due_date, t.created_at, t.updated_at
      from tasks t
      join projects p on p.id = t.project_id
      where ${where.join(" and ")}
      order by t.created_at desc
      ${paging}
      `,
      values,
    );
    return result.rows;
  }

  async create({ projectId, title, description, status, priority, assigneeId, dueDate }) {
    const result = await this.pool.query(
      `
      insert into tasks (title, description, status, priority, project_id, assignee_id, due_date)
      values ($1, $2, $3, $4, $5, $6, $7)
      returning id, title, description, status, priority, project_id, assignee_id, due_date, created_at, updated_at
      `,
      [title, description ?? null, status, priority, projectId, assigneeId ?? null, dueDate ?? null],
    );
    return result.rows[0];
  }

  async getById(taskId) {
    const result = await this.pool.query(
      "select id, title, description, status, priority, project_id, assignee_id, due_date, created_at, updated_at from tasks where id = $1",
      [taskId],
    );
    return result.rows[0] || null;
  }

  async getProjectOwnerAndTaskAssignee(taskId) {
    const result = await this.pool.query(
      `
      select p.owner_id, t.assignee_id
      from tasks t
      join projects p on p.id = t.project_id
      where t.id = $1
      `,
      [taskId],
    );
    return result.rows[0] || null;
  }

  async update(taskId, patch) {
    const fields = [];
    const values = [];
    let i = 1;

    if (patch.title !== undefined) {
      fields.push(`title = $${i++}`);
      values.push(patch.title);
    }
    if (patch.description !== undefined) {
      fields.push(`description = $${i++}`);
      values.push(patch.description);
    }
    if (patch.status !== undefined) {
      fields.push(`status = $${i++}`);
      values.push(patch.status);
    }
    if (patch.priority !== undefined) {
      fields.push(`priority = $${i++}`);
      values.push(patch.priority);
    }
    if (patch.assignee_id !== undefined) {
      fields.push(`assignee_id = $${i++}`);
      values.push(patch.assignee_id);
    }
    if (patch.due_date !== undefined) {
      fields.push(`due_date = $${i++}`);
      values.push(patch.due_date);
    }

    values.push(taskId);
    const result = await this.pool.query(
      `update tasks set ${fields.join(", ")} where id = $${i++} returning id, title, description, status, priority, project_id, assignee_id, due_date, created_at, updated_at`,
      values,
    );
    return result.rows[0] || null;
  }

  async delete(taskId) {
    const result = await this.pool.query("delete from tasks where id = $1", [taskId]);
    return result.rowCount > 0;
  }

  async stats(projectId, userId) {
    const result = await this.pool.query(
      `
      select
        (select count(*) from tasks t join projects p on p.id = t.project_id where t.project_id = $1 and (p.owner_id = $2 or t.assignee_id = $2) and t.status = 'todo') as todo,
        (select count(*) from tasks t join projects p on p.id = t.project_id where t.project_id = $1 and (p.owner_id = $2 or t.assignee_id = $2) and t.status = 'in_progress') as in_progress,
        (select count(*) from tasks t join projects p on p.id = t.project_id where t.project_id = $1 and (p.owner_id = $2 or t.assignee_id = $2) and t.status = 'done') as done
      `,
      [projectId, userId],
    );

    const byAssignee = await this.pool.query(
      `
      select t.assignee_id, count(*)::int as count
      from tasks t
      join projects p on p.id = t.project_id
      where t.project_id = $1 and (p.owner_id = $2 or t.assignee_id = $2)
      group by t.assignee_id
      order by count desc
      `,
      [projectId, userId],
    );

    return {
      by_status: result.rows[0] || { todo: 0, in_progress: 0, done: 0 },
      by_assignee: byAssignee.rows,
    };
  }
}

module.exports = TasksRepository;

