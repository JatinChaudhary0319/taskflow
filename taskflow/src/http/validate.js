const { ValidationError } = require("./errors");

function asString(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s;
}

function oneOf(v, allowed) {
  if (v == null) return null;
  const s = asString(v);
  if (!s) return null;
  return allowed.includes(s) ? s : null;
}

function uuidLike(v) {
  const s = asString(v);
  if (!s) return null;
  const ok = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
  return ok ? s : null;
}

function dateOnly(v) {
  const s = asString(v);
  if (!s) return null;
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(s);
  return ok ? s : null;
}

function optionalTextOrNull(v) {
  if (v === null) return { kind: "set", value: null };
  if (v === undefined) return { kind: "skip" };
  const s = asString(v);
  if (!s) return { kind: "set", value: "" };
  return { kind: "set", value: s };
}

function requiredField(fields, name, value, predicate) {
  const v = predicate(value);
  if (v == null) fields[name] = "is required";
  return v;
}

function failIf(fields) {
  if (Object.keys(fields).length > 0) throw new ValidationError(fields);
}

module.exports = {
  asString,
  oneOf,
  uuidLike,
  dateOnly,
  optionalTextOrNull,
  requiredField,
  failIf,
};

