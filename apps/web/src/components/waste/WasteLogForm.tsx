import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateWasteLog, WASTE_REASONS, REASON_LABELS } from "@/hooks/useWasteLogs";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { calculateIngredientCost } from "@/lib/shared/utils/unitConversion";

interface WasteLogFormProps {
  module: "food" | "beverage";
  onSuccess?: () => void;
}

const UNITS = ["g", "kg", "ml", "L", "each"];

const WasteLogForm = ({ module, onSuccess }: WasteLogFormProps) => {
  const orgId = useOrgId();
  const createWaste = useCreateWasteLog();
  const reasons = WASTE_REASONS[module];

  const [itemId, setItemId] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("each");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");
  const [costOverride, setCostOverride] = useState(false);

  // Fetch items based on module
  const { data: items } = useQuery({
    queryKey: ["waste-items", module, orgId],
    queryFn: async () => {
      if (!orgId) return [];
      if (module === "food") {
        const { data } = await supabase.from("ingredients").select("id, name, unit, cost_per_unit").eq("org_id", orgId).order("name");
        return (data ?? []).map((i: any) => ({ id: i.id, name: i.name, unit: i.unit, costPerUnit: i.cost_per_unit }));
      } else {
        const { data } = await supabase.from("bev_products").select("id, name, purchase_price, bottle_size_ml").eq("org_id", orgId).order("name");
        return (data ?? []).map((p: any) => ({ id: p.id, name: p.name, unit: "ml", costPerUnit: p.purchase_price }));
      }
    },
    enabled: !!orgId,
  });

  // Auto-calculate cost when item or quantity changes
  useEffect(() => {
    if (costOverride) return;
    const selected = items?.find((i) => i.id === itemId);
    if (selected && quantity) {
      const calc = calculateIngredientCost(Number(quantity), unit, selected.costPerUnit, selected.unit);
      setCost(calc !== null ? calc.toFixed(2) : "0");
    }
  }, [itemId, quantity, unit, items, costOverride]);

  const handleItemSelect = (id: string) => {
    setItemId(id);
    const selected = items?.find((i) => i.id === id);
    if (selected) {
      setItemName(selected.name);
      setUnit(selected.unit || "each");
    }
  };

  const handleSubmit = () => {
    if (!itemName || !quantity || !reason) return;
    createWaste.mutate(
      {
        module,
        item_type: module === "food" ? "ingredient" : "bev_product",
        item_id: itemId || null,
        item_name: itemName,
        quantity: Number(quantity),
        unit,
        cost: Number(cost) || 0,
        reason,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          setItemId("");
          setItemName("");
          setQuantity("");
          setCost("");
          setNotes("");
          setReason("");
          setCostOverride(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Log {module === "food" ? "Food" : "Beverage"} Waste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Item select */}
          <div className="space-y-2">
            <Label>Item</Label>
            <Select value={itemId} onValueChange={handleItemSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select item..." />
              </SelectTrigger>
              <SelectContent>
                {items?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Or type custom item name"
              value={itemName}
              onChange={(e) => { setItemName(e.target.value); setItemId(""); }}
              className="mt-1"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>{REASON_LABELS[r] || r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity + Unit */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                className="flex-1"
              />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-2">
            <Label>Cost ($)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={cost}
              onChange={(e) => { setCost(e.target.value); setCostOverride(true); }}
              placeholder="Auto-calculated"
            />
            <p className="text-xs text-muted-foreground">
              {costOverride ? "Manual override" : "Auto-calculated from item cost"}
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional details..."
            rows={2}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!itemName || !quantity || !reason || createWaste.isPending}
          className="w-full sm:w-auto"
        >
          {createWaste.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Log Waste
        </Button>
      </CardContent>
    </Card>
  );
};

export default WasteLogForm;
