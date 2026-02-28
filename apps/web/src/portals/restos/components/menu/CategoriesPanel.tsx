import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePOSCategories, useCategoryMutations } from "../../hooks/usePOSData";

interface CategoryFormState {
  name: string;
  icon: string;
  sort_order: number;
}

const EMPTY: CategoryFormState = { name: "", icon: "", sort_order: 0 };

export default function CategoriesPanel() {
  const { data: categories, isLoading } = usePOSCategories();
  const { create, update, remove } = useCategoryMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormState>(EMPTY);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY, sort_order: (categories?.length ?? 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon ?? "", sort_order: cat.sort_order });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      update.mutate({ id: editingId, ...form }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Categories</h2>
        <Button onClick={openCreate} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : !categories?.length ? (
        <div className="text-slate-500 text-sm bg-white/5 rounded-xl p-8 text-center">
          No categories yet. Create your first one.
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat: any) => (
            <div
              key={cat.id}
              className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-slate-600 cursor-grab" />
                <span className="text-lg">{cat.icon || "📁"}</span>
                <div>
                  <p className="text-sm font-medium text-white">{cat.name}</p>
                  <p className="text-xs text-slate-500">Order: {cat.sort_order}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={() => openEdit(cat)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-400"
                  onClick={() => remove.mutate(cat.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Coffee"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Icon (emoji)</label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="☕"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sort Order</label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={create.isPending || update.isPending}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white"
            >
              {create.isPending || update.isPending ? "Saving…" : editingId ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
