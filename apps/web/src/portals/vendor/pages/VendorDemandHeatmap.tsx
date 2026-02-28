import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useMarketplaceDemand } from "@/hooks/useMarketplaceDemand";
import { useVendorAuth } from "@/hooks/useVendorAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Loader2,
  AlertCircle,
  Tag,
  Flame,
  ArrowLeft,
  Filter,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// ─── Brisbane postcode → suburb name + coords ────────────────────────────────

const POSTCODE_DATA: Record<string, { name: string; lat: number; lng: number }> = {
  "4000": { name: "Brisbane CBD", lat: -27.4698, lng: 153.0251 },
  "4005": { name: "New Farm", lat: -27.4500, lng: 153.0530 },
  "4006": { name: "Fortitude Valley", lat: -27.4590, lng: 153.0350 },
  "4007": { name: "Hamilton", lat: -27.4350, lng: 153.0590 },
  "4010": { name: "Albion", lat: -27.4290, lng: 153.0420 },
  "4011": { name: "Clayfield", lat: -27.4200, lng: 153.0360 },
  "4012": { name: "Nundah", lat: -27.4010, lng: 153.0320 },
  "4017": { name: "Sandgate", lat: -27.3520, lng: 153.0780 },
  "4030": { name: "Windsor", lat: -27.4560, lng: 153.0160 },
  "4031": { name: "Lutwyche", lat: -27.4370, lng: 153.0020 },
  "4032": { name: "Kedron", lat: -27.4190, lng: 153.0070 },
  "4034": { name: "Aspley", lat: -27.3940, lng: 153.0130 },
  "4051": { name: "Alderley", lat: -27.4270, lng: 152.9730 },
  "4053": { name: "Everton Park", lat: -27.4070, lng: 152.9800 },
  "4059": { name: "Kelvin Grove", lat: -27.4550, lng: 152.9970 },
  "4060": { name: "Ashgrove", lat: -27.4470, lng: 152.9620 },
  "4064": { name: "Milton", lat: -27.4720, lng: 152.9890 },
  "4066": { name: "Toowong", lat: -27.4770, lng: 152.9650 },
  "4067": { name: "St Lucia", lat: -27.4880, lng: 152.9790 },
  "4068": { name: "Indooroopilly", lat: -27.4950, lng: 152.9580 },
  "4072": { name: "Taringa", lat: -27.4900, lng: 152.9470 },
  "4101": { name: "South Brisbane", lat: -27.4820, lng: 153.0200 },
  "4102": { name: "Woolloongabba", lat: -27.4930, lng: 153.0430 },
  "4103": { name: "Annerley", lat: -27.5090, lng: 153.0360 },
  "4104": { name: "Fairfield", lat: -27.4970, lng: 153.0170 },
  "4105": { name: "Moorooka", lat: -27.5120, lng: 153.0090 },
  "4109": { name: "Sunnybank", lat: -27.5630, lng: 153.0580 },
  "4120": { name: "Stones Corner", lat: -27.5020, lng: 153.0510 },
  "4121": { name: "Holland Park", lat: -27.4970, lng: 153.0530 },
  "4151": { name: "Coorparoo", lat: -27.4820, lng: 153.0490 },
  "4152": { name: "Camp Hill", lat: -27.4980, lng: 153.0770 },
  "4169": { name: "Kangaroo Point", lat: -27.4880, lng: 153.0330 },
  "4170": { name: "Morningside", lat: -27.4650, lng: 153.0780 },
  "4171": { name: "Balmoral", lat: -27.4730, lng: 153.0640 },
};

// ─── Category config ─────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: "all", label: "All", color: "#a1a1aa" },
  { key: "Meat", label: "Meat", color: "#ef4444" },
  { key: "Seafood", label: "Seafood", color: "#3b82f6" },
  { key: "Produce", label: "Produce", color: "#22c55e" },
  { key: "Dairy", label: "Dairy", color: "#eab308" },
  { key: "Bakery", label: "Bakery", color: "#ec4899" },
  { key: "Pantry", label: "Pantry", color: "#f97316" },
  { key: "Dry Goods", label: "Dry Goods", color: "#d97706" },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Meat: "#ef4444",
  Seafood: "#3b82f6",
  Produce: "#22c55e",
  Dairy: "#eab308",
  Bakery: "#ec4899",
  Pantry: "#f97316",
  "Dry Goods": "#d97706",
  Beverages: "#06b6d4",
};

