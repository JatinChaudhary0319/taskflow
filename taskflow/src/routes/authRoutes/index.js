const express = require("express");

const env = require("../../config/env");
const pool = require("../../config/db");
const JwtTokens = require("../../auth/tokens");

const AuthService = require("../../services/authService");
const AuthController = require("../../controllers/authController");
const UsersRepository = require("../../repositories/usersRepository");

const JWT_SECRET = env.required("JWT_SECRET");
const JWT_EXPIRY = env.required("JWT_EXPIRY");
const BCRYPT_COST = Math.max(env.optionalInt("BCRYPT_COST", 12), 12);

const tokens = new JwtTokens({ secret: JWT_SECRET, ttlSeconds: JWT_EXPIRY });

const authController = () => {
  const usersRepository = new UsersRepository({ pool });
  const authService = new AuthService({
    usersRepository,
    tokens,
    bcryptCost: BCRYPT_COST,
  });

  return new AuthController({ authService });
};

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
