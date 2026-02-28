import { useState, useEffect } from "react";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { SCHEDULE_FREQUENCIES } from "@/types/housekeeping";
import type { ScheduleFrequency, ServiceSchedule } from "@/types/housekeeping";
import { useSaveServiceSchedule } from "@/hooks/useHousekeeping";
import { toast } from "sonner";

interface ServiceScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceType: string;
  editing?: ServiceSchedule | null;
}

function computeNextDue(startDate: string, frequency: ScheduleFrequency): string {
  const d = new Date(startDate);
  const now = new Date();
  let next = d;

  const advance = (date: Date): Date => {
    switch (frequency) {
      case "WEEKLY": return addWeeks(date, 1);
      case "FORTNIGHTLY": return addDays(date, 14);
      case "MONTHLY": return addMonths(date, 1);
      case "QUARTERLY": return addMonths(date, 3);
      case "ANNUALLY": return addYears(date, 1);
      default: return addMonths(date, 1);
    }
  };

  while (next < now) {
    next = advance(next);
  }

  return next.toISOString().split("T")[0];
}

export default function ServiceScheduleDialog({ open, onOpenChange, serviceType, editing }: ServiceScheduleDialogProps) {
  const saveSchedule = useSaveServiceSchedule();

  const [form, setForm] = useState({
    frequency: "MONTHLY" as ScheduleFrequency,
    provider_name: "",
    estimated_cost: "",
    start_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (editing) {
      setForm({
        frequency: editing.frequency,
        provider_name: editing.provider_name || "",
        estimated_cost: editing.estimated_cost?.toString() || "",
        start_date: editing.start_date,
        notes: editing.notes || "",
      });
    } else {
      setForm({
        frequency: "MONTHLY",
        provider_name: "",
        estimated_cost: "",
        start_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
  }, [editing, open]);

  const handleSave = async () => {
    try {
      const nextDue = computeNextDue(form.start_date, form.frequency);
      await saveSchedule.mutateAsync({
        id: editing?.id,
        service_type: serviceType,
        frequency: form.frequency,
        provider_name: form.provider_name || undefined,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : undefined,
        start_date: form.start_date,
        next_due_date: nextDue,
        notes: form.notes || undefined,
      });
      toast.success(editing ? "Schedule updated" : "Schedule created");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save schedule");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Set Up"} Recurring Schedule</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Frequency</Label>
            <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v as ScheduleFrequency })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SCHEDULE_FREQUENCIES.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Est. Cost ($)</Label>
              <Input type="number" step="0.01" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Provider</Label>
            <Input value={form.provider_name} onChange={(e) => setForm({ ...form, provider_name: e.target.value })} placeholder="Company name" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any additional notes..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saveSchedule.isPending}>
            {saveSchedule.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
