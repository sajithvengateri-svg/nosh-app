import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  classification: string;
  section_tags: string[];
}

interface AddShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  date: string;
  onSave: (shift: {
    user_id: string;
    date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    section: string;
    shift_type: string;
    notes: string;
  }) => void;
  editShift?: {
    id: string;
    user_id: string;
    start_time: string;
    end_time: string;
    break_minutes: number | null;
    section: string | null;
    shift_type: string | null;
    notes: string | null;
  } | null;
  onDelete?: (id: string) => void;
}

const SECTIONS = ["KITCHEN", "BAR", "FOH", "MANAGEMENT"];
const SHIFT_TYPES = ["REGULAR", "SPLIT", "ON_CALL", "TRAINING"];

export default function AddShiftDialog({ open, onOpenChange, employees, date, onSave, editShift, onDelete }: AddShiftDialogProps) {
  const [userId, setUserId] = useState(editShift?.user_id || "");
  const [startTime, setStartTime] = useState(editShift?.start_time?.substring(0, 5) || "07:00");
  const [endTime, setEndTime] = useState(editShift?.end_time?.substring(0, 5) || "15:00");
  const [breakMins, setBreakMins] = useState(String(editShift?.break_minutes ?? 30));
  const [section, setSection] = useState(editShift?.section || "KITCHEN");
  const [shiftType, setShiftType] = useState(editShift?.shift_type || "REGULAR");
  const [notes, setNotes] = useState(editShift?.notes || "");

  const handleSave = () => {
    if (!userId) return;
    onSave({
      user_id: userId,
      date,
      start_time: startTime,
      end_time: endTime,
      break_minutes: Number(breakMins) || 30,
      section,
      shift_type: shiftType,
      notes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editShift ? "Edit Shift" : "Add Shift"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Staff Member</Label>
            <Select value={userId} onValueChange={setUserId} disabled={!!editShift}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.user_id} value={e.user_id}>
                    {e.full_name} ({e.classification})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Break (min)</Label>
              <Input type="number" value={breakMins} onChange={e => setBreakMins(e.target.value)} min={0} max={120} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Shift Type</Label>
            <Select value={shiftType} onValueChange={setShiftType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SHIFT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {editShift && onDelete && (
            <Button variant="destructive" size="sm" onClick={() => { onDelete(editShift.id); onOpenChange(false); }}>
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!userId}>{editShift ? "Update" : "Add Shift"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