const CATEGORY_BG: Record<string, { bg: string; text: string; border: string }> = {
  Seafood:     { bg: "bg-blue-500/15",   text: "text-blue-300",   border: "border-blue-500/30" },
  Produce:     { bg: "bg-green-500/15",  text: "text-green-300",  border: "border-green-500/30" },
  Dairy:       { bg: "bg-yellow-500/15", text: "text-yellow-300", border: "border-yellow-500/30" },
  Meat:        { bg: "bg-red-500/15",    text: "text-red-300",    border: "border-red-500/30" },
  "Dry Goods": { bg: "bg-amber-500/15",  text: "text-amber-300",  border: "border-amber-500/30" },
  Pantry:      { bg: "bg-orange-500/15", text: "text-orange-300", border: "border-orange-500/30" },
  Bakery:      { bg: "bg-pink-500/15",   text: "text-pink-300",   border: "border-pink-500/30" },
  Beverages:   { bg: "bg-cyan-500/15",   text: "text-cyan-300",   border: "border-cyan-500/30" },
};

const defaultBg = { bg: "bg-zinc-500/15", text: "text-zinc-300", border: "border-zinc-500/30" };

// ─── Herbs / garnish filter — exclude from core view ─────────────────────────

const HERB_FILTER = new Set([
  "basil", "parsley", "cilantro", "coriander", "mint", "dill", "thyme",
  "rosemary", "oregano", "chives", "tarragon", "sage", "bay leaves",
  "lemongrass", "garnish", "microgreens",
]);

function isHerb(name: string) {
  return HERB_FILTER.has(name.toLowerCase().trim());
}

// ─── FitBounds helper ────────────────────────────────────────────────────────

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useMemo(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [points, map]);
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────────

