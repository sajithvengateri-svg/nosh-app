import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Package, Search, Plus, Edit, Trash2, Loader2, Wine, Beer, Coffee,
  Martini, GlassWater, CupSoda, Leaf, Scan
} from "lucide-react";
import BevLabelScanner from "../components/BevLabelScanner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BevProduct {
  id: string;
  name: string;
  main_category: string;
  sub_category: string | null;
  format: string | null;
  bottle_size_ml: number | null;
  purchase_price: number;
  sell_price: number;
  pour_size_ml: number | null;
  pours_per_unit: number | null;
  par_level: number | null;
  is_coravin_eligible: boolean;
  abv: number | null;
  speed_rail_position: number | null;
  org_id: string;
}

const categories = [
  { key: "all", label: "All", icon: Package },
  { key: "wine", label: "Wine", icon: Wine },
  { key: "beer", label: "Beer", icon: Beer },
  { key: "spirits", label: "Spirits", icon: GlassWater },
  { key: "cocktails", label: "Cocktails", icon: Martini },
  { key: "mixers", label: "Mixers", icon: CupSoda },
  { key: "soft_drinks", label: "Soft Drinks", icon: Leaf },
  { key: "coffee_tea", label: "Coffee / Tea", icon: Coffee },
];

const defaultForm = {
  name: "", main_category: "wine", sub_category: "", format: "",
  bottle_size_ml: 750, purchase_price: 0, sell_price: 0,
  pour_size_ml: 150, pours_per_unit: 5, par_level: 0,
  is_coravin_eligible: false, abv: 0, speed_rail_position: 0,
};

