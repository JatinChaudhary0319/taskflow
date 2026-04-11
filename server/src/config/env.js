const required = (name) => {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") {
    const err = new Error(`${name} is required`);
    err.code = "ENV_REQUIRED";
    throw err;
  }
  return String(v).trim();
};

const optional = (name, fallback) => {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") return fallback;
  return String(v).trim();
};

const optionalInt = (name, fallback) => {
  const v = process.env[name];
  if (v == null || String(v).trim() === "") return fallback;
  const n = Number.parseInt(String(v).trim(), 10);
  if (!Number.isFinite(n)) {
    const err = new Error(`${name} must be an integer`);
    err.code = "ENV_INVALID";
    throw err;
  }
  return n;
};

module.exports = {
  required,
  optional,
  optionalInt,
};

