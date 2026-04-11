import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatApiError, useAuth } from "@/contexts/auth-context";
import { ApiError, apiFetch } from "@/lib/api";
import type { Task, TaskPriority, TaskStatus, User } from "@/types/taskflow";

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : "";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: Task | null;
  onSaved: (task: Task) => void;
  /** All registered users (for assignee picker). */
  directoryUsers: User[];
};

export function TaskDialog({ open, onOpenChange, projectId, task, onSaved, directoryUsers }: Props) {
  const { user } = useAuth();
  const editing = Boolean(task);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const assigneePickerUsers = useMemo(() => {
    const map = new Map(directoryUsers.map((u) => [u.id, u]));
    if (task?.assignee_id && !map.has(task.assignee_id)) {
      map.set(task.assignee_id, {
        id: task.assignee_id,
        name: `User ${task.assignee_id.slice(0, 8)}…`,
        email: "",
      });
    }
    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [directoryUsers, task?.assignee_id]);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee_id ?? null);
      setDueDate(toDateInputValue(task.due_date));
    } else {
      setTitle("");
      setDescription("");
      setStatus("todo");
      setPriority("medium");
      setAssigneeId(null);
      setDueDate("");
    }
  }, [open, task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      if (editing && task) {
        const body: Record<string, unknown> = {
          title: title.trim(),
          description: description.trim() === "" ? null : description.trim(),
          status,
          priority,
          due_date: dueDate === "" ? null : dueDate,
          assignee_id: assigneeId,
        };
        const updated = await apiFetch<Task>(`/tasks/${task.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        onSaved(updated);
        toast.success("Task updated");
      } else {
        const created = await apiFetch<Task>(`/projects/${projectId}/tasks`, {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() === "" ? null : description.trim(),
            status,
            priority,
            assignee_id: assigneeId,
            due_date: dueDate === "" ? null : dueDate,
          }),
        });
        onSaved(created);
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(formatApiError(err));
      if (err instanceof ApiError && err.status === 401) {
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const assigneeSelectValue =
    user?.id && assigneeId === user.id ? `__me:${user.id}` : (assigneeId ?? "none");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit task" : "New task"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update fields and save." : "Add a task to this project."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-desc">Description</Label>
              <Input
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Assignee</Label>
              <Select
                value={assigneeSelectValue}
                onValueChange={(v) => {
                  if (v === "none") setAssigneeId(null);
                  else if (v.startsWith("__me:")) setAssigneeId(v.slice("__me:".length));
                  else setAssigneeId(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {user?.id ? (
                    <SelectItem value={`__me:${user.id}`}>Me ({user.name})</SelectItem>
                  ) : null}
                  {assigneePickerUsers
                    .filter((u) => u.id !== user?.id)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
