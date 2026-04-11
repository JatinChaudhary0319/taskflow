"use strict";

process.env.JWT_SECRET = "test-jwt-secret-minimum-length-thirty-two";
process.env.JWT_EXPIRY = "86400";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://noop:noop@127.0.0.1:59999/noop";

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../src/app");

describe("HTTP API (no database required)", () => {
  test("POST /auth/register returns 400 with structured fields when body empty", async () => {
    const res = await request(app).post("/auth/register").send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "validation failed");
    assert.ok(res.body.fields);
    assert.equal(res.body.fields.email, "is required");
  });

  test("POST /auth/login returns 400 when password missing", async () => {
    const res = await request(app).post("/auth/login").send({ email: "a@b.com" });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "validation failed");
    assert.equal(res.body.fields.password, "is required");
  });

  test("GET /projects without Authorization returns 401", async () => {
    const res = await request(app).get("/projects");
    assert.equal(res.status, 401);
    assert.equal(res.body.error, "unauthorized");
  });
});
