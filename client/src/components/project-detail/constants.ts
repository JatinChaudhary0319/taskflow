import type { TaskStatus } from "@/types/taskflow";

export const statusLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const priorityVariant = {
  low: "secondary",
  medium: "outline",
  high: "default",
} as const;

export const BOARD_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];
