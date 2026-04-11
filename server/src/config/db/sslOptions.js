/** Shared SSL option for `pg` (Supabase / managed Postgres need TLS). */

function parseBool(v) {
  if (v == null) return false;
  return String(v).trim().toLowerCase() === "true";
}

/** When `DB_SSL=true`, use TLS (rejectUnauthorized: false matches typical Supabase certs from Node). */
function dbSslOption() {
  return parseBool(process.env.DB_SSL) ? { rejectUnauthorized: false } : undefined;
}

module.exports = { dbSslOption, parseBool };
