# Taskflow

## 1. Overview

Taskflow is a full-stack task and project manager: users register and sign in with JWT auth, create projects, and manage tasks with status, priority, assignee, and due dates. The assignment specified Go as the preferred backend language; **this implementation uses Node.js (Express)** with PostgreSQL, `node-pg-migrate` for schema changes, and a **React 19 + TypeScript** SPA.

**Stack**

- **API:** Express 5, `pg`, `bcryptjs` (cost ≥ 12, configurable), `jsonwebtoken`, `pino` + `pino-http`, graceful shutdown on `SIGTERM` / `SIGINT`
- **DB:** PostgreSQL (hosted **Supabase** or optional **Docker** Postgres via compose profile `local-db`) with versioned up/down migrations; **`DB_SSL=true`** enables TLS for managed providers
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
- **Drag-and-drop:** Tasks persist **per-status order** via `sort_order` (migration `1775828000000`). On desktop, with filters cleared, the board uses **HTML5 drag-and-drop** (`Html5Kanban`) to reorder within a column or move between columns; changes are saved with `POST /projects/:id/tasks/reorder`.
- **Real-time (SSE):** `GET /projects/:id/stream/tasks?token=<jwt>` pushes JSON events when tasks change (create/update/delete/reorder) or the project is deleted. **`GET /stream/workspace?token=<jwt>`** is a **user-scoped** stream: the API notifies everyone connected as that user when any project they care about changes (tasks created/updated/deleted/reordered, project renamed/deleted). That way the **projects list** refetches when someone assigns you to a task for the first time. Same token-in-query constraint as project SSE. Fan-out is **in-memory per Node process** (no Redis).
- **Docker web image:** Static build served by **nginx** on port **3000** inside the container; the browser calls the API at **`http://localhost:4000`** (host-mapped), set at **build time** via `VITE_API_URL`.
- **User directory:** `GET /users` (authenticated) returns all users for assignee filters and the task dialog picker.

## 3. Running Locally (Docker — recommended)

Assume **Docker Desktop** (or Docker Engine + Compose) is installed.

```bash
git clone https://github.com/JatinChaudhary0319/taskflow-jatin-chaudhary.git
cd taskflow-jatin-chaudhary
cp .env.example .env
# Edit .env: set DATABASE_URL (see below), JWT_SECRET, and matching VITE_API_URL / API_PORT / WEB_PORT / CORS_ORIGIN.
docker compose up --build
```