const VendorDemandHeatmap = () => {
  const navigate = useNavigate();
  const { vendorProfile } = useVendorAuth();
  const { data: insights, isLoading, error } = useMarketplaceDemand();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSuburb, setSelectedSuburb] = useState<string | null>(null);
  const [pushDealItem, setPushDealItem] = useState<any | null>(null);

  // Scope to vendor's delivery areas
  const vendorPostcodes = (vendorProfile as any)?.delivery_areas as string[] | null;

  // Filter + aggregate demand per postcode
  const { suburbData, allFiltered } = useMemo(() => {
    let items = insights || [];

    // Scope to vendor postcodes
    if (vendorPostcodes?.length) {
      items = items.filter((i) => vendorPostcodes.includes(i.postcode));
    }

    // Category filter
    if (categoryFilter !== "all") {
      items = items.filter((i) => i.ingredient_category === categoryFilter);
    }

    // Remove herbs
    items = items.filter((i) => !isHerb(i.ingredient_name || ""));

    // Group by postcode for map bubbles
    const map: Record<string, { items: typeof items; totalQty: number; topIngredient: string }> = {};
    for (const item of items) {
      const pc = item.postcode;
      if (!pc || !POSTCODE_DATA[pc]) continue;
      if (!map[pc]) map[pc] = { items: [], totalQty: 0, topIngredient: "" };
      map[pc].items.push(item);
      map[pc].totalQty += item.total_quantity;
    }
    // Set top ingredient per suburb
    for (const pc of Object.keys(map)) {
      map[pc].items.sort((a, b) => b.total_quantity - a.total_quantity);
      map[pc].topIngredient = map[pc].items[0]?.ingredient_name || "";
    }

    return { suburbData: map, allFiltered: items };
  }, [insights, vendorPostcodes, categoryFilter]);

  const maxSuburbQty = useMemo(
    () => Math.max(...Object.values(suburbData).map((s) => s.totalQty), 1),
    [suburbData]
  );

  const mapPoints = useMemo(
    () =>
      Object.keys(suburbData)
        .filter((pc) => POSTCODE_DATA[pc])
        .map((pc) => [POSTCODE_DATA[pc].lat, POSTCODE_DATA[pc].lng] as [number, number]),
    [suburbData]
  );

  // ─── Suburb detail view data ────────────────────────────────────────
  const suburbItems = useMemo(() => {
    if (!selectedSuburb || !suburbData[selectedSuburb]) return [];
    return suburbData[selectedSuburb].items;
  }, [selectedSuburb, suburbData]);

  const maxItemQty = useMemo(
    () => Math.max(...suburbItems.map((i) => i.total_quantity), 1),
    [suburbItems]
  );

  const maxItemPrice = useMemo(
    () => Math.max(...suburbItems.map((i) => Number(i.avg_price_paid) || 0), 1),
    [suburbItems]
  );

  // ─── Loading / Error ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Header />
        <div className="flex items-center gap-3 text-muted-foreground p-6 border rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm">
            {(error as any)?.code === "42501"
              ? "Demand data is delayed by 7 days for privacy. Check back soon."
              : "Unable to load demand data"}
          </p>
        </div>
      </div>
    );
  }

  // ─── SUBURB DETAIL VIEW (full page) ───────────────────────────────

  if (selectedSuburb) {
    const suburb = POSTCODE_DATA[selectedSuburb];
    const suburbTotal = suburbData[selectedSuburb]?.totalQty || 0;

    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedSuburb(null)}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Map
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              {suburb?.name || selectedSuburb}
            </h2>
            <p className="text-xs text-muted-foreground">
              {suburbItems.length} ingredients · {suburbTotal.toLocaleString()} total demand
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {selectedSuburb}
          </Badge>
        </div>

        {/* Category filter for suburb view */}
        <div className="flex gap-1.5 px-4 py-2 overflow-x-auto border-b">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                categoryFilter === cat.key
                  ? "text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
              style={
                categoryFilter === cat.key
                  ? { backgroundColor: cat.color }
                  : undefined
              }
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Ingredient pills — sorted by demand (top=highest, bottom=lowest) */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {suburbItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">No demand data for this filter</p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {suburbItems.map((item, i) => {
                  const colors = CATEGORY_BG[item.ingredient_category] || defaultBg;
                  const demandPct = item.total_quantity / maxItemQty;
                  const price = Number(item.avg_price_paid) || 0;
                  const pricePct = price / maxItemPrice;

                  // Pill width: base 40% + up to 55% based on price (bigger pill = higher price)
                  const pillWidth = 40 + pricePct * 55;
                  // Opacity: brighter = more demand
                  const opacity = 0.5 + demandPct * 0.5;

                  return (
                    <motion.button
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setPushDealItem(item)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer",
                        colors.bg,
                        colors.border
                      )}
                      style={{
                        width: `${Math.min(pillWidth, 100)}%`,
                        opacity,
                        paddingTop: demandPct > 0.5 ? "14px" : "10px",
                        paddingBottom: demandPct > 0.5 ? "14px" : "10px",
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[item.ingredient_category] || "#71717a",
                          }}
                        />
                        <span
                          className={cn(
                            "truncate",
                            colors.text,
                            demandPct > 0.6
                              ? "text-base font-bold"
                              : demandPct > 0.3
                              ? "text-sm font-semibold"
                              : "text-sm font-medium"
                          )}
                        >
                          {item.ingredient_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <Badge
                          variant="secondary"
                          className="text-[11px] rounded-full font-mono"
                        >
                          {item.total_quantity.toLocaleString()} {item.unit}
                        </Badge>
                        {price > 0 && (
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ${price.toFixed(0)}/{item.unit}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Privacy footer */}
        <div className="px-4 py-2 border-t">
          <p className="text-[10px] text-muted-foreground text-center">
            Aggregated demand only — no chef names or recipes shared · 7-day delay
          </p>
        </div>

        {/* Push Deal dialog */}
        <PushDealDialog
          item={pushDealItem}
          onClose={() => setPushDealItem(null)}
          navigate={navigate}
        />
      </div>
    );
  }

  // ─── MAP VIEW (default) ───────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header + filter */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        <Header />

        {/* Category filter bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                categoryFilter === cat.key
                  ? "text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-secondary"
              )}
              style={
                categoryFilter === cat.key
                  ? { backgroundColor: cat.color }
                  : undefined
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {Object.keys(suburbData).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No demand data in your area yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Data appears as chefs add recipes nearby
              </p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[-27.4698, 153.0251]}
            zoom={12}
            className="w-full h-full"
            style={{ background: "#1a1a2e" }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {mapPoints.length > 0 && <FitBounds points={mapPoints} />}

            {Object.entries(suburbData).map(([pc, data]) => {
              const suburb = POSTCODE_DATA[pc];
              if (!suburb) return null;

              const sizePct = data.totalQty / maxSuburbQty;
              // Bubble radius: 12–45px based on demand
              const radius = 12 + sizePct * 33;
              // Get dominant category color
              const topCategory = data.items[0]?.ingredient_category || "";
              const bubbleColor = CATEGORY_COLORS[topCategory] || "#a1a1aa";

              return (
                <CircleMarker
                  key={pc}
                  center={[suburb.lat, suburb.lng]}
                  radius={radius}
                  pathOptions={{
                    fillColor: bubbleColor,
                    fillOpacity: 0.35 + sizePct * 0.4,
                    color: bubbleColor,
                    weight: 2,
                    opacity: 0.7,
                  }}
                  eventHandlers={{
                    click: () => setSelectedSuburb(pc),
                  }}
                >
                  <Popup>
                    <div className="text-center min-w-[120px]">
                      <p className="font-bold text-sm">{suburb.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {data.totalQty.toLocaleString()} total demand
                      </p>
                      <p className="text-xs mt-1">
                        Top: <strong>{data.topIngredient}</strong>
                      </p>
                      <button
                        onClick={() => setSelectedSuburb(pc)}
                        className="mt-2 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium"
                      >
                        View All →
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Bottom summary bar */}
      <div className="px-4 py-2 border-t bg-background/95 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">
              {Object.keys(suburbData).length}
            </strong>{" "}
            suburbs
          </span>
          <span>
            <strong className="text-foreground">
              {allFiltered.length}
            </strong>{" "}
            ingredients
          </span>
          <span>
            <strong className="text-foreground">
              {allFiltered
                .reduce((s, i) => s + i.total_quantity, 0)
                .toLocaleString()}
            </strong>{" "}
            total qty
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Tap a suburb to see demand · 7-day delay
        </p>
      </div>
    </div>
  );
};

