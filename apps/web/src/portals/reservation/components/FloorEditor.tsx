import React, { useState, useCallback, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Save, Camera, Trash2, LayoutGrid, Undo2, Redo2, Grid3X3, ZoomIn, ZoomOut, Maximize, Download, RotateCw, LayoutTemplate } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import FloorCanvas, { type FloorZoneRegion } from "./FloorCanvas";
import FloorMiniMap from "./FloorMiniMap";
import RoomScanDialog from "./RoomScanDialog";
import { TemplatePickerDialog } from "./TemplatePickerDialog";
import AlignmentToolbar from "./AlignmentToolbar";
import { type DecorElement, DECOR_DEFAULTS, type DecorElementType } from "./FloorDecorNode";
import { useCanvasViewport } from "../hooks/useCanvasViewport";
import { useUndoRedo } from "../hooks/useUndoRedo";
import { useEditorKeyboard } from "../hooks/useEditorKeyboard";
import { snapToGrid, detectSmartGuides, alignItems, distributeItems, exportAsPNG, type SmartGuide } from "../utils/canvasUtils";
import type { FloorTemplate } from "../data/floorTemplates";
import {
  fetchTables, fetchFloorLayouts, updateTablePositions, createTable, updateTable, deleteTable,
  fetchFloorZones, createFloorZone, updateFloorZone, deleteFloorZone, updateFloorLayout,
} from "@/lib/shared/queries/resQueries";
import type { ResTable, TableZone, TableShape } from "@/lib/shared/types/res.types";

const ZONE_COLORS = [
  { label: 'Blue', value: 'rgba(59,130,246,0.25)' },
  { label: 'Green', value: 'rgba(34,197,94,0.25)' },
  { label: 'Purple', value: 'rgba(168,85,247,0.25)' },
  { label: 'Amber', value: 'rgba(234,179,8,0.25)' },
  { label: 'Red', value: 'rgba(239,68,68,0.25)' },
  { label: 'Grey', value: 'rgba(107,114,128,0.25)' },
];

const GRID_SIZE_OPTIONS = [25, 50, 100] as const;

const ALL_DECOR_TYPES: DecorElementType[] = [
  'WALL', 'DOOR', 'PILLAR', 'STAGE', 'DANCE_FLOOR',
  'BAR_COUNTER', 'HOST_STAND', 'BATHROOM', 'KITCHEN', 'STAIRS',
];

interface EditorSnapshot {
  tables: ResTable[];
  zones: FloorZoneRegion[];
  decor: DecorElement[];
}

