import { ProjectFiltersBar } from "@/components/project-detail/project-filters-bar";
import { ProjectStatsStrip } from "@/components/project-detail/project-stats-strip";
import { ProjectTaskWorkspace } from "@/components/project-detail/project-task-workspace";
import type { ProjectDetail, ProjectStats, Task, TaskStatus, User } from "@/types/taskflow";

export type ProjectDetailMainProps = {
  project: ProjectDetail;
  stats: ProjectStats | null;
  filteredTasks: Task[];
  statusFilter: string;
  assigneeFilter: string;
  assigneeOptions: User[];
  mutationBusy: boolean;
  dndEnabled: boolean;
  isOwner: boolean;
  userId?: string;
  onStatusFilter: (v: string) => void;
  onAssigneeFilter: (v: string) => void;
  onReorder: (
    columns: { todo: string[]; in_progress: string[]; done: string[] },
    patches: { id: string; status: TaskStatus; sort_order: number }[],
  ) => Promise<void>;
  onEditTask: (t: Task) => void;
  onDeleteTask: (t: Task) => void;
  onStatusChange: (t: Task, s: TaskStatus) => void;
};

/** Stats, filters, and task workspace — updates when task/stats state changes; chrome lives outside. */
export function ProjectDetailMain({
  project,
  stats,
  filteredTasks,
  statusFilter,
  assigneeFilter,
  assigneeOptions,
  mutationBusy,
  dndEnabled,
  isOwner,
  userId,
  onStatusFilter,
  onAssigneeFilter,
  onReorder,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}: ProjectDetailMainProps) {
  return (
    <>
      {stats ? <ProjectStatsStrip stats={stats} /> : null}

      <ProjectFiltersBar
        statusFilter={statusFilter}
        assigneeFilter={assigneeFilter}
        assigneeOptions={assigneeOptions}
        onStatusFilter={onStatusFilter}
        onAssigneeFilter={onAssigneeFilter}
        disabled={mutationBusy}
      />

      <ProjectTaskWorkspace
        projectTasks={project.tasks}
        filteredTasks={filteredTasks}
        dndEnabled={dndEnabled}
        mutationBusy={mutationBusy}
        isOwner={isOwner}
        userId={userId}
        onReorder={onReorder}
        onEditTask={onEditTask}
        onDeleteTask={onDeleteTask}
        onStatusChange={onStatusChange}
      />
    </>
  );
}
