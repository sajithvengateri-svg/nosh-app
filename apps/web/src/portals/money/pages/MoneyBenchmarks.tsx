import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Target, TrendingUp, TrendingDown, Minus, Loader2, MapPin, Info,
  CheckCircle2, AlertTriangle, XCircle, Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const VENUE_TYPES = [
  { value: "CASUAL_DINING", label: "Casual Dining" },
  { value: "FINE_DINING", label: "Fine Dining" },
  { value: "CAFE", label: "Café" },
  { value: "BAR", label: "Bar / Pub" },
  { value: "QSR", label: "Quick Service" },
  { value: "CATERING", label: "Catering" },
];

const AU_BENCHMARKS: Record<string, Record<string, { low: number; avg: number; high: number; unit: string; label: string; description: string }>> = {
  CASUAL_DINING: {
    FOOD_COST_PCT: { low: 28, avg: 30, high: 33, unit: "%", label: "Food Cost", description: "COGS food as % of food revenue. Australian casual dining averages 28-33%." },
    BEV_COST_PCT: { low: 20, avg: 22, high: 26, unit: "%", label: "Beverage Cost", description: "COGS beverages as % of bev revenue. Spirits typically 15-18%, beer 20-25%, wine 28-35%." },
    LABOUR_PCT: { low: 28, avg: 32, high: 36, unit: "%", label: "Labour Cost", description: "Total labour inc. super as % of revenue. Award rates + penalty rates drive this in AU." },
    PRIME_COST_PCT: { low: 58, avg: 62, high: 67, unit: "%", label: "Prime Cost", description: "COGS + Labour combined. Best practice: under 65% of revenue." },
    RENT_PCT: { low: 6, avg: 9, high: 12, unit: "%", label: "Rent/Occupancy", description: "Rent + outgoings as % of revenue. CBD locations typically 10-15%, suburban 6-9%." },
    OVERHEAD_PCT: { low: 18, avg: 22, high: 26, unit: "%", label: "Total Overheads", description: "All non-COGS, non-labour costs. Target ≤25% annually (Crunch Hospo)." },
    NET_PROFIT_PCT: { low: 5, avg: 10, high: 15, unit: "%", label: "Net Profit", description: "Bottom line after all costs. Top performers hit 15%+ (Crunch Hospo Big 5)." },
    UTILITIES_PCT: { low: 3, avg: 4.5, high: 6, unit: "%", label: "Utilities", description: "Electricity, gas, water. QLD energy costs trending up — solar ROI is strong." },
    OPS_SUPPLIES_PCT: { low: 2, avg: 3, high: 4, unit: "%", label: "Op. Supplies", description: "Chemicals, packaging, smallwares. System warning if >4% of revenue." },
    MARKETING_PCT: { low: 1.5, avg: 3, high: 5, unit: "%", label: "Marketing", description: "Advertising, social media, promotions. Higher for new venues in first 2 years." },
  },
  FINE_DINING: {
    FOOD_COST_PCT: { low: 30, avg: 33, high: 38, unit: "%", label: "Food Cost", description: "Premium ingredients push food cost higher but GP per cover compensates." },
    BEV_COST_PCT: { low: 22, avg: 25, high: 30, unit: "%", label: "Beverage Cost", description: "Wine-heavy programs with by-the-glass increase cost but drive revenue." },
    LABOUR_PCT: { low: 32, avg: 36, high: 40, unit: "%", label: "Labour Cost", description: "Higher skilled workforce with more staff per cover. Service standards demand it." },
    PRIME_COST_PCT: { low: 62, avg: 68, high: 72, unit: "%", label: "Prime Cost", description: "Higher prime cost offset by higher average spend per cover." },
    RENT_PCT: { low: 8, avg: 11, high: 15, unit: "%", label: "Rent/Occupancy", description: "Premium locations demand premium rent. Amortize fit-out costs separately." },
    OVERHEAD_PCT: { low: 20, avg: 25, high: 30, unit: "%", label: "Total Overheads", description: "Linen, flowers, equipment maintenance all higher for fine dining." },
    NET_PROFIT_PCT: { low: 3, avg: 8, high: 12, unit: "%", label: "Net Profit", description: "Tighter margins but higher revenue per seat if managed well." },
    UTILITIES_PCT: { low: 3, avg: 5, high: 7, unit: "%", label: "Utilities", description: "Commercial kitchen equipment and climate control drive costs." },
    OPS_SUPPLIES_PCT: { low: 2.5, avg: 3.5, high: 5, unit: "%", label: "Op. Supplies", description: "Premium disposables, polishing cloth, candles etc." },
    MARKETING_PCT: { low: 2, avg: 4, high: 6, unit: "%", label: "Marketing", description: "PR, photography, guide listings are essential investments." },
  },
  CAFE: {
    FOOD_COST_PCT: { low: 26, avg: 30, high: 34, unit: "%", label: "Food Cost", description: "Brunch-heavy menus with avocado & eggs. Coffee food pairing lowers this." },
    BEV_COST_PCT: { low: 18, avg: 22, high: 25, unit: "%", label: "Beverage Cost", description: "Coffee GP is strong (70-80%), juice and smoothies drag this up." },
    LABOUR_PCT: { low: 30, avg: 34, high: 38, unit: "%", label: "Labour Cost", description: "Peak morning labour crunch. Weekend penalty rates hit cafes hard." },
    PRIME_COST_PCT: { low: 58, avg: 64, high: 68, unit: "%", label: "Prime Cost", description: "Tight margins without dinner service revenue to amortize fixed costs." },
    RENT_PCT: { low: 8, avg: 10, high: 14, unit: "%", label: "Rent/Occupancy", description: "High foot-traffic locations are essential but expensive." },
    OVERHEAD_PCT: { low: 18, avg: 22, high: 28, unit: "%", label: "Total Overheads", description: "Equipment (espresso machines) and packaging are key drivers." },
    NET_PROFIT_PCT: { low: 5, avg: 8, high: 12, unit: "%", label: "Net Profit", description: "Volume-dependent. Need 200+ covers/day for healthy margins." },
    UTILITIES_PCT: { low: 3, avg: 4, high: 6, unit: "%", label: "Utilities", description: "Espresso machines, grinders, and refrigeration." },
    OPS_SUPPLIES_PCT: { low: 3, avg: 4, high: 5, unit: "%", label: "Op. Supplies", description: "Takeaway cups, lids, bags — significant for high-takeaway venues." },
    MARKETING_PCT: { low: 1, avg: 2, high: 4, unit: "%", label: "Marketing", description: "Instagram-driven, lower spend but consistent presence needed." },
  },
  BAR: {
    FOOD_COST_PCT: { low: 25, avg: 28, high: 32, unit: "%", label: "Food Cost", description: "Simpler menu, lower food cost if focused on bar snacks." },
    BEV_COST_PCT: { low: 20, avg: 24, high: 28, unit: "%", label: "Beverage Cost", description: "Spirits & cocktails best margins (15-20%). Beer on tap 22-28%." },
    LABOUR_PCT: { low: 25, avg: 30, high: 35, unit: "%", label: "Labour Cost", description: "Late night penalty rates significant. RSA compliance adds training cost." },
    PRIME_COST_PCT: { low: 55, avg: 60, high: 65, unit: "%", label: "Prime Cost", description: "Best prime cost ratio of all venue types due to bev margins." },
    RENT_PCT: { low: 7, avg: 10, high: 14, unit: "%", label: "Rent/Occupancy", description: "Entertainment precinct rents are high but foot traffic compensates." },
    OVERHEAD_PCT: { low: 18, avg: 22, high: 26, unit: "%", label: "Total Overheads", description: "Security, entertainment licensing, music rights add up." },
    NET_PROFIT_PCT: { low: 8, avg: 12, high: 18, unit: "%", label: "Net Profit", description: "Highest potential margins in hospo if beverage program is tight." },
    UTILITIES_PCT: { low: 3, avg: 4.5, high: 6, unit: "%", label: "Utilities", description: "Refrigeration for bev storage, ice machines, lighting." },
    OPS_SUPPLIES_PCT: { low: 1.5, avg: 2.5, high: 3.5, unit: "%", label: "Op. Supplies", description: "Glassware breakage, garnishes, cleaning chemicals." },
    MARKETING_PCT: { low: 2, avg: 4, high: 7, unit: "%", label: "Marketing", description: "Events, DJs, social media presence crucial for bar trade." },
  },
  QSR: {
    FOOD_COST_PCT: { low: 25, avg: 28, high: 32, unit: "%", label: "Food Cost", description: "Standardized menu enables tight cost control." },
    BEV_COST_PCT: { low: 15, avg: 18, high: 22, unit: "%", label: "Beverage Cost", description: "Soft drinks and coffee — high margin, low complexity." },
    LABOUR_PCT: { low: 22, avg: 26, high: 30, unit: "%", label: "Labour Cost", description: "Streamlined operations and junior staff keep labour lean." },
    PRIME_COST_PCT: { low: 50, avg: 55, high: 60, unit: "%", label: "Prime Cost", description: "Best prime cost in hospitality due to volume and efficiency." },
    RENT_PCT: { low: 8, avg: 10, high: 13, unit: "%", label: "Rent/Occupancy", description: "High-traffic locations essential for QSR model." },
    OVERHEAD_PCT: { low: 16, avg: 20, high: 24, unit: "%", label: "Total Overheads", description: "Packaging is a major line item. Equipment maintenance scheduled." },
    NET_PROFIT_PCT: { low: 10, avg: 15, high: 20, unit: "%", label: "Net Profit", description: "Volume-driven model yields strong margins when executed well." },
    UTILITIES_PCT: { low: 3, avg: 4, high: 5.5, unit: "%", label: "Utilities", description: "Drive-through adds HVAC and lighting costs." },
    OPS_SUPPLIES_PCT: { low: 3, avg: 4.5, high: 6, unit: "%", label: "Op. Supplies", description: "Packaging, bags, napkins — high volume = high cost." },
    MARKETING_PCT: { low: 3, avg: 5, high: 8, unit: "%", label: "Marketing", description: "Delivery platform commissions often 30%+ of delivery revenue." },
  },
  CATERING: {
    FOOD_COST_PCT: { low: 28, avg: 32, high: 36, unit: "%", label: "Food Cost", description: "Variable by event type. Canapé events higher cost than plated." },
    BEV_COST_PCT: { low: 18, avg: 22, high: 26, unit: "%", label: "Beverage Cost", description: "Package deals can improve margin. BYO events reduce this." },
    LABOUR_PCT: { low: 28, avg: 33, high: 38, unit: "%", label: "Labour Cost", description: "Casual staff for events. Travel time and setup labour significant." },
    PRIME_COST_PCT: { low: 56, avg: 62, high: 68, unit: "%", label: "Prime Cost", description: "Event-based revenue spikes help offset high variable costs." },
    RENT_PCT: { low: 3, avg: 5, high: 8, unit: "%", label: "Rent/Occupancy", description: "Kitchen-only space. Much lower than front-of-house venues." },
    OVERHEAD_PCT: { low: 15, avg: 20, high: 25, unit: "%", label: "Total Overheads", description: "Vehicle, transport, equipment hire are unique to catering." },
    NET_PROFIT_PCT: { low: 8, avg: 12, high: 18, unit: "%", label: "Net Profit", description: "Scalable model — margins improve with volume." },
    UTILITIES_PCT: { low: 2, avg: 3, high: 4.5, unit: "%", label: "Utilities", description: "Lower than venue-based operations." },
    OPS_SUPPLIES_PCT: { low: 2, avg: 3, high: 4, unit: "%", label: "Op. Supplies", description: "Disposables, transport containers, ice." },
    MARKETING_PCT: { low: 2, avg: 4, high: 6, unit: "%", label: "Marketing", description: "Referral-heavy. Photography and website key investments." },
  },
};

