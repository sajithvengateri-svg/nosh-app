import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { ServiceConfig } from "@/types/housekeeping";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (service: ServiceConfig) => void;
}

export default function AddServiceDialog({ open, onOpenChange, onAdd }: AddServiceDialogProps) {
  const [label, setLabel] = useState("");
  const [hasCalendar, setHasCalendar] = useState(false);
  const [hasGraph, setHasGraph] = useState(false);

  const handleAdd = () => {
    if (!label.trim()) return;
    const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    onAdd({
      key: slug,
      label: label.trim(),
      icon: "Wrench",
      color: "text-muted-foreground",
      hasCalendar,
      hasGraph,
      graphMetrics: hasGraph ? [{ key: "quantity", label: "Quantity", color: "hsl(var(--primary))" }] : [],
      metadataFields: [],
    });
    setLabel("");
    setHasCalendar(false);
    setHasGraph(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Custom Service</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Service Name</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Pest Control, Plumbing..." />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox checked={hasCalendar} onCheckedChange={(c) => setHasCalendar(!!c)} />
              <Label className="text-xs">Scheduled (calendar)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={hasGraph} onCheckedChange={(c) => setHasGraph(!!c)} />
              <Label className="text-xs">Track consumption</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!label.trim()}>Add Service</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
