import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Plus, 
  Package,
  AlertTriangle,
  TrendingDown,
  ArrowUpDown,
  Edit,
  Trash2,
  Loader2,
  ClipboardList,
  FileText,
  Clock,
  Calendar,
  MapPin,
  Settings2
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import InventorySyncButton from "@/components/inventory/InventorySyncButton";
import StocktakeDialog from "@/components/inventory/StocktakeDialog";
import InvoiceScannerDialog from "@/components/inventory/InvoiceScannerDialog";
import InventoryLocationsManager from "@/components/inventory/InventoryLocationsManager";
import EquipmentInventoryTab from "@/components/inventory/EquipmentInventoryTab";
import CleaningInventoryTab from "@/components/inventory/CleaningInventoryTab";
import { useInventoryLocations } from "@/hooks/useInventoryLocations";
import { isHomeCookMode } from "@/lib/shared/modeConfig";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
  expiry_date: string | null;
  batch_number: string | null;
  received_date: string | null;
  min_stock: number;
  ingredient_id: string | null;
  ingredients?: {
    cost_per_unit: number | null;
    category: string | null;
    supplier: string | null;
  } | null;
}

const categories = ["All", "Proteins", "Produce", "Dairy", "Dry Goods", "Oils", "Beverages"];
const units = ["kg", "g", "L", "ml", "lb", "oz", "each", "bunch", "case"];

