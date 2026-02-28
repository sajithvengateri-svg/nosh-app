import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wrench, Plus, Pencil, Trash2, Scan } from "lucide-react";
import BevLabelScanner from "../components/BevLabelScanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES = ["Espresso Machine", "Grinder", "Blender", "Glass Washer", "Ice Machine", "Draught System", "Coravin Unit", "POS Terminal", "Speed Rail", "Other"];
const CONDITIONS = ["excellent", "good", "fair", "poor", "out_of_service"];

const emptyForm = { name: "", category: "Espresso Machine", location: "", notes: "", quantity: 1, condition: "good", supplier: "", cost_per_unit: 0, par_level: 0 };

const BevEquipment = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("equipment_inventory")
      .select("*")
      .eq("org_id", orgId)
      .order("name");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const save = async () => {
    if (!orgId || !form.name.trim()) return;
    const payload = { ...form, org_id: orgId };
    let error;
    if (editId) {
      ({ error } = await supabase.from("equipment_inventory").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("equipment_inventory").insert(payload));
    }
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Equipment updated" : "Equipment added");
    setShowDialog(false);
    setEditId(null);
    setForm(emptyForm);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("equipment_inventory").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Equipment removed");
    load();
  };

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({ name: item.name, category: item.category, location: item.location || "", notes: item.notes || "", quantity: item.quantity, condition: item.condition || "good", supplier: item.supplier || "", cost_per_unit: item.cost_per_unit || 0, par_level: item.par_level || 0 });
    setShowDialog(true);
  };

  const filtered = items.filter(i => {
    if (filterCat !== "all" && i.category !== filterCat) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat).length;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Bar Equipment</h1>
          <p className="text-sm text-muted-foreground">Track bar equipment, maintenance, and warranties</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <Scan className="w-4 h-4 mr-2" /> Scan Tag
          </Button>
          <Dialog open={showDialog} onOpenChange={v => { setShowDialog(v); if (!v) { setEditId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> Add Equipment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit Equipment" : "Add Equipment"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. La Marzocca Linea PB" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Service Bar" /></div>
                <div><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} /></div>
              </div>
              <div><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Serial number, maintenance notes..." /></div>
              <Button onClick={save} className="w-full">{editId ? "Update" : "Add Equipment"}</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </motion.div>

      {/* Category summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant={filterCat === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterCat("all")}>
          All ({items.length})
        </Badge>
        {CATEGORIES.filter(c => categoryCounts[c] > 0).map(c => (
          <Badge key={c} variant={filterCat === c ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterCat(c)}>
            {c} ({categoryCounts[c]})
          </Badge>
        ))}
      </div>

      <Input placeholder="Search equipment..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">
          {items.length === 0 ? "No equipment tracked yet. Add your first piece of bar equipment." : "No equipment matches your filter."}
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="w-3 h-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(item.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {item.location && <Badge variant="outline" className="text-xs">{item.location}</Badge>}
                  <Badge variant="secondary" className="text-xs capitalize">{(item.condition || "good").replace("_", " ")}</Badge>
                  <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                </div>
                {item.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{item.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BevLabelScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        scanType="equipment_tag"
        title="Equipment Tag Scanner"
        onDataExtracted={(data) => { console.log("Equipment scan:", data); toast.success("Equipment tag scanned!"); load(); }}
      />
    </div>
  );
};

export default BevEquipment;
