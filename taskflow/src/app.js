require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pinoHttp = require("pino-http");

const pool = require("./config/db");
const logger = require("./config/logger");
const env = require("./config/env");

const errorHandler = require("./http/middleware/errorHandler");
const notFound = require("./http/middleware/notFound");

const buildRoutes = require("./routes");

const PORT = env.optional("PORT", "5000");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1 as ok");
    res.type("application/json").status(200).send({ ok: true });
  } catch (_e) {
    res.type("application/json").status(500).send({ ok: false });
  }
});

app.use(buildRoutes());
app.use(notFound());
app.use(errorHandler());

const server = app.listen(PORT, () => logger.info({ port: PORT }, "server started"));

function shutdown(signal) {
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

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

module.exports = app;