const Inventory = ({ embedded = false }: { embedded?: boolean }) => {
  const { canEdit } = useAuth();
  const { currentOrg, storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  const { locations, loading: locationsLoading, refetch: refetchLocations } = useInventoryLocations();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [stocktakeDialogOpen, setStocktakeDialogOpen] = useState(false);
  const [invoiceScannerOpen, setInvoiceScannerOpen] = useState(false);
  const [locationsManagerOpen, setLocationsManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("inventory");

  const [formData, setFormData] = useState({
    name: "",
    quantity: 0,
    unit: "kg",
    location: "",
    expiry_date: "",
    batch_number: "",
    min_stock: 0,
  });

  // Set default location when locations load
  useEffect(() => {
    if (locations.length > 0 && !formData.location) {
      setFormData(prev => ({ ...prev, location: locations[0].name }));
    }
  }, [locations]);

  const hasEditPermission = canEdit("inventory");

  useEffect(() => {
    fetchInventory(true);
  }, []);

  const fetchInventory = async (autoSync = false) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventory")
      .select("*, ingredients(cost_per_unit, category, supplier)")
      .order("name");

    if (error) {
      console.error("Error fetching inventory:", error);
      toast.error("Failed to load inventory");
      setLoading(false);
      return;
    }

    // Auto-sync from ingredients if inventory is empty on first load
    if (autoSync && (!data || data.length === 0)) {
      const { data: syncCount, error: syncError } = await supabase.rpc("sync_inventory_from_ingredients");
      if (!syncError && syncCount && syncCount > 0) {
        toast.success(`Auto-synced ${syncCount} ingredients to inventory`);
        // Refetch after sync
        const { data: refreshed } = await supabase
          .from("inventory")
          .select("*, ingredients(cost_per_unit, category, supplier)")
          .order("name");
        setInventory(refreshed || []);
      } else {
        setInventory([]);
      }
    } else {
      setInventory(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    if (editingItem) {
      const { error } = await supabase
        .from("inventory")
        .update({
          name: formData.name,
          quantity: formData.quantity,
          unit: formData.unit,
          location: formData.location,
          expiry_date: formData.expiry_date || null,
          batch_number: formData.batch_number || null,
          min_stock: formData.min_stock,
        })
        .eq("id", editingItem.id);

      if (error) {
        toast.error("Failed to update item");
        console.error(error);
        return;
      }
      toast.success("Inventory item updated");
    } else {
      const { error } = await supabase.from("inventory").insert({
        name: formData.name,
        quantity: formData.quantity,
        unit: formData.unit,
        location: formData.location,
        expiry_date: formData.expiry_date || null,
        batch_number: formData.batch_number || null,
        min_stock: formData.min_stock,
        received_date: new Date().toISOString().split("T")[0],
        org_id: currentOrg?.id,
      });

      if (error) {
        toast.error("Failed to add item");
        console.error(error);
        return;
      }
      toast.success("Inventory item added");
    }

    resetForm();
    fetchInventory();
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    const { error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", deletingItem.id);

    if (error) {
      toast.error("Failed to delete item");
      console.error(error);
      return;
    }

    toast.success("Item deleted");
    setDeleteDialogOpen(false);
    setDeletingItem(null);
    fetchInventory();
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      location: item.location,
      expiry_date: item.expiry_date || "",
      batch_number: item.batch_number || "",
      min_stock: Number(item.min_stock),
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({
      name: "",
      quantity: 0,
      unit: "kg",
      location: locations.length > 0 ? locations[0].name : "",
      expiry_date: "",
      batch_number: "",
      min_stock: 0,
    });
  };

  const getStatus = (quantity: number, minStock: number) => {
    if (minStock === 0) return "ok";
    if (quantity <= minStock * 0.25) return "critical";
    if (quantity <= minStock * 0.5) return "low";
    return "ok";
  };

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const criticalCount = inventory.filter(i => getStatus(Number(i.quantity), Number(i.min_stock)) === "critical").length;
  const lowCount = inventory.filter(i => getStatus(Number(i.quantity), Number(i.min_stock)) === "low").length;
  
  // Expiry tracking
  const expiringItems = useMemo(() => {
    return inventory.filter(item => {
      if (!item.expiry_date) return false;
      const days = differenceInDays(new Date(item.expiry_date), new Date());
      return days >= 0 && days <= 7;
    });
  }, [inventory]);

  const statusStyles = {
    ok: "bg-success/10 text-success",
    low: "bg-warning/10 text-warning",
    critical: "bg-destructive/10 text-destructive",
  };

  const content = (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Inventory</h1>
            <p className="page-subtitle">{isHomeCook ? "What's in your kitchen right now" : `${inventory.length} items tracked`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasEditPermission && (
              <>
                {!isHomeCook && <InventorySyncButton onSync={fetchInventory} />}
                {!isHomeCook && (
                  <Button variant="outline" onClick={() => setInvoiceScannerOpen(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Scan Invoice
                  </Button>
                )}
                <Button variant="outline" onClick={() => setStocktakeDialogOpen(true)}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Stocktake
                </Button>
                {!isHomeCook && (
                  <Button variant="outline" onClick={() => setLocationsManagerOpen(true)}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Locations
                  </Button>
                )}
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </>
            )}
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inventory">Food Inventory</TabsTrigger>
            {!isHomeCook && <TabsTrigger value="smallwares">Smallwares</TabsTrigger>}
            {!isHomeCook && <TabsTrigger value="cleaning">Cleaning</TabsTrigger>}
          </TabsList>

          <TabsContent value="inventory" className="space-y-6 mt-4">
        {/* Alert Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          <div className="card-elevated p-4 border-l-4 border-l-destructive">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{criticalCount} Critical</p>
                <p className="text-sm text-muted-foreground">Needs attention</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-warning">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingDown className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{lowCount} Low Stock</p>
                <p className="text-sm text-muted-foreground">Below minimum</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4 border-l-4 border-l-warning">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{expiringItems.length} Expiring</p>
                <p className="text-sm text-muted-foreground">Within 7 days</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </motion.div>

        {/* Inventory Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="card-elevated overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Item</th>
                    {!isHomeCook && <th className="text-left p-4 font-medium text-muted-foreground text-sm">Location</th>}
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Stock</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Min Level</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Cost/Unit</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Expiry</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                    {hasEditPermission && (
                      <th className="text-right p-4 font-medium text-muted-foreground text-sm">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const status = getStatus(Number(item.quantity), Number(item.min_stock));
                    return (
                      <tr 
                        key={item.id} 
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              <Package className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div>
                              <span className="font-medium text-foreground">{item.name}</span>
                              {item.ingredients?.category && (
                                <p className="text-xs text-muted-foreground">{item.ingredients.category}</p>
                              )}
                              {!isHomeCook && item.batch_number && (
                                <p className="text-xs text-muted-foreground">Batch: {item.batch_number}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {!isHomeCook && (
                        <td className="p-4 text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const loc = locations.find(l => l.name === item.location);
                              return loc ? (
                                <>
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: loc.color }}
                                  />
                                  {item.location}
                                </>
                              ) : item.location;
                            })()}
                          </div>
                        </td>
                        )}
                        <td className="p-4 font-medium">{Number(item.quantity).toFixed(1)} {item.unit}</td>
                        <td className="p-4 text-muted-foreground">{Number(item.min_stock).toFixed(1)} {item.unit}</td>
                        <td className="p-4 text-muted-foreground">
                          {item.ingredients?.cost_per_unit 
                            ? `$${Number(item.ingredients.cost_per_unit).toFixed(2)}` 
                            : "-"}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {item.expiry_date ? format(new Date(item.expiry_date), "MMM d, yyyy") : "-"}
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium capitalize",
                            statusStyles[status]
                          )}>
                            {status}
                          </span>
                        </td>
                        {hasEditPermission && (
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditDialog(item)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                              >
                                <Edit className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingItem(item);
                                  setDeleteDialogOpen(true);
                                }}
                                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={hasEditPermission ? 8 : 7} className="p-8 text-center text-muted-foreground">
                        No inventory items found. Click "Sync from Ingredients" to populate.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

          </TabsContent>

          <TabsContent value="smallwares" className="mt-4">
            <EquipmentInventoryTab />
          </TabsContent>

          <TabsContent value="cleaning" className="mt-4">
            <CleaningInventoryTab />
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={resetForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fresh Salmon"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  />
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
              {!isHomeCook && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="location">Location</Label>
                    {hasEditPermission && (
                      <button
                        type="button"
                        onClick={() => setLocationsManagerOpen(true)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Settings2 className="w-3 h-3" />
                        Manage
                      </button>
                    )}
                  </div>
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData({ ...formData, location: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: loc.color }}
                            />
                            {loc.name}
                          </div>
                        </SelectItem>
                      ))}
                      {locations.length === 0 && (
                        <SelectItem value="" disabled>
                          No locations - click Manage to add
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_stock">Min Stock Level</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              )}
              {isHomeCook && (
              <div className="space-y-2">
                <Label htmlFor="min_stock">Min Stock Level</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                />
              </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
                {!isHomeCook && (
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch Number</Label>
                  <Input
                    id="batch"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    placeholder="e.g., LOT-2024-001"
                  />
                </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingItem ? "Save Changes" : "Add Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Item</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{deletingItem?.name}"? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stocktake Dialog */}
        <StocktakeDialog
          open={stocktakeDialogOpen}
          onOpenChange={setStocktakeDialogOpen}
          onComplete={fetchInventory}
        />

        {/* Invoice Scanner Dialog */}
        <InvoiceScannerDialog
          open={invoiceScannerOpen}
          onOpenChange={setInvoiceScannerOpen}
          onComplete={fetchInventory}
        />

        {/* Locations Manager Dialog */}
        <InventoryLocationsManager
          open={locationsManagerOpen}
          onOpenChange={(open) => {
            setLocationsManagerOpen(open);
            if (!open) refetchLocations();
          }}
        />
      </div>
  );

  if (embedded) return content;
  return <AppLayout>{content}</AppLayout>;
};

export default Inventory;
