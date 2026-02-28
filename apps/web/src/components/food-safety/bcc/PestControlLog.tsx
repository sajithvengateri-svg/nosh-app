import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Bug, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { format, parseISO } from "date-fns";

interface PestLog {
  id: string;
  log_type: string;
  date_of_service: string;
  service_provider: string | null;
  technician_name: string | null;
  areas_inspected: string[] | null;
  pests_found: boolean | null;
  pest_types: string[] | null;
  findings: string | null;
  treatment_applied: string | null;
  corrective_action: string | null;
  next_service_date: string | null;
}

export default function PestControlLog() {
  const orgId = useOrgId();
  const [logs, setLogs] = useState<PestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    log_type: "self_inspection",
    service_provider: "",
    technician_name: "",
    pests_found: false,
    findings: "",
    treatment_applied: "",
    corrective_action: "",
    next_service_date: "",
  });

  const fetchLogs = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase.from("bcc_pest_control_logs").select("*").eq("org_id", orgId).order("date_of_service", { ascending: false });
    if (data) setLogs(data as unknown as PestLog[]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    const { error } = await supabase.from("bcc_pest_control_logs").insert({
      org_id: orgId,
      log_type: form.log_type,
      service_provider: form.service_provider || null,
      technician_name: form.technician_name || null,
      pests_found: form.pests_found,
      findings: form.findings || null,
      treatment_applied: form.treatment_applied || null,
      corrective_action: form.corrective_action || null,
      next_service_date: form.next_service_date || null,
    } as any);
    if (error) toast.error("Failed to save");
    else { toast.success("Pest control entry logged"); setDialogOpen(false); fetchLogs(); }
    setSaving(false);
  };

  return (
    <>
      <Card className="border-[#000080]/20">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#000080]"><Bug className="w-5 h-5" />Pest Control Log</CardTitle>
            <CardDescription>Professional service logs and weekly self-inspections</CardDescription>
          </div>
          <Button size="sm" className="bg-[#000080] hover:bg-[#000080]/90 text-white" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Log
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#000080]" /></div> :
           logs.length === 0 ? <p className="text-center text-muted-foreground py-8">No pest control records yet.</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Pests Found</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Next Service</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs whitespace-nowrap">{format(parseISO(l.date_of_service), "dd/MM/yy")}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-xs">{l.log_type === "professional" ? "Professional" : "Self-Inspection"}</Badge></TableCell>
                      <TableCell className="text-sm">{l.service_provider || "—"}</TableCell>
                      <TableCell>{l.pests_found ? <AlertTriangle className="w-4 h-4 text-destructive" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}</TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{l.findings || "—"}</TableCell>
                      <TableCell className="text-xs">{l.next_service_date ? format(parseISO(l.next_service_date), "dd/MM/yy") : "—"}</TableCell>
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
          <DialogHeader><DialogTitle>Log Pest Control Entry</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Type</Label>
              <Select value={form.log_type} onValueChange={(v) => setForm({ ...form, log_type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self_inspection">Weekly Self-Inspection</SelectItem>
                  <SelectItem value="professional">Professional Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.log_type === "professional" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Provider</Label><Input value={form.service_provider} onChange={(e) => setForm({ ...form, service_provider: e.target.value })} className="mt-1" /></div>
                <div><Label>Technician</Label><Input value={form.technician_name} onChange={(e) => setForm({ ...form, technician_name: e.target.value })} className="mt-1" /></div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>Pests Found?</Label>
              <Switch checked={form.pests_found} onCheckedChange={(v) => setForm({ ...form, pests_found: v })} />
            </div>
            <div><Label>Findings</Label><Textarea value={form.findings} onChange={(e) => setForm({ ...form, findings: e.target.value })} className="mt-1" /></div>
            {form.pests_found && (
              <div><Label>Corrective Action</Label><Textarea value={form.corrective_action} onChange={(e) => setForm({ ...form, corrective_action: e.target.value })} className="mt-1" /></div>
            )}
            <div><Label>Next Service Date</Label><Input type="date" value={form.next_service_date} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} className="mt-1" /></div>
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