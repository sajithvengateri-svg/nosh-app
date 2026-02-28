import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useMenus } from "@/hooks/useMenus";
import { useMenuCostSnapshots } from "@/hooks/useMenuCostSnapshots";
import { useOrg } from "@/contexts/OrgContext";
import { MenuItem, Menu } from "@/types/menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Upload, FileText, Loader2, Check, Percent, DollarSign,
  BookOpen, AlertCircle, ExternalLink, Save, X, Sparkles,
  AlertTriangle, Archive, ArrowLeft, Plus, Trash2,
  Camera, Image as ImageIcon, Mail, Copy, MessageSquare,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ArchivedCostingList from "./ArchivedCostingList";
import DishTrendPopover from "./DishTrendPopover";
import WorkflowStepper from "./WorkflowStepper";
import RemedialNotesSheet from "./RemedialNotesSheet";
import MenuCostingWalkthrough from "@/components/onboarding/MenuCostingWalkthrough";
import { useAuth } from "@/contexts/AuthContext";

interface ExtractedMenuItem {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  confidence: number;
  selected?: boolean;
}

type WorkflowStep = "setup" | "extracting" | "review" | "manual" | "costing";

const GST_RATE = 0.10;

const categoryOptions = [
  "Mains", "Starters", "Desserts", "Sides", "Drinks",
  "Specials", "Breakfast", "Lunch", "Dinner", "Uncategorized",
];

