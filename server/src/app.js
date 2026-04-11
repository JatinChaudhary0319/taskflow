require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pinoHttp = require("pino-http");

const pool = require("./config/db");
const logger = require("./config/logger");
const env = require("./config/env");
const response = require("./http/response");

const errorHandler = require("./http/middleware/errorHandler");
const notFound = require("./http/middleware/notFound");

const buildRoutes = require("./routes");

const PORT = env.optional("PORT", "4000");

const app = express();
app.disable("x-powered-by");
const corsOrigin = env.optional("CORS_ORIGIN", "*");
app.use(
  cors({
    origin:
      corsOrigin === "*"
        ? true
        : corsOrigin.split(",").map((s) => s.trim()).filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

app.get("/health", async (req, res) => {
  try {
    await pool.query("select 1 as ok");
    response.success(res, { status: 200, data: { ok: true } });
  } catch (err) {
    response.serverError(res, { err, logger: req.log });
  }
});

app.use(buildRoutes());
app.use(notFound());
app.use(errorHandler());

function shutdown(signal, server) {
  logger.info({ signal }, "shutdown started");
  server.close(async () => {
    try {
      await pool.end();
      logger.info("shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "shutdown failed");
      process.exit(1);
    }
  });
  setTimeout(() => process.exit(1), 15000).unref();
}

if (require.main === module) {
  const server = app.listen(PORT, () => logger.info({ port: PORT }, "server started"));
  process.on("SIGTERM", () => shutdown("SIGTERM", server));
  process.on("SIGINT", () => shutdown("SIGINT", server));
}

module.exports = app;