- **App (UI):** port from `WEB_PORT` (default **3000**) — [http://localhost:3000](http://localhost:3000)
- **API:** port from `API_PORT` (default **4000**) — [http://localhost:4000](http://localhost:4000)  
- **Health:** `GET http://localhost:4000/health` (adjust host/port if you changed `API_PORT`)

`docker compose up` starts **api** and **web** only. The API entrypoint waits until **`DATABASE_URL`** accepts connections, runs **migrations**, runs the **idempotent seed**, then serves the app. There is **no local Postgres container** unless you opt in (see next subsection).

### Using Supabase (or any remote Postgres)

1. In Supabase: **Project Settings → Database**, copy the **URI** (direct connection on port **5432** is fine for this API container).
2. In root **`.env`** set:
   - `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres`
   - `DB_SSL=true`
3. Run `docker compose up --build`. Migrations and seed apply to your Supabase project (use a dev project, not production data, unless you intend to).

**Notes**

- URL-encode special characters in the DB password inside `DATABASE_URL`.
- Prefer Supabase’s **direct** connection (`db.*.supabase.co:5432`) for **migrations**; the **transaction pooler** (`:6543`) can break tools that rely on prepared statements or session features.

### Optional: local Postgres in Docker

If you prefer a database inside Compose instead of Supabase:

1. In **`.env`**, set `DATABASE_URL=postgres://taskflow:taskflow@postgres:5432/taskflow` and `DB_SSL=false` (matching `POSTGRES_*` in `.env.example`).
2. Start with **`docker compose --profile local-db up --build`** so the `postgres` service runs and the API can resolve hostname `postgres`.

### Docker: `FATAL: role "postgres" does not exist` (only when using `--profile local-db`)

This comes from the **bundled** Postgres container. The data volume was created with a **different** `POSTGRES_USER` than your current `.env` (often the volume still has **`taskflow`** from the defaults, while `.env` was changed to `postgres`). The official image only creates the user you set on **first** init; changing `POSTGRES_USER` later does not add roles.

**Fix:** Align `POSTGRES_*` in `.env` with how the volume was first created (see `.env.example`), **or** wipe the volume: `docker compose --profile local-db down -v` then `docker compose --profile local-db up --build`.

### Docker: `FATAL: role "taskflow" does not exist` (only with `--profile local-db`)

Same root cause as above: the volume was first initialized with a **different** `POSTGRES_USER` than today’s `.env`.

**Fix (pick one):**

1. Match `POSTGRES_*` and `DATABASE_URL` to whatever the volume was created with, **or**
2. Reset the bundled DB volume (deletes local DB data):

   ```bash
   docker compose --profile local-db down -v
   docker compose --profile local-db up --build
   ```

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

Vite dev server listens on **3000** and **proxies** `/auth`, `/users`, `/projects`, `/tasks`, `/stream`, and `/health` to `http://localhost:4000` when `VITE_API_URL` is not set, so relative API calls and SSE work out of the box.

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
- `GET /stream/workspace?token=<jwt>` — **SSE** (no `Authorization` header): notifies the **authenticated user** with `data:` JSON such as `{ "type": "workspace_changed", "projectId" }` or `{ "type": "project_deleted", "projectId" }` when their **GET /projects** list may have changed (task assign/create/delete, reorder, project update/delete). Use this on the home/projects page.
- `GET /projects/:id/stream/tasks?token=<jwt>` — **SSE** (`text/event-stream`): comment heartbeats `:ping`, `data:` JSON payloads such as `{ "type": "task_created", "task", "actorUserId" }`, `{ "type": "task_updated", ... }`, `{ "type": "task_deleted", "taskId" }`, `{ "type": "tasks_reordered" }`, `{ "type": "project_deleted" }`. Requires access to the project.
- `GET /projects/:id/tasks?status=&assignee=&page=&limit=` → `{ "tasks": [...] }` (pagination optional)
- `POST /projects/:id/tasks/reorder` — body `{ "columns": { "todo": ["uuid", ...], "in_progress": [...], "done": [...] } }` (every task **the caller can see** on the project—owner, assignee, or creator—appears exactly once) → `204`
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

## 9. What I’d Do With More Time

This repo leans **full-stack with a strong frontend surface** (typed SPA, routing, live updates, DnD). Given more time, these are the next upgrades—especially on the **client**:

**Forms and validation**

- **React Hook Form + Yup (or Zod)** for login/register, task, and project dialogs: shared schema objects, fewer ad-hoc `useState` validators, and clearer field-level errors aligned with the API’s `fields` map.

**Client data layer**

- **Redux Toolkit** (or **TanStack Query**) for a **centralized store**: normalized tasks by id, deduped project fetches, and predictable updates when SSE fires—today `Context` + `useState` in hooks is fine for the assignment scope but does not scale as features grow.

**HTTP client**

- **Axios with interceptors** for **one place** that attaches `Authorization`, normalizes JSON errors into a single `ApiError` type, handles **401 → logout/redirect**, optional request IDs, and retry/backoff for idempotent GETs—today `apiFetch` in `client/src/lib/api.ts` covers auth and 401 clearing on `fetch`, but interceptors would make cross-cutting behavior easier to extend (e.g. feature flags, tracing headers).

**Loading UX**

- **Skeleton loaders** (and layout placeholders) on **projects list** and **project detail** instead of a single centered spinner, so perceived performance and layout stability match what you’d expect in a consumer product.

**Other (backend + product)**

- Stronger **E2E and DB-backed integration tests** (register → create project → task flows, SSE, reorder).
- **User search** for assignees instead of raw UUID fragments in filters.
- **Horizontal scale:** Redis pub/sub (or similar) so SSE works across multiple API instances.
- **Stricter production defaults:** fail compose if `JWT_SECRET` still equals the documented dev placeholder; rate limiting and refresh tokens.
- **i18n** and richer **accessibility** audits on complex dialogs.

---

**UI component approach:** [shadcn/ui](https://ui.shadcn.com/)-style patterns (Radix + CVA + Tailwind), implemented directly in `client/src/components/ui/` for this repo.
