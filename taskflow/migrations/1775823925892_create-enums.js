const up = (pgm) => {
    pgm.createType(
        "task_status",
        [
            "todo",
            "in_progress",
            "done",
        ]
    );

    pgm.createType(
        "task_priority",
        [
            "low",
            "medium",
            "high",
        ]
    );
};

const down = (pgm) => {
    pgm.dropType(
        "task_priority"
    );

    pgm.dropType(
        "task_status"
    );
};

module.exports = { up, down };
