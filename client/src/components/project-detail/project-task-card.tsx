import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Task, TaskStatus } from "@/types/taskflow";

import { priorityVariant } from "./constants";

export type ProjectTaskCardProps = {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: TaskStatus) => void;
  canDelete: boolean;
  /** Disable controls while a project/task API call is in flight. */
  disabled?: boolean;
};

function ProjectTaskCardInner({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  canDelete,
  disabled = false,
}: ProjectTaskCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            className="min-w-0 flex-1 text-left font-medium leading-snug hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            {task.title}
          </button>
          <Badge variant={priorityVariant[task.priority]} className="shrink-0 capitalize">
            {task.priority}
          </Badge>
        </div>
        {task.description ? (
          <CardDescription className="line-clamp-2">{task.description}</CardDescription>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Select
            value={task.status}
            onValueChange={(v) => onStatusChange(v as TaskStatus)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-full sm:max-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To do</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onEdit} disabled={disabled}>
              Edit
            </Button>
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={onDelete}
                disabled={disabled}
              >
                Delete
              </Button>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {task.due_date ? `Due ${String(task.due_date).slice(0, 10)}` : "No due date"}
        </p>
      </CardHeader>
    </Card>
  );
}

export const ProjectTaskCard = memo(ProjectTaskCardInner);
