import { useEffect, useState, memo } from "react";
import toast from "react-hot-toast";

import { formatApiError } from "@/contexts/auth-context";
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

export type EditProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialDescription: string | null;
  onSave: (data: { name: string; description: string | null }) => Promise<void>;
  /** Disables actions while any project/task mutation is running (including this save). */
  mutationBusy: boolean;
};

function EditProjectDialogInner({
  open,
  onOpenChange,
  initialName,
  initialDescription,
  onSave,
  mutationBusy,
}: EditProjectDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setDescription(initialDescription ?? "");
  }, [open, initialName, initialDescription]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || mutationBusy || submitting) return;
    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() === "" ? null : description.trim(),
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const locked = mutationBusy || submitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>Update name or description.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="ep-name">Name</Label>
              <Input id="ep-name" value={name} onChange={(e) => setName(e.target.value)} required disabled={locked} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ep-desc">Description</Label>
              <Input id="ep-desc" value={description} onChange={(e) => setDescription(e.target.value)} disabled={locked} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={locked || !name.trim()}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export const EditProjectDialog = memo(EditProjectDialogInner);
