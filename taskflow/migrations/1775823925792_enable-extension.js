const up = (pgm) => {
    pgm.sql(`
        CREATE EXTENSION
        IF NOT EXISTS pgcrypto
    `);
};

const down = (pgm) => {
    pgm.sql(`
        DROP EXTENSION
        IF EXISTS pgcrypto
    `);
};

module.exports = { up, down };
