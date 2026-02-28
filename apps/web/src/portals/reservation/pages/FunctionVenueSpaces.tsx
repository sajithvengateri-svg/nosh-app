import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, MapPin, Pencil, Trash2, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FunctionVenueSpaces = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", hire_type: "ZONE",
    capacity_min: 1, capacity_max: 100,
    room_hire_fee: 0, minimum_spend: 0, is_active: true,
  });

  const { data: spaces = [], isLoading } = useQuery({
    queryKey: ["res_venue_spaces", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("res_venue_spaces").select("*").eq("org_id", orgId!).order("sort_order");
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const resetForm = () => {
    setForm({ name: "", description: "", hire_type: "ZONE", capacity_min: 1, capacity_max: 100, room_hire_fee: 0, minimum_spend: 0, is_active: true });
    setEditId(null);
  };

  const openEdit = (space: any) => {
    setForm({
      name: space.name, description: space.description || "",
      hire_type: space.hire_type, capacity_min: space.capacity_min,
      capacity_max: space.capacity_max, room_hire_fee: Number(space.room_hire_fee),
      minimum_spend: Number(space.minimum_spend), is_active: space.is_active,
    });
    setEditId(space.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!orgId || !form.name) { toast.error("Name required"); return; }
    setSaving(true);
    if (editId) {
      const { error } = await supabase.from("res_venue_spaces").update(form as any).eq("id", editId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Space updated");
    } else {
      const { error } = await supabase.from("res_venue_spaces").insert({ ...form, org_id: orgId } as any);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Space added");
    }
    setSaving(false);
    setShowForm(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["res_venue_spaces"] });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("res_venue_spaces").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Space deleted");
    qc.invalidateQueries({ queryKey: ["res_venue_spaces"] });
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building className="w-6 h-6 text-primary" /> Venue Spaces
        </h1>
        <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Space</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit" : "Add"} Venue Space</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Private Dining Room" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div>
                <Label>Hire Type</Label>
                <Select value={form.hire_type} onValueChange={v => setForm(p => ({ ...p, hire_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHOLE_VENUE">Whole Venue</SelectItem>
                    <SelectItem value="ZONE">Zone / Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Min Capacity</Label><Input type="number" min={1} value={form.capacity_min} onChange={e => setForm(p => ({ ...p, capacity_min: +e.target.value }))} /></div>
                <div><Label>Max Capacity</Label><Input type="number" min={1} value={form.capacity_max} onChange={e => setForm(p => ({ ...p, capacity_max: +e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Room Hire Fee ($)</Label><Input type="number" min={0} value={form.room_hire_fee} onChange={e => setForm(p => ({ ...p, room_hire_fee: +e.target.value }))} /></div>
                <div><Label>Minimum Spend ($)</Label><Input type="number" min={0} value={form.minimum_spend} onChange={e => setForm(p => ({ ...p, minimum_spend: +e.target.value }))} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Update" : "Add Space"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : spaces.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No venue spaces configured. Add your first space above.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {spaces.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{s.name}</p>
                      <Badge variant="outline" className="text-[10px]">{s.hire_type === "WHOLE_VENUE" ? "Whole Venue" : "Zone"}</Badge>
                      {!s.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {s.capacity_min}–{s.capacity_max} pax · Hire: ${Number(s.room_hire_fee).toLocaleString()} · Min spend: ${Number(s.minimum_spend).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FunctionVenueSpaces;
