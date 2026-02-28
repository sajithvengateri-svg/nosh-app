import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePOSModifierGroups, useModifierMutations } from "../../hooks/usePOSData";

export default function ModifierGroupsPanel() {
  const { data: groups, isLoading } = usePOSModifierGroups();
  const { createGroup, createMod, removeGroup } = useModifierMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: "", is_required: false, min_selections: 0, max_selections: 1 });
  const [modDialogOpen, setModDialogOpen] = useState(false);
  const [modGroupId, setModGroupId] = useState<string | null>(null);
  const [modForm, setModForm] = useState({ name: "", price_adjustment: "" });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateGroup = () => {
    if (!groupForm.name.trim()) return;
    createGroup.mutate(groupForm, { onSuccess: () => { setDialogOpen(false); setGroupForm({ name: "", is_required: false, min_selections: 0, max_selections: 1 }); } });
  };

  const handleAddMod = () => {
    if (!modForm.name.trim() || !modGroupId) return;
    createMod.mutate(
      { group_id: modGroupId, name: modForm.name, price_adjustment: parseFloat(modForm.price_adjustment) || 0 },
      { onSuccess: () => { setModDialogOpen(false); setModForm({ name: "", price_adjustment: "" }); } }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Modifier Groups</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
          <Plus className="h-4 w-4 mr-1" /> Add Group
        </Button>
      </div>

      {isLoading ? (
        <div className="text-slate-400 text-sm">Loading…</div>
      ) : !groups?.length ? (
        <div className="text-slate-500 text-sm bg-white/5 rounded-xl p-8 text-center">
          No modifier groups yet. E.g. "Milk Options", "Extra Toppings".
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group: any) => {
            const isExpanded = expandedGroups.has(group.id);
            return (
              <div key={group.id} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02]"
                  onClick={() => toggleExpand(group.id)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                    <div>
                      <p className="text-sm font-medium text-white">{group.name}</p>
                      <p className="text-xs text-slate-500">
                        {group.is_required ? "Required" : "Optional"} · {group.min_selections}–{group.max_selections} selections ·{" "}
                        {group.modifiers?.length ?? 0} options
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost" size="sm"
                      className="text-xs text-slate-400 hover:text-white"
                      onClick={() => { setModGroupId(group.id); setModForm({ name: "", price_adjustment: "" }); setModDialogOpen(true); }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-400" onClick={() => removeGroup.mutate(group.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {isExpanded && group.modifiers?.length > 0 && (
                  <div className="border-t border-white/5 px-4 py-2 space-y-1">
                    {group.modifiers.map((mod: any) => (
                      <div key={mod.id} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-slate-300">{mod.name}</span>
                        <span className={`font-mono text-xs ${Number(mod.price_adjustment) > 0 ? "text-emerald-400" : Number(mod.price_adjustment) < 0 ? "text-red-400" : "text-slate-500"}`}>
                          {Number(mod.price_adjustment) > 0 ? "+" : ""}
                          {Number(mod.price_adjustment) !== 0 ? `$${Number(mod.price_adjustment).toFixed(2)}` : "Free"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Group Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-white/10 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Modifier Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Group Name</label>
              <Input value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} placeholder="e.g. Milk Options" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">Required?</label>
              <Switch checked={groupForm.is_required} onCheckedChange={(v) => setGroupForm({ ...groupForm, is_required: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Min Selections</label>
                <Input type="number" value={groupForm.min_selections} onChange={(e) => setGroupForm({ ...groupForm, min_selections: parseInt(e.target.value) || 0 })} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Max Selections</label>
                <Input type="number" value={groupForm.max_selections} onChange={(e) => setGroupForm({ ...groupForm, max_selections: parseInt(e.target.value) || 1 })} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <Button onClick={handleCreateGroup} disabled={createGroup.isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
              {createGroup.isPending ? "Creating…" : "Create Group"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Modifier Dialog */}
      <Dialog open={modDialogOpen} onOpenChange={setModDialogOpen}>
        <DialogContent className="bg-[#1a1d27] border-white/10 text-white sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Modifier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Name</label>
              <Input value={modForm.name} onChange={(e) => setModForm({ ...modForm, name: e.target.value })} placeholder="e.g. Oat Milk" className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Price Adjustment ($)</label>
              <Input type="number" step="0.01" value={modForm.price_adjustment} onChange={(e) => setModForm({ ...modForm, price_adjustment: e.target.value })} placeholder="0.00" className="bg-white/5 border-white/10 text-white" />
            </div>
            <Button onClick={handleAddMod} disabled={createMod.isPending} className="w-full bg-rose-500 hover:bg-rose-600 text-white">
              {createMod.isPending ? "Adding…" : "Add Modifier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
