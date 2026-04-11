const up = (pgm) => {
  pgm.addColumn("tasks", {
    sort_order: {
      type: "integer",
      notNull: true,
      default: 0,
    },
  });

  pgm.sql(`
    WITH ranked AS (
      SELECT id,
        (ROW_NUMBER() OVER (PARTITION BY project_id, status ORDER BY created_at ASC) - 1) AS rn
      FROM tasks
    )
    UPDATE tasks t
    SET sort_order = ranked.rn
    FROM ranked
    WHERE t.id = ranked.id
  `);
};

const down = (pgm) => {
  pgm.dropColumn("tasks", "sort_order");
};

module.exports = { up, down };
