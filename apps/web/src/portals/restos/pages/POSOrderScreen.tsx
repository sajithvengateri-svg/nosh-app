import { useState, useMemo } from "react";
import { usePOSMenuItems, usePOSCategories, usePOSModifierGroups } from "../hooks/usePOSData";
import { usePOSStore } from "@/lib/shared/state/posStore";
import { useCurrencySymbol } from "@/hooks/useCurrencySymbol";
import POSMenuGrid from "../components/pos/POSMenuGrid";
import POSCart from "../components/pos/POSCart";
import POSSectionTabs from "../components/pos/POSSectionTabs";
import POSMasterEdit from "../components/pos/POSMasterEdit";
import POSModifierModal from "../components/pos/POSModifierModal";
import type { CartItem, POSStation, POSOrderType } from "@/lib/shared/types/pos.types";
import { ShoppingCart, Pencil, X, Utensils, Wine, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Station colour map — customisable via master edit
export const DEFAULT_STATION_COLORS: Record<POSStation, { bg: string; border: string; text: string; label: string }> = {
  HOT:    { bg: "bg-red-500/15",    border: "border-red-500/40",    text: "text-red-400",    label: "Hot Kitchen" },
  COLD:   { bg: "bg-sky-500/15",    border: "border-sky-500/40",    text: "text-sky-400",    label: "Cold Kitchen" },
  BAR:    { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-400", label: "Bar" },
  PASS:   { bg: "bg-amber-500/15",  border: "border-amber-500/40",  text: "text-amber-400",  label: "Pass" },
  COFFEE: { bg: "bg-orange-500/15", border: "border-orange-500/40", text: "text-orange-400", label: "Coffee" },
};

type POSMode = "FOOD" | "BEV" | "FUNCTION";

const MODE_CONFIG: Record<POSMode, { icon: React.ElementType; label: string; stations: POSStation[] }> = {
  FOOD:     { icon: Utensils,     label: "Food",     stations: ["HOT", "COLD", "PASS"] },
  BEV:      { icon: Wine,         label: "Beverage", stations: ["BAR", "COFFEE"] },
  FUNCTION: { icon: CalendarDays, label: "Function", stations: ["HOT", "COLD", "BAR", "COFFEE", "PASS"] },
};

export default function POSOrderScreen() {
  const sym = useCurrencySymbol();
  const { data: menuItems = [], isLoading: loadingItems } = usePOSMenuItems();
  const { data: categories = [] } = usePOSCategories();
  const { data: modifierGroups = [] } = usePOSModifierGroups();

  const [posMode, setPosMode] = useState<POSMode>("FOOD");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeStation, setActiveStation] = useState<POSStation | null>(null);
  const [masterEditOpen, setMasterEditOpen] = useState(false);
  const [modifierItem, setModifierItem] = useState<any>(null);
  const [cartOpen, setCartOpen] = useState(true);

  const cart = usePOSStore((s) => s.cart);
  const addToCart = usePOSStore((s) => s.addToCart);
  const orderType = usePOSStore((s) => s.orderType);
  const setOrderType = usePOSStore((s) => s.setOrderType);

  const modeStations = MODE_CONFIG[posMode].stations;

  // Filter items by mode (station), category, and active station
  const filteredItems = useMemo(() => {
    let items = menuItems.filter((i: any) => modeStations.includes(i.station));
    if (activeStation) items = items.filter((i: any) => i.station === activeStation);
    if (activeCategoryId) items = items.filter((i: any) => i.category_id === activeCategoryId);
    return items;
  }, [menuItems, modeStations, activeStation, activeCategoryId]);

  // Categories relevant to current mode
  const modeCategories = useMemo(() => {
    const stationItemCatIds = new Set(
      menuItems
        .filter((i: any) => modeStations.includes(i.station))
        .map((i: any) => i.category_id)
        .filter(Boolean)
    );
    return categories.filter((c: any) => stationItemCatIds.has(c.id));
  }, [menuItems, categories, modeStations]);

  const handleItemTap = (item: any) => {
    // Check if item has modifier groups
    // For now, add directly; modifier modal can be triggered
    const cartItem: CartItem = {
      tempId: crypto.randomUUID(),
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: Number(item.price),
      modifiers: [],
      notes: "",
      station: item.station,
      courseNumber: 1,
    };
    addToCart(cartItem);
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  if (masterEditOpen) {
    return (
      <POSMasterEdit
        menuItems={menuItems}
        categories={categories}
        onClose={() => setMasterEditOpen(false)}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden -m-4 md:-m-6">
      {/* Left: Menu area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar: Mode selector + Order type + Master Edit */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#0a0c10]/60 backdrop-blur-sm">
          {/* Mode pills */}
          <div className="flex gap-1">
            {(Object.keys(MODE_CONFIG) as POSMode[]).map((mode) => {
              const cfg = MODE_CONFIG[mode];
              const Icon = cfg.icon;
              return (
                <button
                  key={mode}
                  onClick={() => { setPosMode(mode); setActiveStation(null); setActiveCategoryId(null); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    posMode === mode
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          {/* Order type selector */}
          <div className="flex gap-1">
            {(["DINE_IN", "TAKEAWAY", "TAB"] as POSOrderType[]).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  orderType === t
                    ? "bg-white/10 text-white"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMasterEditOpen(true)}
            className="text-slate-400 hover:text-white gap-1.5 text-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit Layout
          </Button>
        </div>

        {/* Station colour tabs */}
        <POSSectionTabs
          stations={modeStations}
          activeStation={activeStation}
          onSelect={setActiveStation}
          colors={DEFAULT_STATION_COLORS}
        />

        {/* Category filter chips */}
        {modeCategories.length > 0 && (
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none border-b border-white/5">
            <button
              onClick={() => setActiveCategoryId(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                !activeCategoryId
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              All
            </button>
            {modeCategories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id === activeCategoryId ? null : cat.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                  activeCategoryId === cat.id
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Menu grid */}
        <div className="flex-1 overflow-auto p-3">
          <POSMenuGrid
            items={filteredItems}
            stationColors={DEFAULT_STATION_COLORS}
            onItemTap={handleItemTap}
            loading={loadingItems}
            sym={sym}
          />
        </div>
      </div>

      {/* Right: Cart panel (collapsible on mobile) */}
      <div
        className={cn(
          "border-l border-white/10 bg-[#0a0c10] flex flex-col transition-all",
          cartOpen ? "w-80 lg:w-96" : "w-12"
        )}
      >
        {cartOpen ? (
          <POSCart onCollapse={() => setCartOpen(false)} />
        ) : (
          <button
            onClick={() => setCartOpen(true)}
            className="flex flex-col items-center gap-2 pt-4 text-slate-400 hover:text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Modifier modal */}
      {modifierItem && (
        <POSModifierModal
          item={modifierItem}
          groups={modifierGroups}
          onConfirm={(cartItem) => { addToCart(cartItem); setModifierItem(null); }}
          onClose={() => setModifierItem(null)}
        />
      )}
    </div>
  );
}
