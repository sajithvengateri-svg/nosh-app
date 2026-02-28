import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Search, 
  Plus, 
  TrendingUp,
  TrendingDown,
  Package,
  Edit,
  Trash2,
  Loader2,
  Truck,
  Camera,
  Upload,
  FileText,
  Sparkles,
  Percent,
  Receipt
} from "lucide-react";
import PriceHistoryChart from "@/components/ingredients/PriceHistoryChart";
import PriceUpdateDialog from "@/components/ingredients/PriceUpdateDialog";
import IngredientScanner, { type ScannedIngredientData } from "@/components/ingredients/IngredientScanner";
import DocketScanner from "@/components/food-safety/DocketScanner";
import AppLayout from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { isHomeCookMode } from "@/lib/shared/modeConfig";

interface Ingredient {
  id: string;
  name: string;
  category: string;
  unit: string;
  cost_per_unit: number;
  supplier: string | null;
  allergens: string[];
  par_level: number;
  current_stock: number;
  notes: string | null;
  yield_percent: number;
}

interface Supplier {
  id: string;
  name: string;
  category: string;
}

const categories = ["All", "Proteins", "Produce", "Dairy", "Dry Goods", "Oils", "Beverages", "Prepared"];
const units = ["kg", "g", "L", "ml", "lb", "oz", "each", "bunch", "case"];

