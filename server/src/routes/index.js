const express = require("express");
const env = require("../config/env");
const JwtTokens = require("../auth/tokens");
const pool = require("../config/db");

const authRoutes = require("./authRoutes");
const taskRoutes = require("./taskRoutes");
const projectRoutes = require("./projectRoutes");
const userRoutes = require("./userRoutes");

const authMiddlewareFactory = require("../http/middleware/auth");
const { validateRequest, parseProjectIdParam, parseSseTokenQuery } = require("../http/middleware/validateRequest");
const { createTaskStreamHandler } = require("../http/taskStreamHandler");
const { createWorkspaceStreamHandler } = require("../http/workspaceStreamHandler");

const JWT_SECRET = env.required("JWT_SECRET");
const JWT_EXPIRY = env.optionalInt("JWT_EXPIRY", 86400);

const tokens = new JwtTokens({ secret: JWT_SECRET, ttlSeconds: JWT_EXPIRY });

const authMiddleware = authMiddlewareFactory({ tokens });

const taskSseHandler = createTaskStreamHandler({ tokens, pool });
const workspaceSseHandler = createWorkspaceStreamHandler({ tokens });

function buildRoutes() {
  const router = express.Router();

  router.use("/auth", authRoutes);

  /** SSE: EventSource cannot set Authorization; token is passed as ?token= (dev-friendly; use cookies or gateway in production). */
  router.get(
    "/projects/:id/stream/tasks",
    validateRequest({ params: parseProjectIdParam, query: parseSseTokenQuery }),
    taskSseHandler,
  );

  router.get("/stream/workspace", validateRequest({ query: parseSseTokenQuery }), workspaceSseHandler);

  router.use(authMiddleware);

  router.use("/projects", projectRoutes);

  router.use("/tasks", taskRoutes);

  router.use("/users", userRoutes);

  return router;
}

module.exports = buildRoutes;

