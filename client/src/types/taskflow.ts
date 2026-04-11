export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string;
  assignee_id: string | null;
  creator_id?: string;
  due_date: string | null;
  sort_order?: number;
  created_at: string;
  updated_at: string;
};

export type ProjectDetail = Project & { tasks: Task[] };

export type ProjectStats = {
  by_status: { todo: string; in_progress: string; done: string };
  by_assignee: { assignee_id: string | null; count: number }[];
};
