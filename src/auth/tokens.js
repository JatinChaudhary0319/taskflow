const jwt = require("jsonwebtoken");

function parseTtlSeconds(value) {
  const n =
    typeof value === "number" && Number.isFinite(value)
      ? Math.trunc(value)
      : Number.parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("ttlSeconds must be a positive integer (seconds)");
  }
  return n;
}

class JwtTokens {
  constructor({ secret, ttlSeconds }) {
    this.secret = secret;
    this.ttlSeconds = parseTtlSeconds(ttlSeconds);
  }

  issue({ userId, email }) {
    return jwt.sign({ user_id: userId, email }, this.secret, {
      algorithm: "HS256",
      // Must be a number: string values are parsed by `ms` and bare digits default to milliseconds.
      expiresIn: this.ttlSeconds,
    });
  }

  verify(token) {
    return jwt.verify(token, this.secret, { algorithms: ["HS256"] });
  }
}

module.exports = JwtTokens;

