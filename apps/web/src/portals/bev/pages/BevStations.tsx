import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

const COLORS = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500", "bg-red-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500"];

const BevStations = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", color: "bg-blue-500", description: "" });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase.from("kitchen_sections").select("*").eq("org_id", orgId).order("display_order");
    setSections(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const save = async () => {
    if (!orgId || !form.name.trim()) return;
    const { error } = await supabase.from("kitchen_sections").insert({
      org_id: orgId, name: form.name, color: form.color, description: form.description || null,
      display_order: sections.length,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Station added!");
    setShowDialog(false);
    setForm({ name: "", color: "bg-blue-500", description: "" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("kitchen_sections").delete().eq("id", id);
    toast.success("Station removed");
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Bar Stations</h1>
          <p className="text-sm text-muted-foreground">Manage bar stations and assign team members</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Station</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Station</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Well, Service Bar" /></div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map(c => (
                    <button key={c} className={`w-8 h-8 rounded-full ${c} ${form.color === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                      onClick={() => setForm({ ...form, color: c })} />
                  ))}
                </div>
              </div>
              <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Station purpose..." /></div>
              <Button onClick={save} className="w-full">Add Station</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : sections.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No stations set up. Add your first bar station (Well, Service Bar, etc.).</CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(s => (
            <Card key={s.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${s.color || "bg-primary"}`} />
                    <p className="font-medium text-foreground">{s.name}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(s.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
                <p className="text-xs text-muted-foreground">{s.description || "No description"}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BevStations;
