const express = require("express");
const env = require("../config/env");
const JwtTokens = require("../auth/tokens");

const authRoutes = require("./authRoutes");
const taskRoutes = require("./taskRoutes");
const projectRoutes = require("./projectRoutes");

const authMiddlewareFactory = require("../http/middleware/auth");

const JWT_SECRET = env.required("JWT_SECRET");
const JWT_EXPIRY = env.required("JWT_EXPIRY");

const tokens = new JwtTokens({ secret: JWT_SECRET, ttlSeconds: JWT_EXPIRY });

const authMiddleware = authMiddlewareFactory({ tokens });

function buildRoutes() {
  const router = express.Router();

  router.use("/auth", authRoutes);

  router.use(authMiddleware);

  router.use("/projects", projectRoutes);

  router.use("/tasks", taskRoutes);

  return router;
}

module.exports = buildRoutes;

