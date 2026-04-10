const { Pool } = require("pg");

function parseBool(v) {
  if (v == null) return false;
  return String(v).trim().toLowerCase() === "true";
}

const sslEnabled = parseBool(process.env.DB_SSL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
