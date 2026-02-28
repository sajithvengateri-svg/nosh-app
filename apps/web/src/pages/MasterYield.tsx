import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, AlertTriangle, Percent } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  cost_per_unit: number;
  yield_percent: number;
}

const categories = ["All", "Proteins", "Produce", "Dairy", "Dry Goods", "Oils", "Beverages", "Prepared"];

const MasterYield = () => {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ingredients")
      .select("id, name, category, unit, cost_per_unit, yield_percent")
      .order("name");

    if (error) {
      toast.error("Failed to load ingredients");
    } else {
      setIngredients(data || []);
    }
    setLoading(false);
  };

  const handleYieldSave = async (id: string) => {
    const parsed = parseFloat(editValue);
    if (isNaN(parsed)) {
      setEditingId(null);
      return;
    }
    const clamped = Math.min(100, Math.max(1, parsed));
    const { error } = await supabase
      .from("ingredients")
      .update({ yield_percent: clamped } as any)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update yield");
    } else {
      setIngredients(prev =>
        prev.map(i => (i.id === id ? { ...i, yield_percent: clamped } : i))
      );
      toast.success("Yield updated");
    }
    setEditingId(null);
  };

  const filtered = ingredients.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || i.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const avgYield = ingredients.length > 0
    ? ingredients.reduce((sum, i) => sum + Number(i.yield_percent), 0) / ingredients.length
    : 100;
  const belowThreshold = ingredients.filter(i => Number(i.yield_percent) < 75).length;

  const getYieldColor = (y: number) => {
    if (y < 50) return "text-destructive";
    if (y < 75) return "text-warning";
    return "text-success";
  };

  const usableCost = (cost: number, yieldPct: number) => {
    if (yieldPct <= 0) return cost;
    return cost / (yieldPct / 100);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ingredients")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="page-title font-display">Master Yield Editor</h1>
            <p className="page-subtitle">Bulk view and edit yield percentages</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-elevated p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg Yield</p>
            <p className={cn("text-2xl font-bold", getYieldColor(avgYield))}>
              {avgYield.toFixed(0)}%
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Below 75%</p>
            <p className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
              {belowThreshold > 0 && <AlertTriangle className="w-4 h-4 text-warning" />}
              {belowThreshold}
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Items</p>
            <p className="text-2xl font-bold text-foreground">{ingredients.length}</p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Filtered</p>
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="card-elevated overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Cost/Unit</TableHead>
                  <TableHead className="text-right">Yield %</TableHead>
                  <TableHead className="text-right">Usable Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(ing => (
                  <TableRow key={ing.id}>
                    <TableCell className="font-medium">{ing.name}</TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {ing.category}
                      </span>
                    </TableCell>
                    <TableCell>{ing.unit}</TableCell>
                    <TableCell className="text-right">${Number(ing.cost_per_unit).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {editingId === ing.id ? (
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleYieldSave(ing.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleYieldSave(ing.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-20 h-8 text-right ml-auto"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(ing.id);
                            setEditValue(String(Number(ing.yield_percent)));
                          }}
                          className={cn(
                            "font-semibold cursor-pointer hover:underline",
                            getYieldColor(Number(ing.yield_percent))
                          )}
                        >
                          {Number(ing.yield_percent)}%
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${usableCost(Number(ing.cost_per_unit), Number(ing.yield_percent)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No ingredients found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MasterYield;
