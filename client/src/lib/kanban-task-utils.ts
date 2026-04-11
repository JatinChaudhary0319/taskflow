import type { Task, TaskStatus } from "@/types/taskflow";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

function sortInColumn(a: Task, b: Task) {
  const ao = a.sort_order ?? 0;
  const bo = b.sort_order ?? 0;
  if (ao !== bo) return ao - bo;
  return String(a.created_at).localeCompare(String(b.created_at));
}

export function tasksToColumns(tasks: Task[]): Record<TaskStatus, Task[]> {
  const cols: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };
  for (const t of tasks) {
    cols[t.status].push(t);
  }
  for (const k of COLUMNS) cols[k].sort(sortInColumn);
  return cols;
}

export function normalizeColumns(cols: Record<TaskStatus, Task[]>): Record<TaskStatus, Task[]> {
  const out: Record<TaskStatus, Task[]> = {
    todo: [...cols.todo],
    in_progress: [...cols.in_progress],
    done: [...cols.done],
  };
  for (const k of COLUMNS) {
    out[k] = out[k].map((t, i) => ({ ...t, sort_order: i, status: k }));
  }
  return out;
}

function findPlaced(cols: Record<TaskStatus, Task[]>, id: string): { status: TaskStatus; index: number } | null {
  for (const st of COLUMNS) {
    const idx = cols[st].findIndex((t) => t.id === id);
    if (idx >= 0) return { status: st, index: idx };
  }
  return null;
}

/** Tasks whose column or index changed vs drag-start snapshot (for PATCH sync). */
export function computeDragPatches(
  before: Record<TaskStatus, Task[]>,
  after: Record<TaskStatus, Task[]>,
): { id: string; status: TaskStatus; sort_order: number }[] {
  const patches: { id: string; status: TaskStatus; sort_order: number }[] = [];
  const seen = new Set<string>();
  for (const st of COLUMNS) {
    for (let i = 0; i < after[st].length; i++) {
      const id = after[st][i].id;
      if (seen.has(id)) continue;
      seen.add(id);
      const prev = findPlaced(before, id);
      if (!prev) continue;
      if (prev.status !== st || prev.index !== i) {
        patches.push({ id, status: st, sort_order: i });
      }
    }
  }
  return patches;
}

export const KANBAN_STATUSES: readonly TaskStatus[] = COLUMNS;
