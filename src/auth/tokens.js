const jwt = require("jsonwebtoken");

class JwtTokens {
  constructor({ secret, ttlSeconds }) {
    this.secret = secret;
    this.ttlSeconds = ttlSeconds;
  }

  issue({ userId, email }) {
    return jwt.sign({ user_id: userId, email }, this.secret, {
      algorithm: "HS256",
      expiresIn: this.ttlSeconds,
    });
  }

  verify(token) {
    return jwt.verify(token, this.secret, { algorithms: ["HS256"] });
  }
}

module.exports = JwtTokens;

