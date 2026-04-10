const up = (pgm) => {
    pgm.createTable(
        "projects",
        {
            id: {
                type: "uuid",
                primaryKey: true,
                default:
                    pgm.func(
                        "gen_random_uuid()"
                    ),
            },

            name: {
                type: "varchar(255)",
                notNull: true,
            },

            description: {
                type: "text",
            },

            owner_id: {
                type: "uuid",
                notNull: true,
                references:
                    "users",
                onDelete:
                    "cascade",
            },

            created_at: {
                type: "timestamp",
                default:
                    pgm.func(
                        "current_timestamp"
                    ),
            },
        }
    );
};

const down = (pgm) => {
    pgm.dropTable(
        "projects"
    );
};

module.exports = { up, down };
