const up = (pgm) => {
  pgm.addColumns("tasks", {
    creator_id: {
      type: "uuid",
      notNull: true,
      references: "users",
      onDelete: "cascade",
    },
  });

  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = current_timestamp;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
    CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at()
  `);
};

const down = (pgm) => {
  pgm.sql(`DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks`);
  pgm.sql(`DROP FUNCTION IF EXISTS set_updated_at()`);
  pgm.dropColumn("tasks", "creator_id");
};

module.exports = { up, down };

