import { memo } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export type AssigneeFilterOption = { id: string; name: string };

export type ProjectFiltersBarProps = {
  statusFilter: string;
  assigneeFilter: string;
  assigneeOptions: AssigneeFilterOption[];
  onStatusFilter: (v: string) => void;
  onAssigneeFilter: (v: string) => void;
  disabled?: boolean;
};

function ProjectFiltersBarInner({
  statusFilter,
  assigneeFilter,
  assigneeOptions,
  onStatusFilter,
  onAssigneeFilter,
  disabled = false,
}: ProjectFiltersBarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="grid gap-2 sm:w-44">
        <Label>Status</Label>
        <Select value={statusFilter} onValueChange={onStatusFilter} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="todo">To do</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2 sm:w-56">
        <Label>Assignee</Label>
        <Select value={assigneeFilter} onValueChange={onAssigneeFilter} disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            <SelectItem value="me">Assigned to me</SelectItem>
            {assigneeOptions.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export const ProjectFiltersBar = memo(ProjectFiltersBarInner);
