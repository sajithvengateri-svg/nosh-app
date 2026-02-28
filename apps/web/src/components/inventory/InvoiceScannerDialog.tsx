import { useState, useRef, useEffect } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FileText, Upload, Loader2, Check, AlertTriangle, Package, Camera, Archive, Plus, Search, PenLine,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { inferCategory, inferUnit } from "@/lib/ingredientMatcher";

interface ExtractedItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
  matched_ingredient_id?: string;
  matched_ingredient_name?: string;
  confidence: number;
  selected: boolean;
  editing?: boolean;
}

interface InvoiceScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const INVOICE_TYPES = [
  { value: "food", label: "Food" },
  { value: "equipment", label: "Equipment" },
  { value: "cleaning", label: "Cleaning" },
  { value: "other", label: "Other" },
];

const InvoiceScannerDialog = ({ open, onOpenChange, onComplete }: InvoiceScannerDialogProps) => {
  const { profile } = useAuth();
  const { currentOrg } = useOrg();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "processing" | "review" | "complete">("upload");
  const [loading, setLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceType, setInvoiceType] = useState("food");
  const [existingIngredients, setExistingIngredients] = useState<{ id: string; name: string; unit: string }[]>([]);
  const [addingAll, setAddingAll] = useState(false);

  // Load existing ingredients when dialog opens
  useEffect(() => {
    if (open && currentOrg?.id) {
      supabase.from("ingredients").select("id, name, unit").eq("org_id", currentOrg.id).then(({ data }) => {
        setExistingIngredients(data || []);
      });
    }
  }, [open, currentOrg?.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setInvoiceFile(file);
  };

  const uploadToStorage = async (file: File): Promise<string | null> => {
    if (!currentOrg?.id) return null;
    const path = `${currentOrg.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("invoices").upload(path, file);
    if (error) { console.error("Upload error:", error); return null; }
    return path;
  };

  const shouldSaveFile = () => {
    return (profile as any)?.save_invoice_files !== false;
  };

  const saveOnly = async () => {
    if (!invoiceFile) return;
    setLoading(true);
    try {
      const fileUrl = shouldSaveFile() ? await uploadToStorage(invoiceFile) : null;
      await supabase.from("invoice_scans").insert({
        file_name: invoiceFile.name,
        file_url: fileUrl,
        invoice_type: invoiceType,
        status: "archived",
        org_id: currentOrg?.id,
        scanned_by: profile?.user_id,
        items_extracted: 0, items_matched: 0, prices_updated: 0,
      } as any);
      toast.success("Invoice archived");
      setStep("complete");
      onComplete?.();
      setTimeout(() => { onOpenChange(false); resetDialog(); }, 1500);
    } catch { toast.error("Failed to save"); }
    finally { setLoading(false); }
  };

  const processInvoice = async () => {
    if (!invoiceFile) return;
    setStep("processing");
    setLoading(true);

    try {
      // Upload file to storage (respecting save preference)
      const fileUrl = shouldSaveFile() ? await uploadToStorage(invoiceFile) : null;

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(invoiceFile);
      });

      const { data: ingredients } = await supabase.from("ingredients").select("id, name, unit");

      const { data, error } = await supabase.functions.invoke("extract-invoice", {
        body: { image_base64: base64, file_type: invoiceFile.type, existing_ingredients: ingredients || [] },
      });
      if (error) throw error;

      await supabase.from("invoice_scans").insert({
        file_name: invoiceFile.name,
        file_url: fileUrl,
        invoice_type: invoiceType,
        status: "completed",
        org_id: currentOrg?.id,
        scanned_by: profile?.user_id,
        items_extracted: data.items?.length || 0,
        items_matched: data.items?.filter((i: any) => i.matched_ingredient_id).length || 0,
        prices_updated: 0,
      } as any);

      const items: ExtractedItem[] = (data.items || []).map((item: any) => ({
        ...item, selected: item.confidence > 0.7,
      }));
      setExtractedItems(items);
      setStep("review");
    } catch (error) {
      console.error("Failed to process invoice:", error);
      toast.error("Failed to process invoice. Please try again.");
      setStep("upload");
    } finally { setLoading(false); }
  };

  const toggleItem = (index: number) => {
    const updated = [...extractedItems];
    updated[index].selected = !updated[index].selected;
    setExtractedItems(updated);
  };

  const updateItemField = (index: number, field: keyof ExtractedItem, value: any) => {
    const updated = [...extractedItems];
    (updated[index] as any)[field] = value;
    setExtractedItems(updated);
  };

  const addAsNewIngredient = async (index: number) => {
    const item = extractedItems[index];
    if (!currentOrg?.id) return;

    try {
      const category = inferCategory(item.name);
      const unit = item.unit || inferUnit(item.name);
      const { data, error } = await supabase.from("ingredients").insert({
        name: item.name,
        unit,
        category,
        cost_per_unit: item.price || 0,
        org_id: currentOrg.id,
        current_stock: 0,
      }).select("id, name").single();

      if (error) throw error;

      const updated = [...extractedItems];
      updated[index].matched_ingredient_id = data.id;
      updated[index].matched_ingredient_name = data.name;
      updated[index].selected = true;
      setExtractedItems(updated);

      // Add to local ingredients list
      setExistingIngredients(prev => [...prev, { id: data.id, name: data.name, unit }]);
      toast.success(`Added "${data.name}" as new ingredient`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add ingredient");
    }
  };

  const addAllUnmatched = async () => {
    const unmatchedIndices = extractedItems
      .map((item, i) => (!item.matched_ingredient_id ? i : -1))
      .filter(i => i !== -1);

    if (unmatchedIndices.length === 0) return;
    setAddingAll(true);

    try {
      for (const idx of unmatchedIndices) {
        await addAsNewIngredient(idx);
      }
      toast.success(`Added ${unmatchedIndices.length} new ingredients`);
    } catch {
      toast.error("Some ingredients failed to add");
    } finally {
      setAddingAll(false);
    }
  };

  const pickExistingIngredient = (index: number, ingredientId: string, ingredientName: string) => {
    const updated = [...extractedItems];
    updated[index].matched_ingredient_id = ingredientId;
    updated[index].matched_ingredient_name = ingredientName;
    updated[index].selected = true;
    setExtractedItems(updated);
    toast.success(`Matched to "${ingredientName}"`);
  };

  const clearMatch = (index: number) => {
    const updated = [...extractedItems];
    updated[index].matched_ingredient_id = undefined;
    updated[index].matched_ingredient_name = undefined;
    setExtractedItems(updated);
  };

  const applyInventoryUpdates = async () => {
    setLoading(true);
    try {
      const selectedItems = extractedItems.filter((i) => i.selected);
      for (const item of selectedItems) {
        if (item.matched_ingredient_id) {
          const { data: ing } = await supabase.from("ingredients").select("current_stock").eq("id", item.matched_ingredient_id).single();
          const currentStock = Number(ing?.current_stock) || 0;
          const newStock = currentStock + item.quantity;
          await supabase.from("ingredients").update({ current_stock: newStock }).eq("id", item.matched_ingredient_id);
          await supabase.from("inventory").update({ quantity: newStock }).eq("ingredient_id", item.matched_ingredient_id);
        }
      }
      toast.success(`Updated ${selectedItems.length} inventory items`);
      setStep("complete");
      onComplete?.();
      setTimeout(() => { onOpenChange(false); resetDialog(); }, 2000);
    } catch { toast.error("Failed to update inventory"); }
    finally { setLoading(false); }
  };

  const resetDialog = () => { setStep("upload"); setInvoiceFile(null); setExtractedItems([]); setInvoiceType("food"); };
  const selectedCount = extractedItems.filter((i) => i.selected).length;
  const unmatchedCount = extractedItems.filter((i) => !i.matched_ingredient_id).length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetDialog(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {step === "upload" && "Scan Invoice"}
            {step === "processing" && "Processing Invoice..."}
            {step === "review" && "Review Extracted Items"}
            {step === "complete" && "Done"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a supplier invoice — extract data or archive it"}
            {step === "processing" && "AI is extracting items from your invoice"}
            {step === "review" && `${extractedItems.length} items found · ${unmatchedCount} unmatched`}
            {step === "complete" && "Invoice processed successfully"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "upload" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice Type</Label>
                <Select value={invoiceType} onValueChange={setInvoiceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVOICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {invoiceType !== "food" && (
                  <p className="text-xs text-muted-foreground">Non-food invoices can be saved without extraction</p>
                )}
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  invoiceFile ? "border-success bg-success/5" : "border-border"
                )}
              >
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleFileSelect} className="hidden" />
                {invoiceFile ? (
                  <div className="space-y-2">
                    <Check className="w-12 h-12 text-success mx-auto" />
                    <p className="font-medium">{invoiceFile.name}</p>
                    <p className="text-sm text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-center gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-primary/10"><Upload className="w-8 h-8 text-primary" /></div>
                      <div className="p-3 rounded-xl bg-primary/10"><Camera className="w-8 h-8 text-primary" /></div>
                    </div>
                    <p className="font-medium">Upload Invoice Image</p>
                    <p className="text-sm text-muted-foreground">Supports: JPG, PNG, PDF</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="text-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <p className="font-medium">Analyzing invoice...</p>
              <Progress value={66} className="max-w-xs mx-auto" />
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              {/* Add All Unmatched button */}
              {unmatchedCount >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addAllUnmatched}
                  disabled={addingAll}
                  className="w-full border-dashed"
                >
                  {addingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add All {unmatchedCount} Unmatched as New Ingredients
                </Button>
              )}

              {extractedItems.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-2" />
                  <p className="font-medium">No items detected</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {extractedItems.map((item, index) => (
                    <ReviewItemCard
                      key={index}
                      item={item}
                      index={index}
                      existingIngredients={existingIngredients}
                      onToggle={toggleItem}
                      onUpdateField={updateItemField}
                      onAddAsNew={addAsNewIngredient}
                      onPickExisting={pickExistingIngredient}
                      onClearMatch={clearMatch}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {step === "complete" && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <p className="font-medium text-success">Done!</p>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button variant="outline" onClick={saveOnly} disabled={!invoiceFile || loading}>
                <Archive className="w-4 h-4 mr-2" />Save Only
              </Button>
              <Button onClick={processInvoice} disabled={!invoiceFile || loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                Extract & Process
              </Button>
            </>
          )}
          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={applyInventoryUpdates} disabled={loading || selectedCount === 0}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Update {selectedCount} Items
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Review Item Card ─── */
interface ReviewItemCardProps {
  item: ExtractedItem;
  index: number;
  existingIngredients: { id: string; name: string; unit: string }[];
  onToggle: (i: number) => void;
  onUpdateField: (i: number, field: keyof ExtractedItem, value: any) => void;
  onAddAsNew: (i: number) => Promise<void>;
  onPickExisting: (i: number, id: string, name: string) => void;
  onClearMatch: (i: number) => void;
}

const ReviewItemCard = ({
  item, index, existingIngredients,
  onToggle, onUpdateField, onAddAsNew, onPickExisting, onClearMatch,
}: ReviewItemCardProps) => {
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isEditing = item.editing;

  const handleAddNew = async () => {
    setAdding(true);
    await onAddAsNew(index);
    setAdding(false);
  };

  return (
    <div className={cn(
      "p-4 rounded-lg border transition-colors space-y-2",
      item.selected ? "bg-primary/5 border-primary" : "bg-muted/50"
    )}>
      {/* Main row */}
      <div className="flex items-center gap-3">
        <Checkbox checked={item.selected} onCheckedChange={() => onToggle(index)} />
        <div className="p-2 rounded-lg bg-muted"><Package className="w-4 h-4 text-muted-foreground" /></div>

        {isEditing ? (
          <div className="flex-1 grid grid-cols-3 gap-2">
            <Input
              value={item.name}
              onChange={(e) => onUpdateField(index, "name", e.target.value)}
              className="h-8 text-sm"
              placeholder="Name"
            />
            <Input
              type="number"
              min="0"
              step="0.1"
              value={item.quantity}
              onChange={(e) => onUpdateField(index, "quantity", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm"
              placeholder="Qty"
            />
            <Input
              value={item.unit}
              onChange={(e) => onUpdateField(index, "unit", e.target.value)}
              className="h-8 text-sm"
              placeholder="Unit"
            />
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{item.name}</span>
              {item.price != null && item.price > 0 && (
                <span className="text-xs text-muted-foreground">${item.price.toFixed(2)}</span>
              )}
            </div>
          </div>
        )}

        {!isEditing && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={item.quantity}
              onChange={(e) => onUpdateField(index, "quantity", parseFloat(e.target.value) || 0)}
              className="w-20 h-8"
            />
            <span className="text-sm text-muted-foreground w-8">{item.unit}</span>
          </div>
        )}

        <Badge variant={item.confidence > 0.8 ? "default" : "secondary"} className="shrink-0">
          {Math.round(item.confidence * 100)}%
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onUpdateField(index, "editing", !isEditing)}
        >
          <PenLine className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Match status row */}
      <div className="pl-12">
        {item.matched_ingredient_id ? (
          <div className="flex items-center gap-2 text-xs">
            <Check className="w-3 h-3 text-success" />
            <span className="text-muted-foreground">Matched:</span>
            <Badge variant="secondary" className="text-xs">{item.matched_ingredient_name}</Badge>
            <button
              onClick={() => onClearMatch(index)}
              className="text-xs text-primary hover:underline"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-warning flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />No match
            </p>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={handleAddNew}
              disabled={adding}
            >
              {adding ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
              Add as New
            </Button>

            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-6 text-xs px-2">
                  <Search className="w-3 h-3 mr-1" />Pick Existing
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search ingredients..." />
                  <CommandList>
                    <CommandEmpty>No ingredients found.</CommandEmpty>
                    <CommandGroup>
                      {existingIngredients.map(ing => (
                        <CommandItem
                          key={ing.id}
                          onSelect={() => {
                            onPickExisting(index, ing.id, ing.name);
                            setPickerOpen(false);
                          }}
                        >
                          {ing.name}
                          <span className="ml-auto text-xs text-muted-foreground">{ing.unit}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceScannerDialog;
