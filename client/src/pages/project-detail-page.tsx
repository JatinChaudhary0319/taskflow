import { useNavigate, useParams } from "react-router-dom";

import { BreadcrumbsBar } from "@/components/layout/breadcrumbs-bar";
import { DeleteProjectDialog } from "@/components/project-detail/delete-project-dialog";
import { EditProjectDialog } from "@/components/project-detail/edit-project-dialog";
import { ProjectDetailChrome } from "@/components/project-detail/project-detail-chrome";
import { ProjectDetailErrorCard } from "@/components/project-detail/project-detail-error-card";
import { ProjectDetailMain } from "@/components/project-detail/project-detail-main";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { useAuth } from "@/contexts/auth-context";
import { useProjectDetailPage } from "@/hooks/use-project-detail-page";
import { Spinner } from "@/utils/Spinner";

const LOADING_CRUMB = [{ label: "…", href: undefined }] as const;

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
      {loading ? (
        <>
          <BreadcrumbsBar items={[...LOADING_CRUMB]} />
          <div className="flex justify-center py-20">
            <Spinner className="h-10 w-10" />
          </div>
        </>
      ) : error || !project ? (
        <>
          <BreadcrumbsBar items={[...LOADING_CRUMB]} />
          <ProjectDetailErrorCard
            message={error ?? "Not found"}
            onRetry={() => void load()}
            onBack={() => navigate("/projects")}
          />
        </>
      ) : (
        <>
          <ProjectDetailChrome
            breadcrumbLabel={project.name}
            name={project.name}
            description={project.description}
            live={vm.live}
            isOwner={vm.isOwner}
            mutationBusy={vm.mutationBusy}
            onEditProject={vm.openEditProjectDialog}
            onDeleteProject={vm.openDeleteProjectDialog}
            onAddTask={vm.openNewTask}
          />

          <ProjectDetailMain
            project={project}
            stats={vm.stats}
            filteredTasks={vm.filteredTasks}
            statusFilter={vm.statusFilter}
            assigneeFilter={vm.assigneeFilter}
            assigneeOptions={vm.assigneeFilterOptions}
            mutationBusy={vm.mutationBusy}
            dndEnabled={vm.dndEnabled}
            isOwner={vm.isOwner}
            userId={vm.userId}
            onStatusFilter={vm.setStatusFilter}
            onAssigneeFilter={vm.setAssigneeFilter}
            onReorder={vm.handleReorder}
            onEditTask={vm.openEditTask}
            onDeleteTask={vm.deleteTask}
            onStatusChange={vm.onStatusChange}
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
