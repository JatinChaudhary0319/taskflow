import { memo } from "react";

import { ProjectKanban } from "@/components/tasks/project-kanban";
import { Card, CardContent } from "@/components/ui/card";
import type { Task, TaskStatus } from "@/types/taskflow";

import { BOARD_STATUSES, statusLabel } from "./constants";
import { ProjectTaskCard } from "./project-task-card";

export type ProjectTaskWorkspaceProps = {
  projectTasks: Task[];
  filteredTasks: Task[];
  dndEnabled: boolean;
  mutationBusy: boolean;
  isOwner: boolean;
  userId?: string;
  onReorder: (
    columns: { todo: string[]; in_progress: string[]; done: string[] },
    patches: { id: string; status: TaskStatus; sort_order: number }[],
  ) => Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (t: Task) => void;
  onStatusChange: (t: Task, s: TaskStatus) => void;
};

function ProjectTaskWorkspaceInner({
  projectTasks,
  filteredTasks,
  dndEnabled,
  mutationBusy,
  isOwner,
  userId,
  onReorder,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}: ProjectTaskWorkspaceProps) {
  return (
    <>
      {!dndEnabled ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Clear status and assignee filters to drag tasks between columns and reorder.
        </p>
      ) : null}

      {dndEnabled ? (
        <ProjectKanban
          tasks={projectTasks}
          onReorder={onReorder}
          onEdit={onEditTask}
          onDelete={onDeleteTask}
          onStatusChange={onStatusChange}
          isOwner={Boolean(isOwner)}
          userId={userId}
          interactionDisabled={mutationBusy}
        />
      ) : (
        <div className="hidden gap-4 md:grid md:grid-cols-3">
          {BOARD_STATUSES.map((col) => (
            <div key={col} className="rounded-lg border bg-card/50 p-3">
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{statusLabel[col]}</h2>
              <ul className="flex flex-col gap-3">
                {filteredTasks
                  .filter((t) => t.status === col)
                  .map((task) => (
                    <li key={task.id}>
                      <ProjectTaskCard
                        task={task}
                        onEdit={() => onEditTask(task)}
                        onDelete={() => onDeleteTask(task)}
                        onStatusChange={(s) => onStatusChange(task, s)}
                        canDelete={isOwner || task.creator_id === userId}
                        disabled={mutationBusy}
                      />
                    </li>
                  ))}
                {filteredTasks.filter((t) => t.status === col).length === 0 ? (
                  <li className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                    No tasks
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ul className="flex flex-col gap-3 md:hidden">
        {filteredTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No tasks match these filters.
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <li key={task.id}>
              <ProjectTaskCard
                task={task}
                onEdit={() => onEditTask(task)}
                onDelete={() => onDeleteTask(task)}
                onStatusChange={(s) => onStatusChange(task, s)}
                canDelete={isOwner || task.creator_id === userId}
                disabled={mutationBusy}
              />
            </li>
          ))
        )}
      </ul>
    </>
  );
}

export const ProjectTaskWorkspace = memo(ProjectTaskWorkspaceInner);
