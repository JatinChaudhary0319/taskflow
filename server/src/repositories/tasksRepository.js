class TasksRepository {
  constructor({ pool }) {
    this.pool = pool;
  }

  static orderByStatusAndSort() {
    return `
      order by
        case t.status when 'todo' then 0 when 'in_progress' then 1 else 2 end,
        t.sort_order asc,
        t.created_at asc
    `;
  }

  async listByProjectAccessible({ projectId, userId, status, assigneeId, page, limit }) {
    const where = [
      "t.project_id = $1",
      `(p.owner_id = $2 or t.assignee_id = $2 or t.creator_id = $2)`,
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
      select t.id, t.title, t.description, t.status, t.priority, t.project_id, t.assignee_id, t.creator_id, t.due_date, t.sort_order, t.created_at, t.updated_at
      from tasks t
      join projects p on p.id = t.project_id
      where ${where.join(" and ")}
      ${TasksRepository.orderByStatusAndSort()}
      ${paging}
      `,
      values,
    );
    return result.rows;
  }

  async getNextSortOrder(projectId, status) {
    const result = await this.pool.query(
      `select coalesce(max(sort_order), -1) + 1 as n from tasks where project_id = $1 and status = $2`,
      [projectId, status],
    );
    return Number(result.rows[0].n);
  }

  async create({ projectId, creatorId, title, description, status, priority, assigneeId, dueDate }) {
    const sortOrder = await this.getNextSortOrder(projectId, status || "todo");
    const result = await this.pool.query(
      `
      insert into tasks (title, description, status, priority, project_id, assignee_id, creator_id, due_date, sort_order)
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id, title, description, status, priority, project_id, assignee_id, creator_id, due_date, sort_order, created_at, updated_at
      `,
      [
        title,
        description ?? null,
        status,
        priority,
        projectId,
        assigneeId ?? null,
        creatorId,
        dueDate ?? null,
        sortOrder,
      ],
    );
    return result.rows[0];
  }

  async getById(taskId) {
    const result = await this.pool.query(
      "select id, title, description, status, priority, project_id, assignee_id, creator_id, due_date, sort_order, created_at, updated_at from tasks where id = $1",
      [taskId],
    );
    return result.rows[0] || null;
  }

  async listIdsForProject(projectId) {
    const result = await this.pool.query("select id from tasks where project_id = $1", [projectId]);
    return result.rows.map((r) => r.id);
  }

  async reorderByColumns({ projectId, userId, columns }) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: accessRows } = await client.query(
        `
        select t.id
        from tasks t
        join projects p on p.id = t.project_id
        where t.project_id = $1
          and (p.owner_id = $2 or t.assignee_id = $2 or t.creator_id = $2)
        `,
        [projectId, userId],
      );
      const accessibleIds = new Set(accessRows.map((r) => r.id));

      const todo = columns.todo ?? [];
      const inProgress = columns.in_progress ?? [];
      const done = columns.done ?? [];
      const allProvided = [...todo, ...inProgress, ...done];

      if (allProvided.length !== accessibleIds.size) {
        const err = new Error("column mismatch");
        err.code = "REORDER_MISMATCH";
        throw err;
      }
      const seen = new Set();
      for (const id of allProvided) {
        if (!accessibleIds.has(id) || seen.has(id)) {
          const err = new Error("invalid task id");
          err.code = "REORDER_MISMATCH";
          throw err;
        }
        seen.add(id);
      }

      const ids = [];
      const statuses = [];
      const sortOrders = [];
      for (const status of ["todo", "in_progress", "done"]) {
        const col = columns[status] ?? [];
        for (let i = 0; i < col.length; i++) {
          ids.push(col[i]);
          statuses.push(status);
          sortOrders.push(i);
        }
      }

      if (ids.length > 0) {
        await client.query(
          `
          update tasks t
          set
            status = x.status::task_status,
            sort_order = x.sort_order
          from (
            select *
            from unnest($1::uuid[], $2::text[], $3::int[]) as x(id, status, sort_order)
          ) x
          where t.id = x.id and t.project_id = $4
          `,
          [ids, statuses, sortOrders, projectId],
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async getProjectOwnerAndTaskMeta(taskId) {
    const result = await this.pool.query(
      `
      select p.owner_id, t.assignee_id, t.creator_id
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
    if (patch.sort_order !== undefined) {
      fields.push(`sort_order = $${i++}`);
      values.push(patch.sort_order);
    }

    values.push(taskId);
    const result = await this.pool.query(
      `update tasks set ${fields.join(", ")} where id = $${i++} returning id, title, description, status, priority, project_id, assignee_id, creator_id, due_date, sort_order, created_at, updated_at`,
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
        (select count(*) from tasks t join projects p on p.id = t.project_id where t.project_id = $1 and (p.owner_id = $2 or t.assignee_id = $2 or t.creator_id = $2) and t.status = 'todo') as todo,
        (select count(*) from tasks t join projects p on p.id = t.project_id where t.project_id = $1 and (p.owner_id = $2 or t.assignee_id = $2 or t.creator_id = $2) and t.status = 'in_progress') as in_progress,
        (select count(*) from tasks t join projects p on p.id = t.project_id where t.project_id = $1 and (p.owner_id = $2 or t.assignee_id = $2 or t.creator_id = $2) and t.status = 'done') as done
      `,
      [projectId, userId],
    );

    const byAssignee = await this.pool.query(
      `
      select t.assignee_id, count(*)::int as count
      from tasks t
      join projects p on p.id = t.project_id
      where t.project_id = $1 and (p.owner_id = $2 or t.assignee_id = $2 or t.creator_id = $2)
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
