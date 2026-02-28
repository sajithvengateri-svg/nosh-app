import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useSidebarConfig } from "../hooks/useSidebarConfig";
import { upsertSidebarConfig } from "@/lib/shared/queries/resQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  ResSidebarSection,
  SidebarNavItem,
} from "@/lib/shared/types/res.types";

// ─── Default sections (same 7 from useSidebarConfig) ───
const PLACEHOLDER_TS = new Date(0).toISOString();

const DEFAULT_SECTIONS: ResSidebarSection[] = [
  {
    id: "default-venueflow",
    org_id: "",
    section_key: "venueflow",
    label: "VenueFlow",
    icon_name: "Building2",
    sort_order: 0,
    is_visible: true,
    required_role: null,
    items: [
      { key: "vf-dashboard", label: "Dashboard", path: "/reservation/venueflow", icon: "LayoutDashboard", is_visible: true, required_role: null },
      { key: "vf-pipeline", label: "Pipeline", path: "/reservation/venueflow/pipeline", icon: "Kanban", is_visible: true, required_role: null },
      { key: "vf-calendar", label: "Calendar", path: "/reservation/venueflow/calendar", icon: "Calendar", is_visible: true, required_role: null },
      { key: "vf-proposals", label: "Proposals", path: "/reservation/venueflow/proposals", icon: "FileText", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-venue_setup",
    org_id: "",
    section_key: "venue_setup",
    label: "Venue Setup",
    icon_name: "Settings2",
    sort_order: 1,
    is_visible: true,
    required_role: null,
    items: [
      { key: "rooms", label: "Rooms & Spaces", path: "/reservation/venueflow/rooms", icon: "DoorOpen", is_visible: true, required_role: null },
      { key: "menus", label: "Menu Templates", path: "/reservation/venueflow/menus", icon: "UtensilsCrossed", is_visible: true, required_role: null },
      { key: "beverages", label: "Beverage Packages", path: "/reservation/venueflow/beverages", icon: "Wine", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-reservations",
    org_id: "",
    section_key: "reservations",
    label: "Reservations",
    icon_name: "CalendarCheck",
    sort_order: 2,
    is_visible: true,
    required_role: null,
    items: [
      { key: "dashboard", label: "Dashboard", path: "/reservation/dashboard", icon: "LayoutDashboard", is_visible: true, required_role: null },
      { key: "diary", label: "Diary", path: "/reservation/diary", icon: "BookOpen", is_visible: true, required_role: null },
      { key: "floor", label: "Floor Plan", path: "/reservation/floor", icon: "Map", is_visible: true, required_role: null },
      { key: "reservations", label: "Reservations", path: "/reservation/reservations", icon: "ClipboardList", is_visible: true, required_role: null },
      { key: "waitlist", label: "Waitlist", path: "/reservation/waitlist", icon: "Clock", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-growth",
    org_id: "",
    section_key: "growth",
    label: "Growth",
    icon_name: "TrendingUp",
    sort_order: 3,
    is_visible: true,
    required_role: null,
    items: [
      { key: "leads", label: "Leads", path: "/reservation/venueflow/leads", icon: "UserPlus", is_visible: true, required_role: null },
      { key: "referrals", label: "Referrals", path: "/reservation/venueflow/referrals", icon: "Share2", is_visible: true, required_role: null },
      { key: "reactivation", label: "Re-activation", path: "/reservation/venueflow/reactivation", icon: "RefreshCw", is_visible: true, required_role: null },
      { key: "analytics", label: "Analytics", path: "/reservation/venueflow/analytics", icon: "BarChart3", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-guests",
    org_id: "",
    section_key: "guests",
    label: "Guests",
    icon_name: "Users",
    sort_order: 4,
    is_visible: true,
    required_role: null,
    items: [
      { key: "guest-db", label: "Guest Database", path: "/reservation/guests", icon: "Database", is_visible: true, required_role: null },
      { key: "csv-import", label: "CSV Import", path: "/reservation/venueflow/csv-import", icon: "Upload", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-online",
    org_id: "",
    section_key: "online",
    label: "Online",
    icon_name: "Globe",
    sort_order: 5,
    is_visible: true,
    required_role: null,
    items: [
      { key: "booking-widget", label: "Booking Widget", path: "/reservation/widget", icon: "ExternalLink", is_visible: true, required_role: null },
      { key: "function-widget", label: "Function Widget", path: "/reservation/function-widget", icon: "ExternalLink", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
  {
    id: "default-system",
    org_id: "",
    section_key: "system",
    label: "System",
    icon_name: "Cog",
    sort_order: 6,
    is_visible: true,
    required_role: null,
    items: [
      { key: "automations", label: "Automations", path: "/reservation/venueflow/automations", icon: "Zap", is_visible: true, required_role: null },
      { key: "integrations", label: "Integrations", path: "/reservation/venueflow/integrations", icon: "Plug", is_visible: true, required_role: null },
      { key: "reports", label: "Reports", path: "/reservation/reports", icon: "FileBarChart", is_visible: true, required_role: null },
      { key: "settings", label: "Settings", path: "/reservation/settings", icon: "Settings", is_visible: true, required_role: null },
    ],
    created_at: PLACEHOLDER_TS,
    updated_at: PLACEHOLDER_TS,
  },
];

// ─── Role filter options ───────────────────────────
const ROLE_OPTIONS = [
  { value: "__all__", label: "All Users" },
  { value: "owner", label: "Owner Only" },
  { value: "head_chef", label: "Manager+" },
] as const;

function roleLabel(role: string | null): string {
  if (!role) return "All Users";
  if (role === "owner") return "Owner Only";
  if (role === "head_chef") return "Manager+";
  return role;
}

// ═══════════════════════════════════════════════════════
// SORTABLE ITEM ROW
// ═══════════════════════════════════════════════════════

interface SortableItemRowProps {
  item: SidebarNavItem;
  onToggleVisible: () => void;
  onLabelChange: (label: string) => void;
  onRoleChange: (role: string | null) => void;
}

function SortableItemRow({
  item,
  onToggleVisible,
  onLabelChange,
  onRoleChange,
}: SortableItemRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.label);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const commitLabel = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.label) {
      onLabelChange(trimmed);
    } else {
      setEditValue(item.label);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 rounded-md border border-transparent bg-muted/40 px-3 py-2 ml-6 hover:border-border transition-colors"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
        aria-label={`Reorder ${item.label}`}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Visibility toggle */}
      <Switch
        checked={item.is_visible}
        onCheckedChange={onToggleVisible}
        className="scale-75"
      />
      <span className="text-muted-foreground">
        {item.is_visible ? (
          <Eye className="w-3.5 h-3.5" />
        ) : (
          <EyeOff className="w-3.5 h-3.5" />
        )}
      </span>

      {/* Label (click to edit) */}
      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitLabel();
            if (e.key === "Escape") {
              setEditValue(item.label);
              setIsEditing(false);
            }
          }}
          autoFocus
          className="h-7 text-sm flex-1 max-w-[180px]"
        />
      ) : (
        <button
          onClick={() => {
            setEditValue(item.label);
            setIsEditing(true);
          }}
          className="text-sm font-medium text-left flex-1 hover:underline decoration-dashed underline-offset-4 truncate"
        >
          {item.label}
        </button>
      )}

      {/* Path badge */}
      <Badge variant="outline" className="text-[10px] font-mono hidden lg:inline-flex">
        {item.path}
      </Badge>

      {/* Role filter */}
      <Select
        value={item.required_role ?? "__all__"}
        onValueChange={(v) => onRoleChange(v === "__all__" ? null : v)}
      >
        <SelectTrigger className="h-7 w-[120px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ROLE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SORTABLE SECTION CARD
// ═══════════════════════════════════════════════════════

interface SortableSectionCardProps {
  section: ResSidebarSection;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisible: () => void;
  onLabelChange: (label: string) => void;
  onItemToggleVisible: (itemKey: string) => void;
  onItemLabelChange: (itemKey: string, label: string) => void;
  onItemRoleChange: (itemKey: string, role: string | null) => void;
  onItemReorder: (oldIndex: number, newIndex: number) => void;
}

function SortableSectionCard({
  section,
  isExpanded,
  onToggleExpand,
  onToggleVisible,
  onLabelChange,
  onItemToggleVisible,
  onItemLabelChange,
  onItemRoleChange,
  onItemReorder,
}: SortableSectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(section.label);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.section_key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const commitLabel = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== section.label) {
      onLabelChange(trimmed);
    } else {
      setEditValue(section.label);
    }
    setIsEditing(false);
  };

  // Sensors for item-level drag
  const itemSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = section.items.findIndex((item) => item.key === active.id);
    const newIndex = section.items.findIndex((item) => item.key === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onItemReorder(oldIndex, newIndex);
    }
  };

  const visibleCount = section.items.filter((i) => i.is_visible).length;
  const totalCount = section.items.length;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`transition-colors ${!section.is_visible ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Reorder ${section.label} section`}
            >
              <GripVertical className="w-5 h-5" />
            </button>

            {/* Expand/Collapse */}
            <button
              onClick={onToggleExpand}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {/* Visibility toggle */}
            <Switch
              checked={section.is_visible}
              onCheckedChange={onToggleVisible}
            />
            <span className="text-muted-foreground">
              {section.is_visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </span>

            {/* Section label (click to edit) */}
            {isEditing ? (
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitLabel();
                  if (e.key === "Escape") {
                    setEditValue(section.label);
                    setIsEditing(false);
                  }
                }}
                autoFocus
                className="h-8 text-base font-semibold flex-1 max-w-[240px]"
              />
            ) : (
              <CardTitle
                onClick={() => {
                  setEditValue(section.label);
                  setIsEditing(true);
                }}
                className="text-base cursor-pointer hover:underline decoration-dashed underline-offset-4"
              >
                {section.label}
              </CardTitle>
            )}

            {/* Info badges */}
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {visibleCount}/{totalCount} items
              </Badge>
              {section.required_role && (
                <Badge variant="outline" className="text-xs">
                  {roleLabel(section.required_role)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Expanded items */}
        {isExpanded && (
          <CardContent className="pt-0 pb-4 space-y-1.5">
            <DndContext
              sensors={itemSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleItemDragEnd}
            >
              <SortableContext
                items={section.items.map((i) => i.key)}
                strategy={verticalListSortingStrategy}
              >
                {section.items.map((item) => (
                  <SortableItemRow
                    key={item.key}
                    item={item}
                    onToggleVisible={() => onItemToggleVisible(item.key)}
                    onLabelChange={(label) => onItemLabelChange(item.key, label)}
                    onRoleChange={(role) => onItemRoleChange(item.key, role)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {section.items.length === 0 && (
              <p className="text-sm text-muted-foreground ml-6 py-2">
                No items in this section.
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

function SidebarNavSettings() {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();

  // Fetch current config (unfiltered -- pass no role so admin sees everything)
  const { sections: fetchedSections, isLoading, isUsingDefaults } = useSidebarConfig();

  // Local editable state
  const [localSections, setLocalSections] = useState<ResSidebarSection[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Clone fetched sections into local state on mount / when data changes
  useEffect(() => {
    if (!isLoading && fetchedSections.length > 0) {
      setLocalSections(structuredClone(fetchedSections));
    } else if (!isLoading && fetchedSections.length === 0) {
      // Fallback to defaults if hook returned nothing (e.g. all sections filtered out)
      setLocalSections(structuredClone(DEFAULT_SECTIONS));
    }
  }, [fetchedSections, isLoading]);

  // ── Sensors for section-level drag ──
  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ── Save mutation ──
  const saveMut = useMutation({
    mutationFn: async () => {
      if (!currentOrg) throw new Error("No organization selected");
      const sections = localSections.map((s, i) => ({
        org_id: currentOrg.id,
        section_key: s.section_key,
        label: s.label,
        icon_name: s.icon_name,
        sort_order: i,
        is_visible: s.is_visible,
        required_role: s.required_role,
        items: s.items,
      }));
      return upsertSidebarConfig(sections);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_sidebar_config"] });
      toast.success("Sidebar saved!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to save sidebar config");
    },
  });

  // ── Section-level handlers ──

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalSections((prev) => {
      const oldIndex = prev.findIndex((s) => s.section_key === active.id);
      const newIndex = prev.findIndex((s) => s.section_key === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const toggleSectionExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSectionVisible = (sectionKey: string) => {
    setLocalSections((prev) =>
      prev.map((s) =>
        s.section_key === sectionKey
          ? { ...s, is_visible: !s.is_visible }
          : s,
      ),
    );
  };

  const updateSectionLabel = (sectionKey: string, label: string) => {
    setLocalSections((prev) =>
      prev.map((s) =>
        s.section_key === sectionKey ? { ...s, label } : s,
      ),
    );
  };

  // ── Item-level handlers ──

  const toggleItemVisible = (sectionKey: string, itemKey: string) => {
    setLocalSections((prev) =>
      prev.map((s) =>
        s.section_key === sectionKey
          ? {
              ...s,
              items: s.items.map((i) =>
                i.key === itemKey ? { ...i, is_visible: !i.is_visible } : i,
              ),
            }
          : s,
      ),
    );
  };

  const updateItemLabel = (sectionKey: string, itemKey: string, label: string) => {
    setLocalSections((prev) =>
      prev.map((s) =>
        s.section_key === sectionKey
          ? {
              ...s,
              items: s.items.map((i) =>
                i.key === itemKey ? { ...i, label } : i,
              ),
            }
          : s,
      ),
    );
  };

  const updateItemRole = (sectionKey: string, itemKey: string, role: string | null) => {
    setLocalSections((prev) =>
      prev.map((s) =>
        s.section_key === sectionKey
          ? {
              ...s,
              items: s.items.map((i) =>
                i.key === itemKey ? { ...i, required_role: role } : i,
              ),
            }
          : s,
      ),
    );
  };

  const reorderItems = (sectionKey: string, oldIndex: number, newIndex: number) => {
    setLocalSections((prev) =>
      prev.map((s) =>
        s.section_key === sectionKey
          ? { ...s, items: arrayMove(s.items, oldIndex, newIndex) }
          : s,
      ),
    );
  };

  // ── Reset to defaults ──

  const handleReset = () => {
    setLocalSections(structuredClone(DEFAULT_SECTIONS));
    setExpandedKeys(new Set());
    toast.info("Reset to defaults (unsaved)");
  };

  // ── Loading state ──

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading sidebar config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sidebar Navigation</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Drag to reorder sections and items, toggle visibility, and customize labels.
          </p>
          {isUsingDefaults && (
            <Badge variant="secondary" className="mt-2 text-xs">
              Using default configuration
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button
            size="sm"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !currentOrg}
            className="gap-2"
          >
            {saveMut.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Sortable sections */}
      <DndContext
        sensors={sectionSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={localSections.map((s) => s.section_key)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {localSections.map((section) => (
              <SortableSectionCard
                key={section.section_key}
                section={section}
                isExpanded={expandedKeys.has(section.section_key)}
                onToggleExpand={() => toggleSectionExpand(section.section_key)}
                onToggleVisible={() => toggleSectionVisible(section.section_key)}
                onLabelChange={(label) => updateSectionLabel(section.section_key, label)}
                onItemToggleVisible={(itemKey) =>
                  toggleItemVisible(section.section_key, itemKey)
                }
                onItemLabelChange={(itemKey, label) =>
                  updateItemLabel(section.section_key, itemKey, label)
                }
                onItemRoleChange={(itemKey, role) =>
                  updateItemRole(section.section_key, itemKey, role)
                }
                onItemReorder={(oldIdx, newIdx) =>
                  reorderItems(section.section_key, oldIdx, newIdx)
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Bottom actions (duplicate for long lists) */}
      {localSections.length > 4 && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending || !currentOrg}
            className="gap-2"
          >
            {saveMut.isPending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

export default SidebarNavSettings;
