import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Search, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useKitchenInventory,
  useSaveKitchenItem,
  useDeleteKitchenItem,
  useKitchenInventorySummary,
  CROCKERY_CATEGORIES,
  CONDITIONS,
  UNITS,
} from "@/hooks/useKitchenInventory";
import type { KitchenInventoryItem } from "@/hooks/useKitchenInventory";

const emptyForm = {
  name: "", category: "Plates", quantity: 0, unit: "each", par_level: 0,
  condition: "good", location: "Kitchen", supplier: "", cost_per_unit: 0, notes: "",
};

export default function CrockeryTab() {
  const { items, isLoading } = useKitchenInventory("crockery");
  const { totalItems, totalValue, belowPar, needReplace } = useKitchenInventorySummary("crockery");
  const saveItem = useSaveKitchenItem();
  const deleteItem = useDeleteKitchenItem();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<KitchenInventoryItem | null>(null);
  const [deleting, setDeleting] = useState<KitchenInventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((i) => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const conditionStyle: Record<string, string> = {
    good: "bg-success/10 text-success",
    chipped: "bg-warning/10 text-warning",
    replace: "bg-destructive/10 text-destructive",
  };

  const openEdit = (item: KitchenInventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name, category: item.category, quantity: item.quantity, unit: item.unit,
      par_level: item.par_level, condition: item.condition, location: item.location,
      supplier: item.supplier || "", cost_per_unit: item.cost_per_unit, notes: item.notes || "",
    });
    setDialogOpen(true);
  };

  const close = () => { setDialogOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setSaving(true);
    try {
      await saveItem.mutateAsync({ ...form, id: editing?.id });
      toast.success(editing ? "Updated" : "Added");
      close();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteItem.mutateAsync(deleting.id);
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
    setDeleteOpen(false);
    setDeleting(null);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{totalItems}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Items</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">${totalValue.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Total Value</p>
        </CardContent></Card>
        <Card><CardContent className={cn("p-3 text-center", belowPar.length > 0 && "border-warning/30")}>
          <p className={cn("text-2xl font-bold", belowPar.length > 0 && "text-warning")}>{belowPar.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Below Par</p>
        </CardContent></Card>
        <Card><CardContent className={cn("p-3 text-center", needReplace.length > 0 && "border-destructive/30")}>
          <p className={cn("text-2xl font-bold", needReplace.length > 0 && "text-destructive")}>{needReplace.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase">Need Replace</p>
        </CardContent></Card>
      </div>

      {/* Alert */}
      {belowPar.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">{belowPar.length} items below par level</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search crockery..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CROCKERY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Item</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Qty</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Par</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Condition</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Location</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Supplier</th>
                <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3"><Badge variant="outline" className="text-xs">{item.category}</Badge></td>
                  <td className={cn("p-3", item.par_level > 0 && item.quantity < item.par_level && "text-destructive font-semibold")}>
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-3 text-muted-foreground">{item.par_level} {item.unit}</td>
                  <td className="p-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium capitalize", conditionStyle[item.condition] || conditionStyle.good)}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">{item.location}</td>
                  <td className="p-3 text-muted-foreground">{item.supplier || "-"}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-muted"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                      <button onClick={() => { setDeleting(item); setDeleteOpen(true); }} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No crockery items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={close}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Crockery Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Dinner Plates 10in" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CROCKERY_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} /></div>
              <div className="space-y-2"><Label>Unit</Label>
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Par Level</Label><Input type="number" min="0" value={form.par_level} onChange={(e) => setForm({ ...form, par_level: parseInt(e.target.value) || 0 })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="space-y-2"><Label>Supplier</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Cost per Unit ($)</Label><Input type="number" min="0" step="0.01" value={form.cost_per_unit} onChange={(e) => setForm({ ...form, cost_per_unit: parseFloat(e.target.value) || 0 })} /></div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              {editing ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
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
}
