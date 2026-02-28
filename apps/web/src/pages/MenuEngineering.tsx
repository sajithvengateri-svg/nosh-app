import { useState, useRef } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { motion } from "framer-motion";
import { format } from "date-fns";
import FoodCostCalculator from "@/components/costing/FoodCostCalculator";
import { 
  Menu as MenuIcon,
  TrendingUp,
  Star,
  AlertTriangle,
  Puzzle,
  DollarSign,
  Percent,
  BarChart3,
  Archive,
  Plus,
  MoreVertical,
  Camera,
  Upload,
  FileText,
  Edit2,
  Loader2,
  Check,
  X,
  FolderOpen,
  Copy,
  Trash2,
  Table as TableIcon,
  Calculator,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useMenus } from "@/hooks/useMenus";
import { useMenuStore } from "@/stores/menuStore";
import { MenuItem, MenuAnalytics } from "@/types/menu";
import { cn } from "@/lib/utils";
import MenuMatrixChart from "@/components/menu/MenuMatrixChart";
import MenuItemEditDialog from "@/components/menu/MenuItemEditDialog";
import MenuManagerDrawer from "@/components/menu/MenuManagerDrawer";
import MenuInlineEditTable from "@/components/menu/MenuInlineEditTable";
import MenuCostingTab from "@/components/menu/MenuCostingTab";
import MenuTrendsTab from "@/components/menu/MenuTrendsTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MenuAIRecommendations from "@/components/menu/MenuAIRecommendations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExtractedMenuItem {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  confidence: number;
  selected?: boolean;
}

const profitabilityConfig = {
  'star': { icon: Star, label: 'Star', color: 'text-warning', bg: 'bg-warning/10', desc: 'High popularity, high margin' },
  'plow-horse': { icon: TrendingUp, label: 'Plow Horse', color: 'text-primary', bg: 'bg-primary/10', desc: 'High popularity, low margin' },
  'puzzle': { icon: Puzzle, label: 'Puzzle', color: 'text-success', bg: 'bg-success/10', desc: 'Low popularity, high margin' },
  'dog': { icon: AlertTriangle, label: 'Dog', color: 'text-destructive', bg: 'bg-destructive/10', desc: 'Low popularity, low margin' },
};