const Ingredients = ({ embedded = false }: { embedded?: boolean }) => {
  const { canEdit } = useAuth();
  const { currentOrg, storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDocketScanner, setShowDocketScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [addMethodOpen, setAddMethodOpen] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [extractedIngredients, setExtractedIngredients] = useState<Array<{name: string; category: string; unit: string; cost_per_unit: number; selected: boolean}>>([]);
  const [showBatchReview, setShowBatchReview] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const [priceUpdateIngredient, setPriceUpdateIngredient] = useState<Ingredient | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Produce",
    unit: "kg",
    cost_per_unit: 0,
    supplier: "",
    par_level: 0,
    current_stock: 0,
    notes: "",
    yield_percent: 100,
  });

  const hasEditPermission = canEdit("ingredients");

  useEffect(() => {
    fetchIngredients();
    if (!isHomeCook) fetchSuppliers();
    // Auto-open docket scanner via query param
    if (searchParams.get("docket") === "1") {
      setShowDocketScanner(true);
      searchParams.delete("docket");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name, category")
      .order("name");

    if (error) {
      console.error("Error fetching suppliers:", error);
    } else {
      setSuppliers(data || []);
    }
  };

  const fetchIngredients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching ingredients:", error);
      toast.error("Failed to load ingredients");
    } else {
      setIngredients(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Ingredient name is required");
      return;
    }

    if (editingIngredient) {
      const { error } = await supabase
        .from("ingredients")
        .update({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          cost_per_unit: formData.cost_per_unit,
          supplier: formData.supplier || null,
          par_level: formData.par_level,
          current_stock: formData.current_stock,
          notes: formData.notes || null,
          yield_percent: formData.yield_percent,
        } as any)
        .eq("id", editingIngredient.id);

      if (error) {
        toast.error("Failed to update ingredient");
        console.error(error);
        return;
      }
      toast.success(`${formData.name} updated successfully`);
    } else {
      const { error } = await supabase.from("ingredients").insert({
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        cost_per_unit: formData.cost_per_unit,
        supplier: formData.supplier || null,
        par_level: formData.par_level,
        current_stock: formData.current_stock,
        notes: formData.notes || null,
        yield_percent: formData.yield_percent,
        org_id: currentOrg?.id,
      } as any);

      if (error) {
        toast.error("Failed to create ingredient");
        console.error(error);
        return;
      }
      toast.success(`${formData.name} added successfully`);
    }

    resetForm();
    fetchIngredients();
  };

  const handlePriceUpdate = async (newPrice: number, method: "direct" | "weighted") => {
    if (!priceUpdateIngredient) return;
    const { error } = await supabase
      .from("ingredients")
      .update({ cost_per_unit: newPrice } as any)
      .eq("id", priceUpdateIngredient.id);
    if (error) {
      toast.error("Failed to update price");
      return;
    }
    toast.success(`Price updated (${method === "weighted" ? "stock-weighted avg" : "direct"}) to $${newPrice.toFixed(2)}`);
    setPriceUpdateIngredient(null);
    fetchIngredients();
  };

  const handleDelete = async () => {
    if (!deletingIngredient) return;

    const { error } = await supabase
      .from("ingredients")
      .delete()
      .eq("id", deletingIngredient.id);

    if (error) {
      toast.error("Failed to delete ingredient");
      console.error(error);
      return;
    }

    toast.success("Ingredient deleted");
    setDeleteDialogOpen(false);
    setDeletingIngredient(null);
    fetchIngredients();
  };

  const openEditDialog = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      cost_per_unit: Number(ingredient.cost_per_unit),
      supplier: ingredient.supplier || "",
      par_level: Number(ingredient.par_level),
      current_stock: Number(ingredient.current_stock),
      notes: ingredient.notes || "",
      yield_percent: Number(ingredient.yield_percent) || 100,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingIngredient(null);
    setFormData({
      name: "",
      category: "Produce",
      unit: "kg",
      cost_per_unit: 0,
      supplier: "",
      par_level: 0,
      current_stock: 0,
      notes: "",
      yield_percent: 100,
    });
  };

  const filteredItems = ingredients.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (current: number, par: number) => {
    if (par === 0) return "ok";
    const ratio = current / par;
    if (ratio <= 0.25) return "critical";
    if (ratio <= 0.5) return "low";
    return "ok";
  };

  const handleUploadFile = () => {
    setAddMethodOpen(false);
    setTimeout(() => uploadFileRef.current?.click(), 150);
  };

  const handleFileUploaded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);
    toast.info(`Processing "${file.name}"...`);
    
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-ingredients-list", {
        body: { file_base64: base64, file_type: file.type, file_name: file.name },
      });
      if (error) throw error;

      const items = (data.ingredients || []).map((ing: any) => ({
        name: ing.name || "",
        category: ing.category || "Produce",
        unit: ing.unit || "kg",
        cost_per_unit: ing.cost_per_unit || 0,
        selected: true,
      }));

      if (items.length === 0) {
        toast.warning("No ingredients detected. Try a different file.");
      } else {
        setExtractedIngredients(items);
        setShowBatchReview(true);
        toast.success(`Found ${items.length} ingredients!`);
      }
    } catch (err) {
      console.error("Failed to extract ingredients:", err);
      toast.error("Failed to extract ingredients. Please try again.");
    } finally {
      setIsUploadingFile(false);
      if (uploadFileRef.current) uploadFileRef.current.value = "";
    }
  };

  const handleSaveBatch = async () => {
    const selected = extractedIngredients.filter(i => i.selected && i.name.trim());
    if (selected.length === 0) { toast.error("Select at least one ingredient"); return; }
    setIsSavingBatch(true);
    try {
      const toInsert = selected.map(ing => ({
        name: ing.name.trim(),
        category: ing.category,
        unit: ing.unit,
        cost_per_unit: ing.cost_per_unit,
        org_id: currentOrg?.id,
      }));
      const { error } = await supabase.from("ingredients").insert(toInsert);
      if (error) throw error;
      toast.success(`Added ${selected.length} ingredients!`);
      setShowBatchReview(false);
      setExtractedIngredients([]);
      fetchIngredients();
    } catch (err) {
      console.error("Failed to save ingredients:", err);
      toast.error("Failed to save ingredients");
    } finally {
      setIsSavingBatch(false);
    }
  };

  const content = (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Ingredients</h1>
            <p className="page-subtitle">{isHomeCook ? "Your ingredient pantry" : "Manage your ingredient library"}</p>
          </div>
          {hasEditPermission && (
            <div className="flex gap-2">
              {isHomeCook && (
                <Button variant="outline" onClick={() => setShowDocketScanner(prev => !prev)}>
                  <Receipt className="w-4 h-4 mr-2" />
                  {showDocketScanner ? "Hide Scanner" : "Scan Docket"}
                </Button>
              )}
              {!isHomeCook && (
              <Button variant="outline" onClick={() => navigate("/master-yield")}>
                <Percent className="w-4 h-4 mr-2" />
                Master Yield
              </Button>
              )}
              <Button onClick={() => setAddMethodOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </div>
          )}
        </motion.div>

        {/* Inline Docket Scanner for Home Cooks */}
        {isHomeCook && showDocketScanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card-elevated p-4"
          >
            <DocketScanner />
          </motion.div>
        )}

        {/* Search and Categories */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Ingredients Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredItems.map((ingredient, index) => {
              const stockStatus = getStockStatus(Number(ingredient.current_stock), Number(ingredient.par_level));
              
              return (
                <motion.div
                  key={ingredient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="card-elevated p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <div className="p-2 rounded-lg bg-muted">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <PriceHistoryChart 
                        ingredientId={ingredient.id}
                        ingredientName={ingredient.name}
                        currentPrice={Number(ingredient.cost_per_unit)}
                        unit={ingredient.unit}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                        {ingredient.category}
                      </span>
                      {hasEditPermission && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditDialog(ingredient)}
                            className="p-1 rounded hover:bg-muted transition-colors"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingIngredient(ingredient);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-foreground mb-1">{ingredient.name}</h3>
                  
                  <div className="pt-3 border-t border-border mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Price per {ingredient.unit}</p>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        stockStatus === "critical" && "bg-destructive/10 text-destructive",
                        stockStatus === "low" && "bg-warning/10 text-warning",
                        stockStatus === "ok" && "bg-success/10 text-success"
                      )}>
                        {stockStatus === "critical" ? "Critical" : stockStatus === "low" ? "Low" : "In Stock"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-foreground">
                        ${Number(ingredient.cost_per_unit).toFixed(2)}
                      </p>
                      {hasEditPermission && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPriceUpdateIngredient(ingredient); }}
                          className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                        >
                          $ Update
                        </button>
                      )}
                    </div>
                    {!isHomeCook && Number((ingredient as any).yield_percent) < 100 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Yield: {Number((ingredient as any).yield_percent)}% · Usable: ${(Number(ingredient.cost_per_unit) / (Number((ingredient as any).yield_percent) / 100)).toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                    <span>Stock: {Number(ingredient.current_stock).toFixed(1)} {ingredient.unit}</span>
                    <span>Par: {Number(ingredient.par_level).toFixed(1)} {ingredient.unit}</span>
                  </div>

                  {!isHomeCook && ingredient.supplier && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Supplier: {ingredient.supplier}
                    </p>
                  )}
                </motion.div>
              );
            })}

            {filteredItems.length === 0 && !loading && (
              <div className="col-span-full py-12 text-center">
                <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No ingredients found</p>
                {hasEditPermission && (
                  <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Ingredient
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={resetForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingIngredient ? "Edit Ingredient" : "New Ingredient"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ingredient Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fresh Salmon"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c !== "All").map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost/Unit ($)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                {!isHomeCook && (
                <div className="space-y-2">
                  <Label htmlFor="yield">Yield %</Label>
                  <Input
                    id="yield"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.yield_percent}
                    onChange={(e) => setFormData({ ...formData, yield_percent: parseFloat(e.target.value) || 100 })}
                  />
                  {formData.yield_percent < 100 && formData.cost_per_unit > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Usable cost: ${(formData.cost_per_unit / (formData.yield_percent / 100)).toFixed(2)}/{formData.unit}
                    </p>
                  )}
                </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="par">Par Level</Label>
                  <Input
                    id="par"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.par_level}
                    onChange={(e) => setFormData({ ...formData, par_level: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              {!isHomeCook && (
              <>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier || "none"}
                  onValueChange={(value) => setFormData({ ...formData, supplier: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">No supplier</span>
                    </SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.name}>
                        <div className="flex items-center gap-2">
                          <Truck className="w-3 h-3 text-muted-foreground" />
                          <span>{supplier.name}</span>
                          <span className="text-xs text-muted-foreground">({supplier.category})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {suppliers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No suppliers found. Add suppliers in Food Safety → Suppliers.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                />
              </div>
              </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingIngredient ? "Save Changes" : "Add Ingredient"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Ingredient</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{deletingIngredient?.name}"? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Ingredient Scanner */}
        <IngredientScanner
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onDataExtracted={(scanned: ScannedIngredientData) => {
            const validCategories = ["Proteins", "Produce", "Dairy", "Dry Goods", "Oils", "Beverages", "Prepared"];
            const matchedCategory = validCategories.find(
              c => c.toLowerCase() === (scanned.category || "").toLowerCase()
            ) || "Produce";
            
            const validUnits = ["kg", "g", "L", "ml", "lb", "oz", "each", "bunch", "case"];
            const matchedUnit = validUnits.find(
              u => u.toLowerCase() === (scanned.suggested_unit || "").toLowerCase()
            ) || "kg";

            setFormData({
              name: scanned.name || "",
              category: matchedCategory,
              unit: matchedUnit,
              cost_per_unit: scanned.estimated_cost_per_unit || 0,
              supplier: "",
              par_level: 0,
              current_stock: 0,
              notes: [scanned.notes, scanned.allergens?.length ? `Allergens: ${scanned.allergens.join(", ")}` : ""].filter(Boolean).join("\n"),
              yield_percent: 100,
            });
            setEditingIngredient(null);
            setDialogOpen(true);
          }}
        />

        {/* Add Method Dialog — 3 options */}
        <Dialog open={addMethodOpen} onOpenChange={setAddMethodOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Ingredients</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
              <button
                onClick={() => { setAddMethodOpen(false); setScannerOpen(true); }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Camera className="w-8 h-8 text-primary" />
                <span className="font-medium text-sm">Scan / Photo</span>
                <span className="text-xs text-muted-foreground text-center">Snap a photo, barcode, or product label</span>
              </button>
              <button
                onClick={handleUploadFile}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-8 h-8 text-primary" />
                <span className="font-medium text-sm">Upload File</span>
                <span className="text-xs text-muted-foreground text-center">Excel, CSV, or image of a list</span>
              </button>
              <button
                onClick={() => { setAddMethodOpen(false); setEditingIngredient(null); setDialogOpen(true); }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Plus className="w-8 h-8 text-primary" />
                <span className="font-medium text-sm">Type Manually</span>
                <span className="text-xs text-muted-foreground text-center">Enter details by hand</span>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hidden file input for upload */}
        <input
          ref={uploadFileRef}
          type="file"
          className="hidden"
          accept=".csv,.xlsx,.xls,image/*,.pdf"
          onChange={handleFileUploaded}
        />

        {/* Upload loading overlay */}
        {isUploadingFile && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <p className="font-medium">Extracting ingredients with AI...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Batch Review Dialog */}
        <Dialog open={showBatchReview} onOpenChange={setShowBatchReview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Extracted Ingredients</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground mb-4">
              <Sparkles className="w-4 h-4 inline mr-1 text-warning" />
              AI-extracted — review and deselect any you don't need.
            </p>
            <div className="space-y-2">
              {extractedIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <input
                    type="checkbox"
                    checked={ing.selected}
                    onChange={() => {
                      const updated = [...extractedIngredients];
                      updated[idx].selected = !updated[idx].selected;
                      setExtractedIngredients(updated);
                    }}
                    className="rounded border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{ing.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{ing.category} · {ing.unit}</span>
                  </div>
                  {ing.cost_per_unit > 0 && (
                    <span className="text-xs text-muted-foreground">${ing.cost_per_unit.toFixed(2)}/{ing.unit}</span>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowBatchReview(false)}>Cancel</Button>
              <Button onClick={handleSaveBatch} disabled={isSavingBatch || extractedIngredients.filter(i => i.selected).length === 0}>
                {isSavingBatch ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add {extractedIngredients.filter(i => i.selected).length} Ingredients
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Price Update Dialog */}
        {priceUpdateIngredient && (
          <PriceUpdateDialog
            open={!!priceUpdateIngredient}
            onOpenChange={(o) => { if (!o) setPriceUpdateIngredient(null); }}
            ingredientName={priceUpdateIngredient.name}
            currentPrice={Number(priceUpdateIngredient.cost_per_unit)}
            currentStock={Number(priceUpdateIngredient.current_stock)}
            unit={priceUpdateIngredient.unit}
            onConfirm={handlePriceUpdate}
          />
        )}
      </div>
  );

  if (embedded) return content;
  return <AppLayout>{content}</AppLayout>;
};

export default Ingredients;
