import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader2, Search, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CleaningItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  par_level: number;
  location: string;
  supplier: string | null;
  cost_per_unit: number;
  sds_url: string | null;
  last_ordered: string | null;
  notes: string | null;
}

const CATEGORIES = ["Chemicals", "Disposables", "Cloths/Sponges", "PPE", "Paper Products", "Other"];
const UNITS = ["each", "bottle", "box", "pack", "litre", "case"];

const emptyForm = {
  name: "", category: "Other", quantity: 0, unit: "each", par_level: 0,
  location: "Storage", supplier: "", cost_per_unit: 0, sds_url: "", notes: "",
};

const CleaningInventoryTab = () => {
  const { currentOrg } = useOrg();
  const { canEdit } = useAuth();
  const hasEdit = canEdit("inventory");
  const [items, setItems] = useState<CleaningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<CleaningItem | null>(null);
  const [deleting, setDeleting] = useState<CleaningItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cleaning_inventory")
      .select("*")
      .order("category, name" as any);
    if (!error) setItems((data as any[]) || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    if (editing) {
      const { error } = await supabase.from("cleaning_inventory").update({
        name: form.name, category: form.category, quantity: form.quantity, unit: form.unit,
        par_level: form.par_level, location: form.location,
        supplier: form.supplier || null, cost_per_unit: form.cost_per_unit,
        sds_url: form.sds_url || null, notes: form.notes || null,
      }).eq("id", editing.id);
      if (error) { toast.error("Update failed"); return; }
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("cleaning_inventory").insert({
        ...form, supplier: form.supplier || null, sds_url: form.sds_url || null,
        notes: form.notes || null, org_id: currentOrg?.id,
      });
      if (error) { toast.error("Add failed"); console.error(error); return; }
      toast.success("Added");
    }
    close(); fetchItems();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await supabase.from("cleaning_inventory").delete().eq("id", deleting.id);
    toast.success("Deleted"); setDeleteOpen(false); setDeleting(null); fetchItems();
  };

  const openEdit = (item: CleaningItem) => {
    setEditing(item);
    setForm({
      name: item.name, category: item.category, quantity: item.quantity, unit: item.unit,
      par_level: item.par_level, location: item.location,
      supplier: item.supplier || "", cost_per_unit: item.cost_per_unit,
      sds_url: item.sds_url || "", notes: item.notes || "",
    });
    setDialogOpen(true);
  };

  const close = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const belowPar = items.filter(i => i.par_level > 0 && i.quantity < i.par_level);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {belowPar.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">{belowPar.length} items below par — reorder needed</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search cleaning materials..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasEdit && (
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
        )}
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Item</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Qty</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Par</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Cost/Unit</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Supplier</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">SDS</th>
                {hasEdit && <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3"><Badge variant="outline" className="text-xs">{item.category}</Badge></td>
                  <td className={cn("p-3", item.par_level > 0 && item.quantity < item.par_level && "text-destructive font-semibold")}>
                    {Number(item.quantity)} {item.unit}
                  </td>
                  <td className="p-3 text-muted-foreground">{Number(item.par_level)} {item.unit}</td>
                  <td className="p-3 text-muted-foreground">${Number(item.cost_per_unit).toFixed(2)}</td>
                  <td className="p-3 text-muted-foreground">{item.supplier || "-"}</td>
                  <td className="p-3">
                    {item.sds_url ? (
                      <a href={item.sds_url} target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1 text-xs">
                        <ExternalLink className="w-3 h-3" />View
                      </a>
                    ) : "-"}
                  </td>
                  {hasEdit && (
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => { setDeleting(item); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={hasEdit ? 8 : 7} className="p-8 text-center text-muted-foreground">No cleaning materials found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={close}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Cleaning Material</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Blue Roll" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" min="0" step="0.1" value={form.quantity} onChange={e => setForm({...form, quantity: parseFloat(e.target.value)||0})} /></div>
              <div className="space-y-2"><Label>Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm({...form, unit: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Par Level</Label><Input type="number" min="0" step="0.1" value={form.par_level} onChange={e => setForm({...form, par_level: parseFloat(e.target.value)||0})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Supplier</Label><Input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} /></div>
              <div className="space-y-2"><Label>Cost/Unit ($)</Label><Input type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={e => setForm({...form, cost_per_unit: parseFloat(e.target.value)||0})} /></div>
            </div>
            <div className="space-y-2"><Label>Safety Data Sheet URL</Label><Input value={form.sds_url} onChange={e => setForm({...form, sds_url: e.target.value})} placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSubmit}>{editing ? "Save" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={() => setDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Item</DialogTitle></DialogHeader>
          <p className="text-muted-foreground">Delete "{deleting?.name}"? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CleaningInventoryTab;
