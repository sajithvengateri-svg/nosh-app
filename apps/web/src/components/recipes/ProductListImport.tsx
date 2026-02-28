import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Upload, PenLine, Loader2, X, Check, ChefHat, Trash2, Plus,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExtractedItem {
  name: string;
  category: string;
  price: number;
  selected: boolean;
}

interface ProductListImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

type Step = "choose" | "extracting" | "review";

const ProductListImport = ({ open, onOpenChange, onComplete }: ProductListImportProps) => {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [step, setStep] = useState<Step>("choose");
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [showManual, setShowManual] = useState(false);

  const reset = () => {
    setStep("choose");
    setItems([]);
    setLoading(false);
    setSaving(false);
    setShowManual(false);
    setManualName("");
    setManualPrice("");
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await extractFromFile(file);
  };

  const extractFromFile = async (file: File) => {
    setStep("extracting");
    setLoading(true);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("extract-menu", {
        body: { image_base64: base64, file_type: file.type },
      });

      if (error) throw error;

      const menuItems: ExtractedItem[] = (data?.menu_items || []).map((item: any) => ({
        name: item.name || "Untitled",
        category: item.category || "Mains",
        price: Number(item.sell_price || item.price) || 0,
        selected: true,
      }));

      if (menuItems.length === 0) {
        toast.error("No items found. Try a clearer image or add manually.");
        setStep("choose");
      } else {
        setItems(menuItems);
        setStep("review");
      }
    } catch (err) {
      console.error("Extract error:", err);
      toast.error("Failed to extract items");
      setStep("choose");
    } finally {
      setLoading(false);
    }
  };

  const addManualItem = () => {
    if (!manualName.trim()) return;
    setItems(prev => [
      ...prev,
      { name: manualName.trim(), category: "Mains", price: Number(manualPrice) || 0, selected: true },
    ]);
    setManualName("");
    setManualPrice("");
    if (step === "choose") setStep("review");
  };

  const toggleItem = (idx: number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleConfirm = async () => {
    const selected = items.filter(i => i.selected);
    if (selected.length === 0) {
      toast.error("Select at least one item");
      return;
    }

    setSaving(true);
    try {
      const inserts = selected.map(item => ({
        name: item.name,
        category: item.category,
        sell_price: item.price,
        recipe_type: "dish",
        org_id: currentOrg?.id,
        created_by: user?.id,
        cost_per_serving: 0,
        is_public: true,
        servings: 1,
      }));

      const { error } = await supabase.from("recipes").insert(inserts);
      if (error) throw error;

      toast.success(`${selected.length} recipe cards created! Tap any recipe to add ingredients.`);
      onComplete();
      handleClose();
    } catch (err) {
      console.error("Batch create error:", err);
      toast.error("Failed to create recipes");
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = items.filter(i => i.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            {step === "choose" && "Add Your Product List"}
            {step === "extracting" && "Reading your list..."}
            {step === "review" && `Review Items (${selectedCount})`}
          </DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,.csv,.xlsx,.xls,.doc,.docx"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Step: Choose method */}
        {step === "choose" && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Add your products or menu items to auto-create recipe cards.
            </p>

            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "image/*";
                  fileInputRef.current.capture = "environment";
                  fileInputRef.current.click();
                }
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-primary/10">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Scan / Take Photo</p>
                <p className="text-sm text-muted-foreground">Snap your menu or product list</p>
              </div>
            </button>

            <button
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = "application/pdf,.csv,.xlsx,.xls,.doc,.docx,image/*";
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                }
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-primary/10">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Upload File</p>
                <p className="text-sm text-muted-foreground">PDF, Excel, CSV, or image</p>
              </div>
            </button>

            <button
              onClick={() => setShowManual(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-primary/10">
                <PenLine className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Type It In</p>
                <p className="text-sm text-muted-foreground">Add items one by one</p>
              </div>
            </button>

            {/* Inline manual entry */}
            <AnimatePresence>
              {showManual && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2"
                >
                  <div className="flex gap-2">
                    <Input
                      placeholder="Item name"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addManualItem()}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Price"
                      type="number"
                      step="0.01"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addManualItem()}
                      className="w-24"
                    />
                    <Button size="icon" variant="outline" onClick={addManualItem}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {items.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 py-1">
                          {item.name}
                          {item.price > 0 && ` $${item.price.toFixed(2)}`}
                          <button onClick={() => removeItem(i)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {items.length > 0 && (
                    <Button onClick={() => setStep("review")} className="w-full">
                      Review {items.length} items
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Step: Extracting */}
        {step === "extracting" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI is reading your list...</p>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="flex-1 min-h-0 space-y-3">
            {/* Inline add */}
            <div className="flex gap-2">
              <Input
                placeholder="Add another item"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManualItem()}
                className="flex-1"
              />
              <Input
                placeholder="$"
                type="number"
                step="0.01"
                value={manualPrice}
                onChange={(e) => setManualPrice(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManualItem()}
                className="w-20"
              />
              <Button size="icon" variant="outline" onClick={addManualItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <ScrollArea className="max-h-[40vh]">
              <div className="space-y-1">
                {items.map((item, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      item.selected ? "bg-muted/50" : "bg-muted/20 opacity-50"
                    )}
                  >
                    <button onClick={() => toggleItem(i)} className="flex-shrink-0">
                      <div className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
                        item.selected ? "bg-primary border-primary" : "border-muted-foreground"
                      )}>
                        {item.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    {item.price > 0 && (
                      <span className="text-sm font-medium text-muted-foreground">${item.price.toFixed(2)}</span>
                    )}
                    <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === "review" && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setStep("choose"); }}>
              Back
            </Button>
            <Button onClick={handleConfirm} disabled={saving || selectedCount === 0}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create {selectedCount} Recipes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductListImport;
