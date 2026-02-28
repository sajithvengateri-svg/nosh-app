import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { usePOSMenuItems, usePOSCategories, useMenuItemMutations } from "../../hooks/usePOSData";

interface ItemForm {
  name: string;
  description: string;
  price: string;
  cost_price: string;
  category_id: string;
  station: string;
  is_active: boolean;
}

const EMPTY: ItemForm = { name: "", description: "", price: "", cost_price: "", category_id: "", station: "PASS", is_active: true };
const STATIONS = ["HOT", "COLD", "BAR", "PASS", "COFFEE"] as const;

export default function MenuItemsPanel() {
  const { data: items, isLoading } = usePOSMenuItems();
  const { data: categories } = usePOSCategories();
  const { create, update, remove } = useMenuItemMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      cost_price: String(item.cost_price ?? ""),
      category_id: item.category_id ?? "",
      station: item.station ?? "PASS",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      cost_price: parseFloat(form.cost_price) || 0,
      category_id: form.category_id || null,
      station: form.station,
      is_active: form.is_active,
    };
    if (editingId) {
      update.mutate({ id: editingId, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const filtered = (items ?? []).filter((i: any) => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== "all" && i.category_id !== filterCat) return false;
    return true;
  });

  const stationColor: Record<string, string> = {
    HOT: "bg-red-500/20 text-red-400",
    COLD: "bg-blue-500/20 text-blue-400",
    BAR: "bg-purple-500/20 text-purple-400",
    PASS: "bg-slate-500/20 text-slate-400",
    COFFEE: "bg-amber-500/20 text-amber-400",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-lg font-semibold text-white">Menu Items</h2>
        <Button onClick={openCreate} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44 bg-white/5 border-white/10 text-white">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1d27] border-white/10 text-white">
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : !filtered.length ? (
        <div className="text-slate-500 text-sm bg-white/5 rounded-xl p-8 text-center">
          {search || filterCat !== "all" ? "No items match filters." : "No menu items yet. Add your first one."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-500 uppercase tracking-wide">
                <th className="pb-2 pr-4">Item</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Price</th>
                <th className="pb-2 pr-4">Cost</th>
                <th className="pb-2 pr-4">GP%</th>
                <th className="pb-2 pr-4">Station</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: any) => {
                const gp = item.price > 0 && item.cost_price != null
                  ? Math.round(((item.price - item.cost_price) / item.price) * 100)
                  : null;
                return (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-white">{item.name}</p>
                      {item.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">{item.description}</p>}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {item.category ? `${item.category.icon ?? ""} ${item.category.name}` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-white font-mono">${Number(item.price).toFixed(2)}</td>
                    <td className="py-3 pr-4 text-slate-400 font-mono">${Number(item.cost_price ?? 0).toFixed(2)}</td>
                    <td className="py-3 pr-4">
                      {gp != null ? (
                        <span className={gp >= 70 ? "text-emerald-400" : gp >= 50 ? "text-amber-400" : "text-red-400"}>
                          {gp}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${stationColor[item.station] ?? stationColor.PASS}`}>
                        {item.station}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-400" onClick={() => remove.mutate(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Item" : "New Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Flat White" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Price ($)</label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Cost ($)</label>
                <Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Category</label>
                <Select value={form.category_id || "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? "" : v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d27] border-white/10 text-white">
                    <SelectItem value="none">No category</SelectItem>
                    {categories?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Station</label>
                <Select value={form.station} onValueChange={(v) => setForm({ ...form, station: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d27] border-white/10 text-white">
                    {STATIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Active</label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
              {create.isPending || update.isPending ? "Saving…" : editingId ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
