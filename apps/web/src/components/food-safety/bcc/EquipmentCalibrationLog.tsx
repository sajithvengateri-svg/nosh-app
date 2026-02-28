import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Wrench, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";

interface CalibrationLog {
  id: string;
  equipment_name: string;
  equipment_type: string | null;
  serial_number: string | null;
  log_type: string;
  performed_at: string;
  performed_by: string | null;
  method: string | null;
  result: string | null;
  passed: boolean | null;
  next_due_date: string | null;
  notes: string | null;
}

export default function EquipmentCalibrationLog() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [logs, setLogs] = useState<CalibrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    equipment_name: "", equipment_type: "thermometer", serial_number: "",
    log_type: "calibration", method: "ice_water", result: "", passed: true,
    next_due_date: "", notes: "",
  });

  const fetch = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase.from("bcc_equipment_calibration_logs").select("*").eq("org_id", orgId).order("performed_at", { ascending: false });
    if (data) setLogs(data as unknown as CalibrationLog[]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async () => {
    if (!orgId || !form.equipment_name.trim()) { toast.error("Equipment name required"); return; }
    setSaving(true);
    const { error } = await supabase.from("bcc_equipment_calibration_logs").insert({
      org_id: orgId,
      equipment_name: form.equipment_name,
      equipment_type: form.equipment_type,
      serial_number: form.serial_number || null,
      log_type: form.log_type,
      method: form.method || null,
      result: form.result || null,
      passed: form.passed,
      next_due_date: form.next_due_date || null,
      notes: form.notes || null,
      performed_by: user?.email?.split("@")[0] || null,
    } as any);
    if (error) toast.error("Failed to save");
    else { toast.success("Calibration logged"); setDialogOpen(false); fetch(); }
    setSaving(false);
  };

  return (
    <>
      <Card className="border-[#000080]/20">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#000080]"><Wrench className="w-5 h-5" />Equipment & Calibration</CardTitle>
            <CardDescription>Thermometer calibration records and equipment service logs</CardDescription>
          </div>
          <Button size="sm" className="bg-[#000080] hover:bg-[#000080]/90 text-white" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Log
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#000080]" /></div> :
           logs.length === 0 ? <p className="text-center text-muted-foreground py-8">No calibration records yet.</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Next Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs whitespace-nowrap">{format(parseISO(l.performed_at), "dd/MM/yy")}</TableCell>
                      <TableCell className="font-medium">{l.equipment_name}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{l.log_type}</Badge></TableCell>
                      <TableCell className="text-xs">{l.method || "—"}</TableCell>
                      <TableCell>{l.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-destructive" />}</TableCell>
                      <TableCell className="text-xs">{l.next_due_date ? format(parseISO(l.next_due_date), "dd/MM/yy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Log Calibration / Service</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Equipment Name *</Label><Input value={form.equipment_name} onChange={(e) => setForm({ ...form, equipment_name: e.target.value })} className="mt-1" placeholder="e.g. Probe Thermometer #1" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Type</Label>
                <Select value={form.equipment_type} onValueChange={(v) => setForm({ ...form, equipment_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermometer">Thermometer</SelectItem>
                    <SelectItem value="fridge">Fridge/Freezer</SelectItem>
                    <SelectItem value="oven">Oven</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ice_water">Ice Water (0°C)</SelectItem>
                    <SelectItem value="boiling_water">Boiling Water (100°C)</SelectItem>
                    <SelectItem value="reference_thermometer">Reference Thermometer</SelectItem>
                    <SelectItem value="professional_service">Professional Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Result</Label><Input value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} className="mt-1" placeholder="e.g. 0.2°C variance" /></div>
              <div><Label>Next Due</Label><Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} className="mt-1" /></div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Passed?</Label>
              <Switch checked={form.passed} onCheckedChange={(v) => setForm({ ...form, passed: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#000080] hover:bg-[#000080]/90 text-white">{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}