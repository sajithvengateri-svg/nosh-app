import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  GripVertical, RotateCcw, Pencil, Check, X, ArrowRight,
  LayoutGrid, ChevronDown, ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
import { useBevNavOrder, BevNavItem } from "@/hooks/useBevNavOrder";

// ---------- Sortable nav item ----------
interface SortableNavItemProps {
  item: BevNavItem;
  sectionId: string;
  allSections: { id: string; title: string }[];
  onRename: (sectionId: string, itemId: string, name: string) => void;
  onMove: (itemId: string, fromSection: string, toSection: string) => void;
}

const SortableNavItem = ({ item, sectionId, allSections, onRename, onMove }: SortableNavItemProps) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.title);
  const [moving, setMoving] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleSave = () => {
    if (editValue.trim()) {
      onRename(sectionId, item.id, editValue.trim());
      toast.success(`Renamed to "${editValue.trim()}"`);
    }
    setEditing(false);
  };

  const handleMove = (targetSection: string) => {
    onMove(item.id, sectionId, targetSection);
    setMoving(false);
    toast.success("Item moved");
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2.5 bg-card border rounded-lg group",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {editing ? (
        <div className="flex-1 flex items-center gap-1">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave}>
            <Check className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(false)}>
            <X className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm font-medium">{item.title}</span>
          <div className="hidden group-hover:flex items-center gap-0.5">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditValue(item.title); setEditing(true); }}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setMoving(!moving)}>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </>
      )}

      {moving && !editing && (
        <Select onValueChange={handleMove}>
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue placeholder="Move to..." />
          </SelectTrigger>
          <SelectContent>
            {allSections.filter(s => s.id !== sectionId).map(s => (
              <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

// ---------- Sortable section ----------
interface SortableSectionProps {
  sectionId: string;
  sectionTitle: string;
  index: number;
  totalSections: number;
  items: BevNavItem[];
  allSections: { id: string; title: string }[];
  onReorderItems: (sectionId: string, from: number, to: number) => void;
  onRenameSection: (sectionId: string, name: string) => void;
  onRenameItem: (sectionId: string, itemId: string, name: string) => void;
  onMoveItem: (itemId: string, fromSection: string, toSection: string) => void;
  onMoveSection: (from: number, to: number) => void;
}

const SortableSection = ({
  sectionId, sectionTitle, index, totalSections, items, allSections,
  onReorderItems, onRenameSection, onRenameItem, onMoveItem, onMoveSection,
}: SortableSectionProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(sectionTitle);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = items.findIndex(i => i.id === active.id);
      const newIdx = items.findIndex(i => i.id === over.id);
      onReorderItems(sectionId, oldIdx, newIdx);
      toast.success("Order updated");
    }
  };

  const handleSaveTitle = () => {
    if (titleValue.trim()) {
      onRenameSection(sectionId, titleValue.trim());
      toast.success(`Section renamed to "${titleValue.trim()}"`);
    }
    setEditingTitle(false);
  };

  return (
    <div className="border rounded-xl p-4 bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        {editingTitle ? (
          <div className="flex-1 flex items-center gap-1">
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              className="h-8 text-sm font-semibold"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
            />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveTitle}>
            <Check className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingTitle(false)}>
            <X className="w-3.5 h-3.5 text-destructive" />
            </Button>
          </div>
        ) : (
          <button
            className="flex-1 text-left text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-2"
            onClick={() => { setTitleValue(sectionTitle); setEditingTitle(true); }}
          >
            {sectionTitle}
            <Pencil className="w-3 h-3 text-muted-foreground" />
          </button>
        )}

        <div className="flex gap-0.5">
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === 0}
            onClick={() => onMoveSection(index, index - 1)}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={index === totalSections - 1}
            onClick={() => onMoveSection(index, index + 1)}>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {items.map((item) => (
              <SortableNavItem
                key={item.id}
                item={item}
                sectionId={sectionId}
                allSections={allSections}
                onRename={onRenameItem}
                onMove={onMoveItem}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

// ---------- Main component ----------
const BevNavigationSettings = () => {
  const {
    sections, reorderSections, reorderItemsInSection,
    moveItemToSection, renameSection, renameItem, resetToDefault,
  } = useBevNavOrder();

  const allSectionsMeta = sections.map(s => ({ id: s.id, title: s.title }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                Sidebar Navigation
              </CardTitle>
              <CardDescription>
                Drag items to reorder, click titles to rename, use arrow to move items between sections
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => { resetToDefault(); toast.success("Navigation reset"); }}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section, idx) => (
            <SortableSection
              key={section.id}
              sectionId={section.id}
              sectionTitle={section.title}
              index={idx}
              totalSections={sections.length}
              items={section.items}
              allSections={allSectionsMeta}
              onReorderItems={reorderItemsInSection}
              onRenameSection={renameSection}
              onRenameItem={renameItem}
              onMoveItem={moveItemToSection}
              onMoveSection={reorderSections}
            />
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-center">
        Changes are saved automatically to your browser
      </p>
    </motion.div>
  );
};

export default BevNavigationSettings;
