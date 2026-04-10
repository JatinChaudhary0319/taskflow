const { UnauthenticatedError } = require("../errors");

function authMiddleware({ tokens }) {
  return (req, _res, next) => {
    try {
      const header = req.headers.authorization || "";
      const m = /^Bearer\s+(.+)$/.exec(header);
      if (!m) throw new UnauthenticatedError();
      const claims = tokens.verify(m[1]);
      if (!claims || !claims.user_id || !claims.email) throw new UnauthenticatedError();
      req.auth = { userId: claims.user_id, email: claims.email };
      next();
    } catch (_err) {
      next(new UnauthenticatedError());
    }
  };
}

module.exports = authMiddleware;

