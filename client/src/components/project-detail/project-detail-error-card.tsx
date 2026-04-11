import { memo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ProjectDetailErrorCardProps = {
  message: string;
  onRetry: () => void;
  onBack: () => void;
};

function ProjectDetailErrorCardInner({ message, onRetry, onBack }: ProjectDetailErrorCardProps) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-base">Project unavailable</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onRetry}>
          Retry
        </Button>
        <Button type="button" onClick={onBack}>
          Back to projects
        </Button>
      </CardContent>
    </Card>
  );
}

export const ProjectDetailErrorCard = memo(ProjectDetailErrorCardInner);
