const up = (pgm) => {
    pgm.createIndex(
        "users",
        "email"
    );

    pgm.createIndex(
        "projects",
        "owner_id"
    );

    pgm.createIndex(
        "tasks",
        "project_id"
    );

    pgm.createIndex(
        "tasks",
        "assignee_id"
    );

    pgm.createIndex(
        "tasks",
        "status"
    );
};

const down = (pgm) => {
    pgm.dropIndex(
        "tasks",
        "status"
    );

    pgm.dropIndex(
        "tasks",
        "assignee_id"
    );

    pgm.dropIndex(
        "tasks",
        "project_id"
    );

    pgm.dropIndex(
        "projects",
        "owner_id"
    );

    pgm.dropIndex(
        "users",
        "email"
    );
};

module.exports = { up, down };
