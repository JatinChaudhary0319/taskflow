-- Idempotent seed: safe to run on every API container start.
-- Test login: test@example.com / password123

INSERT INTO users (id, name, email, password)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test User',
  'test@example.com',
  '$2b$12$eQX9e8SfI0iVUIfjrTabSem77JhU1E2PxlP887zhuVTHgIIwbvc4K'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projects (id, name, description, owner_id)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'Demo Project',
  'Seed project',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (id, title, status, priority, project_id, assignee_id, creator_id)
VALUES
(
  '00000000-0000-0000-0000-000000000201',
  'Setup backend',
  'todo',
  'high',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
),
(
  '00000000-0000-0000-0000-000000000202',
  'Implement API',
  'in_progress',
  'medium',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
),
(
  '00000000-0000-0000-0000-000000000203',
  'Deploy',
  'done',
  'low',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;
