#!/usr/bin/env node
/**
 * Runs node-pg-migrate with optional --reject-unauthorized false when DB_SSL=true
 * (required for TLS to Supabase from the migrate CLI).
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.join(__dirname, "..");
const direction = process.argv[2] || "up";
const sslArgs =
  String(process.env.DB_SSL || "")
    .trim()
    .toLowerCase() === "true"
    ? ["--reject-unauthorized", "false"]
    : [];

const bin = path.join(root, "node_modules/node-pg-migrate/bin/node-pg-migrate.js");
const r = spawnSync(process.execPath, [bin, direction, "-m", "migrations", ...sslArgs], {
  cwd: root,
  stdio: "inherit",
});

process.exit(r.status ?? 1);
