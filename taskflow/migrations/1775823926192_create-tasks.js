const up = (pgm) => {
    pgm.createTable(
        "tasks",
        {
            id: {
                type: "uuid",
                primaryKey: true,
                default:
                    pgm.func(
                        "gen_random_uuid()"
                    ),
            },

            title: {
                type: "varchar(255)",
                notNull: true,
            },

            description: {
                type: "text",
            },

            status: {
                type:
                    "task_status",
                notNull: true,
                default:
                    "todo",
            },

            priority: {
                type:
                    "task_priority",
                notNull: true,
                default:
                    "medium",
            },

            project_id: {
                type: "uuid",
                notNull: true,
                references:
                    "projects",
                onDelete:
                    "cascade",
            },

            assignee_id: {
                type: "uuid",
                references:
                    "users",
                onDelete:
                    "set null",
            },

            due_date: {
                type: "date",
            },

            created_at: {
                type: "timestamp",
                default:
                    pgm.func(
                        "current_timestamp"
                    ),
            },

            updated_at: {
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
        "tasks"
    );
};

module.exports = { up, down };
