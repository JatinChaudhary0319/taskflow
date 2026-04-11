const up = (pgm) => {
  pgm.addColumn("tasks", {
    creator_id: {
      type: "uuid",
      references: "users",
      onDelete: "set null",
    },
  });

  pgm.sql(`
    UPDATE tasks t
    SET creator_id = p.owner_id
    FROM projects p
    WHERE t.project_id = p.id AND t.creator_id IS NULL
  `);

  pgm.sql(`ALTER TABLE tasks ALTER COLUMN creator_id SET NOT NULL`);
};

const down = (pgm) => {
  pgm.dropColumn("tasks", "creator_id");
};

module.exports = { up, down };
