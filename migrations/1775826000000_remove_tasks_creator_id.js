const up = (pgm) => {
  pgm.dropColumn("tasks", "creator_id");
};

const down = (pgm) => {
  pgm.addColumn("tasks", {
    creator_id: {
      type: "uuid",
      references: "users",
      onDelete: "cascade",
    },
  });
};

module.exports = { up, down };