// ─── Push Deal Dialog ────────────────────────────────────────────────────────

function PushDealDialog({
  item,
  onClose,
  navigate,
}: {
  item: any | null;
  onClose: () => void;
  navigate: (path: string) => void;
}) {
  if (!item) return null;

  const price = Number(item.avg_price_paid) || 0;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {item.ingredient_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Quantity</p>
              <p className="font-bold text-lg">
                {item.total_quantity.toLocaleString()} {item.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orders</p>
              <p className="font-bold text-lg">{item.order_count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Area</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {POSTCODE_DATA[item.postcode]?.name || item.postcode}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Price</p>
              <p className="font-medium">
                {price > 0 ? `$${price.toFixed(2)}/${item.unit}` : "—"}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Week ending {new Date(item.week_ending).toLocaleDateString()}
          </div>
          <Button
            className="w-full"
            onClick={() => {
              onClose();
              navigate(
                `/vendor/beta-deals?ingredient=${encodeURIComponent(
                  item.ingredient_name
                )}&postcode=${item.postcode}`
              );
            }}
          >
            <Tag className="w-4 h-4 mr-2" />
            Push Deal on {item.ingredient_name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Flame className="w-6 h-6 text-orange-500" />
        Ingredient Demand
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        See what chefs near you need — tap a suburb, then push a deal
      </p>
    </div>
  );
}

export default VendorDemandHeatmap;
