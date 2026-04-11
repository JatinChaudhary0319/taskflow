#!/usr/bin/env node
/**
 * Used by Docker entrypoint: wait until DATABASE_URL accepts connections.
 * Honors DB_SSL for Supabase / managed Postgres.
 */
const { Client } = require("pg");
const { dbSslOption } = require("../src/config/db/sslOptions");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    process.exit(1);
  }
  const c = new Client({
    connectionString: url,
    ssl: dbSslOption(),
  });
  await c.connect();
  await c.end();
}

main().catch(() => process.exit(1));
