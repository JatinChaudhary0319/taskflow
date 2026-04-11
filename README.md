# Taskflow

## 1. Overview

Taskflow is a full-stack task and project manager: users register and sign in with JWT auth, create projects, and manage tasks with status, priority, assignee, and due dates. The assignment specified Go as the preferred backend language; **this implementation uses Node.js (Express)** with PostgreSQL, `node-pg-migrate` for schema changes, and a **React 19 + TypeScript** SPA.

**Stack**

- **API:** Express 5, `pg`, `bcryptjs` (cost ≥ 12, configurable), `jsonwebtoken`, `pino` + `pino-http`, graceful shutdown on `SIGTERM` / `SIGINT`
- **DB:** PostgreSQL 16 (Docker) with versioned up/down migrations
- **UI:** Vite, React Router 7, **shadcn-style components** (Radix primitives + `class-variance-authority` + Tailwind CSS v4), **react-hot-toast**, theme (light / dark / system) persisted in **localStorage** (`taskflow-ui-theme`), auth session in **localStorage** (`taskflow_auth`) — no Redux
- **Infra:** Root `docker-compose.yml`, **one multi-target `Dockerfile`** (`api` + `web` stages), API uses a **multi-stage** install (deps stage + runtime copy)

## 2. Architecture Decisions

- **`server/` and `client/`** are used instead of `backend/` and `frontend/` to match this repo; functionally they are the same split.
- **Layered API:** routes → controllers → services → repositories, with shared validation and a single JSON error shape.
- **JWT** carries `user_id` and `email`; access token TTL defaults to **24 hours** (`JWT_EXPIRY=86400` seconds). Secret is **only** supplied via environment variables (see `.env.example`).
- **Task `creator_id`** was reintroduced after an earlier migration removed it, so **DELETE `/tasks/:id`** matches the spec: **project owner or task creator** (not assignee-only).
- **Project access** includes owner, assignee on any task, or creator on any task, so collaborators who only create tasks still see the project.
- **UI state:** Auth and theme use **localStorage**; the API client attaches `Authorization: Bearer` from stored JWT. Protected routes redirect to `/login`.
- **Optimistic updates:** Task **status** changes update the board immediately and roll back if the PATCH fails.
- **Drag-and-drop:** Tasks persist **per-status order** via `sort_order` (migration `1775828000000`). On desktop, with filters cleared, the board uses **@dnd-kit** to reorder within a column or move between columns; changes are saved with `POST /projects/:id/tasks/reorder`.
- **Real-time (SSE):** `GET /projects/:id/stream/tasks?token=<jwt>` pushes JSON events when tasks change (create/update/delete/reorder) or the project is deleted. The UI opens `EventSource` with the token in the query string because **`EventSource` cannot send `Authorization` headers** (acceptable for local dev; production would use cookies or a gateway). Fan-out is **in-memory per Node process** (no Redis) — fine for a single API replica; scale-out would need a shared pub/sub layer.
- **Docker web image:** Static build served by **nginx** on port **3000** inside the container; the browser calls the API at **`http://localhost:4000`** (host-mapped), set at **build time** via `VITE_API_URL`.
- **User directory:** `GET /users` (authenticated) returns all users for assignee filters and the task dialog picker.

## 3. Running Locally (Docker — recommended)

Assume **Docker Desktop** (or Docker Engine + Compose) is installed.

```bash
git clone https://github.com/your-name/taskflow-your-name.git
cd taskflow-your-name
cp .env.example .env
# Edit .env if you want strong secrets; defaults are fine for local review.
docker compose up --build
```

