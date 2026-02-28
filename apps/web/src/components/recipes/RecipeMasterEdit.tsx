import { useState, useMemo } from "react";
import { ArrowLeft, Download, Trash2, FolderEdit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import RecipeTypeBadge from "./RecipeTypeBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RecipeType } from "./RecipeTypeSelector";

interface Recipe {
  id: string;
  name: string;
  category: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  cost_per_serving: number;
  sell_price: number | null;
  recipe_type: string | null;
  is_batch_recipe: boolean;
  created_at: string;
}

interface Section {
  id: string;
  name: string;
  color: string;
}

interface Props {
  recipes: Recipe[];
  sections: Section[];
  activeMenuRecipeIds: Set<string>;
  onClose: () => void;
  onRefresh: () => void;
}

const RecipeMasterEdit = ({ recipes, sections, activeMenuRecipeIds, onClose, onRefresh }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  // Inline edit tracking
  const [editingSellPrice, setEditingSellPrice] = useState<Record<string, string>>({});

  const allIds = useMemo(() => recipes.map(r => r.id), [recipes]);
  const allSelected = recipes.length > 0 && selected.size === recipes.length;
  const someSelected = selected.size > 0 && selected.size < recipes.length;
  const selectedCount = selected.size;

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  // ── CSV Export ──
  const exportCSV = () => {
    const selectedRecipes = recipes.filter(r => selected.has(r.id));
    if (selectedRecipes.length === 0) return;

    const header = "Name,Category,Type,Servings,Prep (min),Cook (min),Cost/Serving,Sell Price\n";
    const rows = selectedRecipes.map(r =>
      `"${r.name.replace(/"/g, '""')}","${r.category}","${r.recipe_type || 'dish'}",${r.servings},${r.prep_time},${r.cook_time},${r.cost_per_serving},${r.sell_price ?? ''}`
    ).join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recipes-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedRecipes.length} recipes`);
  };

  // ── Bulk Delete ──
  const handleBulkDelete = async () => {
    setDeleting(true);
    const ids = Array.from(selected);
    try {
      // Related tables use ON DELETE CASCADE, so just delete recipes directly
      // Use .select("id") to verify which rows were actually deleted (RLS may silently block)
      const { data, error } = await supabase
        .from("recipes")
        .delete()
        .in("id", ids)
        .select("id");
      
      if (error) {
        toast.error("Failed to delete recipes: " + error.message);
        console.error("Bulk delete error:", error);
        setDeleting(false);
        return;
      }

      if (!data || data.length === 0) {
        toast.error("Delete blocked — you may not have permission to delete these recipes.");
        setDeleting(false);
        return;
      }

      if (data.length < ids.length) {
        toast.warning(`Only ${data.length} of ${ids.length} recipes were deleted (permission issue on the rest).`);
      } else {
        toast.success(`Deleted ${data.length} recipe${data.length !== 1 ? "s" : ""}`);
      }

      setSelected(new Set());
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
      onRefresh();
    } catch (err: any) {
      toast.error("Delete failed: " + (err?.message || "Unknown error"));
      console.error("Bulk delete catch:", err);
    } finally {
      setDeleting(false);
    }
  };

  // ── Bulk Category Change ──
  const handleBulkCategoryChange = async (category: string) => {
    const ids = Array.from(selected);
    const { error } = await supabase.from("recipes").update({ category }).in("id", ids);
    if (error) {
      toast.error("Failed to update category");
      console.error(error);
      return;
    }
    toast.success(`Updated ${ids.length} recipes to "${category}"`);
    setCategoryPopoverOpen(false);
    onRefresh();
  };

  // ── Inline Sell Price ──
  const commitSellPrice = async (id: string) => {
    const raw = editingSellPrice[id];
    if (raw === undefined) return;
    const val = parseFloat(raw);
    const sell_price = isNaN(val) ? null : val;
    const { error } = await supabase.from("recipes").update({ sell_price }).eq("id", id);
    if (error) {
      toast.error("Failed to update sell price");
      return;
    }
    setEditingSellPrice(prev => { const n = { ...prev }; delete n[id]; return n; });
    onRefresh();
  };

  // ── Inline Category ──
  const handleInlineCategory = async (id: string, category: string) => {
    const { error } = await supabase.from("recipes").update({ category }).eq("id", id);
    if (error) {
      toast.error("Failed to update category");
      return;
    }
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Master Edit — Recipe Bank</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={selectedCount === 0}
            onClick={exportCSV}
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedCount === 0}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  // @ts-ignore – indeterminate is valid
                  indeterminate={someSelected}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-36">Category</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-24 text-right">Cost/Srv</TableHead>
              <TableHead className="w-28 text-right">Sell Price</TableHead>
              <TableHead className="w-20 text-center">Menu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.map(recipe => {
              const isSelected = selected.has(recipe.id);
              const isOnMenu = activeMenuRecipeIds.has(recipe.id);
              const isEditingPrice = editingSellPrice[recipe.id] !== undefined;

              return (
                <TableRow
                  key={recipe.id}
                  data-state={isSelected ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => toggleOne(recipe.id)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(recipe.id)} />
                  </TableCell>
                  <TableCell className="font-medium">{recipe.name}</TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Select
                      value={recipe.category}
                      onValueChange={(val) => handleInlineCategory(recipe.id, val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map(s => (
                          <SelectItem key={s.id} value={s.name}>
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                              {s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <RecipeTypeBadge type={(recipe.recipe_type || "dish") as RecipeType} />
                    {(recipe.recipe_type || "dish") === "dish" && (
                      <span className="text-xs text-muted-foreground">Dish</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    ${Number(recipe.cost_per_serving).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                    {isEditingPrice ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Input
                          className="h-7 w-20 text-right text-sm"
                          type="number"
                          step="0.01"
                          autoFocus
                          value={editingSellPrice[recipe.id]}
                          onChange={e => setEditingSellPrice(prev => ({ ...prev, [recipe.id]: e.target.value }))}
                          onBlur={() => commitSellPrice(recipe.id)}
                          onKeyDown={e => { if (e.key === "Enter") commitSellPrice(recipe.id); }}
                        />
                      </div>
                    ) : (
                      <button
                        className="text-sm font-mono hover:underline"
                        onClick={() =>
                          setEditingSellPrice(prev => ({
                            ...prev,
                            [recipe.id]: recipe.sell_price?.toString() ?? "",
                          }))
                        }
                      >
                        {recipe.sell_price != null ? `$${Number(recipe.sell_price).toFixed(2)}` : "—"}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isOnMenu && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Check className="w-3 h-3" /> On
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Sticky bottom toolbar */}
      {selectedCount > 0 && (
        <div className="border-t bg-muted/50 px-4 py-3 flex items-center justify-between shrink-0">
          <span className="text-sm font-medium">
            {selectedCount} of {recipes.length} selected
          </span>
          <div className="flex items-center gap-2">
            <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderEdit className="w-4 h-4 mr-1" />
                  Change Category
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                {sections.map(s => (
                  <button
                    key={s.id}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
                    onClick={() => handleBulkCategoryChange(s.name)}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete {selectedCount}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteConfirmText(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Recipe{selectedCount !== 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              This will permanently delete {selectedCount} recipe{selectedCount !== 1 ? "s" : ""} and all associated ingredients, method steps, and data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-bold text-foreground">DELETE</span> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              autoFocus
            />
            {deleteConfirmText.length > 0 && deleteConfirmText.toUpperCase() !== "DELETE" && (
              <p className="text-xs text-destructive">Please type DELETE to enable the button</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText(""); }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={deleting || deleteConfirmText.toUpperCase() !== "DELETE"}
            >
              {deleting ? "Deleting…" : `Delete ${selectedCount} Recipe${selectedCount !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecipeMasterEdit;
