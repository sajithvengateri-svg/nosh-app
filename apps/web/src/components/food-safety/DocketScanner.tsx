import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Check, Plus, X, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

interface DocketItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  matched_ingredient_id: string | null;
  matched_ingredient_name: string | null;
  confidence: number;
  action: "update" | "skip" | "add_new";
}

interface ExistingIngredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
}

interface DocketResult {
  store_name: string;
  receipt_date: string;
  receipt_total: number;
  items: DocketItem[];
}

const DocketScanner = () => {
  const { currentOrg } = useOrg();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<DocketResult | null>(null);
  const [ingredients, setIngredients] = useState<ExistingIngredient[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setResult(null);

    try {
      // Fetch existing ingredients for matching
      const { data: ingData } = await supabase
        .from("ingredients")
        .select("id, name, unit, cost_per_unit")
        .order("name");

      const existingIngredients = (ingData || []).map((i: any) => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        cost_per_unit: Number(i.cost_per_unit),
      }));
      setIngredients(existingIngredients);

      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke("scan-docket", {
        body: {
          image_base64: base64,
          file_type: file.type,
          existing_ingredients: existingIngredients,
        },
      });

      if (error) throw error;

      if (data?.items) {
        const items: DocketItem[] = data.items.map((item: any) => ({
          ...item,
          action: item.matched_ingredient_id && item.confidence >= 0.6 ? "update" : "skip",
        }));
        setResult({
          store_name: data.store_name || "Unknown Store",
          receipt_date: data.receipt_date || new Date().toISOString().split("T")[0],
          receipt_total: data.receipt_total || 0,
          items,
        });
        toast.success(`Extracted ${items.length} items from receipt`);
      } else {
        toast.error("Could not extract items from receipt");
      }
    } catch (err: any) {
      console.error("Docket scan error:", err);
      toast.error(err?.message || "Failed to scan receipt");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateItemAction = (index: number, action: DocketItem["action"]) => {
    if (!result) return;
    const updated = [...result.items];
    updated[index] = { ...updated[index], action };
    setResult({ ...result, items: updated });
  };

  const updateItemMatch = (index: number, ingredientId: string) => {
    if (!result) return;
    const ing = ingredients.find((i) => i.id === ingredientId);
    const updated = [...result.items];
    updated[index] = {
      ...updated[index],
      matched_ingredient_id: ingredientId,
      matched_ingredient_name: ing?.name || null,
      confidence: 1,
      action: "update",
    };
    setResult({ ...result, items: updated });
  };

  const handleUpdatePrices = async () => {
    if (!result) return;
    setIsSaving(true);

    try {
      const toUpdate = result.items.filter(
        (i) => i.action === "update" && i.matched_ingredient_id
      );
      const toAdd = result.items.filter((i) => i.action === "add_new");

      let updatedCount = 0;
      let addedCount = 0;

      // Update matched ingredient prices
      for (const item of toUpdate) {
        const { error } = await supabase
          .from("ingredients")
          .update({ cost_per_unit: item.unit_price } as any)
          .eq("id", item.matched_ingredient_id!);
        if (!error) updatedCount++;
      }

      // Add new ingredients from unmatched items
      if (toAdd.length > 0) {
        const newIngredients = toAdd.map((item) => ({
          name: item.name,
          unit: "each",
          cost_per_unit: item.unit_price,
          category: "Produce",
          org_id: currentOrg?.id,
        }));
        const { error } = await supabase.from("ingredients").insert(newIngredients);
        if (!error) addedCount = toAdd.length;
      }

      const messages = [];
      if (updatedCount > 0) messages.push(`${updatedCount} prices updated`);
      if (addedCount > 0) messages.push(`${addedCount} new ingredients added`);
      toast.success(messages.join(", ") || "No changes made");

      setResult(null);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const matchedCount = result?.items.filter((i) => i.action === "update").length || 0;
  const addNewCount = result?.items.filter((i) => i.action === "add_new").length || 0;

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!result && (
        <div className="card-elevated p-8">
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Receipt className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Scan Supermarket Docket</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Take a photo or upload your supermarket receipt to update ingredient prices
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => fileInputRef.current?.click()} disabled={isScanning}>
                  {isScanning ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  {isScanning ? "Scanning..." : "Snap / Upload"}
                </Button>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* Scanning overlay */}
      {isScanning && (
        <div className="card-elevated p-8 text-center">
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin mb-4" />
          <p className="font-medium">Extracting items from receipt...</p>
          <p className="text-sm text-muted-foreground">AI is reading your docket</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Receipt Summary */}
          <div className="card-elevated p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">{result.store_name}</p>
                  <p className="text-sm text-muted-foreground">{result.receipt_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{result.items.length} items</Badge>
                <span className="font-bold text-lg">${result.receipt_total.toFixed(2)}</span>
                <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="card-elevated overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead>Matched Ingredient</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select
                        value={item.matched_ingredient_id || "__none__"}
                        onValueChange={(val) => {
                          if (val === "__none__") {
                            const updated = [...result.items];
                            updated[idx] = { ...updated[idx], matched_ingredient_id: null, matched_ingredient_name: null, confidence: 0, action: "skip" };
                            setResult({ ...result, items: updated });
                          } else {
                            updateItemMatch(idx, val);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="No match" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No match</SelectItem>
                          {ingredients.map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              {ing.name} (${ing.cost_per_unit.toFixed(2)}/{ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {item.confidence > 0 && item.confidence < 1 && (
                        <span className="text-xs text-muted-foreground ml-1">
                          {Math.round(item.confidence * 100)}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant={item.action === "update" ? "default" : "outline"}
                          size="sm"
                          disabled={!item.matched_ingredient_id}
                          onClick={() => updateItemAction(idx, "update")}
                          className="text-xs h-7 px-2"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Update
                        </Button>
                        <Button
                          variant={item.action === "add_new" ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateItemAction(idx, "add_new")}
                          className="text-xs h-7 px-2"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          New
                        </Button>
                        <Button
                          variant={item.action === "skip" ? "secondary" : "ghost"}
                          size="sm"
                          onClick={() => updateItemAction(idx, "skip")}
                          className="text-xs h-7 px-2"
                        >
                          Skip
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-muted-foreground">
              {matchedCount} price updates, {addNewCount} new ingredients
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResult(null)}>Cancel</Button>
              <Button onClick={handleUpdatePrices} disabled={isSaving || (matchedCount === 0 && addNewCount === 0)}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Apply {matchedCount + addNewCount} Changes
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocketScanner;
