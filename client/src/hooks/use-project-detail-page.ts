import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NavigateFunction } from "react-router-dom";
import toast from "react-hot-toast";

import { formatApiError } from "@/contexts/auth-context";
import { useMutationRun } from "@/hooks/use-mutation-run";
import { useProjectLiveEvents } from "@/hooks/use-project-live-events";
import { ApiError, apiFetch } from "@/lib/api";
import type { ProjectDetail, ProjectStats, Task, TaskStatus, User } from "@/types/taskflow";

export function useProjectDetailPage(
  projectId: string | undefined,
  user: User | null,
  token: string | null,
  navigate: NavigateFunction,
) {
  const { run, busy: mutationBusy } = useMutationRun();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);

  const loadDirectoryUsers = useCallback(async () => {
    if (!projectId) return;
    try {
      const { users } = await apiFetch<{ users: User[] }>("/users");
      setWorkspaceUsers(users ?? []);
    } catch {
      setWorkspaceUsers([]);
      toast.error("Could not load user directory");
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setWorkspaceUsers([]);
      return;
    }
    void loadDirectoryUsers();
  }, [projectId, loadDirectoryUsers]);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, statsRes] = await Promise.all([
        apiFetch<ProjectDetail>(`/projects/${projectId}`),
        apiFetch<{ stats: ProjectStats }>(`/projects/${projectId}/stats`).catch(() => ({
          stats: null as unknown as ProjectStats,
        })),
      ]);
      setProject(detail);
      if (statsRes.stats) setStats(statsRes.stats);
    } catch (err) {
      setError(formatApiError(err));
      if (err instanceof ApiError && err.status === 404) {
        toast.error("Project not found");
      } else if (err instanceof ApiError && err.status !== 401) {
        toast.error(formatApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  /** Refetch project + stats without toggling `loading` (avoids full-page spinner / header flicker). */
  const loadSilent = useCallback(async () => {
    if (!projectId) return;
    try {
      const [detail, statsRes] = await Promise.all([
        apiFetch<ProjectDetail>(`/projects/${projectId}`),
        apiFetch<{ stats: ProjectStats }>(`/projects/${projectId}/stats`).catch(() => ({
          stats: null as unknown as ProjectStats,
        })),
      ]);
      setProject(detail);
      if (statsRes.stats) setStats(statsRes.stats);
    } catch {
      /* keep existing UI */
    }
  }, [projectId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const loadSilentRef = useRef(loadSilent);
  useEffect(() => {
    loadSilentRef.current = loadSilent;
  }, [loadSilent]);

  useEffect(() => {
    void load();
  }, [load]);

  const onTaskEvent = useCallback(() => {
    void loadSilentRef.current();
  }, []);

  const { live } = useProjectLiveEvents({
    projectId,
    token: token ?? undefined,
    navigate,
    onTaskEvent,
  });

  const isOwner = Boolean(user?.id && project?.owner_id === user.id);
  const dndEnabled = statusFilter === "all" && assigneeFilter === "all";

  const filteredTasks = useMemo(() => {
    if (!project?.tasks) return [];
    return project.tasks.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (assigneeFilter === "all") return true;
      if (assigneeFilter === "unassigned") return t.assignee_id == null;
      if (assigneeFilter === "me") return t.assignee_id === user?.id;
      return t.assignee_id === assigneeFilter;
    });
  }, [project?.tasks, statusFilter, assigneeFilter, user?.id]);

  const assigneeFilterOptions = useMemo(
    () =>
      [...workspaceUsers].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [workspaceUsers],
  );

  const handleReorder = useCallback(
    async (
      columns: { todo: string[]; in_progress: string[]; done: string[] },
      patches: { id: string; status: TaskStatus; sort_order: number }[],
    ) => {
      if (!projectId) return;
      try {
        await run(async () => {
          await apiFetch(`/projects/${projectId}/tasks/reorder`, {
            method: "POST",
            body: JSON.stringify({ columns }),
          });
          if (patches.length > 0) {
            await Promise.all(
              patches.map((p) =>
                apiFetch(`/tasks/${p.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ status: p.status, sort_order: p.sort_order }),
                }),
              ),
            );
          }
          await loadSilentRef.current();
        });
      } catch (err) {
        toast.error(formatApiError(err));
        throw err;
      }
    },
    [projectId, run],
  );

  const onStatusChange = useCallback(
    async (task: Task, next: TaskStatus) => {
      if (!projectId || task.status === next) return;
      const prev = task.status;
      setProject((p) =>
        p
          ? {
              ...p,
              tasks: p.tasks.map((x) => (x.id === task.id ? { ...x, status: next } : x)),
            }
          : p,
      );
      try {
        await run(async () => {
          const updated = await apiFetch<Task>(`/tasks/${task.id}`, {
            method: "PATCH",
            body: JSON.stringify({ status: next }),
          });
          setProject((p) =>
            p
              ? {
                  ...p,
                  tasks: p.tasks.map((x) => (x.id === task.id ? updated : x)),
                }
              : p,
          );
          await loadSilentRef.current();
        });
      } catch (err) {
        setProject((p) =>
          p
            ? {
                ...p,
                tasks: p.tasks.map((x) => (x.id === task.id ? { ...x, status: prev } : x)),
              }
            : p,
        );
        toast.error(formatApiError(err));
      }
    },
    [projectId, run],
  );

  const deleteTask = useCallback(
    async (task: Task) => {
      if (!window.confirm(`Delete task “${task.title}”?`)) return;
      try {
        await run(async () => {
          await apiFetch(`/tasks/${task.id}`, { method: "DELETE" });
          setProject((p) => (p ? { ...p, tasks: p.tasks.filter((x) => x.id !== task.id) } : p));
          await loadSilentRef.current();
        });
        toast.success("Task deleted");
      } catch (err) {
        toast.error(formatApiError(err));
      }
    },
    [run],
  );

  const saveProject = useCallback(
    async (payload: { name: string; description: string | null }) => {
      if (!projectId) throw new Error("Missing project");
      await run(async () => {
        const updated = await apiFetch<{ name: string; description: string | null }>(
          `/projects/${projectId}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: payload.name,
              description: payload.description,
            }),
          },
        );
        setProject((p) => (p ? { ...p, name: updated.name, description: updated.description } : p));
        toast.success("Project updated");
      });
    },
    [projectId, run],
  );

  const confirmDeleteProject = useCallback(async () => {
    if (!projectId) return;
    setDeletingProject(true);
    try {
      await run(async () => {
        await apiFetch(`/projects/${projectId}`, { method: "DELETE" });
        toast.success("Project deleted");
        navigate("/projects", { replace: true });
      });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setDeletingProject(false);
      setDeleteProjectOpen(false);
    }
  }, [projectId, navigate, run]);

  const openNewTask = useCallback(() => {
    setEditingTask(null);
    setTaskDialogOpen(true);
  }, []);

  const openEditProjectDialog = useCallback(() => {
    setEditProjectOpen(true);
  }, []);

  const openDeleteProjectDialog = useCallback(() => {
    setDeleteProjectOpen(true);
  }, []);

  const openEditTask = useCallback((t: Task) => {
    setEditingTask(t);
    setTaskDialogOpen(true);
  }, []);

  const onTaskSaved = useCallback((t: Task) => {
    setProject((p) => {
      if (!p) return p;
      const exists = p.tasks.some((x) => x.id === t.id);
      if (exists) {
        return { ...p, tasks: p.tasks.map((x) => (x.id === t.id ? t : x)) };
      }
      return { ...p, tasks: [t, ...p.tasks] };
    });
    void loadSilentRef.current();
  }, []);

  return {
    project,
    stats,
    loading,
    error,
    load,
    live,
    mutationBusy,
    statusFilter,
    setStatusFilter,
    assigneeFilter,
    setAssigneeFilter,
    assigneeFilterOptions,
    workspaceUsers,
    filteredTasks,
    dndEnabled,
    isOwner,
    taskDialogOpen,
    setTaskDialogOpen,
    editingTask,
    editProjectOpen,
    setEditProjectOpen,
    deleteProjectOpen,
    setDeleteProjectOpen,
    deletingProject,
    handleReorder,
    onStatusChange,
    deleteTask,
    saveProject,
    confirmDeleteProject,
    openNewTask,
    openEditProjectDialog,
    openDeleteProjectDialog,
    openEditTask,
    onTaskSaved,
    userId: user?.id,
  };
}
