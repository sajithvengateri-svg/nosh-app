import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home, Wine, Martini, BarChart3, ClipboardCheck, Package,
  Beer, Droplets, TrendingUp, Receipt, Shield, Users2,
  Coffee, GraduationCap, Store, Settings, Menu,
  RotateCcw, Check, GripVertical, Plus, X,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBevBottomNavPrefs, allBevNavItems } from "@/hooks/useBevBottomNavPrefs";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  Home, Wine, Martini, BarChart3, ClipboardCheck, Package,
  Beer, Droplets, TrendingUp, Receipt, Shield, Users2,
  Coffee, GraduationCap, Store, Settings, Menu,
};

interface SortableItemProps {
  item: typeof allBevNavItems[0];
  onRemove: (path: string) => void;
}

const SortableItem = ({ item, onRemove }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.path });
  const Icon = iconMap[item.icon] || Menu;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border bg-background transition-shadow",
        isDragging ? "shadow-lg border-primary z-50 opacity-90" : "border-border"
      )}
    >
      <button {...attributes} {...listeners} className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5" />
      </button>
      <Icon className="w-5 h-5 text-primary shrink-0" />
      <span className="text-sm font-medium flex-1">{item.label}</span>
      <button onClick={() => onRemove(item.path)} className="text-muted-foreground hover:text-destructive p-1 rounded">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const BevBottomNavSettings = () => {
  const { primaryPaths, updatePrimaryPaths, resetToDefaults, defaultPrimaryPaths } = useBevBottomNavPrefs();
  const [selectedPaths, setSelectedPaths] = useState<string[]>(primaryPaths);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const selectedItems = selectedPaths
    .map(p => allBevNavItems.find(i => i.path === p))
    .filter(Boolean) as typeof allBevNavItems;

  const availableItems = allBevNavItems.filter(i => !selectedPaths.includes(i.path));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedPaths(prev => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const addItem = (path: string) => {
    if (selectedPaths.length >= 5) {
      toast.error("Remove an item first (max 5)");
      return;
    }
    setSelectedPaths(prev => [...prev, path]);
  };

  const removeItem = (path: string) => {
    if (selectedPaths.length <= 3) {
      toast.error("You need at least 3 items");
      return;
    }
    setSelectedPaths(prev => prev.filter(p => p !== path));
  };

  const handleSave = () => {
    updatePrimaryPaths(selectedPaths);
    toast.success("Bottom menu updated!");
  };

  const handleReset = () => {
    resetToDefaults();
    setSelectedPaths([...defaultPrimaryPaths]);
    toast.success("Reset to defaults");
  };

  const hasChanges = JSON.stringify(selectedPaths) !== JSON.stringify(primaryPaths);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Menu className="w-5 h-5" />
            Mobile Bottom Menu
          </CardTitle>
          <CardDescription>
            Drag to reorder, tap + to add, × to remove. Max 5 items.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={selectedPaths.length <= 5 ? "default" : "destructive"}>
              {selectedPaths.length} / 5 selected
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>
              {hasChanges && (
                <Button size="sm" onClick={handleSave}>
                  <Check className="w-4 h-4 mr-1" /> Save
                </Button>
              )}
            </div>
          </div>

          {/* Sortable active items */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active items</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedPaths} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {selectedItems.map(item => (
                    <SortableItem key={item.path} item={item} onRemove={removeItem} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Available items to add */}
          {availableItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {availableItems.map(item => {
                  const Icon = iconMap[item.icon] || Menu;
                  return (
                    <button
                      key={item.path}
                      onClick={() => addItem(item.path)}
                      className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 mb-0.5 opacity-50" />
                      <Icon className="w-4 h-4 mb-0.5" />
                      <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">Preview:</p>
            <div className="flex items-center justify-around bg-muted/50 rounded-xl p-3">
              {selectedItems.slice(0, 5).map(item => {
                const Icon = iconMap[item.icon] || Menu;
                return (
                  <div key={item.path} className="flex flex-col items-center gap-1">
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default BevBottomNavSettings;