const MenuEngineering = () => {
  const [showArchived, setShowArchived] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewMenuDialogOpen, setIsNewMenuDialogOpen] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [newMenuStep, setNewMenuStep] = useState<"name" | "method">("name");
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
  const [isRenamingMenu, setIsRenamingMenu] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMasterEditMode, setIsMasterEditMode] = useState(false);
  
  // Menu parsing state
  const [isParsingMenu, setIsParsingMenu] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMenuItem[]>([]);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isCostCalcOpen, setIsCostCalcOpen] = useState(false);
  
  // Use database-backed hook
  const { 
    menus, 
    isLoading,
    getActiveMenu, 
    getArchivedMenus,
    createMenu,
    activateMenu,
    deleteMenuItem,
    addMenuItem,
    batchAddMenuItems,
    updateMenuItem,
    renameMenu,
    archiveMenu,
    duplicateMenu,
    isPending,
  } = useMenus();
  const { currentOrg } = useOrg();
  
  // Still use store for POS and analytics (these can be migrated later)
  const { posConnections, getMenuAnalytics } = useMenuStore();
  
  const activeMenu = getActiveMenu();
  const archivedMenus = getArchivedMenus();
  const analytics = activeMenu ? getMenuAnalytics(activeMenu.id) : null;
  const connectedPOS = posConnections.find(p => p.isConnected);

  const handleStartRenameMenu = () => {
    if (activeMenu) {
      setRenameValue(activeMenu.name);
      setIsRenamingMenu(true);
    }
  };

  const handleSaveRenameMenu = () => {
    if (activeMenu && renameValue.trim()) {
      renameMenu({ menuId: activeMenu.id, newName: renameValue.trim() });
      toast.success("Menu renamed");
    }
    setIsRenamingMenu(false);
    setRenameValue("");
  };

  const handleArchiveActiveMenu = () => {
    setShowArchiveConfirm(true);
  };

  const confirmArchiveActiveMenu = () => {
    if (activeMenu) {
      archiveMenu(activeMenu.id);
      toast.success(`"${activeMenu.name}" archived`);
      setShowArchiveConfirm(false);
    }
  };

  const handleDuplicateActiveMenu = async () => {
    if (activeMenu) {
      try {
        const newMenu = await duplicateMenu({ menuId: activeMenu.id, newName: `${activeMenu.name} (Copy)` });
        toast.success(`Duplicated as "${newMenu?.name}"`);
      } catch (err) {
        toast.error("Failed to duplicate menu");
      }
    }
  };

  const handleScanMenu = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = "environment";
      fileInputRef.current.click();
    }
  };

  const handleUploadPDF = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = ".pdf,image/*";
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingMenu(true);
    toast.info(`Processing "${file.name}"...`);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call the AI extraction function
      const { data, error } = await supabase.functions.invoke("extract-menu", {
        body: {
          file_base64: base64,
          file_type: file.type,
        },
      });

      if (error) throw error;

      const items: ExtractedMenuItem[] = (data.menu_items || []).map((item: ExtractedMenuItem) => ({
        ...item,
        selected: item.confidence > 0.7,
      }));

      if (items.length === 0) {
        toast.warning("No menu items detected. Try a clearer image.");
      } else {
        setExtractedItems(items);
        setIsReviewDialogOpen(true);
        toast.success(`Found ${items.length} menu items!`);
      }
    } catch (error) {
      console.error("Failed to parse menu:", error);
      toast.error("Failed to parse menu. Please try again.");
    } finally {
      setIsParsingMenu(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const toggleExtractedItem = (index: number) => {
    const updated = [...extractedItems];
    updated[index].selected = !updated[index].selected;
    setExtractedItems(updated);
  };

  const handleImportItems = async () => {
    const selectedItems = extractedItems.filter(i => i.selected);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to import");
      return;
    }
    
    try {
      // If no active menu, create one first
      let targetMenuId = activeMenu?.id;
      if (!targetMenuId) {
        const newMenu = await createMenu({ name: "Imported Menu", orgId: currentOrg!.id });
        activateMenu(newMenu.id);
        targetMenuId = newMenu.id;
      }

      // Batch add all selected items
      const itemsToAdd = selectedItems.map(item => ({
        name: item.name,
        description: item.description,
        category: item.category || "Uncategorized",
        sellPrice: item.price || 0,
        foodCost: 0,
        foodCostPercent: 0,
        contributionMargin: item.price || 0,
        popularity: 0,
        profitability: "puzzle" as const,
        isActive: true,
        allergens: [],
      }));
      
      await batchAddMenuItems({ menuId: targetMenuId, items: itemsToAdd });

      toast.success(`Imported ${selectedItems.length} menu items!`);
      setIsReviewDialogOpen(false);
      setExtractedItems([]);
    } catch (err) {
      console.error("Failed to import items:", err);
      toast.error("Failed to import menu items");
    }
  };

  const handleItemClick = (item: MenuItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleItemSave = (item: MenuItem) => {
    updateMenuItem(item);
    toast.success("Item updated");
  };

  const handleItemDelete = (itemId: string) => {
    deleteMenuItem(itemId);
    toast.success("Item deleted");
  };

  // Master edit: save all items at once
  const handleMasterSaveAll = (updatedItems: MenuItem[]) => {
    updatedItems.forEach(item => {
      updateMenuItem(item);
    });
    setIsMasterEditMode(false);
  };

  const handleCreateMenu = async () => {
    if (newMenuName.trim()) {
      try {
        const newMenu = await createMenu({ name: newMenuName.trim(), orgId: currentOrg!.id });
        activateMenu(newMenu.id);
        setNewMenuName("");
        setIsNewMenuDialogOpen(false);
        toast.success(`Created "${newMenu.name}"`);
      } catch (err) {
        toast.error("Failed to create menu");
      }
    }
  };

  const handleAddItem = async () => {
    if (!activeMenu) return;
    
    try {
      const newItem = await addMenuItem({
        menuId: activeMenu.id,
        item: {
          name: "New Item",
          category: "Mains",
          sellPrice: 0,
          foodCost: 0,
          foodCostPercent: 0,
          contributionMargin: 0,
          popularity: 0,
          profitability: "puzzle",
          isActive: true,
          allergens: [],
        },
      });
      
      setEditingItem(newItem);
      setIsEditDialogOpen(true);
    } catch (err) {
      toast.error("Failed to add item");
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Menu Engineering</h1>
            <p className="page-subtitle">Track costs, analyze profitability, optimize your menu</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsCostCalcOpen(true)}
            >
              <Calculator className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Cost Calc</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsMenuManagerOpen(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">All Menus</span>
              <Badge variant="secondary" className="ml-2">{menus.length}</Badge>
            </Button>
            <Button 
              onClick={() => setIsNewMenuDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Menu
            </Button>
          </div>
        </motion.div>

        <Tabs defaultValue="costing" className="w-full">
          <TabsList className="inline-flex h-8 gap-1 p-0.5">
            <TabsTrigger value="costing" className="h-7 px-3 text-xs rounded-full">
              <DollarSign className="w-3 h-3 mr-1.5" />
              Costing
            </TabsTrigger>
            <TabsTrigger value="matrix" className="h-7 px-3 text-xs rounded-full">
              <BarChart3 className="w-3 h-3 mr-1.5" />
              Matrix
            </TabsTrigger>
            <TabsTrigger value="trends" className="h-7 px-3 text-xs rounded-full">
              <TrendingUp className="w-3 h-3 mr-1.5" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="costing" className="mt-6">
            <MenuCostingTab />
          </TabsContent>

          <TabsContent value="matrix" className="mt-6 space-y-6">

        {/* Scan/Upload Menu Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-elevated p-6"
        >
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Scan or Upload Menu</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a PDF or image of your menu to auto-populate items, categories, and pricing
                </p>
              </div>
              <div className="flex gap-3">
                <button className="btn-primary" onClick={handleScanMenu}>
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Menu
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors"
                  onClick={handleUploadPDF}
                >
                  <Upload className="w-4 h-4" />
                  Upload PDF
                </button>
                {/* file input moved to top level so it works from any tab */}
              </div>
            </div>
          </div>
        </motion.div>

        {/* POS Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "card-elevated p-4 border-l-4",
            connectedPOS ? "border-l-success" : "border-l-warning"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", connectedPOS ? "bg-success/10" : "bg-warning/10")}>
                <BarChart3 className={cn("w-5 h-5", connectedPOS ? "text-success" : "text-warning")} />
              </div>
              <div>
                <p className="font-semibold">
                  {connectedPOS ? `Connected to ${connectedPOS.displayName}` : 'No POS Connected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {connectedPOS 
                    ? `Last sync: ${connectedPOS.lastSync?.toLocaleDateString()}`
                    : 'Connect your POS to import sales data automatically'}
                </p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-muted hover:bg-secondary transition-colors text-sm font-medium">
              {connectedPOS ? 'Manage' : 'Connect POS'}
            </button>
          </div>
        </motion.div>

        {/* No Active Menu State */}
        {!activeMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-elevated p-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <MenuIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No Active Menu</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create a new menu to start tracking costs and analyzing profitability of your dishes.
            </p>
            <Button onClick={() => setIsNewMenuDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Menu
            </Button>
          </motion.div>
        )}

        {/* Active Menu Content */}
        {activeMenu && (
          <>
            {/* Menu Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card-elevated p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <MenuIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {isRenamingMenu ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="h-8 w-48 text-lg font-semibold"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRenameMenu();
                              if (e.key === "Escape") setIsRenamingMenu(false);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveRenameMenu}>
                            <Check className="w-4 h-4 text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsRenamingMenu(false)}>
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-lg font-semibold">{activeMenu.name}</h2>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6"
                            onClick={handleStartRenameMenu}
                          >
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      v{activeMenu.version} • {activeMenu.items.length} items • Since {activeMenu.effectiveFrom.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleStartRenameMenu}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDuplicateActiveMenu}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleArchiveActiveMenu}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Percent className="w-4 h-4" />
                    <span className="text-xs">Avg Food Cost</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {activeMenu.items.length > 0 
                      ? (activeMenu.items.reduce((sum, i) => sum + i.foodCostPercent, 0) / activeMenu.items.length).toFixed(1)
                      : "0.0"}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold">${analytics?.totalRevenue.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs">Gross Profit</span>
                  </div>
                  <p className="text-2xl font-bold text-success">${analytics?.grossProfit.toLocaleString() || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Star className="w-4 h-4" />
                    <span className="text-xs">Star Items</span>
                  </div>
                  <p className="text-2xl font-bold">{activeMenu.items.filter(i => i.profitability === 'star').length}</p>
                </div>
              </div>
            </motion.div>

            {/* Menu Matrix Chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-elevated overflow-hidden"
            >
              <div className="p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <BarChart3 className="w-3 h-3" />Menu Matrix
                  </span>
                  <span className="text-xs text-muted-foreground">Click on any item to edit. Bubble size = % of total sales.</span>
                </div>
              </div>
              <div className="p-4">
                <MenuMatrixChart 
                  items={activeMenu.items} 
                  onItemClick={handleItemClick}
                />
              </div>
            </motion.div>

            {/* Menu Items Table */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card-elevated overflow-hidden"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">
                    <TableIcon className="w-3 h-3" />All Menu Items
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isMasterEditMode
                      ? "Edit all fields directly in the table below"
                      : "Click any row to edit pricing and details"}
                  </span>
                </div>
                <div className="flex gap-2">
                  {!isMasterEditMode && (
                    <>
                      <MenuAIRecommendations 
                        menuItems={activeMenu.items} 
                        menuName={activeMenu.name} 
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setIsMasterEditMode(true)}
                        disabled={activeMenu.items.length === 0}
                      >
                        <TableIcon className="w-4 h-4 mr-2" />
                        Master Edit
                      </Button>
                      <Button size="sm" onClick={handleAddItem}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Item
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {activeMenu.items.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <p>No menu items yet. Add your first item to get started.</p>
                </div>
              ) : isMasterEditMode ? (
                <div className="p-4">
                  <MenuInlineEditTable
                    items={activeMenu.items}
                    onSaveAll={handleMasterSaveAll}
                    onDeleteItem={handleItemDelete}
                    onCancel={() => setIsMasterEditMode(false)}
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="px-4 py-3 font-medium">Item</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium text-right">Sell Price</th>
                        <th className="px-4 py-3 font-medium text-right">Food Cost</th>
                        <th className="px-4 py-3 font-medium text-right">Cost %</th>
                        <th className="px-4 py-3 font-medium text-right">Margin</th>
                        <th className="px-4 py-3 font-medium text-right">Sales</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeMenu.items.map((item) => {
                        const config = profitabilityConfig[item.profitability];
                        const Icon = config.icon;

                        return (
                          <tr 
                            key={item.id} 
                            className="hover:bg-muted/30 transition-colors cursor-pointer"
                            onClick={() => handleItemClick(item)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("p-1.5 rounded-lg", config.bg)}>
                                  <Icon className={cn("w-4 h-4", config.color)} />
                                </div>
                                <span className="font-medium">{item.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                            <td className="px-4 py-3 text-right font-semibold">${item.sellPrice.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">${item.foodCost.toFixed(2)}</td>
                            <td className={cn(
                              "px-4 py-3 text-right font-medium",
                              item.foodCostPercent > 30 ? "text-destructive" : "text-success"
                            )}>
                              {item.foodCostPercent.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-right text-success font-medium">
                              ${item.contributionMargin.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right">{item.popularity}</td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                config.bg, config.color
                              )}>
                                {config.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Archived Menus */}
        {showArchived && archivedMenus.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">
                  <Archive className="w-3 h-3" />Archived Menus
                </span>
                <span className="text-xs text-muted-foreground">Historical menus with preserved cost data</span>
              </div>
            </div>
            <div className="divide-y divide-border">
              {archivedMenus.map(menu => (
                <div key={menu.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Archive className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{menu.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {menu.effectiveFrom.toLocaleDateString()} - {menu.effectiveTo?.toLocaleDateString()}
                        {' • '}{menu.items.length} items
                      </p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg bg-muted hover:bg-secondary transition-colors text-sm font-medium">
                    View
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <MenuTrendsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Item Dialog */}
      <MenuItemEditDialog
        item={editingItem}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleItemSave}
        onDelete={handleItemDelete}
      />

      {/* New Menu Dialog — 2-step: name then method */}
      <Dialog open={isNewMenuDialogOpen} onOpenChange={(open) => { setIsNewMenuDialogOpen(open); if (!open) { setNewMenuStep("name"); setNewMenuName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newMenuStep === "name" ? "Create New Menu" : `"${newMenuName}" — Choose Input Method`}</DialogTitle>
          </DialogHeader>

          {newMenuStep === "name" ? (
            <>
              <div className="py-4">
                <Label htmlFor="menuName">Menu Name</Label>
                <Input
                  id="menuName"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  placeholder="e.g., Spring Menu 2026"
                  className="mt-2"
                  onKeyDown={(e) => { if (e.key === "Enter" && newMenuName.trim()) setNewMenuStep("method"); }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewMenuDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => setNewMenuStep("method")} disabled={!newMenuName.trim()}>Next</Button>
              </DialogFooter>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-4 py-4">
              <button
                onClick={() => {
                  setIsNewMenuDialogOpen(false);
                  if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.capture = "environment"; }
                  setTimeout(() => fileInputRef.current?.click(), 150);
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Camera className="w-8 h-8 text-primary" />
                <span className="font-medium text-sm">Scan with Camera</span>
                <span className="text-xs text-muted-foreground">Take a photo of your menu</span>
              </button>
              <button
                onClick={() => {
                  setIsNewMenuDialogOpen(false);
                  if (fileInputRef.current) { fileInputRef.current.accept = ".pdf,image/*"; fileInputRef.current.removeAttribute("capture"); }
                  setTimeout(() => fileInputRef.current?.click(), 150);
                }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Upload className="w-8 h-8 text-primary" />
                <span className="font-medium text-sm">Upload PDF/Image</span>
                <span className="text-xs text-muted-foreground">PDF, JPG, PNG supported</span>
              </button>
              <button
                onClick={handleCreateMenu}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Plus className="w-8 h-8 text-primary" />
                <span className="font-medium text-sm">Start from Scratch</span>
                <span className="text-xs text-muted-foreground">Manually add items</span>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{activeMenu?.name}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Active since {activeMenu ? format(activeMenu.effectiveFrom, "dd MMM yyyy") : "—"} · {activeMenu?.items.length || 0} items</p>
                <p>This menu will be moved to your archive. You can restore it later.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchiveActiveMenu}>Yes, Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Menu Import Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Review Extracted Menu Items
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {extractedItems.length} items found. Select items to import to your menu.
          </p>

          <div className="py-4 space-y-2 max-h-[400px] overflow-y-auto">
            {extractedItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                  item.selected ? "bg-primary/5 border-primary" : "bg-muted/50"
                )}
              >
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => toggleExtractedItem(index)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.name}</span>
                    {item.category && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>
                {item.price != null && (
                  <span className="font-semibold">${item.price.toFixed(2)}</span>
                )}
                <Badge
                  variant={item.confidence > 0.8 ? "default" : item.confidence > 0.5 ? "secondary" : "outline"}
                >
                  {Math.round(item.confidence * 100)}%
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportItems} 
              disabled={extractedItems.filter(i => i.selected).length === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Import {extractedItems.filter(i => i.selected).length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Manager Drawer */}
      <MenuManagerDrawer 
        open={isMenuManagerOpen} 
        onOpenChange={setIsMenuManagerOpen} 
      />

      {/* Loading overlay for parsing */}
      {isParsingMenu && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <p className="font-medium">Analyzing menu with AI...</p>
            <p className="text-sm text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      )}

      {/* Hidden file input — must be outside tabs so it's always in the DOM */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Food Cost Calculator */}
      <FoodCostCalculator
        isOpen={isCostCalcOpen}
        onClose={() => setIsCostCalcOpen(false)}
      />
    </AppLayout>
  );
};

export default MenuEngineering;
