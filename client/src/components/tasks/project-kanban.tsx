import { useCallback, useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";

import { Html5Kanban, type Html5KanbanDragHandleProps } from "@/components/kanban/html5-kanban";
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
import { computeDragPatches, KANBAN_STATUSES, normalizeColumns, tasksToColumns } from "@/lib/kanban-task-utils";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/types/taskflow";

const statusLabel: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const priorityVariant = {
  low: "secondary",
  medium: "outline",
  high: "default",
} as const;

function columnsToIds(cols: Record<TaskStatus, Task[]>) {
  return {
    todo: cols.todo.map((t) => t.id),
    in_progress: cols.in_progress.map((t) => t.id),
    done: cols.done.map((t) => t.id),
  };
}

type Props = {
  tasks: Task[];
  onReorder: (
    ids: { todo: string[]; in_progress: string[]; done: string[] },
    patches: { id: string; status: TaskStatus; sort_order: number }[],
  ) => Promise<void>;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (t: Task, s: TaskStatus) => void;
  isOwner: boolean;
  userId?: string;
  /** Disable drag and card actions while a reorder / PATCH is in flight. */
  interactionDisabled?: boolean;
};

const columnDefs = KANBAN_STATUSES.map((id) => ({ id, title: statusLabel[id] }));

export function ProjectKanban({
  tasks,
  onReorder,
  onEdit,
  onDelete,
  onStatusChange,
  isOwner,
  userId,
  interactionDisabled = false,
}: Props) {
  const [cols, setCols] = useState(() => tasksToColumns(tasks));
  const tasksRef = useRef(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    setCols(tasksToColumns(tasks));
  }, [tasks]);

  const dragBeforeRef = useRef<Record<TaskStatus, Task[]> | null>(null);

  const handleDragSessionStart = useCallback(() => {
    dragBeforeRef.current = normalizeColumns(tasksToColumns(tasksRef.current));
  }, []);

  const handleDragCancel = useCallback(() => {
    dragBeforeRef.current = null;
  }, []);

  const handleCommit = useCallback(
    async (nextCols: Record<TaskStatus, Task[]>) => {
      const before = dragBeforeRef.current;
      dragBeforeRef.current = null;
      if (before == null) return;
      const patches = computeDragPatches(before, nextCols);
      try {
        await onReorder(columnsToIds(nextCols), patches);
      } catch {
        setCols(tasksToColumns(tasksRef.current));
      }
    },
    [onReorder],
  );

  return (
    <div className="hidden md:block">
      <Html5Kanban<Task, TaskStatus>
        columns={columnDefs}
        value={cols}
        onValueChange={setCols}
        normalize={normalizeColumns}
        mapMovedItem={(t, col) => ({ ...t, status: col })}
        onDragSessionStart={handleDragSessionStart}
        onDragCancel={handleDragCancel}
        onCommit={handleCommit}
        interactionDisabled={interactionDisabled}
        renderItem={(task, _columnId, { dragHandleProps, isDragging }) => (
          <TaskKanbanCard
            task={task}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task)}
            onStatusChange={(s) => onStatusChange(task, s)}
            canDelete={isOwner || task.creator_id === userId}
            disabled={interactionDisabled}
          />
        )}
      />
    </div>
  );
}

function TaskKanbanCard({
  task,
  dragHandleProps,
  isDragging,
  onEdit,
  onDelete,
  onStatusChange,
  canDelete,
  disabled = false,
}: {
  task: Task;
  dragHandleProps: Html5KanbanDragHandleProps;
  isDragging: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (s: TaskStatus) => void;
  canDelete: boolean;
  disabled?: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden", isDragging && "opacity-50")}>
      <CardHeader className="space-y-2 p-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing disabled:pointer-events-none disabled:opacity-40"
            aria-label="Drag to reorder"
            {...dragHandleProps}
            disabled={disabled}
          >
            <GripVertical className="h-5 w-5 shrink-0" />
          </button>
          <div className="min-w-0 flex-1">
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
              <CardDescription className="mt-1 line-clamp-2">{task.description}</CardDescription>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:pl-7">
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
        <p className="text-xs text-muted-foreground sm:pl-7">
          {task.due_date ? `Due ${String(task.due_date).slice(0, 10)}` : "No due date"}
        </p>
      </CardHeader>
    </Card>
  );
}
