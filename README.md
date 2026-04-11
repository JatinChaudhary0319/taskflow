## Overview

TaskTracker backend API built with Node.js (Express), PostgreSQL, `pg`, JWT auth, bcrypt password hashing, and `node-pg-migrate` migrations.

## Architecture Decisions

- **Layering**: routes → controllers → services → repositories to keep HTTP, business rules, and persistence concerns separate.
- **Authorization in services**: project ownership and task assignee rules live in services so controllers stay thin and repositories stay data-only.
- **Migrations**: schema changes are explicit and versioned using `node-pg-migrate` (no ORM auto-migration).
- **Logging**: structured JSON logs via `pino` and `pino-http`.
- **Tradeoffs**: kept validation minimal and explicit to stay dependency-light.

## Running Locally

```bash
git clone https://github.com/JatinChaudhary0319/taskflow-server.git
cd taskflow
cp .env.example .env
docker compose up --build
```

API available at `http://localhost:3000`

Note: this submission includes **backend only** (Node.js + PostgreSQL). Frontend is intentionally not implemented.

## Running Migrations

Migrations run automatically when the API container starts.

If you want to run them manually:

```bash
docker compose run --rm api npm run migrate:up
docker compose run --rm api npm run migrate:down
```

## Test Credentials

Email: `test@example.com`  
Password: `password123`

## Seeding Data

The compose stack includes a `seed` service that loads `seeds/seed.sql` into the database.

To rerun seeds:

```bash
docker compose run --rm seed
```

## API Reference

All requests/response bodies are JSON and return `Content-Type: application/json`.

A Postman collection is included at `postman/taskflow.postman_collection.json`.

### Auth

- **POST** `/auth/register`

Request:

```json
{ "name": "Jane", "email": "jane@example.com", "password": "password123" }
```

Response:

```json
{
  "user": { "id": "...", "name": "Jane", "email": "jane@example.com", "created_at": "..." },
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

- **POST** `/auth/login`

Request:

```json
{ "email": "test@example.com", "password": "password123" }
```

Response: same shape as register.

### Projects (Bearer token required)

- **GET** `/projects`
- **POST** `/projects`

Request:

```json
{ "name": "My Project", "description": "Optional" }
```

- **GET** `/projects/:id`
- **PATCH** `/projects/:id`

Request:

```json
{ "name": "New name", "description": null }
```

- **DELETE** `/projects/:id`

### Tasks (Bearer token required)

- **GET** `/projects/:id/tasks?status=todo&assignee=<user_uuid>&page=1&limit=20`
- **POST** `/projects/:id/tasks`

Request:

```json
{
  "title": "Task title",
  "description": "Optional",
  "status": "todo",
  "priority": "medium",
  "assignee_id": null,
  "due_date": "2026-04-10"
}
```

- **PATCH** `/tasks/:id`

Request:

```json
{ "status": "done", "priority": "high", "assignee_id": null, "due_date": null }
```

- **DELETE** `/tasks/:id`

### Errors

- **400** validation:

```json
{ "error": "validation failed", "fields": { "email": "is required" } }
```

- **401** unauthenticated:

```json
{ "error": "unauthenticated" }
```

- **403** forbidden:

```json
{ "error": "forbidden" }
```

- **404** not found:

```json
{ "error": "not found" }
```

## What You'd Do With More Time

- Add a full request validator with richer error messages and better type guarantees.
- Add integration tests (auth + task flows) and CI to run them in Docker.
- Add rate limiting and refresh tokens for improved auth ergonomics.
- Add richer project membership/collaboration models beyond owner/task access.