const Cellar = () => {
  const { currentOrg } = useOrg();
  const [products, setProducts] = useState<BevProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BevProduct | null>(null);
  const [deleting, setDeleting] = useState<BevProduct | null>(null);
  const [formData, setFormData] = useState(defaultForm);

  const fetchProducts = useCallback(async () => {
    if (!currentOrg?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("bev_products").select("*").eq("org_id", currentOrg.id).order("name");
    if (error) { toast.error("Failed to load products"); console.error(error); }
    else setProducts(data || []);
    setLoading(false);
  }, [currentOrg?.id]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Product name is required"); return; }
    const payload = {
      name: formData.name,
      main_category: formData.main_category,
      sub_category: formData.sub_category || null,
      format: formData.format || null,
      bottle_size_ml: formData.bottle_size_ml || null,
      purchase_price: formData.purchase_price,
      sell_price: formData.sell_price,
      pour_size_ml: formData.pour_size_ml || null,
      pours_per_unit: formData.pours_per_unit || null,
      par_level: formData.par_level || null,
      is_coravin_eligible: formData.is_coravin_eligible,
      abv: formData.abv || null,
      speed_rail_position: formData.speed_rail_position || null,
    };

    if (editing) {
      const { error } = await (supabase as any).from("bev_products").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update product"); return; }
      toast.success("Product updated");
    } else {
      const { error } = await (supabase as any).from("bev_products").insert({ ...payload, org_id: currentOrg?.id });
      if (error) { toast.error("Failed to add product"); return; }
      toast.success("Product added");
    }
    resetForm();
    fetchProducts();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await (supabase as any).from("bev_products").delete().eq("id", deleting.id);
    if (error) { toast.error("Failed to delete product"); return; }
    toast.success("Product deleted");
    setDeleteDialogOpen(false);
    setDeleting(null);
    fetchProducts();
  };

  const openEdit = (p: BevProduct) => {
    setEditing(p);
    setFormData({
      name: p.name, main_category: p.main_category,
      sub_category: p.sub_category || "", format: p.format || "",
      bottle_size_ml: p.bottle_size_ml || 750,
      purchase_price: Number(p.purchase_price), sell_price: Number(p.sell_price),
      pour_size_ml: p.pour_size_ml || 150, pours_per_unit: p.pours_per_unit || 5,
      par_level: p.par_level || 0, is_coravin_eligible: p.is_coravin_eligible,
      abv: p.abv || 0, speed_rail_position: p.speed_rail_position || 0,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false); setEditing(null); setFormData(defaultForm);
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === "all" || p.main_category === selectedCategory;
    return matchSearch && matchCat;
  });

  const pourCost = (p: BevProduct) => {
    if (!p.pours_per_unit || p.pours_per_unit === 0) return 0;
    return Number(p.purchase_price) / p.pours_per_unit;
  };

  const gpPercent = (p: BevProduct) => {
    if (!p.sell_price || Number(p.sell_price) === 0) return 0;
    const cost = pourCost(p);
    return ((Number(p.sell_price) - cost) / Number(p.sell_price)) * 100;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-8 h-8" /> Cellar
          </h1>
          <p className="text-muted-foreground">Full product catalogue — {products.length} products</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <Scan className="w-4 h-4 mr-2" /> Scan Label
          </Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search products..." className="pl-10" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} />
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((c) => (
          <button key={c.key} onClick={() => setSelectedCategory(c.key)}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              selectedCategory === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
            )}>
            <c.icon className="w-4 h-4" /> {c.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => {
            const cost = pourCost(p);
            const gp = gpPercent(p);
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * i }} className="card-elevated p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="outline" className="text-xs">{p.main_category.replace("_", " ")}</Badge>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1 rounded hover:bg-muted transition-colors">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button onClick={() => { setDeleting(p); setDeleteDialogOpen(true); }}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{p.name}</h3>
                {p.sub_category && <p className="text-xs text-muted-foreground mb-2">{p.sub_category}</p>}
                <div className="pt-3 border-t border-border mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-muted-foreground">Purchase</p><p className="font-bold">${Number(p.purchase_price).toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Sell</p><p className="font-bold">${Number(p.sell_price).toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Pour Cost</p><p className="font-bold">${cost.toFixed(2)}</p></div>
                  <div><p className="text-xs text-muted-foreground">GP%</p>
                    <p className={cn("font-bold", gp >= 70 ? "text-success" : gp >= 60 ? "text-warning" : "text-destructive")}>
                      {gp.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {p.abv && p.abv > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">ABV: {p.abv}% {p.format && `• ${p.format}`} {p.bottle_size_ml && `• ${p.bottle_size_ml}ml`}</p>
                )}
              </motion.div>
            );
          })}
          {filtered.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add First Product
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={resetForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tanqueray London Dry Gin" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.main_category} onValueChange={v => setFormData({ ...formData, main_category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c.key !== "all").map(c => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub-Category</Label>
                <Input value={formData.sub_category} onChange={e => setFormData({ ...formData, sub_category: e.target.value })}
                  placeholder="e.g., London Dry" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Format</Label>
                <Input value={formData.format} onChange={e => setFormData({ ...formData, format: e.target.value })}
                  placeholder="e.g., bottle" />
              </div>
              <div className="space-y-2">
                <Label>Bottle (ml)</Label>
                <Input type="number" value={formData.bottle_size_ml}
                  onChange={e => setFormData({ ...formData, bottle_size_ml: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>ABV %</Label>
                <Input type="number" step="0.1" value={formData.abv}
                  onChange={e => setFormData({ ...formData, abv: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price ($)</Label>
                <Input type="number" step="0.01" value={formData.purchase_price}
                  onChange={e => setFormData({ ...formData, purchase_price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Sell Price ($)</Label>
                <Input type="number" step="0.01" value={formData.sell_price}
                  onChange={e => setFormData({ ...formData, sell_price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pour Size (ml)</Label>
                <Input type="number" value={formData.pour_size_ml}
                  onChange={e => setFormData({ ...formData, pour_size_ml: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Pours/Unit</Label>
                <Input type="number" value={formData.pours_per_unit}
                  onChange={e => setFormData({ ...formData, pours_per_unit: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Par Level</Label>
                <Input type="number" value={formData.par_level}
                  onChange={e => setFormData({ ...formData, par_level: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>{editing ? "Save Changes" : "Add Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={() => { setDeleteDialogOpen(false); setDeleting(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Product</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete <strong>{deleting?.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BevLabelScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        scanType="spirit_label"
        title="Spirit / Product Scanner"
        onDataExtracted={(data) => { console.log("Label scan:", data); toast.success("Label scanned!"); fetchProducts(); }}
      />
    </div>
  );
};

export default Cellar;
