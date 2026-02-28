// QuickTimerDialog — create ad-hoc timer or pick from saved favourites

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Star, Clock } from "lucide-react";
import type { AlertType, TimerCategory } from "@/lib/shared/types/timer.types";

interface QuickTimerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (config: {
    label: string;
    duration_seconds: number;
    alert_type: AlertType;
    station?: string;
    category?: TimerCategory;
  }) => void;
  savedTimers?: Array<{
    id: string;
    label: string;
    duration_seconds: number;
    alert_type: AlertType;
    station: string | null;
    use_count: number;
  }>;
  defaultStation?: string;
  defaultCategory?: TimerCategory;
}

export default function QuickTimerDialog({
  open,
  onOpenChange,
  onStart,
  savedTimers = [],
  defaultStation,
  defaultCategory = "kitchen",
}: QuickTimerDialogProps) {
  const [label, setLabel] = useState("");
  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("0");
  const [alertType, setAlertType] = useState<AlertType>("CHIME");

  const handleStart = () => {
    const dur = parseInt(minutes || "0") * 60 + parseInt(seconds || "0");
    if (dur <= 0 || !label.trim()) return;
    onStart({
      label: label.trim(),
      duration_seconds: dur,
      alert_type: alertType,
      station: defaultStation,
      category: defaultCategory,
    });
    setLabel("");
    setMinutes("5");
    setSeconds("0");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plus className="h-4 w-4 text-emerald-400" />
            Quick Timer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Saved favourites */}
          {savedTimers.length > 0 && (
            <div>
              <Label className="text-xs text-slate-400 mb-2 block">
                <Star className="h-3 w-3 inline mr-1" /> Favourites
              </Label>
              <div className="flex flex-wrap gap-2">
                {savedTimers.slice(0, 8).map((st) => (
                  <Button
                    key={st.id}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs"
                    onClick={() => {
                      onStart({
                        label: st.label,
                        duration_seconds: st.duration_seconds,
                        alert_type: st.alert_type,
                        station: st.station ?? defaultStation,
                        category: defaultCategory,
                      });
                      onOpenChange(false);
                    }}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {st.label} ({Math.floor(st.duration_seconds / 60)}m)
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Custom timer */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-slate-400">Label</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Blanch broccolini"
                className="bg-slate-800 border-slate-600 text-white mt-1"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-xs text-slate-400">Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  max="999"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-slate-400">Seconds</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-400">Alert Sound</Label>
              <Select value={alertType} onValueChange={(v) => setAlertType(v as AlertType)}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem value="CHIME">🔔 Chime</SelectItem>
                  <SelectItem value="BELL">🛎️ Bell</SelectItem>
                  <SelectItem value="BUZZER">📢 Buzzer</SelectItem>
                  <SelectItem value="SILENT">🔇 Silent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={!label.trim() || (parseInt(minutes || "0") * 60 + parseInt(seconds || "0")) <= 0}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Start Timer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