const FloorEditor = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  // Selection state: multi-select via Set
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);

  // Local state
  const [localTables, setLocalTables] = useState<ResTable[]>([]);
  const [localZones, setLocalZones] = useState<FloorZoneRegion[]>([]);
  const [localDecor, setLocalDecor] = useState<DecorElement[]>([]);
  const [showScan, setShowScan] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [panelTab, setPanelTab] = useState<string>("tables");

  // Snap-to-grid state
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(50);

  // Smart guides state
  const [smartGuides, setSmartGuides] = useState<SmartGuide[]>([]);

  // Ref to track table positions before a bulk drag for computing delta
  const dragStartPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // --- Queries ---
  const { data: tables = [] } = useQuery({
    queryKey: ["res_tables", orgId],
    queryFn: async () => { const { data } = await fetchTables(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: layouts = [] } = useQuery({
    queryKey: ["res_floor_layouts", orgId],
    queryFn: async () => { const { data } = await fetchFloorLayouts(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const { data: dbZones = [] } = useQuery({
    queryKey: ["res_floor_zones", orgId],
    queryFn: async () => { const { data } = await fetchFloorZones(orgId!); return data ?? []; },
    enabled: !!orgId,
  });

  const activeLayout = layouts.find((l: any) => l.is_active) ?? layouts[0] ?? null;
  const canvasWidth = activeLayout?.canvas_width ?? 1200;
  const canvasHeight = activeLayout?.canvas_height ?? 800;

  // --- Viewport (zoom/pan) ---
  const {
    viewport,
    isPanning,
    containerRef,
    handleWheel,
    fitToScreen,
    zoomIn,
    zoomOut,
    resetZoom,
    setPan,
  } = useCanvasViewport({ canvasWidth, canvasHeight });

  // --- Undo/Redo ---
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo<EditorSnapshot>();

  const currentSnapshot = useCallback((): EditorSnapshot => ({
    tables: structuredClone(localTables),
    zones: structuredClone(localZones),
    decor: structuredClone(localDecor),
  }), [localTables, localZones, localDecor]);

  const applySnapshot = useCallback((snap: EditorSnapshot) => {
    setLocalTables(snap.tables);
    setLocalZones(snap.zones);
    setLocalDecor(snap.decor);
    setHasChanges(true);
  }, []);

  const handleUndo = useCallback(() => {
    const prev = undo(currentSnapshot());
    if (prev) applySnapshot(prev);
  }, [undo, currentSnapshot, applySnapshot]);

  const handleRedo = useCallback(() => {
    const next = redo(currentSnapshot());
    if (next) applySnapshot(next);
  }, [redo, currentSnapshot, applySnapshot]);

  // --- Sync server data to local state ---
  React.useEffect(() => {
    if (tables.length > 0 && !hasChanges) setLocalTables(tables as ResTable[]);
  }, [tables, hasChanges]);

  React.useEffect(() => {
    if (dbZones.length > 0 && !hasChanges) {
      setLocalZones(dbZones.map((z: any) => ({
        id: z.id, zone: z.zone, label: z.label,
        x: Number(z.x), y: Number(z.y), width: Number(z.width), height: Number(z.height),
        color: z.color,
      })));
    }
  }, [dbZones, hasChanges]);

  React.useEffect(() => {
    if (activeLayout && !hasChanges) {
      const stored = (activeLayout as any).decor_elements;
      if (Array.isArray(stored)) {
        setLocalDecor(stored as DecorElement[]);
      }
    }
  }, [activeLayout, hasChanges]);

  // --- Derived selections ---
  const selectedTable = useMemo(() => {
    if (selectedIds.size === 1) {
      const id = Array.from(selectedIds)[0];
      return localTables.find(t => t.id === id) ?? null;
    }
    return null;
  }, [selectedIds, localTables]);

  const selectedZone = localZones.find(z => z.id === selectedZoneId) ?? null;
  const selectedDecor = localDecor.find(d => d.id === selectedDecorId) ?? null;

  // --- Snap helper ---
  const applySnap = useCallback((x: number, y: number): { x: number; y: number } => {
    if (!snapEnabled) return { x: Math.round(x), y: Math.round(y) };
    return { x: snapToGrid(x, gridSize), y: snapToGrid(y, gridSize) };
  }, [snapEnabled, gridSize]);

  // --- Drag handlers ---
  const handleDragStart = useCallback(() => {
    // Push undo snapshot before any drag begins
    pushSnapshot(currentSnapshot());
    // Cache positions for bulk drag delta computation
    const positions = new Map<string, { x: number; y: number }>();
    localTables.forEach(t => {
      positions.set(t.id, { x: t.x_position ?? 0, y: t.y_position ?? 0 });
    });
    dragStartPositionsRef.current = positions;
  }, [pushSnapshot, currentSnapshot, localTables]);

  const handleDrag = useCallback((tableId: string, x: number, y: number) => {
    const snapped = applySnap(x, y);

    // Multi-select bulk drag: if dragged table is in the selection and multiple are selected
    if (selectedIds.has(tableId) && selectedIds.size > 1) {
      const prevPos = dragStartPositionsRef.current.get(tableId);
      if (prevPos) {
        // Find the current position of the dragged table to compute incremental delta
        const currentTable = localTables.find(t => t.id === tableId);
        if (currentTable) {
          const dx = snapped.x - (currentTable.x_position ?? 0);
          const dy = snapped.y - (currentTable.y_position ?? 0);
          setLocalTables(prev => prev.map(t => {
            if (selectedIds.has(t.id)) {
              return {
                ...t,
                x_position: (t.x_position ?? 0) + dx,
                y_position: (t.y_position ?? 0) + dy,
              };
            }
            return t;
          }));
        }
      }
    } else {
      setLocalTables(prev => prev.map(t =>
        t.id === tableId ? { ...t, x_position: snapped.x, y_position: snapped.y } : t
      ));
    }

    // Smart guides
    const draggedTable = localTables.find(t => t.id === tableId);
    if (draggedTable) {
      const draggedBounds = {
        id: tableId,
        x: snapped.x,
        y: snapped.y,
        width: draggedTable.width,
        height: draggedTable.height,
      };
      const otherBounds = localTables
        .filter(t => t.id !== tableId && t.x_position != null)
        .map(t => ({
          id: t.id,
          x: t.x_position ?? 0,
          y: t.y_position ?? 0,
          width: t.width,
          height: t.height,
        }));
      setSmartGuides(detectSmartGuides(draggedBounds, otherBounds));
    }

    setHasChanges(true);
  }, [applySnap, selectedIds, localTables]);

  const handleDragEnd = useCallback(() => {
    setSmartGuides([]);
    dragStartPositionsRef.current = new Map();
  }, []);

  const handleZoneDrag = useCallback((zoneId: string, x: number, y: number) => {
    const snapped = applySnap(x, y);
    setLocalZones(prev => prev.map(z => z.id === zoneId ? { ...z, x: snapped.x, y: snapped.y } : z));
    setHasChanges(true);
  }, [applySnap]);

  const handleZoneResize = useCallback((zoneId: string, w: number, h: number) => {
    const snapped = applySnap(w, h);
    setLocalZones(prev => prev.map(z => z.id === zoneId ? { ...z, width: Math.max(100, snapped.x), height: Math.max(80, snapped.y) } : z));
    setHasChanges(true);
  }, [applySnap]);

  const handleDecorDrag = useCallback((id: string, x: number, y: number) => {
    const snapped = applySnap(x, y);
    setLocalDecor(prev => prev.map(d => d.id === id ? { ...d, x: snapped.x, y: snapped.y } : d));
    setHasChanges(true);
  }, [applySnap]);

  // --- Table rotation ---
  const handleTableRotate = useCallback((tableId: string, angle: number) => {
    setLocalTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, rotation: Math.round(angle) } : t
    ));
    setHasChanges(true);
  }, []);

  // --- Click handlers ---
  const handleTableClick = useCallback((table: ResTable, shiftKey: boolean) => {
    setSelectedZoneId(null);
    setSelectedDecorId(null);
    if (shiftKey) {
      // Toggle in/out of selection
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(table.id)) {
          next.delete(table.id);
        } else {
          next.add(table.id);
        }
        return next;
      });
    } else {
      setSelectedIds(new Set([table.id]));
    }
  }, []);

  const handleCanvasClick = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedZoneId(null);
    setSelectedDecorId(null);
  }, []);

  const handleLassoSelect = useCallback((tableIds: string[]) => {
    setSelectedIds(new Set(tableIds));
    setSelectedZoneId(null);
    setSelectedDecorId(null);
  }, []);

  // --- Save ---
  const handleSave = async () => {
    try {
      // Save table positions
      const positions = localTables.map(t => ({
        id: t.id, x_position: t.x_position ?? 0, y_position: t.y_position ?? 0,
        width: t.width, height: t.height, rotation: t.rotation,
      }));
      const results = await updateTablePositions(positions);
      const failed = results.filter((r: any) => r.error);
      if (failed.length > 0) { toast.error("Failed to save tables: " + (failed[0] as any).error!.message); return; }

      // Save zone positions
      for (const z of localZones) {
        await updateFloorZone(z.id, { x: z.x, y: z.y, width: z.width, height: z.height, label: z.label, color: z.color, zone: z.zone });
      }

      // Save decor elements to layout JSONB
      if (activeLayout?.id) {
        await updateFloorLayout(activeLayout.id, { decor_elements: localDecor });
      }

      setHasChanges(false);
      await qc.invalidateQueries({ queryKey: ["res_tables"] });
      await qc.invalidateQueries({ queryKey: ["res_floor_zones"] });
      await qc.invalidateQueries({ queryKey: ["res_floor_layouts"] });
      toast.success("Floor layout saved");
    } catch (err: any) {
      toast.error("Save failed: " + (err?.message ?? "Unknown error"));
    }
  };

  // --- Add table ---
  const handleAddTable = async () => {
    if (!orgId) return;
    pushSnapshot(currentSnapshot());
    const count = localTables.length + 1;
    const { error } = await createTable({
      org_id: orgId, name: `T${count}`, zone: 'INDOOR', max_capacity: 2,
      x_position: 100 + (count % 5) * 150, y_position: 100 + Math.floor(count / 5) * 150,
      shape: 'ROUND', width: 80, height: 80,
    });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["res_tables"] });
    setHasChanges(false);
    toast.success(`Table T${count} added`);
  };

  // --- Add zone ---
  const handleAddZone = async () => {
    if (!orgId) return;
    pushSnapshot(currentSnapshot());
    const count = localZones.length;
    const colorIdx = count % ZONE_COLORS.length;
    const zoneTypes: TableZone[] = ['INDOOR', 'OUTDOOR', 'BAR', 'PRIVATE'];
    const zoneType = zoneTypes[count % zoneTypes.length];
    const { data, error } = await createFloorZone({
      org_id: orgId,
      layout_id: activeLayout?.id ?? null,
      zone: zoneType,
      label: zoneType.charAt(0) + zoneType.slice(1).toLowerCase(),
      x: 10 + (count % 2) * 600,
      y: 10 + Math.floor(count / 2) * 400,
      width: 560,
      height: 360,
      color: ZONE_COLORS[colorIdx].value,
      sort_order: count,
    });
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries({ queryKey: ["res_floor_zones"] });
    setHasChanges(false);
    toast.success("Zone added");
  };

  // --- Add decor ---
  const handleAddDecor = useCallback((type: DecorElementType) => {
    pushSnapshot(currentSnapshot());
    const defaults = DECOR_DEFAULTS[type];
    const newDecor: DecorElement = {
      id: crypto.randomUUID(),
      type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: defaults.width,
      height: defaults.height,
      rotation: 0,
      label: defaults.label,
    };
    setLocalDecor(prev => [...prev, newDecor]);
    setSelectedDecorId(newDecor.id);
    setSelectedIds(new Set());
    setSelectedZoneId(null);
    setHasChanges(true);
    toast.success(`${defaults.label} added`);
  }, [pushSnapshot, currentSnapshot]);

  // --- Delete zone ---
  const handleDeleteZone = async () => {
    if (!selectedZoneId) return;
    pushSnapshot(currentSnapshot());
    const { error } = await deleteFloorZone(selectedZoneId);
    if (error) { toast.error("Failed: " + error.message); return; }
    setSelectedZoneId(null);
    await qc.invalidateQueries({ queryKey: ["res_floor_zones"] });
    setHasChanges(false);
    toast.success("Zone removed");
  };

  // --- Delete table ---
  const handleDeleteTable = async () => {
    if (selectedIds.size === 0) return;
    pushSnapshot(currentSnapshot());
    for (const id of selectedIds) {
      const { error } = await deleteTable(id);
      if (error) { toast.error("Failed to remove table: " + error.message); return; }
    }
    setSelectedIds(new Set());
    setHasChanges(false);
    qc.invalidateQueries({ queryKey: ["res_tables"] });
    toast.success(selectedIds.size > 1 ? `${selectedIds.size} tables removed` : "Table removed");
  };

  // --- Delete decor ---
  const handleDeleteDecor = useCallback(() => {
    if (!selectedDecorId) return;
    pushSnapshot(currentSnapshot());
    setLocalDecor(prev => prev.filter(d => d.id !== selectedDecorId));
    setSelectedDecorId(null);
    setHasChanges(true);
    toast.success("Decor element removed");
  }, [selectedDecorId, pushSnapshot, currentSnapshot]);

  // --- Delete selected (for keyboard shortcut) ---
  const deleteSelected = useCallback(() => {
    if (selectedIds.size > 0) {
      handleDeleteTable();
    } else if (selectedZoneId) {
      handleDeleteZone();
    } else if (selectedDecorId) {
      handleDeleteDecor();
    }
  }, [selectedIds, selectedZoneId, selectedDecorId, handleDeleteDecor]);

  // --- Duplicate selected ---
  const duplicateSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    pushSnapshot(currentSnapshot());
    const newIds = new Set<string>();
    const newTables = localTables.filter(t => selectedIds.has(t.id)).map(t => {
      const newId = crypto.randomUUID();
      newIds.add(newId);
      return {
        ...structuredClone(t),
        id: newId,
        name: `${t.name} copy`,
        x_position: (t.x_position ?? 0) + 30,
        y_position: (t.y_position ?? 0) + 30,
      };
    });
    setLocalTables(prev => [...prev, ...newTables]);
    setSelectedIds(newIds);
    setHasChanges(true);
  }, [selectedIds, localTables, pushSnapshot, currentSnapshot]);

  // --- Select all ---
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(localTables.map(t => t.id)));
    setSelectedZoneId(null);
    setSelectedDecorId(null);
  }, [localTables]);

  // --- Clear selection ---
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectedZoneId(null);
    setSelectedDecorId(null);
  }, []);

  // --- Nudge ---
  const nudge = useCallback((dx: number, dy: number) => {
    if (selectedIds.size > 0) {
      pushSnapshot(currentSnapshot());
      setLocalTables(prev => prev.map(t => {
        if (selectedIds.has(t.id)) {
          return {
            ...t,
            x_position: (t.x_position ?? 0) + dx,
            y_position: (t.y_position ?? 0) + dy,
          };
        }
        return t;
      }));
      setHasChanges(true);
    }
  }, [selectedIds, pushSnapshot, currentSnapshot]);

  // --- Update table property ---
  const handleUpdateSelected = async (field: string, value: unknown) => {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0];
    pushSnapshot(currentSnapshot());
    const shapeDefaults: Record<string, { width: number; height: number }> = {
      ROUND: { width: 80, height: 80 }, SQUARE: { width: 80, height: 80 },
      RECTANGLE: { width: 140, height: 70 }, BAR: { width: 200, height: 40 },
      COUNTER: { width: 280, height: 35 }, BANQUET: { width: 240, height: 60 },
    };
    let updates: Record<string, unknown> = { [field]: value };
    if (field === 'shape' && typeof value === 'string' && shapeDefaults[value]) {
      updates = { ...updates, ...shapeDefaults[value] };
    }
    setLocalTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    await updateTable(id, updates);
    qc.invalidateQueries({ queryKey: ["res_tables"] });
  };

  // --- Update zone property ---
  const handleUpdateZone = (field: keyof FloorZoneRegion, value: unknown) => {
    if (!selectedZoneId) return;
    pushSnapshot(currentSnapshot());
    setLocalZones(prev => prev.map(z => z.id === selectedZoneId ? { ...z, [field]: value } : z));
    setHasChanges(true);
  };

  // --- Update decor property ---
  const handleUpdateDecor = useCallback((field: keyof DecorElement, value: unknown) => {
    if (!selectedDecorId) return;
    pushSnapshot(currentSnapshot());
    setLocalDecor(prev => prev.map(d => d.id === selectedDecorId ? { ...d, [field]: value } : d));
    setHasChanges(true);
  }, [selectedDecorId, pushSnapshot, currentSnapshot]);

  // --- Alignment and distribution ---
  const handleAlign = useCallback((alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedIds.size < 2) return;
    pushSnapshot(currentSnapshot());
    const items = localTables
      .filter(t => selectedIds.has(t.id))
      .map(t => ({ id: t.id, x: t.x_position ?? 0, y: t.y_position ?? 0, width: t.width, height: t.height }));
    const newPositions = alignItems(items, alignment);
    setLocalTables(prev => prev.map(t => {
      const pos = newPositions.get(t.id);
      if (pos) return { ...t, x_position: pos.x, y_position: pos.y };
      return t;
    }));
    setHasChanges(true);
  }, [selectedIds, localTables, pushSnapshot, currentSnapshot]);

  const handleDistribute = useCallback((direction: 'horizontal' | 'vertical') => {
    if (selectedIds.size < 3) return;
    pushSnapshot(currentSnapshot());
    const items = localTables
      .filter(t => selectedIds.has(t.id))
      .map(t => ({ id: t.id, x: t.x_position ?? 0, y: t.y_position ?? 0, width: t.width, height: t.height }));
    const newPositions = distributeItems(items, direction);
    setLocalTables(prev => prev.map(t => {
      const pos = newPositions.get(t.id);
      if (pos) return { ...t, x_position: pos.x, y_position: pos.y };
      return t;
    }));
    setHasChanges(true);
  }, [selectedIds, localTables, pushSnapshot, currentSnapshot]);

  // --- Export PNG ---
  const handleExportPNG = useCallback(async () => {
    // Find the SVG element inside the canvas container
    const svg = containerRef.current?.querySelector('svg') as SVGSVGElement | null;
    if (!svg) {
      toast.error("Canvas not ready for export");
      return;
    }
    try {
      await exportAsPNG(svg, 'floor-plan.png');
      toast.success("Floor plan exported as PNG");
    } catch (err: any) {
      toast.error("Export failed: " + (err?.message ?? "Unknown error"));
    }
  }, [containerRef]);

  // --- Fit to screen ---
  const handleFitToScreen = useCallback(() => {
    const allItems = [
      ...localTables.filter(t => t.x_position != null).map(t => ({
        x: t.x_position ?? 0, y: t.y_position ?? 0, width: t.width, height: t.height,
      })),
      ...localZones.map(z => ({ x: z.x, y: z.y, width: z.width, height: z.height })),
      ...localDecor.map(d => ({ x: d.x, y: d.y, width: d.width, height: d.height })),
    ];
    fitToScreen(allItems);
  }, [localTables, localZones, localDecor, fitToScreen]);

  // --- Load template ---
  const handleLoadTemplate = useCallback((template: FloorTemplate) => {
    pushSnapshot(currentSnapshot());
    const newTables: ResTable[] = template.tables.map((t, i) => ({
      id: `template-${Date.now()}-${i}`,
      org_id: orgId ?? '',
      name: t.name,
      zone: t.zone,
      min_capacity: t.min_capacity,
      max_capacity: t.max_capacity,
      is_active: true,
      is_blocked: false,
      block_reason: null,
      group_id: null,
      sort_order: i,
      x_position: t.x_position,
      y_position: t.y_position,
      width: t.width,
      height: t.height,
      shape: t.shape,
      rotation: t.rotation,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    setLocalTables(newTables);
    setLocalZones([]);
    setLocalDecor([]);
    setSelectedIds(new Set());
    setHasChanges(true);
    toast.success(`Loaded "${template.name}" template with ${template.tables.length} tables`);
  }, [orgId, pushSnapshot, currentSnapshot]);

  // --- Viewport jump (for mini-map) ---
  const handleViewportJump = useCallback((newPanX: number, newPanY: number) => {
    setPan(newPanX, newPanY);
  }, [setPan]);

  // --- Keyboard shortcuts ---
  useEditorKeyboard({
    deleteSelected,
    duplicateSelected,
    selectAll,
    clearSelection,
    nudge,
    undo: handleUndo,
    redo: handleRedo,
    isActive: true,
    nudgeAmount: snapEnabled ? gridSize : 5,
  });

  // --- Render ---
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Floor Layout Editor</h2>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Undo / Redo */}
          <Button variant="outline" size="sm" onClick={handleUndo} disabled={!canUndo} title="Undo (Cmd+Z)">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRedo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-border" />

          {/* Snap toggle + grid size */}
          <div className="flex items-center gap-1.5">
            <Grid3X3 className="w-4 h-4 text-muted-foreground" />
            <Switch checked={snapEnabled} onCheckedChange={setSnapEnabled} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-8 px-2">
                  {gridSize}px
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {GRID_SIZE_OPTIONS.map(size => (
                  <DropdownMenuItem key={size} onClick={() => setGridSize(size)}>
                    {size}px grid
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Zoom controls */}
          <Button variant="outline" size="sm" onClick={zoomOut} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground font-mono w-12 text-center">
            {Math.round(viewport.zoom * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={zoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleFitToScreen} title="Fit to Screen">
            <Maximize className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetZoom} title="Reset Zoom">
            100%
          </Button>

          <div className="w-px h-6 bg-border" />

          {/* AI Room Scan */}
          <Button variant="outline" size="sm" onClick={() => setShowScan(true)}>
            <Camera className="w-4 h-4 mr-2" /> AI Room Scan
          </Button>

          {/* Add Zone */}
          <Button variant="outline" size="sm" onClick={handleAddZone}>
            <LayoutGrid className="w-4 h-4 mr-2" /> Add Zone
          </Button>

          {/* Add Table */}
          <Button variant="outline" size="sm" onClick={handleAddTable}>
            <Plus className="w-4 h-4 mr-2" /> Add Table
          </Button>

          {/* Add Decor dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Decor
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ALL_DECOR_TYPES.map(type => (
                <DropdownMenuItem key={type} onClick={() => handleAddDecor(type)}>
                  {DECOR_DEFAULTS[type].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Load Template */}
          <Button variant="outline" size="sm" onClick={() => setShowTemplatePicker(true)} title="Load Template">
            <LayoutTemplate className="w-4 h-4 mr-2" /> Templates
          </Button>

          {/* Export PNG */}
          <Button variant="outline" size="sm" onClick={handleExportPNG} title="Export as PNG">
            <Download className="w-4 h-4" />
          </Button>

          {/* Save */}
          <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" /> Save Layout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left panel: tables + zones + decor list */}
        <Card className="lg:col-span-1">
          <CardContent className="p-3">
            <Tabs value={panelTab} onValueChange={setPanelTab}>
              <TabsList className="w-full">
                <TabsTrigger value="tables" className="flex-1 text-xs">Tables ({localTables.length})</TabsTrigger>
                <TabsTrigger value="zones" className="flex-1 text-xs">Zones ({localZones.length})</TabsTrigger>
                <TabsTrigger value="decor" className="flex-1 text-xs">Decor ({localDecor.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="tables" className="mt-2 space-y-1 max-h-[450px] overflow-y-auto">
                {localTables.map(t => (
                  <button
                    key={t.id}
                    onClick={(e) => handleTableClick(t, e.shiftKey)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                      selectedIds.has(t.id) ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    <Badge variant="secondary" className="text-[10px]">{t.zone}</Badge>
                  </button>
                ))}
              </TabsContent>
              <TabsContent value="zones" className="mt-2 space-y-1 max-h-[450px] overflow-y-auto">
                {localZones.map(z => (
                  <button
                    key={z.id}
                    onClick={() => { setSelectedZoneId(z.id); setSelectedIds(new Set()); setSelectedDecorId(null); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                      selectedZoneId === z.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium">{z.label}</span>
                    <div className="w-4 h-4 rounded" style={{ background: z.color }} />
                  </button>
                ))}
                {localZones.length === 0 && (
                  <p className="text-xs text-muted-foreground p-2">No zones yet. Click "Add Zone" to create one.</p>
                )}
              </TabsContent>
              <TabsContent value="decor" className="mt-2 space-y-1 max-h-[450px] overflow-y-auto">
                {localDecor.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDecorId(d.id); setSelectedIds(new Set()); setSelectedZoneId(null); }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                      selectedDecorId === d.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="font-medium">{d.label || DECOR_DEFAULTS[d.type].label}</span>
                    <Badge variant="secondary" className="text-[10px]">{d.type}</Badge>
                  </button>
                ))}
                {localDecor.length === 0 && (
                  <p className="text-xs text-muted-foreground p-2">No decor elements. Use "Add Decor" to place walls, doors, etc.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Canvas */}
        <div className="lg:col-span-2" ref={containerRef}>
          {/* Alignment toolbar above canvas when multi-select */}
          {selectedIds.size >= 2 && (
            <div className="mb-2 flex justify-center">
              <AlignmentToolbar
                selectedCount={selectedIds.size}
                onAlign={handleAlign}
                onDistribute={handleDistribute}
                onDuplicate={duplicateSelected}
                onDelete={handleDeleteTable}
              />
            </div>
          )}
          <FloorCanvas
            tables={localTables}
            layout={activeLayout}
            zones={localZones}
            decorElements={localDecor}
            isEditMode={true}
            selectedTableIds={selectedIds}
            selectedZoneId={selectedZoneId}
            selectedDecorId={selectedDecorId}
            viewport={viewport}
            isPanning={isPanning}
            gridSize={snapEnabled ? gridSize : 100}
            smartGuides={smartGuides}
            onTableClick={handleTableClick}
            onTableDrag={handleDrag}
            onTableRotate={handleTableRotate}
            onTableZoneChange={(tableId, zone) => {
              setLocalTables(prev => prev.map(t => t.id === tableId ? { ...t, zone } : t));
              updateTable(tableId, { zone });
              qc.invalidateQueries({ queryKey: ["res_tables"] });
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onZoneClick={(id) => { setSelectedZoneId(id); setSelectedIds(new Set()); setSelectedDecorId(null); }}
            onZoneDrag={handleZoneDrag}
            onZoneResize={handleZoneResize}
            onDecorClick={(id) => { setSelectedDecorId(id); setSelectedIds(new Set()); setSelectedZoneId(null); }}
            onDecorDrag={handleDecorDrag}
            onLassoSelect={handleLassoSelect}
            onCanvasClick={handleCanvasClick}
            onWheel={handleWheel}
          />
        </div>

        {/* Properties Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {selectedIds.size > 1
                ? `${selectedIds.size} items selected`
                : selectedTable
                  ? `Edit: ${selectedTable.name}`
                  : selectedZone
                    ? `Zone: ${selectedZone.label}`
                    : selectedDecor
                      ? `Decor: ${selectedDecor.label || DECOR_DEFAULTS[selectedDecor.type].label}`
                      : 'Select an item'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Multi-select panel */}
            {selectedIds.size > 1 ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {selectedIds.size} tables selected. Use the alignment toolbar above the canvas to align or distribute them.
                </p>
                <AlignmentToolbar
                  selectedCount={selectedIds.size}
                  onAlign={handleAlign}
                  onDistribute={handleDistribute}
                  onDuplicate={duplicateSelected}
                  onDelete={handleDeleteTable}
                />
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteTable}>
                  <Trash2 className="w-3 h-3 mr-2" /> Delete Selected ({selectedIds.size})
                </Button>
              </>
            ) : selectedTable ? (
              <>
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={selectedTable.name} onChange={e => handleUpdateSelected('name', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Zone</Label>
                  <Select value={selectedTable.zone} onValueChange={v => handleUpdateSelected('zone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['INDOOR', 'OUTDOOR', 'BAR', 'PRIVATE'] as TableZone[]).map(z => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Shape</Label>
                  <Select value={selectedTable.shape} onValueChange={v => handleUpdateSelected('shape', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['ROUND', 'SQUARE', 'RECTANGLE', 'BAR', 'COUNTER', 'BANQUET'] as TableShape[]).map(s => (
                        <SelectItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Min Seats</Label>
                    <Input type="number" value={selectedTable.min_capacity} onChange={e => handleUpdateSelected('min_capacity', +e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Max Seats</Label>
                    <Input type="number" value={selectedTable.max_capacity} onChange={e => handleUpdateSelected('max_capacity', +e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input type="number" min={40} max={800} value={selectedTable.width} onChange={e => handleUpdateSelected('width', Math.max(40, Math.min(800, +e.target.value)))} />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input type="number" min={30} max={800} value={selectedTable.height} onChange={e => handleUpdateSelected('height', Math.max(30, Math.min(800, +e.target.value)))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Rotation ({selectedTable.rotation})</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={0} max={360} value={selectedTable.rotation} onChange={e => handleUpdateSelected('rotation', +e.target.value % 360)} />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleUpdateSelected('rotation', ((selectedTable.rotation ?? 0) + 45) % 360)}
                      title="Rotate 45 degrees"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteTable}>
                  <Trash2 className="w-3 h-3 mr-2" /> Remove Table
                </Button>
              </>
            ) : selectedZone ? (
              <>
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input value={selectedZone.label} onChange={e => handleUpdateZone('label', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Zone Type</Label>
                  <Select value={selectedZone.zone} onValueChange={v => handleUpdateZone('zone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['INDOOR', 'OUTDOOR', 'BAR', 'PRIVATE'] as TableZone[]).map(z => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Color</Label>
                  <Select value={selectedZone.color} onValueChange={v => handleUpdateZone('color', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ZONE_COLORS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ background: c.value }} />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input type="number" min={100} max={1200} value={selectedZone.width} onChange={e => handleUpdateZone('width', Math.max(100, +e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input type="number" min={80} max={800} value={selectedZone.height} onChange={e => handleUpdateZone('height', Math.max(80, +e.target.value))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">X Position</Label>
                    <Input type="number" min={0} value={selectedZone.x} onChange={e => handleUpdateZone('x', Math.max(0, +e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Y Position</Label>
                    <Input type="number" min={0} value={selectedZone.y} onChange={e => handleUpdateZone('y', Math.max(0, +e.target.value))} />
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteZone}>
                  <Trash2 className="w-3 h-3 mr-2" /> Remove Zone
                </Button>
              </>
            ) : selectedDecor ? (
              <>
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={selectedDecor.type} onValueChange={v => handleUpdateDecor('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_DECOR_TYPES.map(dt => (
                        <SelectItem key={dt} value={dt}>{DECOR_DEFAULTS[dt].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Label</Label>
                  <Input value={selectedDecor.label ?? ''} onChange={e => handleUpdateDecor('label', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input type="number" min={10} max={800} value={selectedDecor.width} onChange={e => handleUpdateDecor('width', Math.max(10, +e.target.value))} />
                  </div>
                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input type="number" min={10} max={800} value={selectedDecor.height} onChange={e => handleUpdateDecor('height', Math.max(10, +e.target.value))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Rotation ({selectedDecor.rotation})</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" min={0} max={360} value={selectedDecor.rotation} onChange={e => handleUpdateDecor('rotation', +e.target.value % 360)} />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => handleUpdateDecor('rotation', ((selectedDecor.rotation ?? 0) + 45) % 360)}
                      title="Rotate 45 degrees"
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button variant="destructive" size="sm" className="w-full" onClick={handleDeleteDecor}>
                  <Trash2 className="w-3 h-3 mr-2" /> Remove Decor
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Click a table or zone to edit its properties.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mini-map overlay */}
      <FloorMiniMap
        tables={localTables}
        zones={localZones}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        zoom={viewport.zoom}
        panX={viewport.panX}
        panY={viewport.panY}
        containerWidth={canvasWidth}
        containerHeight={canvasHeight}
        onViewportJump={handleViewportJump}
      />

      <RoomScanDialog open={showScan} onOpenChange={setShowScan} />
      <TemplatePickerDialog
        open={showTemplatePicker}
        onOpenChange={setShowTemplatePicker}
        onSelectTemplate={handleLoadTemplate}
      />
    </div>
  );
};

export default FloorEditor;
