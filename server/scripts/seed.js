require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  const sqlPath = path.join(__dirname, "..", "seeds", "seed.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  await pool.query(sql);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
