import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Plus, CheckCircle2, Camera, Loader2,
  Save, Clock, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { format } from "date-fns";

interface CleaningLogEntry {
  id: string;
  date: string;
  time: string;
  location: string | null;
  status: string | null;
  notes: string | null;
  recorded_by_name: string | null;
  readings: any;
}

const statusColors: Record<string, string> = {
  pass: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  fail: "bg-destructive/10 text-destructive border-destructive/20",
};

const CLEANING_ACTIONS = [
  "Wipe & sanitise",
  "Deep clean",
  "Sweep & mop",
  "Degrease",
  "Descale",
  "Empty bins",
  "Restock supplies",
  "Other",
];

export default function BCCCleaningLog() {
  const { user, canEdit } = useAuth();
  const { currentOrg } = useOrg();
  const hasEdit = canEdit("food-safety");

  const [logs, setLogs] = useState<CleaningLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [location, setLocation] = useState("");
  const [action, setAction] = useState("Wipe & sanitise");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // AI verify
  const [isVerifying, setIsVerifying] = useState(false);
  const verifyRef = useRef<HTMLInputElement>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    fetchLogs();
  }, [currentOrg?.id]);

  const fetchLogs = async () => {
    if (!currentOrg?.id) { setLoading(false); return; }
    setLoading(true);

    const { data } = await supabase
      .from("food_safety_logs")
      .select("*")
      .eq("org_id", currentOrg.id)
      .eq("log_type", "cleaning")
      .order("date", { ascending: false })
      .order("time", { ascending: false })
      .limit(100);

    setLogs((data || []) as CleaningLogEntry[]);
    setLoading(false);
  };

  const todayLogs = logs.filter(l => l.date === today);

  const handleSave = async () => {
    if (!location.trim()) { toast.error("Location / item is required"); return; }
    setSaving(true);

    const { error } = await supabase.from("food_safety_logs").insert({
      log_type: "cleaning",
      location,
      status: "pass",
      notes: notes || null,
      readings: { action },
      recorded_by: user?.id,
      recorded_by_name: user?.email?.split("@")[0] || "Unknown",
      date: today,
      time: new Date().toTimeString().split(" ")[0],
      org_id: currentOrg?.id || null,
    } as any);

    if (error) {
      toast.error("Failed to save cleaning log");
    } else {
      toast.success("Cleaning log saved");
      resetDialog();
      fetchLogs();
    }
    setSaving(false);
  };

  const handleVerifyPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVerifying(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke("verify-cleaning", {
        body: { image_base64: base64, file_type: file.type, area_name: location || "kitchen area" },
      });
      if (error) throw error;
      if (data?.status === "approved") {
        toast.success("Cleaning verified by AI");
      } else {
        toast.info(data?.feedback || "Needs attention");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetDialog = () => {
    setDialogOpen(false);
    setLocation("");
    setAction("Wipe & sanitise");
    setNotes("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#000080]" />
            Cleaning Schedule
          </h3>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>
        {hasEdit && (
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5 bg-[#000080] hover:bg-[#000080]/90">
            <Plus className="w-4 h-4" /> Log Clean
          </Button>
        )}
      </div>

      {/* Today's summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-elevated p-3 text-center">
          <p className="text-xl font-bold">{todayLogs.length}</p>
          <p className="text-xs text-muted-foreground">Cleaned Today</p>
        </div>
        <div className="card-elevated p-3 text-center">
          <p className="text-xl font-bold text-success">{todayLogs.filter(l => l.status === "pass").length}</p>
          <p className="text-xs text-muted-foreground">Verified</p>
        </div>
      </div>

      {/* Log list */}
      {logs.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="font-medium">No cleaning logs yet</p>
          <p className="text-sm text-muted-foreground">Tap "Log Clean" to record a cleaning task</p>
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Date</th>
                <th className="text-left p-2 font-medium">Time</th>
                <th className="text-left p-2 font-medium">Location / Item</th>
                <th className="text-left p-2 font-medium">Action</th>
                <th className="text-center p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Signed By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actionLabel = (log.readings as any)?.action || "—";
                const displayStatus = log.status || "pass";
                return (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-2">{log.date ? format(new Date(log.date + "T00:00:00"), "dd MMM") : "—"}</td>
                    <td className="p-2 text-muted-foreground">{log.time?.slice(0, 5) || "—"}</td>
                    <td className="p-2 font-medium">{log.location || "—"}</td>
                    <td className="p-2 text-muted-foreground">{actionLabel}</td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className={cn("text-xs capitalize", statusColors[displayStatus] || "")}>
                        {displayStatus}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <UserCheck className="w-3 h-3" />
                        {log.recorded_by_name || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden file input for verify photo */}
      <input ref={verifyRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleVerifyPhoto} />

      {/* New Cleaning Log Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Log Cleaning Task
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Location / Item</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Prep bench, Walk-in floor, Grill hood" className="mt-1" />
            </div>

            <div>
              <Label>Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CLEANING_ACTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes..." className="mt-1" />
            </div>

            {/* AI Verify button */}
            <Button variant="outline" className="w-full gap-2"
              onClick={() => verifyRef.current?.click()} disabled={isVerifying}>
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {isVerifying ? "Verifying…" : "AI Verify (optional)"}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#000080] hover:bg-[#000080]/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Sign Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
