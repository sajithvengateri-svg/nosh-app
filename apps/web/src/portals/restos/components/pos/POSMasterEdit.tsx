import { useState, useCallback } from "react";
import { ArrowLeft, GripVertical, Eye, EyeOff, Save, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DEFAULT_STATION_COLORS } from "../../pages/POSOrderScreen";
import type { POSStation } from "@/lib/shared/types/pos.types";
import { useMenuItemMutations, useCategoryMutations } from "../../hooks/usePOSData";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  menuItems: any[];
  categories: any[];
  onClose: () => void;
}

const COLOUR_PRESETS = [
  { name: "Red",    class: "bg-red-500" },
  { name: "Sky",    class: "bg-sky-500" },
  { name: "Violet", class: "bg-violet-500" },
  { name: "Amber",  class: "bg-amber-500" },
  { name: "Orange", class: "bg-orange-500" },
  { name: "Emerald",class: "bg-emerald-500" },
  { name: "Pink",   class: "bg-pink-500" },
  { name: "Teal",   class: "bg-teal-500" },
];

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-1">
        <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 touch-none">
          <GripVertical className="h-4 w-4 text-slate-600" />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function POSMasterEdit({ menuItems, categories, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"items" | "stations" | "categories">("stations");
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const [stationLabels, setStationLabels] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(DEFAULT_STATION_COLORS).map(([k, v]) => [k, v.label]))
  );

  // Sortable state
  const [itemOrder, setItemOrder] = useState(() => menuItems.map((i: any) => i.id));
  const [catOrder, setCatOrder] = useState(() => categories.map((c: any) => c.id));
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});

  const { update: updateItem } = useMenuItemMutations();
  const { update: updateCategory } = useCategoryMutations();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleHidden = (id: string) => {
    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleItemDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItemOrder((prev) => {
        const oldIdx = prev.indexOf(String(active.id));
        const newIdx = prev.indexOf(String(over.id));
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, []);

  const handleCatDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCatOrder((prev) => {
        const oldIdx = prev.indexOf(String(active.id));
        const newIdx = prev.indexOf(String(over.id));
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, []);

  const handleSave = async () => {
    try {
      // Persist item sort orders
      const itemPromises = itemOrder.map((id, idx) =>
        updateItem.mutateAsync({ id, sort_order: idx })
      );
      // Persist category sort orders
      const catPromises = catOrder.map((id, idx) =>
        updateCategory.mutateAsync({ id, sort_order: idx })
      );
      // Persist price changes
      const pricePromises = Object.entries(editingPrices).map(([id, price]) =>
        updateItem.mutateAsync({ id, price: Number(price) })
      );

      await Promise.all([...itemPromises, ...catPromises, ...pricePromises]);
      toast.success("Layout saved");
      onClose();
    } catch {
      toast.error("Some changes failed to save");
    }
  };

  const orderedItems = itemOrder
    .map((id) => menuItems.find((i: any) => i.id === id))
    .filter(Boolean);

  const orderedCats = catOrder
    .map((id) => categories.find((c: any) => c.id === id))
    .filter(Boolean);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-4 md:-m-6 bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold text-white">Master Edit — POS Layout</h1>
        <div className="flex-1" />
        <Button onClick={handleSave} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white gap-1.5">
          <Save className="h-3.5 w-3.5" />
          Save Layout
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-white/10">
        {(["stations", "items", "categories"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
              activeTab === tab ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === "stations" && (
          <div className="space-y-3 max-w-xl">
            <p className="text-xs text-slate-500 mb-4">
              Customise station colours, labels, and visibility. Changes apply across POS, KDS, and tickets.
            </p>
            {(Object.entries(DEFAULT_STATION_COLORS) as [POSStation, typeof DEFAULT_STATION_COLORS.HOT][]).map(
              ([station, config]) => (
                <div key={station} className={cn("flex items-center gap-3 p-3 rounded-xl border", config.bg, config.border)}>
                  <GripVertical className="h-4 w-4 text-slate-600 cursor-grab" />
                  <span className={cn("h-4 w-4 rounded-full", config.text.replace("text-", "bg-"))} />
                  <Input
                    value={stationLabels[station] || ""}
                    onChange={(e) => setStationLabels((prev) => ({ ...prev, [station]: e.target.value }))}
                    className="h-8 w-40 bg-white/5 border-white/10 text-white text-sm"
                  />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{station}</span>
                  <div className="flex gap-1 ml-auto">
                    {COLOUR_PRESETS.slice(0, 4).map((preset) => (
                      <button key={preset.name} className={cn("h-5 w-5 rounded-full border border-white/20", preset.class)} title={preset.name} />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === "items" && (
          <div className="space-y-1 max-w-2xl">
            <p className="text-xs text-slate-500 mb-4">
              Drag to reorder, edit prices inline, and toggle visibility. Changes persist on save.
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={itemOrder} strategy={verticalListSortingStrategy}>
                {orderedItems.map((item: any) => {
                  const sc = DEFAULT_STATION_COLORS[item.station as POSStation] ?? DEFAULT_STATION_COLORS.HOT;
                  const hidden = hiddenItems.has(item.id);
                  return (
                    <SortableItem key={item.id} id={item.id}>
                      <div className={cn("flex items-center gap-3 px-3 py-2 rounded-lg transition-colors", hidden ? "opacity-40" : "", "hover:bg-white/5")}>
                        <span className={cn("h-2 w-2 rounded-full", sc.text.replace("text-", "bg-"))} />
                        <span className="text-sm text-white flex-1">{item.name}</span>
                        <span className="text-[10px] text-slate-500">{item.station}</span>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-slate-500" />
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPrices[item.id] ?? Number(item.price).toFixed(2)}
                            onChange={(e) => setEditingPrices((p) => ({ ...p, [item.id]: e.target.value }))}
                            className="w-20 h-7 bg-white/5 border-white/10 text-white text-xs text-right"
                          />
                        </div>
                        <button onClick={() => toggleHidden(item.id)} className={cn("p-1 rounded", hidden ? "text-slate-600" : "text-emerald-400")}>
                          {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </SortableItem>
                  );
                })}
              </SortableContext>
            </DndContext>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="space-y-1 max-w-xl">
            <p className="text-xs text-slate-500 mb-4">
              Drag to reorder and toggle category tabs shown on the POS order screen.
            </p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCatDragEnd}>
              <SortableContext items={catOrder} strategy={verticalListSortingStrategy}>
                {orderedCats.map((cat: any) => (
                  <SortableItem key={cat.id} id={cat.id}>
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5">
                      {cat.icon && <span className="text-sm">{cat.icon}</span>}
                      <span className="text-sm text-white flex-1">{cat.name}</span>
                      <Switch defaultChecked className="data-[state=checked]:bg-rose-500" />
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
