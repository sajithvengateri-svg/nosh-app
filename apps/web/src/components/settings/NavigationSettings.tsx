import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GripVertical, RotateCcw, LayoutGrid } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { useNavOrder } from "@/hooks/useNavOrder";
import BottomNavSettings from "./BottomNavSettings";
import {
  CHEF_MAIN_NAV,
  CHEF_SECONDARY_NAV,
  DEFAULT_MAIN_PATHS,
  DEFAULT_SECONDARY_PATHS,
  type ChefNavItem,
} from "@/lib/chefNavItems";

interface SortableItemProps {
  id: string;
  icon: ChefNavItem["icon"];
  label: string;
}

const SortableItem = ({ id, icon: Icon, label }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground" />
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </div>
  );
};

const NavigationSettings = () => {
  const { canView } = useAuth();
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  
  const {
    mainNavOrder,
    secondaryNavOrder,
    updateMainNavOrder,
    updateSecondaryNavOrder,
    resetToDefault
  } = useNavOrder(DEFAULT_MAIN_PATHS, DEFAULT_SECONDARY_PATHS);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const itemMap = useMemo(() => {
    const map = new Map<string, ChefNavItem>();
    [...CHEF_MAIN_NAV, ...CHEF_SECONDARY_NAV].forEach(item => map.set(item.path, item));
    return map;
  }, []);

  const sortedMainItems = useMemo(() => {
    const allPaths = CHEF_MAIN_NAV.map(i => i.path);
    const ordered = [
      ...mainNavOrder.filter(p => allPaths.includes(p)),
      ...allPaths.filter(p => !mainNavOrder.includes(p)),
    ];
    return ordered
      .map(p => itemMap.get(p))
      .filter((item): item is ChefNavItem => !!item && canView(item.module) && (!item.homeCookOnly || isHomeCook));
  }, [mainNavOrder, canView, itemMap, isHomeCook]);

  const sortedSecondaryItems = useMemo(() => {
    const allPaths = CHEF_SECONDARY_NAV.map(i => i.path);
    const ordered = [
      ...secondaryNavOrder.filter(p => allPaths.includes(p)),
      ...allPaths.filter(p => !secondaryNavOrder.includes(p)),
    ];
    return ordered
      .map(p => itemMap.get(p))
      .filter((item): item is ChefNavItem => !!item && canView(item.module) && (!item.homeCookOnly || isHomeCook));
  }, [secondaryNavOrder, canView, itemMap, isHomeCook]);

  const handleMainDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const paths = sortedMainItems.map(i => i.path);
      const oldIndex = paths.indexOf(active.id as string);
      const newIndex = paths.indexOf(over.id as string);
      updateMainNavOrder(arrayMove(paths, oldIndex, newIndex));
      toast.success("Navigation order updated");
    }
  };

  const handleSecondaryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const paths = sortedSecondaryItems.map(i => i.path);
      const oldIndex = paths.indexOf(active.id as string);
      const newIndex = paths.indexOf(over.id as string);
      updateSecondaryNavOrder(arrayMove(paths, oldIndex, newIndex));
      toast.success("Navigation order updated");
    }
  };

  const handleReset = () => {
    resetToDefault();
    toast.success("Navigation reset to default order");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Navigation Order
              </CardTitle>
              <CardDescription>Drag items to customize your sidebar order</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Nav Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Main Navigation</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMainDragEnd}>
              <SortableContext items={sortedMainItems.map(i => i.path)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sortedMainItems.map((item) => (
                    <SortableItem key={item.path} id={item.path} icon={item.icon} label={item.label} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          {/* Secondary Nav Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Operations</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSecondaryDragEnd}>
              <SortableContext items={sortedSecondaryItems.map(i => i.path)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {sortedSecondaryItems.map((item) => (
                    <SortableItem key={item.path} id={item.path} icon={item.icon} label={item.label} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Bottom Nav Settings */}
      <BottomNavSettings />

      <p className="text-sm text-muted-foreground text-center">
        Changes are saved automatically and synced across your devices
      </p>
    </motion.div>
  );
};

export default NavigationSettings;
