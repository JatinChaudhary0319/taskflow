TRUNCATE TABLE tasks, projects, users RESTART IDENTITY CASCADE;

INSERT INTO users (id, name, email, password)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test User',
  'test@example.com',
  '$2b$12$m/3dh6gSUWOR/tYBKSoRzeZKCfg3VUdM5IN9.SITUr/iAYp8ftn42'
);

INSERT INTO projects (id, name, description, owner_id)
VALUES (
  '00000000-0000-0000-0000-000000000101',
  'Demo Project',
  'Seed project',
  '00000000-0000-0000-0000-000000000001'
);

INSERT INTO tasks (id, title, status, priority, project_id, assignee_id)
VALUES
(
  '00000000-0000-0000-0000-000000000201',
  'Setup backend',
  'todo',
  'high',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001'
),
(
  '00000000-0000-0000-0000-000000000202',
  'Implement API',
  'in_progress',
  'medium',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001'
),
(
  '00000000-0000-0000-0000-000000000203',
  'Deploy',
  'done',
  'low',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001'
);
