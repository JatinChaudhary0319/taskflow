const up = (pgm) => {
    pgm.createTable(
        "users",
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

            email: {
                type: "varchar(255)",
                notNull: true,
                unique: true,
            },

            password: {
                type: "varchar(255)",
                notNull: true,
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
        "users"
    );
};

module.exports = { up, down };
