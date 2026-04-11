import { useNavigate, useParams } from "react-router-dom";

import { BreadcrumbsBar } from "@/components/layout/breadcrumbs-bar";
import { DeleteProjectDialog } from "@/components/project-detail/delete-project-dialog";
import { EditProjectDialog } from "@/components/project-detail/edit-project-dialog";
import { ProjectDetailErrorCard } from "@/components/project-detail/project-detail-error-card";
import { ProjectFiltersBar } from "@/components/project-detail/project-filters-bar";
import { ProjectHeaderBar } from "@/components/project-detail/project-header-bar";
import { ProjectStatsStrip } from "@/components/project-detail/project-stats-strip";
import { ProjectTaskWorkspace } from "@/components/project-detail/project-task-workspace";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useAuth } from "@/contexts/auth-context";
import { useProjectDetailPage } from "@/hooks/use-project-detail-page";
import { Spinner } from "@/utils/Spinner";

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const vm = useProjectDetailPage(projectId, user, token, navigate);

  if (!projectId) {
    return null;
  }

  const { project, loading, error, load } = vm;

  return (
    <div>
      <BreadcrumbsBar
        items={project ? [{ label: project.name }] : [{ label: "…", href: undefined }]}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-10 w-10" />
        </div>
      ) : error || !project ? (
        <ProjectDetailErrorCard
          message={error ?? "Not found"}
          onRetry={() => void load()}
          onBack={() => navigate("/projects")}
        />
      ) : (
        <>
          <ProjectHeaderBar
            name={project.name}
            description={project.description}
            live={vm.live}
            isOwner={vm.isOwner}
            mutationBusy={vm.mutationBusy}
            onEditProject={() => vm.setEditProjectOpen(true)}
            onDeleteProject={() => vm.setDeleteProjectOpen(true)}
            onAddTask={vm.openNewTask}
          />

          {vm.stats ? <ProjectStatsStrip stats={vm.stats} /> : null}

          <ProjectFiltersBar
            statusFilter={vm.statusFilter}
            assigneeFilter={vm.assigneeFilter}
            assigneeOptions={vm.assigneeFilterOptions}
            onStatusFilter={vm.setStatusFilter}
            onAssigneeFilter={vm.setAssigneeFilter}
            disabled={vm.mutationBusy}
          />

          <ProjectTaskWorkspace
            projectTasks={project.tasks}
            filteredTasks={vm.filteredTasks}
            dndEnabled={vm.dndEnabled}
            mutationBusy={vm.mutationBusy}
            isOwner={vm.isOwner}
            userId={vm.userId}
            onReorder={vm.handleReorder}
            onEditTask={vm.openEditTask}
            onDeleteTask={(t) => void vm.deleteTask(t)}
            onStatusChange={(t, s) => void vm.onStatusChange(t, s)}
          />

          <TaskDialog
            open={vm.taskDialogOpen}
            onOpenChange={vm.setTaskDialogOpen}
            projectId={projectId}
            task={vm.editingTask}
            directoryUsers={vm.workspaceUsers}
            onSaved={vm.onTaskSaved}
          />

          <EditProjectDialog
            open={vm.editProjectOpen}
            onOpenChange={vm.setEditProjectOpen}
            initialName={project.name}
            initialDescription={project.description}
            onSave={vm.saveProject}
            mutationBusy={vm.mutationBusy}
          />

          <DeleteProjectDialog
            open={vm.deleteProjectOpen}
            onOpenChange={vm.setDeleteProjectOpen}
            onConfirm={vm.confirmDeleteProject}
            deleting={vm.deletingProject}
          />
        </>
      )}
    </div>
  );
}
