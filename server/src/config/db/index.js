const { Pool } = require("pg");

const { dbSslOption } = require("./sslOptions");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: dbSslOption(),
});

module.exports = pool;