export default function MenuCostingTab() {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { profile } = useAuth();
  const [showCostingWalkthrough, setShowCostingWalkthrough] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    menus,
    getActiveMenu,
    getArchivedMenus,
    createMenu,
    // activateMenu no longer needed — createMenu RPC does both
    archiveMenu,
    unarchiveMenu,
    batchAddMenuItems,
    updateMenuItem,
    deleteMenuItem,
    batchCreateRecipesForMenu,
    isPending,
    getMenuById,
    updateWorkflowStage,
    updateRemedialNotes,
  } = useMenus();

  const { snapshots, snapshotMenuCosts, getDishTrend, isSnapshotting } = useMenuCostSnapshots();

  const activeMenu = getActiveMenu();
  const archivedMenus = getArchivedMenus();
  const menuItems = activeMenu?.items || [];
  const hasLinkedRecipes = menuItems.some(i => i.recipeId);

  // Workflow state
  const [step, setStep] = useState<WorkflowStep>(
    activeMenu && menuItems.length > 0 ? "costing" : "setup"
  );

  // Sync step when activeMenu changes (handles archive race condition)
  useEffect(() => {
    if (!activeMenu && (step === "costing" || step === "review" || step === "extracting")) {
      console.log("[MenuCosting] activeMenu gone, resetting to setup");
      setStep("setup");
      setSavedFile(null);
      setExtractedItems([]);
      setEditedItems([]);
      setIsEditing(false);
      setHasChanges(false);
    }
  }, [activeMenu, step]);
  const [savedFile, setSavedFile] = useState<{ name: string; base64: string; type: string } | null>(null);
  const [isParsingMenu, setIsParsingMenu] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMenuItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [createdMenuId, setCreatedMenuId] = useState<string | null>(null);
  const [isCreatingRecipes, setIsCreatingRecipes] = useState(false);
  const [showAiWarning, setShowAiWarning] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [manualItems, setManualItems] = useState<Array<{
    name: string;
    description: string;
    category: string;
    price: number | null;
  }>>([{ name: "", description: "", category: "Uncategorized", price: null }]);

  // Show menu costing walkthrough for first-time users
  const shouldShowWalkthrough = step === "setup" && !activeMenu && !(profile as any)?.menu_costing_onboarded;
  useState(() => {
    if (shouldShowWalkthrough) setShowCostingWalkthrough(true);
  });

  // Viewing archived menu (read-only mode)
  const [viewingArchivedMenuId, setViewingArchivedMenuId] = useState<string | null>(null);
  const viewingArchivedMenu = viewingArchivedMenuId ? getMenuById(viewingArchivedMenuId) : null;

  // Master edit state
  const [editedItems, setEditedItems] = useState<MenuItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch live recipe costs for linked items
  const [recipeCosts, setRecipeCosts] = useState<Record<string, number>>({});

  useMemo(() => {
    const recipeIds = menuItems.filter(i => i.recipeId).map(i => i.recipeId!);
    if (recipeIds.length === 0) return;
    supabase
      .from("recipes")
      .select("id, cost_per_serving, sell_price")
      .in("id", recipeIds)
      .then(({ data }) => {
        if (data) {
          const costs: Record<string, number> = {};
          data.forEach((r: any) => { costs[r.id] = Number(r.cost_per_serving) || 0; });
          setRecipeCosts(costs);
        }
      });
  }, [menuItems]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    if (menuItems.length === 0) return { avgFc: 0, totalCost: 0, totalRevenue: 0, costedCount: 0 };
    let totalCost = 0, totalRevenueExGst = 0, costedCount = 0;
    menuItems.forEach(item => {
      const recipeCost = item.recipeId ? (recipeCosts[item.recipeId] || 0) : item.foodCost;
      const revenueExGst = item.sellPrice / (1 + GST_RATE);
      totalCost += recipeCost;
      totalRevenueExGst += revenueExGst;
      if (recipeCost > 0) costedCount++;
    });
    const avgFc = totalRevenueExGst > 0 ? (totalCost / totalRevenueExGst) * 100 : 0;
    return { avgFc, totalCost, totalRevenue: totalRevenueExGst, costedCount };
  }, [menuItems, recipeCosts]);

  // --- Archive handler: snapshot then archive ---
  const handleArchiveMenu = async () => {
    if (!activeMenu) {
      console.error("[Archive] No active menu to archive");
      return;
    }
    const menuId = activeMenu.id;
    console.log("[Archive] Starting archive for menu:", menuId, activeMenu.name);
    setIsArchiving(true);
    try {
      // Build snapshot items with live recipe costs
      const snapshotItems = menuItems.map(item => {
        const liveCost = item.recipeId ? (recipeCosts[item.recipeId] || 0) : item.foodCost;
        const exGst = item.sellPrice / (1 + GST_RATE);
        const fcPercent = exGst > 0 ? (liveCost / exGst) * 100 : 0;
        return { id: item.id, name: item.name, sellPrice: item.sellPrice, foodCost: liveCost, foodCostPercent: fcPercent };
      });

      console.log("[Archive] Saving cost snapshot for", snapshotItems.length, "items...");
      await snapshotMenuCosts({ menuId, items: snapshotItems });
      console.log("[Archive] Snapshot saved. Calling archive RPC...");
      
      // Archive via RPC — guaranteed to succeed or throw
      const result = await archiveMenu(menuId);
      console.log("[Archive] RPC returned:", result);
      
      // Clear all local state immediately
      console.log("[Archive] Clearing local state and resetting to setup...");
      setSavedFile(null);
      setExtractedItems([]);
      setEditedItems([]);
      setIsEditing(false);
      setHasChanges(false);
      setStep("setup");
      setShowArchiveConfirm(false);
      toast.success("Menu archived with cost snapshot saved! Ready for a new menu.");
    } catch (err: any) {
      console.error("[Archive] FAILED:", err);
      toast.error(err?.message || "Failed to archive menu. Check your permissions.");
    } finally {
      setIsArchiving(false);
    }
  };

  // --- File processing: validate, read, create menu, auto-extract ---
  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

  const processFile = async (file: File) => {
    // Validate file type
    const isValidType = ACCEPTED_TYPES.some(t => file.type.startsWith(t.split("/")[0]) || file.type === t)
      || file.name.toLowerCase().endsWith(".pdf");
    if (!isValidType) {
      toast.error(`Unsupported file type. Please upload a JPG, PNG, or PDF.`);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 20MB.`);
      return;
    }

    toast.info(`Processing "${file.name}"...`);
    try {
      // 1. Read file as base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Create menu immediately via RPC
      const orgId = currentOrg?.id;
      if (!orgId) { toast.error("No organisation found"); return; }
      const menuName = file.name.replace(/\.[^/.]+$/, "");
      const newMenu = await createMenu({ name: menuName, orgId });
      setCreatedMenuId(newMenu.id);
      console.log("[Upload] Created menu via RPC:", newMenu.id);

      // 3. Save file ref and go straight to extracting
      setSavedFile({ name: file.name, base64, type: file.type });
      setStep("extracting");
      setIsParsingMenu(true);
      toast.success(`Menu "${menuName}" created! Extracting items...`);

      // 4. Auto-trigger AI extraction
      const { data, error } = await supabase.functions.invoke("extract-menu", {
        body: { file_base64: base64, file_type: file.type },
      });
      if (error) throw error;
      const items: ExtractedMenuItem[] = (data.menu_items || []).map((item: ExtractedMenuItem) => ({
        ...item, selected: item.confidence > 0.7,
      }));
      if (items.length === 0) {
        toast.warning("No menu items detected. Try a clearer image.");
        setStep("setup");
      } else {
        setExtractedItems(items);
        setShowAiWarning(true);
        setStep("review");
        toast.success(`Found ${items.length} menu items!`);
      }
    } catch (error) {
      console.error("Failed to process file:", error);
      toast.error("Failed to process menu. Please try again.");
      setStep("setup");
    } finally {
      setIsParsingMenu(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDismissWarning = () => { setShowAiWarning(false); setStep("review"); };

  const toggleExtractedItem = (index: number) => {
    const updated = [...extractedItems];
    updated[index].selected = !updated[index].selected;
    setExtractedItems(updated);
  };

  const handleImportAndCreateRecipes = async () => {
    const selectedItems = extractedItems.filter(i => i.selected);
    if (selectedItems.length === 0) { toast.error("Please select at least one item"); return; }
    setIsCreatingRecipes(true);
    try {
      const orgId = currentOrg?.id;
      if (!orgId) { toast.error("No organisation found"); setIsCreatingRecipes(false); return; }
      
      // Always create a new menu via RPC (creates + activates in one call, bypasses RLS)
      let targetMenuId = createdMenuId || activeMenu?.id;
      if (!targetMenuId) {
        const newMenu = await createMenu({ name: "Imported Menu", orgId });
        targetMenuId = newMenu.id;
        setCreatedMenuId(newMenu.id);
        console.log("[Import] Created & activated menu via RPC:", targetMenuId);
      }
      
      // Batch insert items via RPC
      const itemsToAdd = selectedItems.map(item => ({
        name: item.name, description: item.description, category: item.category || "Uncategorized",
        sellPrice: item.price || 0, foodCost: 0, foodCostPercent: 0,
        contributionMargin: item.price || 0, popularity: 0,
        profitability: "puzzle" as const, isActive: true, allergens: [],
      }));
      console.log("[Import] Inserting", itemsToAdd.length, "items into menu", targetMenuId);
      const insertedCount = await batchAddMenuItems({ menuId: targetMenuId, items: itemsToAdd, orgId });
      console.log("[Import] Inserted count:", insertedCount);
      
      // Create recipes via RPC
      let recipesCreated = 0;
      if (insertedCount > 0) {
        recipesCreated = await batchCreateRecipesForMenu(targetMenuId);
        console.log("[Import] Recipes created:", recipesCreated);
      }
      
      // Wait for query cache to settle
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setExtractedItems([]);
      setSavedFile(null);
      setStep("costing");
      toast.success(`✅ ${insertedCount} menu items imported${recipesCreated > 0 ? ` and ${recipesCreated} recipe pages created` : ''}! Now add costs to each dish.`);
    } catch (err: any) {
      console.error("[Import] Failed:", err);
      toast.error(err?.message || "Failed to import menu items. Please try again.");
    } finally {
      setIsCreatingRecipes(false);
    }
  };

  // Master edit handlers
  const startEditing = () => {
    setEditedItems(menuItems.map(item => ({ ...item })));
    setIsEditing(true);
    setHasChanges(false);
  };

  const updateEditedItem = (id: string, field: keyof MenuItem, value: any) => {
    setEditedItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const newItem = { ...item, [field]: value };
        if (field === "sellPrice" || field === "foodCost") {
          const sellPrice = field === "sellPrice" ? Number(value) : item.sellPrice;
          const foodCost = field === "foodCost" ? Number(value) : item.foodCost;
          const exGst = sellPrice / (1 + GST_RATE);
          newItem.contributionMargin = exGst - foodCost;
          newItem.foodCostPercent = exGst > 0 ? (foodCost / exGst) * 100 : 0;
        }
        return newItem;
      })
    );
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    editedItems.forEach(item => updateMenuItem(item));
    setIsEditing(false);
    setHasChanges(false);
    toast.success("All changes saved");
  };

  // Determine if we should show costing (existing items) or setup — defensive guard
  const showCosting = step === "costing" && !!activeMenu && menuItems.length > 0;

  // Hidden file input
  const fileInput = <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelected} />;


  // ─── VIEWING ARCHIVED MENU (read-only) ───
  if (viewingArchivedMenu) {
    const archivedItems = viewingArchivedMenu.items || [];
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setViewingArchivedMenuId(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">{viewingArchivedMenu.name}</span>
              <Badge variant="secondary">Archived</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(viewingArchivedMenu.effectiveFrom, "dd MMM yyyy")}
              {viewingArchivedMenu.effectiveTo && ` — ${format(viewingArchivedMenu.effectiveTo, "dd MMM yyyy")}`}
            </p>
          </div>
        </div>
        <CostingTable
          items={archivedItems}
          recipeCosts={{}}
          isEditing={false}
          editedItems={[]}
          updateEditedItem={() => {}}
          navigate={navigate}
          getDishTrend={getDishTrend}
        />
      </div>
    );
  }

  // ─── STEP: SETUP ───
  if (!showCosting && step === "setup") {
    return (
      <div className="space-y-6">
        {/* Menu Costing Walkthrough for first-time users */}
        <MenuCostingWalkthrough
          open={showCostingWalkthrough}
          onComplete={() => setShowCostingWalkthrough(false)}
        />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <DollarSign className="w-3 h-3" />Set Up Menu Costing
              </span>
              <p className="text-sm text-muted-foreground mt-2">
                Drop your menu file below, or start from scratch
              </p>
            </div>

            {/* Drag-and-drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = ".pdf,image/*";
                  fileInputRef.current.removeAttribute("capture");
                }
                fileInputRef.current?.click();
              }}
              className={cn(
                "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all",
                dragOver ? "border-primary bg-primary/10 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <div className="flex flex-col items-center gap-3">
                <div className={cn("p-4 rounded-full transition-colors", dragOver ? "bg-primary/20" : "bg-primary/10")}>
                  <Upload className={cn("w-10 h-10", dragOver ? "text-primary" : "text-primary/70")} />
                </div>
                <p className="font-semibold text-lg">{dragOver ? "Drop it here!" : "Drop your menu here"}</p>
                <p className="text-sm text-muted-foreground">PDF, JPG, PNG — or click to browse</p>
              </div>
            </div>

            {/* Input method buttons */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) { fileInputRef.current.accept = "image/*"; fileInputRef.current.setAttribute("capture", "environment"); }
                  fileInputRef.current?.click();
                }}
              >
                <Camera className="w-4 h-4 mr-2" />Scan Menu
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (fileInputRef.current) { fileInputRef.current.accept = "image/jpeg,image/png,image/webp,image/heic"; fileInputRef.current.removeAttribute("capture"); }
                  fileInputRef.current?.click();
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />Attach Photo
              </Button>
              <Button variant="outline" onClick={(e) => { e.stopPropagation(); setShowEmailDialog(true); }}>
                <Mail className="w-4 h-4 mr-2" />Email In
              </Button>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Start from scratch */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={(e) => { e.stopPropagation(); setManualItems([{ name: "", description: "", category: "Uncategorized", price: null }]); setStep("manual"); }}
              >
                <Plus className="w-4 h-4 mr-2" />Start from Scratch
              </Button>
            </div>
          </div>
        </motion.div>
        {/* Show archived menus even in setup */}
        <ArchivedCostingList
          archivedMenus={archivedMenus}
          onViewArchived={(menu) => setViewingArchivedMenuId(menu.id)}
          onUnarchive={(id) => { unarchiveMenu(id); toast.success("Menu restored to draft"); }}
        />
        {fileInput}
      </div>
    );
  }


  // ─── STEP: MANUAL ENTRY ───
  if (step === "manual") {
    const validItems = manualItems.filter(i => i.name.trim());

    const handleManualImport = async () => {
      if (validItems.length === 0) { toast.error("Add at least one item with a name"); return; }
      const formatted: ExtractedMenuItem[] = validItems.map(item => ({
        name: item.name.trim(),
        description: item.description || undefined,
        category: item.category,
        price: item.price ?? 0,
        confidence: 1.0,
        selected: true,
      }));
      setExtractedItems(formatted);
      await handleImportAndCreateRecipes();
    };

    // Override extractedItems temporarily for the import
    const doManualImport = async () => {
      if (validItems.length === 0) { toast.error("Add at least one item with a name"); return; }
      setIsCreatingRecipes(true);
      try {
        const orgId = currentOrg?.id;
        if (!orgId) { toast.error("No organisation found"); setIsCreatingRecipes(false); return; }
        let targetMenuId = activeMenu?.id;
        if (!targetMenuId) {
          const newMenu = await createMenu({ name: "My Menu", orgId });
          targetMenuId = newMenu.id;
          console.log("[ManualImport] Created & activated menu via RPC:", targetMenuId);
        }
        const itemsToAdd = validItems.map(item => ({
          name: item.name.trim(), description: item.description || undefined,
          category: item.category || "Uncategorized",
          sellPrice: item.price ?? 0, foodCost: 0, foodCostPercent: 0,
          contributionMargin: item.price ?? 0, popularity: 0,
          profitability: "puzzle" as const, isActive: true, allergens: [],
        }));
        const insertedCount = await batchAddMenuItems({ menuId: targetMenuId, items: itemsToAdd, orgId });
        if (insertedCount > 0) {
          const recipesCreated = await batchCreateRecipesForMenu(targetMenuId);
          toast.success(`Added ${validItems.length} items${recipesCreated > 0 ? ` and created ${recipesCreated} recipes` : ''}!`);
        } else {
          toast.error("Failed to insert menu items");
        }
        setManualItems([{ name: "", description: "", category: "Uncategorized", price: null }]);
        setStep("costing");
      } catch (err) {
        console.error("Failed to import manual items:", err);
        toast.error("Failed to add menu items");
      } finally {
        setIsCreatingRecipes(false);
      }
    };

    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Plus className="w-3 h-3" />Add Menu Items
              </span>
              <p className="text-sm text-muted-foreground mt-2">
                Type in your dishes, categories and sell prices
              </p>
            </div>
            <Badge variant="secondary">{validItems.length} item{validItems.length !== 1 ? "s" : ""}</Badge>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="min-w-[200px]">Dish Name</TableHead>
                    <TableHead className="min-w-[140px]">Category</TableHead>
                    <TableHead className="w-28 text-right">Sell Price</TableHead>
                    <TableHead className="min-w-[160px]">Description</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="p-2">
                        <Input
                          placeholder="e.g. Chicken Parmigiana"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...manualItems];
                            updated[index].name = e.target.value;
                            setManualItems(updated);
                          }}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Select
                          value={item.category}
                          onValueChange={(val) => {
                            const updated = [...manualItems];
                            updated[index].category = val;
                            setManualItems(updated);
                          }}
                        >
                          <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.price ?? ""}
                            onChange={(e) => {
                              const updated = [...manualItems];
                              updated[index].price = e.target.value ? parseFloat(e.target.value) : null;
                              setManualItems(updated);
                            }}
                            className="h-8 pl-5 text-right"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          placeholder="Optional description"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...manualItems];
                            updated[index].description = e.target.value;
                            setManualItems(updated);
                          }}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        {manualItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setManualItems(prev => prev.filter((_, i) => i !== index))}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setManualItems(prev => [...prev, { name: "", description: "", category: "Uncategorized", price: null }])}
          >
            <Plus className="w-4 h-4 mr-2" />Add Item
          </Button>

          <p className="text-xs text-muted-foreground mt-3">
            💡 Tip: You can always edit names, prices and categories later on the costing sheet
          </p>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setStep("setup")}>Cancel</Button>
            <Button onClick={doManualImport} disabled={validItems.length === 0 || isCreatingRecipes}>
              {isCreatingRecipes ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Recipes...</>
              ) : (
                <><Check className="w-4 h-4 mr-2" />Import {validItems.length} Item{validItems.length !== 1 ? "s" : ""} & Create Recipes</>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── STEP: EXTRACTING ───
  if (step === "extracting") {
    return <div className="space-y-6">{fileInput}<ParsingOverlay /></div>;
  }

  // ─── AI WARNING DIALOG ───
  if (showAiWarning && extractedItems.length > 0) {
    return (
      <div className="space-y-6">
        <Dialog open={showAiWarning} onOpenChange={(open) => { if (!open) handleDismissWarning(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />AI Extraction Complete
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-sm font-medium text-warning">AI can make mistakes</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We found <strong>{extractedItems.length} items</strong> in your menu. Please review and edit the extracted data before importing.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleDismissWarning}><Check className="w-4 h-4 mr-2" />Let's Review & Edit</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {fileInput}
      </div>
    );
  }

  // ─── STEP: REVIEW ───
  if (step === "review" && extractedItems.length > 0) {
    const selectedCount = extractedItems.filter(i => i.selected).length;
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <FileText className="w-3 h-3" />Review Extracted Items
              </span>
              <p className="text-sm text-muted-foreground mt-2">{extractedItems.length} items found. Deselect any that are incorrect.</p>
            </div>
            <Badge variant="secondary">{selectedCount} selected</Badge>
          </div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {extractedItems.map((item, index) => (
              <div key={index} className={cn("flex items-center gap-4 p-4 rounded-lg border transition-colors", item.selected ? "bg-primary/5 border-primary" : "bg-muted/50")}>
                <Checkbox checked={item.selected} onCheckedChange={() => toggleExtractedItem(index)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{item.name}</span>
                    {item.category && <Badge variant="secondary" className="text-xs shrink-0">{item.category}</Badge>}
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.description}</p>}
                </div>
                {item.price != null && <span className="font-semibold shrink-0">${item.price.toFixed(2)}</span>}
                <Badge variant={item.confidence > 0.8 ? "default" : item.confidence > 0.5 ? "secondary" : "outline"} className="shrink-0">
                  {Math.round(item.confidence * 100)}%
                </Badge>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => { setExtractedItems([]); setSavedFile(null); setStep("setup"); }}>Cancel</Button>
            <Button onClick={handleImportAndCreateRecipes} disabled={selectedCount === 0 || isCreatingRecipes}>
              {isCreatingRecipes ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating Recipes...</> : <><Check className="w-4 h-4 mr-2" />Import {selectedCount} Items & Create Recipes</>}
            </Button>
          </div>
        </motion.div>
        {fileInput}
      </div>
    );
  }

  // ─── STEP: COSTING (Live) ───
  return (
    <div className="space-y-6">
      {/* Live Menu Header */}
      {activeMenu && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">{activeMenu.name}</span>
              <Badge className="bg-success/10 text-success border-success" variant="outline">Live</Badge>
              <span className="text-xs text-muted-foreground">
                Since {format(activeMenu.effectiveFrom, "dd MMM yyyy")}
              </span>
              {activeMenu.remedialNotes.length > 0 && (
                <Badge variant="secondary" className="cursor-pointer" onClick={() => setNotesOpen(true)}>
                  {activeMenu.remedialNotes.length} note{activeMenu.remedialNotes.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setNotesOpen(true)}>
                <MessageSquare className="w-3 h-3 mr-1" /> Notes
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowArchiveConfirm(true)} disabled={isArchiving || isSnapshotting}>
                {isArchiving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Archive className="w-3 h-3 mr-1" />}
                Archive
              </Button>
            </div>
          </div>
          <WorkflowStepper
            currentStage={activeMenu.workflowStage}
            onAdvance={(nextStage) => updateWorkflowStage({ menuId: activeMenu.id, stage: nextStage })}
          />
        </div>
      )}

      {/* Aggregate Stats Bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-elevated p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><Percent className="w-4 h-4" /><span className="text-xs">Aggregate FC%</span></div>
            <p className={cn("text-2xl font-bold", aggregateStats.avgFc > 30 ? "text-destructive" : "text-success")}>{aggregateStats.avgFc.toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><DollarSign className="w-4 h-4" /><span className="text-xs">Total Food Cost</span></div>
            <p className="text-2xl font-bold">${aggregateStats.totalCost.toFixed(2)}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><BookOpen className="w-4 h-4" /><span className="text-xs">Costed Items</span></div>
            <p className="text-2xl font-bold">{aggregateStats.costedCount}/{menuItems.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-1"><AlertCircle className="w-4 h-4" /><span className="text-xs">Needs Recipe</span></div>
            <p className="text-2xl font-bold text-warning">{menuItems.length - aggregateStats.costedCount}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Recipe completion</span>
            <span className="font-medium">{menuItems.length > 0 ? Math.round((aggregateStats.costedCount / menuItems.length) * 100) : 0}%</span>
          </div>
          <Progress value={menuItems.length > 0 ? (aggregateStats.costedCount / menuItems.length) * 100 : 0} />
        </div>
      </motion.div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isEditing ? "Edit names and categories to fix OCR errors" : "Click Edit to fix names, or click a recipe link to add ingredients"}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.accept = ".pdf,image/*";
              fileInputRef.current.removeAttribute("capture");
            }
            fileInputRef.current?.click();
          }}>
            <Upload className="w-4 h-4 mr-2" />Import More
          </Button>
          {!isEditing ? (
            <Button size="sm" onClick={startEditing}>Edit Items</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
              <Button size="sm" onClick={handleSaveAll} disabled={!hasChanges}><Save className="w-4 h-4 mr-2" />Save All</Button>
            </div>
          )}
        </div>
      </div>

      {/* Costing Table */}
      <CostingTable
        items={isEditing ? editedItems : menuItems}
        recipeCosts={recipeCosts}
        isEditing={isEditing}
        editedItems={editedItems}
        updateEditedItem={updateEditedItem}
        navigate={navigate}
        getDishTrend={getDishTrend}
      />

      {/* Sticky save bar */}
      {isEditing && hasChanges && (
        <div className="sticky bottom-4 flex justify-center">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-4">
            <span className="text-sm">You have unsaved changes</span>
            <Button size="sm" variant="secondary" onClick={handleSaveAll}><Save className="w-4 h-4 mr-2" />Save All</Button>
          </div>
        </div>
      )}

      {/* Archived Costing Sheets */}
      <ArchivedCostingList
        archivedMenus={archivedMenus}
        onViewArchived={(menu) => setViewingArchivedMenuId(menu.id)}
        onUnarchive={(id) => { unarchiveMenu(id); toast.success("Menu restored to draft"); }}
      />

      {fileInput}

      {/* Email Import Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-4 h-4" />Import via Email</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Forward your menu PDF or supplier price list to this address. We'll extract items automatically.
          </p>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mt-2">
            <code className="text-sm font-mono flex-1 truncate">
              menu-{currentOrg?.id?.slice(0, 8)}@import.queitos.app
            </code>
            <Button variant="ghost" size="icon" onClick={() => {
              navigator.clipboard.writeText(`menu-${currentOrg?.id?.slice(0, 8)}@import.queitos.app`);
              toast.success("Email address copied!");
            }}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Emails are processed within 2 minutes. Check back here for extracted items.
          </p>
        </DialogContent>
      </Dialog>

      {/* Remedial Notes Sheet */}
      <RemedialNotesSheet
        open={notesOpen}
        onOpenChange={setNotesOpen}
        notes={activeMenu?.remedialNotes || []}
        menuItems={menuItems}
        authorName={(profile as any)?.full_name || (profile as any)?.email || 'Unknown'}
        onSave={(notes) => { if (activeMenu) updateRemedialNotes({ menuId: activeMenu.id, notes }); }}
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive "{activeMenu?.name}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Active since {activeMenu ? format(activeMenu.effectiveFrom, "dd MMM yyyy") : "—"} · {menuItems.length} items</p>
                <p>A cost snapshot will be saved before archiving so you can reference historical pricing later.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowArchiveConfirm(false); handleArchiveMenu(); }}>
              Yes, Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Shared Costing Table ───
function CostingTable({
  items,
  recipeCosts,
  isEditing,
  editedItems,
  updateEditedItem,
  navigate,
  getDishTrend,
}: {
  items: MenuItem[];
  recipeCosts: Record<string, number>;
  isEditing: boolean;
  editedItems: MenuItem[];
  updateEditedItem: (id: string, field: keyof MenuItem, value: any) => void;
  navigate: (path: string) => void;
  getDishTrend: (dishName: string) => any[];
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[200px]">Dish Name</TableHead>
              <TableHead className="min-w-[120px]">Category</TableHead>
              <TableHead className="w-28 text-right">Sell Price</TableHead>
              <TableHead className="w-28 text-right">Food Cost</TableHead>
              <TableHead className="w-24 text-right">FC%</TableHead>
              <TableHead className="w-16 text-center">Trend</TableHead>
              <TableHead className="w-24 text-right">Margin</TableHead>
              <TableHead className="w-32">Recipe Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const liveCost = item.recipeId ? (recipeCosts[item.recipeId] || 0) : item.foodCost;
              const exGst = item.sellPrice / (1 + GST_RATE);
              const fcPercent = exGst > 0 ? (liveCost / exGst) * 100 : 0;
              const margin = exGst - liveCost;
              const hasRecipeCost = liveCost > 0;
              const trend = getDishTrend(item.name);

              return (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="p-2">
                    {isEditing ? (
                      <Input value={item.name} onChange={(e) => updateEditedItem(item.id, "name", e.target.value)} className="h-8" />
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-2">
                    {isEditing ? (
                      <Select value={item.category} onValueChange={(val) => updateEditedItem(item.id, "category", val)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categoryOptions.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-muted-foreground">{item.category}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    {isEditing ? (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-muted-foreground">$</span>
                        <Input type="number" step="0.01" min="0" value={item.sellPrice} onChange={(e) => updateEditedItem(item.id, "sellPrice", parseFloat(e.target.value) || 0)} className="h-8 w-20 text-right" />
                      </div>
                    ) : (
                      <span className="font-semibold">${item.sellPrice.toFixed(2)}</span>
                    )}
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    <span className={cn(!hasRecipeCost && "text-muted-foreground")}>${liveCost.toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    <Badge variant="outline" className={cn("font-mono", !hasRecipeCost ? "text-muted-foreground border-muted" : fcPercent > 30 ? "text-destructive border-destructive" : "text-success border-success")}>
                      {fcPercent.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="p-2 text-center">
                    {trend.length > 0 && (
                      <DishTrendPopover dishName={item.name} currentFcPercent={fcPercent} trendData={trend} />
                    )}
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    <span className={cn("font-medium", hasRecipeCost ? "text-success" : "text-muted-foreground")}>${margin.toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="p-2">
                    {item.recipeId ? (
                      hasRecipeCost ? (
                        <Badge className="bg-success/10 text-success border-success cursor-pointer" variant="outline" onClick={() => navigate(`/recipes?edit=${item.recipeId}`)}>
                          <Check className="w-3 h-3 mr-1" />Costed<ExternalLink className="w-3 h-3 ml-1" />
                        </Badge>
                      ) : (
                        <Badge className="bg-warning/10 text-warning border-warning cursor-pointer" variant="outline" onClick={() => navigate(`/recipes?edit=${item.recipeId}`)}>
                          <AlertCircle className="w-3 h-3 mr-1" />Needs Recipe<ExternalLink className="w-3 h-3 ml-1" />
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">No Recipe</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}

function ParsingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
        <p className="font-medium">Extracting menu with AI...</p>
        <p className="text-sm text-muted-foreground">This may take a moment</p>
      </div>
    </div>
  );
}
