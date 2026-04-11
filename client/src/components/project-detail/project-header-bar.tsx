import { memo } from "react";
import { Pencil, Radio, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export type ProjectHeaderBarProps = {
  name: string;
  description: string | null;
  live: boolean;
  isOwner: boolean;
  mutationBusy: boolean;
  onEditProject: () => void;
  onDeleteProject: () => void;
  onAddTask: () => void;
};

function ProjectHeaderBarInner({
  name,
  description,
  live,
  isOwner,
  mutationBusy,
  onEditProject,
  onDeleteProject,
  onAddTask,
}: ProjectHeaderBarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
          {live ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Radio className="h-3 w-3" aria-hidden />
              Live
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">{description || "No description"}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isOwner ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEditProject}
              disabled={mutationBusy}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onDeleteProject}
              disabled={mutationBusy}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </>
        ) : null}
        <Button type="button" size="sm" onClick={onAddTask} disabled={mutationBusy}>
          Add task
        </Button>
      </div>
    </div>
  );
}

export const ProjectHeaderBar = memo(ProjectHeaderBarInner);
