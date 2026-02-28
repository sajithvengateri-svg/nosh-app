import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Users, TrendingUp, DollarSign, Calendar, Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PIPELINE_STAGES = [
  { value: "LEAD", label: "Lead", color: "bg-muted text-muted-foreground" },
  { value: "ENQUIRY", label: "Enquiry", color: "bg-blue-500/10 text-blue-600" },
  { value: "PROPOSAL_SENT", label: "Proposal Sent", color: "bg-purple-500/10 text-purple-600" },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-amber-500/10 text-amber-600" },
  { value: "CONFIRMED", label: "Confirmed", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "COMPLETED", label: "Completed", color: "bg-muted text-muted-foreground" },
  { value: "LOST", label: "Lost", color: "bg-red-500/10 text-red-600" },
];

const FunctionsCRM = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newClient, setNewClient] = useState({
    contact_name: "", company_name: "", email: "", phone: "", source: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["res_function_clients", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("res_function_clients")
        .select("*")
        .eq("org_id", orgId!)
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const filtered = clients.filter((c: any) =>
    !search ||
    c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stageGroups = PIPELINE_STAGES.map(s => ({
    ...s,
    clients: filtered.filter((c: any) => c.pipeline_stage === s.value),
  }));

  const totalClients = clients.length;
  const activeDeals = clients.filter((c: any) => !["COMPLETED", "LOST"].includes(c.pipeline_stage)).length;
  const totalRevenue = clients.reduce((s: number, c: any) => s + (Number(c.total_spend) || 0), 0);

  const handleCreate = async () => {
    if (!orgId || !newClient.contact_name) { toast.error("Contact name required"); return; }
    setSaving(true);
    const { error } = await supabase.from("res_function_clients").insert({
      ...newClient,
      org_id: orgId,
      pipeline_stage: "LEAD",
    } as any);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Client added");
    setShowNew(false);
    setNewClient({ contact_name: "", company_name: "", email: "", phone: "", source: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["res_function_clients"] });
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" /> Functions CRM
        </h1>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Function Client</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Contact Name *</Label><Input value={newClient.contact_name} onChange={e => setNewClient(p => ({ ...p, contact_name: e.target.value }))} /></div>
              <div><Label>Company</Label><Input value={newClient.company_name} onChange={e => setNewClient(p => ({ ...p, company_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} /></div>
                <div><Label>Phone</Label><Input value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} /></div>
              </div>
              <div><Label>Source</Label><Input placeholder="e.g. Website, Referral, Walk-in" value={newClient.source} onChange={e => setNewClient(p => ({ ...p, source: e.target.value }))} /></div>
              <div><Label>Notes</Label><Textarea value={newClient.notes} onChange={e => setNewClient(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button className="w-full" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div><p className="text-2xl font-bold">{totalClients}</p><p className="text-xs text-muted-foreground">Total Clients</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-amber-500" />
          <div><p className="text-2xl font-bold">{activeDeals}</p><p className="text-xs text-muted-foreground">Active Deals</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-emerald-500" />
          <div><p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Pipeline Board */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-[1200px] pb-4">
            {stageGroups.map(stage => (
              <div key={stage.value} className="flex-1 min-w-[170px]">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={stage.color} variant="secondary">{stage.label}</Badge>
                  <span className="text-xs text-muted-foreground">{stage.clients.length}</span>
                </div>
                <div className="space-y-2">
                  {stage.clients.map((c: any) => (
                    <Card key={c.id} className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => navigate(`/reservation/functions/crm/${c.id}`)}>
                      <CardContent className="p-3">
                        <p className="font-medium text-sm truncate">{c.contact_name}</p>
                        {c.company_name && <p className="text-xs text-muted-foreground truncate">{c.company_name}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">{c.total_events || 0} events</span>
                          {Number(c.total_spend) > 0 && <span className="text-xs font-medium text-emerald-600">${Number(c.total_spend).toLocaleString()}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {stage.clients.length === 0 && (
                    <div className="border border-dashed rounded-lg p-4 text-center text-xs text-muted-foreground">
                      No clients
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FunctionsCRM;