- **App (UI):** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:4000](http://localhost:4000)  
- **Health:** `GET http://localhost:4000/health`

`docker compose up` starts PostgreSQL, runs **migrations**, runs the **idempotent seed**, then starts the API and serves the built React app.

### Docker: `FATAL: role "taskflow" does not exist` (repeating in logs)

PostgreSQL only creates `POSTGRES_USER` on **first** startup of an empty data directory. If the Docker volume was created earlier with different settings (or the default `postgres` user only), later connections as `taskflow` fail forever until the data volume is reset.

**Fix (pick one):**

1. **Recommended after a compose change:** `docker compose down` then `docker compose up --build` (this repo uses a dedicated volume name so a fresh cluster is created when the volume name changes).
2. **Nuclear option:** remove the old volume and start clean (deletes DB data on disk):

   ```bash
   docker compose down -v
   docker compose up --build
   ```

Ensure `.env` has matching credentials: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and the same user/password/db inside `DATABASE_URL`.

### Single Dockerfile

The root `Dockerfile` defines two targets:

- **`api`:** Node 20 Alpine, production dependencies, entrypoint runs migrate → seed → `node src/app.js`
- **`web`:** Multi-stage: Node build for Vite, then **nginx:alpine** serving `client/dist` on port 3000

## 4. Running Locally (without Docker)

**Database:** PostgreSQL 16+ reachable on your machine.

**1. Environment**

```bash
cp .env.example .env
# Set DATABASE_URL to your local Postgres, e.g.:
# DATABASE_URL=postgres://user:pass@localhost:5432/taskflow
# Set JWT_SECRET (long random string, ≥ 32 chars recommended)
```

**2. API (`server/`)**

```bash
cd server
npm install
npm run migrate:up
npm run seed
npm start
```

Default API port is **4000** (`PORT` in `.env`).

**3. Client (`client/`)**

```bash
cd client
npm install
# Optional: echo VITE_API_URL=http://localhost:4000 > .env.local
npm run dev
```

Vite dev server listens on **3000** and **proxies** `/auth`, `/users`, `/projects`, `/tasks`, and `/health` to `http://localhost:4000` when `VITE_API_URL` is not set, so relative API calls work out of the box.

## 5. Running Migrations

- **In Docker:** automatic on API container start (`scripts/entrypoint.sh`).
- **Manually (local):** from `server/` with `DATABASE_URL` set:

```bash
cd server
npm run migrate:up
```

Rollback last batch:

```bash
npm run migrate:down
```

Tool: **node-pg-migrate** (`server/migrations/`), every file has **up** and **down**.

## 6. Test Credentials

After seeding:

| Field    | Value           |
| -------- | --------------- |
| Email    | `test@example.com` |
| Password | `password123`      |

## 7. API Reference

Base URL (local Docker): `http://localhost:4000`  
All JSON responses use `Content-Type: application/json`.

**Auth (public)**

- `POST /auth/register` — body: `{ "name", "email", "password" }` → `201` `{ "token", "user" }`
- `POST /auth/login` — body: `{ "email", "password" }` → `200` `{ "token", "user" }`

**Projects** — header: `Authorization: Bearer <token>` (except SSE below)

- `GET /users` → `{ "users": [{ "id", "name", "email", "created_at" }, ...] }` (directory for assignee UI)
- `GET /projects` → `{ "projects": [...] }`
- `POST /projects` — `{ "name", "description?" }` → `201` project
- `GET /projects/:id` → project + `tasks[]` (tasks ordered by status column + `sort_order`)
- `PATCH /projects/:id` — owner only, `{ "name?", "description?" }`
- `DELETE /projects/:id` — owner only → `204`
- `GET /projects/:id/stream/tasks?token=<jwt>` — **SSE** (`text/event-stream`): comment heartbeats `:ping`, `data:` JSON payloads such as `{ "type": "task_created", "task", "actorUserId" }`, `{ "type": "task_updated", ... }`, `{ "type": "task_deleted", "taskId" }`, `{ "type": "tasks_reordered" }`, `{ "type": "project_deleted" }`. Requires access to the project.
- `GET /projects/:id/tasks?status=&assignee=&page=&limit=` → `{ "tasks": [...] }` (pagination optional)
- `POST /projects/:id/tasks/reorder` — body `{ "columns": { "todo": ["uuid", ...], "in_progress": [...], "done": [...] } }` (every task in the project appears exactly once) → `204`
- `POST /projects/:id/tasks` — create task
- `GET /projects/:id/stats` — task counts by status and assignee (bonus)

**Tasks**

- `PATCH /tasks/:id` — partial update (`title`, `description`, `status`, `priority`, `assignee_id`, `due_date`, `sort_order`)
- `DELETE /tasks/:id` — project **owner** or task **creator** → `204`

**Errors**

- `400` `{ "error": "validation failed", "fields": { ... } }`
- `401` `{ "error": "unauthorized" }`
- `403` `{ "error": "forbidden" }`
- `404` `{ "error": "not found" }`

**Postman:** `server/postman/taskflow.postman_collection.json`

## 8. Tests (bonus)

From `server/`:

```bash
npm test
```

Three HTTP-level checks (validation / auth) that do not require a running database.

## 9. What You’d Do With More Time

- Stronger **E2E and DB-backed integration tests** (register → create project → task flows, SSE, reorder).
- **User listing** or search for assignees instead of UUID fragments in filters.
- **SSE auth without query tokens** (BFF cookie session or `fetch()` + `ReadableStream` client).
- **Horizontal scale:** Redis pub/sub (or similar) so SSE works across multiple API instances.
- **Stricter production defaults:** fail compose if `JWT_SECRET` still equals the documented dev placeholder; add rate limiting and refresh tokens.
- **i18n** and richer **accessibility** audits on complex dialogs.

---

**UI component approach:** [shadcn/ui](https://ui.shadcn.com/)-style patterns (Radix + CVA + Tailwind), implemented directly in `client/src/components/ui/` for this repo.
