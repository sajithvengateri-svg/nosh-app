import { create } from 'zustand';
import { 
  RosterConnection, 
  RosterProvider,
  StaffMember,
  Shift,
  DailyRoster,
  LinePrepList,
  LinePrepTask
} from '@/types/menu';

// Empty initial state - no mock data
const initialStaff: StaffMember[] = [];
const initialShifts: Shift[] = [];
const initialLinePrepLists: LinePrepList[] = [];

// Roster connection options (not data, just available providers)
const initialRosterConnections: RosterConnection[] = [
  { id: 'roster-1', provider: 'deputy', displayName: 'Deputy', isConnected: false },
  { id: 'roster-2', provider: 'employment-hero', displayName: 'Employment Hero', isConnected: false },
  { id: 'roster-3', provider: 'tanda', displayName: 'Tanda', isConnected: false },
  { id: 'roster-4', provider: 'planday', displayName: 'Planday', isConnected: false },
];

interface RosterStore {
  staff: StaffMember[];
  shifts: Shift[];
  linePrepLists: LinePrepList[];
  rosterConnections: RosterConnection[];
  selectedRosterProvider: RosterConnection | null;

  // Roster
  getDailyRoster: (date: Date) => DailyRoster;
  getStaffOnDuty: () => StaffMember[];
  connectRoster: (provider: RosterProvider, credentials: any) => void;
  disconnectRoster: (connectionId: string) => void;

  // Shift Overrides
  addShift: (shift: Omit<Shift, 'id'>) => Shift;
  updateShift: (shiftId: string, updates: Partial<Shift>) => void;
  deleteShift: (shiftId: string) => void;

  // Line Prep Lists
  createLinePrepList: (list: Omit<LinePrepList, 'id' | 'status' | 'submittedAt'>) => LinePrepList;
  submitLinePrepList: (listId: string) => void;
  approveLinePrepList: (listId: string, reviewedBy: string, notes?: string) => void;
  rejectLinePrepList: (listId: string, reviewedBy: string, notes: string) => void;
  getLinePrepListsForDate: (date: Date) => LinePrepList[];
  getPendingLinePrepLists: () => LinePrepList[];
}

export const useRosterStore = create<RosterStore>((set, get) => ({
  staff: initialStaff,
  shifts: initialShifts,
  linePrepLists: initialLinePrepLists,
  rosterConnections: initialRosterConnections,
  selectedRosterProvider: null,

  getDailyRoster: (date: Date) => {
    const { shifts, staff } = get();
    const dateStr = date.toDateString();
    const dayShifts = shifts.filter(s => s.date.toDateString() === dateStr);

    const byRole = Object.entries(
      dayShifts.reduce((acc, shift) => {
        acc[shift.role] = (acc[shift.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([role, count]) => ({ role, count }));

    return {
      date,
      shifts: dayShifts,
      totalStaff: dayShifts.length,
      byRole,
    };
  },

  getStaffOnDuty: () => {
    const { shifts, staff } = get();
    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = now.toDateString();

    const onDutyIds = shifts
      .filter(shift => {
        if (shift.date.toDateString() !== todayStr) return false;
        const startHour = parseInt(shift.startTime.split(':')[0]);
        const endHour = parseInt(shift.endTime.split(':')[0]);
        return currentHour >= startHour && currentHour < endHour;
      })
      .map(s => s.staffId);

    return staff.filter(s => onDutyIds.includes(s.id));
  },

  connectRoster: (provider: RosterProvider, credentials: any) => {
    set(state => ({
      rosterConnections: state.rosterConnections.map(c => 
        c.provider === provider 
          ? { ...c, isConnected: true, lastSync: new Date() }
          : c
      ),
      selectedRosterProvider: state.rosterConnections.find(c => c.provider === provider) || null,
    }));
  },

  disconnectRoster: (connectionId: string) => {
    set(state => ({
      rosterConnections: state.rosterConnections.map(c => 
        c.id === connectionId 
          ? { ...c, isConnected: false }
          : c
      ),
      selectedRosterProvider: state.selectedRosterProvider?.id === connectionId ? null : state.selectedRosterProvider,
    }));
  },

  addShift: (shiftData) => {
    const newShift: Shift = {
      ...shiftData,
      id: `shift-override-${Date.now()}`,
      isOverride: true,
    };
    set(state => ({ shifts: [...state.shifts, newShift] }));
    return newShift;
  },

  updateShift: (shiftId: string, updates: Partial<Shift>) => {
    set(state => ({
      shifts: state.shifts.map(s => 
        s.id === shiftId 
          ? { ...s, ...updates, isOverride: true }
          : s
      ),
    }));
  },

  deleteShift: (shiftId: string) => {
    set(state => ({
      shifts: state.shifts.filter(s => s.id !== shiftId),
    }));
  },

  createLinePrepList: (listData) => {
    const newList: LinePrepList = {
      ...listData,
      id: `lpl-${Date.now()}`,
      status: 'draft',
    };
    set(state => ({ linePrepLists: [...state.linePrepLists, newList] }));
    return newList;
  },

  submitLinePrepList: (listId: string) => {
    set(state => ({
      linePrepLists: state.linePrepLists.map(l => 
        l.id === listId 
          ? { ...l, status: 'submitted' as const, submittedAt: new Date() }
          : l
      ),
    }));
  },

  approveLinePrepList: (listId: string, reviewedBy: string, notes?: string) => {
    set(state => ({
      linePrepLists: state.linePrepLists.map(l => 
        l.id === listId 
          ? { ...l, status: 'approved' as const, reviewedBy, reviewedAt: new Date(), reviewNotes: notes }
          : l
      ),
    }));
  },

  rejectLinePrepList: (listId: string, reviewedBy: string, notes: string) => {
    set(state => ({
      linePrepLists: state.linePrepLists.map(l => 
        l.id === listId 
          ? { ...l, status: 'rejected' as const, reviewedBy, reviewedAt: new Date(), reviewNotes: notes }
          : l
      ),
    }));
  },

  getLinePrepListsForDate: (date: Date) => {
    const dateStr = date.toDateString();
    return get().linePrepLists.filter(l => l.forDate.toDateString() === dateStr);
  },

  getPendingLinePrepLists: () => {
    return get().linePrepLists.filter(l => l.status === 'submitted');
  },
}));
