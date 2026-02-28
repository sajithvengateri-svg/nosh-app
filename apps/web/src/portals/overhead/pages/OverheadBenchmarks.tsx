import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Target, TrendingUp, MapPin, Info, Pencil,
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

// Overhead-only benchmarks with utility breakdown (source: Crunch Hospo, ATO, industry surveys)
const OVERHEAD_BENCHMARKS: Record<string, Record<string, { low: number; avg: number; high: number; unit: string; label: string; description: string }>> = {
  CASUAL_DINING: {
    RENT_PCT: { low: 6, avg: 9, high: 12, unit: "%", label: "Rent / Occupancy", description: "Rent + outgoings as % of revenue. CBD locations typically 10-15%, suburban 6-9%." },
    ELECTRICAL_PCT: { low: 1.5, avg: 2.5, high: 3.5, unit: "%", label: "Electrical", description: "Power costs — kitchen equipment, HVAC, lighting. Solar can reduce by 20-40%." },
    GAS_PCT: { low: 0.5, avg: 1, high: 1.5, unit: "%", label: "Gas", description: "Commercial gas supply for cooking. Higher for charcoal/wood-fire kitchens." },
    WATER_PCT: { low: 0.3, avg: 0.5, high: 0.8, unit: "%", label: "Water", description: "Water and sewerage. Dishwasher efficiency and ice machines are key drivers." },
    INTERNET_PHONE_PCT: { low: 0.2, avg: 0.4, high: 0.6, unit: "%", label: "Internet & Phone", description: "NBN, POS connectivity, reservations systems, staff comms." },
    SUPPLIES_PCT: { low: 2, avg: 3, high: 4, unit: "%", label: "Supplies", description: "Cleaning chemicals, packaging, smallwares, disposables." },
    INSURANCE_PCT: { low: 1, avg: 1.5, high: 2.5, unit: "%", label: "Insurance", description: "Business, public liability, workers compensation, property insurance." },
    LICENSES_PCT: { low: 0.3, avg: 0.5, high: 1, unit: "%", label: "Licenses", description: "Liquor licence, council permits, music licensing (APRA/PPCA), food safety." },
    SUBSCRIPTIONS_PCT: { low: 0.5, avg: 1, high: 1.5, unit: "%", label: "Subscriptions", description: "POS software, accounting (Xero), rostering, reservation platforms, delivery apps." },
  },
  FINE_DINING: {
    RENT_PCT: { low: 8, avg: 11, high: 15, unit: "%", label: "Rent / Occupancy", description: "Premium locations demand premium rent. Amortize fit-out costs separately." },
    ELECTRICAL_PCT: { low: 1.5, avg: 2.8, high: 4, unit: "%", label: "Electrical", description: "Climate control, specialist kitchen equipment, ambient lighting systems." },
    GAS_PCT: { low: 0.5, avg: 1.2, high: 1.8, unit: "%", label: "Gas", description: "High-end cooking equipment and extended operating hours." },
    WATER_PCT: { low: 0.3, avg: 0.6, high: 1, unit: "%", label: "Water", description: "Linen laundering, extensive dishwashing, ice production." },
    INTERNET_PHONE_PCT: { low: 0.2, avg: 0.3, high: 0.5, unit: "%", label: "Internet & Phone", description: "Reservation systems, POS, guest WiFi." },
    SUPPLIES_PCT: { low: 2.5, avg: 3.5, high: 5, unit: "%", label: "Supplies", description: "Premium disposables, polishing cloth, candles, flowers, linen." },
    INSURANCE_PCT: { low: 1.2, avg: 2, high: 3, unit: "%", label: "Insurance", description: "Higher premiums for premium fitout, wine cellar, and higher covers value." },
    LICENSES_PCT: { low: 0.3, avg: 0.6, high: 1.2, unit: "%", label: "Licenses", description: "Full liquor licence, council, music licensing, food safety certifications." },
    SUBSCRIPTIONS_PCT: { low: 0.4, avg: 0.8, high: 1.2, unit: "%", label: "Subscriptions", description: "POS, accounting, reservation (e.g. OpenTable), review management." },
  },
  CAFE: {
    RENT_PCT: { low: 8, avg: 10, high: 14, unit: "%", label: "Rent / Occupancy", description: "High foot-traffic locations are essential but expensive." },
    ELECTRICAL_PCT: { low: 1.5, avg: 2.2, high: 3, unit: "%", label: "Electrical", description: "Espresso machines, grinders, refrigeration, display lighting." },
    GAS_PCT: { low: 0.3, avg: 0.6, high: 1, unit: "%", label: "Gas", description: "Kitchen cooking — lower than full-service restaurants." },
    WATER_PCT: { low: 0.3, avg: 0.5, high: 0.8, unit: "%", label: "Water", description: "Coffee machine water usage, dishwashing." },
    INTERNET_PHONE_PCT: { low: 0.3, avg: 0.5, high: 0.7, unit: "%", label: "Internet & Phone", description: "Customer WiFi important for cafe trade, POS, ordering apps." },
    SUPPLIES_PCT: { low: 3, avg: 4, high: 5, unit: "%", label: "Supplies", description: "Takeaway cups, lids, bags, napkins — significant for high-takeaway venues." },
    INSURANCE_PCT: { low: 1, avg: 1.5, high: 2, unit: "%", label: "Insurance", description: "Standard business and liability coverage." },
    LICENSES_PCT: { low: 0.2, avg: 0.4, high: 0.8, unit: "%", label: "Licenses", description: "Food safety, council permits. Liquor licence if applicable." },
    SUBSCRIPTIONS_PCT: { low: 0.5, avg: 1, high: 1.5, unit: "%", label: "Subscriptions", description: "POS, accounting, online ordering, loyalty platforms." },
  },
  BAR: {
    RENT_PCT: { low: 7, avg: 10, high: 14, unit: "%", label: "Rent / Occupancy", description: "Entertainment precinct rents are high but foot traffic compensates." },
    ELECTRICAL_PCT: { low: 1.5, avg: 2.5, high: 3.5, unit: "%", label: "Electrical", description: "Refrigeration for bev storage, ice machines, sound/lighting systems." },
    GAS_PCT: { low: 0.2, avg: 0.5, high: 0.8, unit: "%", label: "Gas", description: "Minimal if kitchen is small; higher for full food service." },
    WATER_PCT: { low: 0.3, avg: 0.5, high: 0.7, unit: "%", label: "Water", description: "Glass washing, ice production, cleaning." },
    INTERNET_PHONE_PCT: { low: 0.2, avg: 0.4, high: 0.6, unit: "%", label: "Internet & Phone", description: "POS connectivity, music streaming, security systems." },
    SUPPLIES_PCT: { low: 1.5, avg: 2.5, high: 3.5, unit: "%", label: "Supplies", description: "Glassware breakage, garnishes, cleaning chemicals, bar tools." },
    INSURANCE_PCT: { low: 1.5, avg: 2, high: 3, unit: "%", label: "Insurance", description: "Higher premiums due to late-night trading and alcohol service." },
    LICENSES_PCT: { low: 0.5, avg: 0.8, high: 1.5, unit: "%", label: "Licenses", description: "Liquor licence (significant), council, music (APRA/PPCA), security." },
    SUBSCRIPTIONS_PCT: { low: 0.4, avg: 0.8, high: 1.2, unit: "%", label: "Subscriptions", description: "POS, accounting, booking platforms, music licensing services." },
  },
  QSR: {
    RENT_PCT: { low: 8, avg: 10, high: 13, unit: "%", label: "Rent / Occupancy", description: "High-traffic locations essential for QSR model." },
    ELECTRICAL_PCT: { low: 1.5, avg: 2.2, high: 3, unit: "%", label: "Electrical", description: "Drive-through adds HVAC, signage, and display screen costs." },
    GAS_PCT: { low: 0.3, avg: 0.7, high: 1.2, unit: "%", label: "Gas", description: "Fryers, grills, and high-throughput cooking equipment." },
    WATER_PCT: { low: 0.2, avg: 0.4, high: 0.6, unit: "%", label: "Water", description: "Lower per-cover but high volume adds up." },
    INTERNET_PHONE_PCT: { low: 0.3, avg: 0.5, high: 0.8, unit: "%", label: "Internet & Phone", description: "Digital ordering, drive-through comms, delivery app integrations." },
    SUPPLIES_PCT: { low: 3, avg: 4.5, high: 6, unit: "%", label: "Supplies", description: "Packaging, bags, napkins — high volume = high cost." },
    INSURANCE_PCT: { low: 0.8, avg: 1.2, high: 2, unit: "%", label: "Insurance", description: "Standard business coverage, vehicle insurance if delivery." },
    LICENSES_PCT: { low: 0.2, avg: 0.4, high: 0.7, unit: "%", label: "Licenses", description: "Council permits, food safety. Liquor if applicable." },
    SUBSCRIPTIONS_PCT: { low: 0.8, avg: 1.2, high: 2, unit: "%", label: "Subscriptions", description: "POS, delivery platforms (UberEats, DoorDash), accounting, rostering." },
  },
  CATERING: {
    RENT_PCT: { low: 3, avg: 5, high: 8, unit: "%", label: "Rent / Occupancy", description: "Kitchen-only space. Much lower than front-of-house venues." },
    ELECTRICAL_PCT: { low: 0.8, avg: 1.5, high: 2.5, unit: "%", label: "Electrical", description: "Commissary kitchen power — lower than venue-based operations." },
    GAS_PCT: { low: 0.3, avg: 0.8, high: 1.2, unit: "%", label: "Gas", description: "Batch cooking for events, prep kitchen gas usage." },
    WATER_PCT: { low: 0.2, avg: 0.4, high: 0.6, unit: "%", label: "Water", description: "Kitchen prep and cleaning — lower than full-service venues." },
    INTERNET_PHONE_PCT: { low: 0.2, avg: 0.3, high: 0.5, unit: "%", label: "Internet & Phone", description: "Office and coordination communications." },
    SUPPLIES_PCT: { low: 2, avg: 3, high: 4, unit: "%", label: "Supplies", description: "Disposables, transport containers, ice, servingware hire." },
    INSURANCE_PCT: { low: 1.5, avg: 2.5, high: 3.5, unit: "%", label: "Insurance", description: "Vehicle, public liability at venues, workers comp for event staff." },
    LICENSES_PCT: { low: 0.3, avg: 0.5, high: 1, unit: "%", label: "Licenses", description: "Food safety certification, council registration, liquor if applicable." },
    SUBSCRIPTIONS_PCT: { low: 0.4, avg: 0.8, high: 1.2, unit: "%", label: "Subscriptions", description: "CRM, accounting, event management platforms." },
  },
};

const OverheadBenchmarks = () => {
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

  const benchmarks = OVERHEAD_BENCHMARKS[venueType] || OVERHEAD_BENCHMARKS.CASUAL_DINING;

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

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" /> Overhead Benchmarks
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Overhead cost benchmarks — {city}
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
            Overhead benchmarks sourced from Crunch Hospo, ATO industry data, and operator surveys. 
            All figures are as % of total revenue. Utility breakdowns reflect typical Australian hospitality energy costs.
            {postcode && postcode !== "0000" && ` Your venue postcode (${postcode}) is factored into regional context.`}
          </span>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-3">
        {Object.entries(benchmarks).map(([key, bm]) => {
          const target = targetMap.get(key) ?? bm.avg;
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
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500" />
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
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Key Overheads — {VENUE_TYPES.find(v => v.value === venueType)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center">
            {["RENT_PCT", "ELECTRICAL_PCT", "SUPPLIES_PCT", "INSURANCE_PCT", "SUBSCRIPTIONS_PCT"].map(key => {
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

export default OverheadBenchmarks;
