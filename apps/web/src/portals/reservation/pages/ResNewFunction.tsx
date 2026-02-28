import React, { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createFunction } from "@/lib/shared/queries/resQueries";
import { format } from "date-fns";

const ResNewFunction = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: "", client_email: "", client_phone: "",
    event_date: format(new Date(), "yyyy-MM-dd"), start_time: "18:00",
    party_size: 20, event_type: "CUSTOM", notes: "", dietary_requirements: "",
  });

  const handleSubmit = async () => {
    if (!orgId || !form.client_name) { toast.error("Client name required"); return; }
    setSaving(true);
    const { error } = await createFunction({ ...form, org_id: orgId, status: "ENQUIRY" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Function enquiry created");
    qc.invalidateQueries({ queryKey: ["res_functions"] });
    navigate("/reservation/functions");
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
      <Card>
        <CardHeader><CardTitle>New Function Enquiry</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Client Name *</Label><Input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={form.client_email} onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))} /></div>
            <div><Label>Phone</Label><Input value={form.client_phone} onChange={e => setForm(p => ({ ...p, client_phone: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div><Label>Date</Label><Input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} /></div>
            <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} /></div>
            <div><Label>Guests</Label><Input type="number" min={1} value={form.party_size} onChange={e => setForm(p => ({ ...p, party_size: +e.target.value }))} /></div>
          </div>
          <div>
            <Label>Event Type</Label>
            <Select value={form.event_type} onValueChange={v => setForm(p => ({ ...p, event_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["WEDDING", "CORPORATE", "BIRTHDAY", "PRIVATE", "CUSTOM"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Dietary Requirements</Label><Textarea value={form.dietary_requirements} onChange={e => setForm(p => ({ ...p, dietary_requirements: e.target.value }))} /></div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Create Enquiry"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResNewFunction;