const MoneyBenchmarks = () => {
  const { currentOrg, venues } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [venueType, setVenueType] = useState("CASUAL_DINING");
  const [editMetric, setEditMetric] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const postcode = venues?.[0]?.postcode;
  const city = postcode?.startsWith("4") ? "Queensland" : postcode?.startsWith("2") ? "NSW" : postcode?.startsWith("3") ? "Victoria" : "Australia";

  const { data: dbBenchmarks = [] } = useQuery({
    queryKey: ["overhead_benchmarks", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("overhead_benchmarks").select("*").eq("org_id", orgId!);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const benchmarks = AU_BENCHMARKS[venueType] || AU_BENCHMARKS.CASUAL_DINING;

  const updateTargetMut = useMutation({
    mutationFn: async ({ metric, target }: { metric: string; target: number }) => {
      const existing = dbBenchmarks.find((b: any) => b.metric === metric);
      if (existing) {
        const { error } = await supabase.from("overhead_benchmarks").update({ target_value: target }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const bm = benchmarks[metric];
        const { error } = await supabase.from("overhead_benchmarks").insert({
          org_id: orgId!, metric, venue_type: venueType, target_value: target,
          benchmark_low: bm.low, benchmark_avg: bm.avg, benchmark_high: bm.high, is_default: false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["overhead_benchmarks"] });
      toast.success("Target updated");
      setEditMetric(null);
    },
  });

  const targetMap = new Map(dbBenchmarks.map((b: any) => [b.metric, Number(b.target_value)]));
  const isLowerBetter = (metric: string) => metric !== "NET_PROFIT_PCT";

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Industry Benchmarks
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Australian hospitality benchmarks — {city}
          </p>
        </div>
        <Select value={venueType} onValueChange={setVenueType}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {VENUE_TYPES.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Benchmarks sourced from Crunch Hospo "Big 5", Restaurant & Catering Australia, ATO industry benchmarks, and
            hospitality operator surveys. Figures represent Australian averages — actual performance varies by location,
            service style, and trade mix. {postcode && postcode !== "0000" && `Your venue postcode (${postcode}) is factored into regional context.`}
          </span>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(benchmarks).map(([key, bm]) => {
          const target = targetMap.get(key) ?? bm.avg;
          const lowerBetter = isLowerBetter(key);
          const rangeWidth = bm.high - bm.low;
          const targetPos = Math.max(0, Math.min(100, ((target - bm.low) / rangeWidth) * 100));

          return (
            <Card key={key}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{bm.label}</p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-[10px] text-muted-foreground cursor-help underline decoration-dotted">{key.replace(/_/g, " ")}</p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs">{bm.description}</TooltipContent>
                    </Tooltip>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{VENUE_TYPES.find(v => v.value === venueType)?.label}</Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Low: {bm.low}{bm.unit}</span>
                    <span>Avg: {bm.avg}{bm.unit}</span>
                    <span>High: {bm.high}{bm.unit}</span>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                    <div className={cn(
                      "absolute inset-0 rounded-full",
                      lowerBetter
                        ? "bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500"
                        : "bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500"
                    )} />
                    <div
                      className="absolute top-0 h-full w-0.5 bg-foreground"
                      style={{ left: `${targetPos}%` }}
                    >
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-foreground whitespace-nowrap">
                        {target}{bm.unit}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Your target: <span className="font-mono font-bold text-foreground">{target}{bm.unit}</span>
                  </div>
                  {editMetric === key ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" className="h-7 w-20 text-xs"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={() => updateTargetMut.mutate({ metric: key, target: parseFloat(editValue) })}>
                        Save
                      </Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setEditMetric(key); setEditValue(String(target)); }}>
                      <Pencil className="w-3 h-3" /> Set Target
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Key Benchmarks — {VENUE_TYPES.find(v => v.value === venueType)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {["NET_PROFIT_PCT", "PRIME_COST_PCT", "LABOUR_PCT", "FOOD_COST_PCT"].map(key => {
              const bm = benchmarks[key];
              return (
                <div key={key} className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">{bm.label}</p>
                  <p className="text-2xl font-bold font-mono text-foreground">{bm.avg}{bm.unit}</p>
                  <p className="text-[9px] text-muted-foreground">{bm.low}–{bm.high}{bm.unit} range</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MoneyBenchmarks;
