// Res OS UI state — RN-portable, Zustand store
import { create } from 'zustand';
import { format } from 'date-fns';

type ServicePeriodKey = 'breakfast' | 'lunch' | 'dinner' | 'all';
type JourneyStageFilter = 'ARRIVING' | 'SEATED' | 'ORDERED' | 'IN_SERVICE' | 'BILL' | 'LEFT' | null;
type ZoomedSection = 'calendar' | 'command' | 'floor' | null;
type FloorActionMode = 'radial' | 'popover';

interface WaiterRef {
  staffId: string;
  staffName: string;
}

interface ResState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  activeFloorView: 'map' | 'list';
  setActiveFloorView: (view: 'map' | 'list') => void;
  selectedTableId: string | null;
  setSelectedTableId: (id: string | null) => void;
  waitlistFilter: string;
  setWaitlistFilter: (filter: string) => void;
  editorMode: boolean;
  setEditorMode: (mode: boolean) => void;
  // Dashboard state
  servicePeriod: ServicePeriodKey;
  setServicePeriod: (period: ServicePeriodKey) => void;
  journeyFilter: JourneyStageFilter;
  setJourneyFilter: (stage: JourneyStageFilter) => void;
  auditPanelOpen: boolean;
  setAuditPanelOpen: (open: boolean) => void;
  // Mission Control zoom
  zoomedSection: ZoomedSection;
  setZoomedSection: (section: ZoomedSection) => void;
  // Waiter assignment (frontend-only until DB migration)
  zoneWaiterMap: Record<string, WaiterRef>;
  setZoneWaiterMap: (map: Record<string, WaiterRef>) => void;
  tableWaiterOverrides: Record<string, WaiterRef>;
  setTableWaiterOverride: (tableId: string, staff: WaiterRef | null) => void;
  // Floor action mode
  floorActionMode: FloorActionMode;
  setFloorActionMode: (mode: FloorActionMode) => void;
}

export const useResStore = create<ResState>((set) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  setSelectedDate: (date) => set({ selectedDate: date }),
  activeFloorView: 'map',
  setActiveFloorView: (view) => set({ activeFloorView: view }),
  selectedTableId: null,
  setSelectedTableId: (id) => set({ selectedTableId: id }),
  waitlistFilter: 'ALL',
  setWaitlistFilter: (filter) => set({ waitlistFilter: filter }),
  editorMode: false,
  setEditorMode: (mode) => set({ editorMode: mode }),
  // Dashboard
  servicePeriod: 'all',
  setServicePeriod: (period) => set({ servicePeriod: period }),
  journeyFilter: null,
  setJourneyFilter: (stage) => set({ journeyFilter: stage }),
  auditPanelOpen: false,
  setAuditPanelOpen: (open) => set({ auditPanelOpen: open }),
  // Mission Control zoom
  zoomedSection: null,
  setZoomedSection: (section) => set({ zoomedSection: section }),
  // Waiter assignment
  zoneWaiterMap: {},
  setZoneWaiterMap: (map) => set({ zoneWaiterMap: map }),
  tableWaiterOverrides: {},
  setTableWaiterOverride: (tableId, staff) =>
    set((state) => ({
      tableWaiterOverrides: staff
        ? { ...state.tableWaiterOverrides, [tableId]: staff }
        : Object.fromEntries(Object.entries(state.tableWaiterOverrides).filter(([k]) => k !== tableId)),
    })),
  // Floor action mode
  floorActionMode: 'popover',
  setFloorActionMode: (mode) => set({ floorActionMode: mode }),
}));
