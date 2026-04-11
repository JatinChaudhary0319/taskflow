import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Plus, Radio } from "lucide-react";
import toast from "react-hot-toast";

import { BreadcrumbsBar } from "@/components/layout/breadcrumbs-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { formatApiError, useAuth } from "@/contexts/auth-context";
import { useWorkspaceLiveEvents } from "@/hooks/use-workspace-live-events";
import { ApiError, apiFetch } from "@/lib/api";
import { Spinner } from "@/utils/Spinner";
import type { Project } from "@/types/taskflow";

export function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ projects: Project[] }>("/projects");
      setProjects(data.projects);
    } catch (err) {
      setError(formatApiError(err));
      if (err instanceof ApiError && err.status !== 401) {
        toast.error(formatApiError(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSilent = useCallback(async () => {
    try {
      const data = await apiFetch<{ projects: Project[] }>("/projects");
      setProjects(data.projects);
    } catch {
      /* keep existing list */
    }
  }, []);

  const loadSilentRef = useRef(loadSilent);
  useEffect(() => {
    loadSilentRef.current = loadSilent;
  }, [loadSilent]);

  const onWorkspaceEvent = useCallback(() => {
    void loadSilentRef.current();
  }, []);

  const { live } = useWorkspaceLiveEvents({
    token: token ?? undefined,
    onWorkspaceEvent,
  });

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setCreating(true);
    try {
      const project = await apiFetch<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() === "" ? null : description.trim(),
        }),
      });
      setProjects((prev) => [project, ...prev]);
      toast.success("Project created");
      setCreateOpen(false);
      setName("");
      setDescription("");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <BreadcrumbsBar items={[]} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            {live ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Radio className="h-3 w-3" aria-hidden />
                Live
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Everything you own or are assigned to. Updates when tasks change.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" aria-hidden />
          New project
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-10 w-10" />
        </div>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">Could not load projects</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="h-6 w-6 text-muted-foreground" aria-hidden />
            </div>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>Create a project to start adding tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-8">
            <Button type="button" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" aria-hidden />
              Create project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link to={`/projects/${p.id}`} className="block h-full">
                <Card className="h-full transition-colors hover:border-primary/40 hover:bg-accent/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{p.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {p.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>Give it a name and an optional description.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="proj-name">Name</Label>
                <Input
                  id="proj-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="proj-desc">Description</Label>
                <Input
                  id="proj-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
