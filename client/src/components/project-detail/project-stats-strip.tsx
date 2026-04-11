import { memo } from "react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectStats } from "@/types/taskflow";

import { BOARD_STATUSES, statusLabel } from "./constants";

export type ProjectStatsStripProps = {
  stats: ProjectStats;
};

function ProjectStatsStripInner({ stats }: ProjectStatsStripProps) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {BOARD_STATUSES.map((k) => (
        <Card key={k}>
          <CardHeader className="p-4 pb-2">
            <CardDescription>{statusLabel[k]}</CardDescription>
            <CardTitle className="text-2xl">{Number(stats.by_status[k] ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export const ProjectStatsStrip = memo(ProjectStatsStripInner);
