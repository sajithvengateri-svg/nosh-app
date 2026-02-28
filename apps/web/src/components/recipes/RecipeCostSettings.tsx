import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface RecipeCostSettingsProps {
  sellPrice: number;
  targetFoodCostPercent: number;
  gstPercent: number;
  totalYield: number;
  yieldUnit: string;
  foodCostLowAlert: number;
  foodCostHighAlert: number;
  onUpdate: (field: string, value: number | string) => void;
  disabled?: boolean;
}

const yieldUnits = ["portions", "serves", "pieces", "kg", "g", "L", "ml"];

const RecipeCostSettings = ({
  sellPrice,
  targetFoodCostPercent,
  gstPercent,
  totalYield,
  yieldUnit,
  foodCostLowAlert,
  foodCostHighAlert,
  onUpdate,
  disabled = false,
}: RecipeCostSettingsProps) => {
  return (
    <div className="card-elevated p-5 space-y-4">
      <h3 className="font-semibold">Pricing & Yield Settings</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sellPrice">Sell Price ($)</Label>
          <Input
            id="sellPrice"
            type="number"
            min="0"
            step="0.01"
            value={sellPrice || ""}
            placeholder="0"
            onChange={(e) => onUpdate("sell_price", parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="targetFoodCost">Target Food Cost %</Label>
          <Input
            id="targetFoodCost"
            type="number"
            min="0"
            max="100"
            step="1"
            value={targetFoodCostPercent || ""}
            placeholder="0"
            onChange={(e) => onUpdate("target_food_cost_percent", parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gst">GST %</Label>
          <Input
            id="gst"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={gstPercent || ""}
            placeholder="0"
            onChange={(e) => onUpdate("gst_percent", parseFloat(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="yield">Total Yield</Label>
          <div className="flex gap-2">
            <Input
              id="yield"
              type="number"
              min="0"
              step="0.1"
              value={totalYield || ""}
              placeholder="1"
              onChange={(e) => onUpdate("total_yield", parseFloat(e.target.value) || 1)}
              className="w-20"
              disabled={disabled}
            />
            <Select
              value={yieldUnit}
              onValueChange={(v) => onUpdate("yield_unit", v)}
              disabled={disabled}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yieldUnits.map(u => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Food Cost Alert Thresholds</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lowAlert" className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning"></span>
              Low Alert (under-pricing)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="lowAlert"
                type="number"
                min="0"
                max="100"
                step="1"
                value={foodCostLowAlert || ""}
                placeholder="0"
                onChange={(e) => onUpdate("food_cost_low_alert", parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Alert when food cost is below this (may be under-priced)</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="highAlert" className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive"></span>
              High Alert (over budget)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="highAlert"
                type="number"
                min="0"
                max="100"
                step="1"
                value={foodCostHighAlert || ""}
                placeholder="0"
                onChange={(e) => onUpdate("food_cost_high_alert", parseFloat(e.target.value) || 0)}
                disabled={disabled}
                className="w-24"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">Critical alert when food cost exceeds this</p>
          </div>
        </div>
      </div>

      {/* Visual indicator of thresholds */}
      <div className="pt-4">
        <div className="flex items-center text-xs text-muted-foreground mb-2">
          <span>0%</span>
          <span className="flex-1"></span>
          <span>100%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex">
          <div 
            className="bg-warning/50" 
            style={{ width: `${foodCostLowAlert}%` }}
          />
          <div 
            className="bg-success" 
            style={{ width: `${targetFoodCostPercent - foodCostLowAlert}%` }}
          />
          <div 
            className="bg-warning" 
            style={{ width: `${foodCostHighAlert - targetFoodCostPercent}%` }}
          />
          <div 
            className="bg-destructive" 
            style={{ width: `${100 - foodCostHighAlert}%` }}
          />
        </div>
        <div className="flex items-center text-xs mt-1">
          <span className="text-warning" style={{ marginLeft: `${foodCostLowAlert - 5}%` }}>
            {foodCostLowAlert}%
          </span>
          <span className="flex-1"></span>
          <span className="text-success" style={{ marginRight: `${100 - targetFoodCostPercent - 10}%` }}>
            Target: {targetFoodCostPercent}%
          </span>
          <span className="flex-1"></span>
          <span className="text-destructive" style={{ marginRight: `${100 - foodCostHighAlert - 5}%` }}>
            {foodCostHighAlert}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default RecipeCostSettings;
