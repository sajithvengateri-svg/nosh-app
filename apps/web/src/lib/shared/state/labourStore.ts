import { create } from 'zustand';

type LabourPeriod = 'this_week' | 'last_week' | 'this_fortnight' | 'custom';
type LabourView = 'roster' | 'timesheets' | 'leave' | 'payroll';

interface LabourState {
  selectedPeriod: LabourPeriod;
  customStart: string | null;
  customEnd: string | null;
  activeView: LabourView;
  activeRosterId: string | null;
  sectionFilter: string | null;
  setPeriod: (period: LabourPeriod) => void;
  setCustomRange: (start: string, end: string) => void;
  setActiveView: (view: LabourView) => void;
  setActiveRosterId: (id: string | null) => void;
  setSectionFilter: (section: string | null) => void;
}

export const useLabourStore = create<LabourState>((set) => ({
  selectedPeriod: 'this_week',
  customStart: null,
  customEnd: null,
  activeView: 'roster',
  activeRosterId: null,
  sectionFilter: null,
  setPeriod: (period) => set({ selectedPeriod: period }),
  setCustomRange: (start, end) => set({ customStart: start, customEnd: end, selectedPeriod: 'custom' }),
  setActiveView: (view) => set({ activeView: view }),
  setActiveRosterId: (id) => set({ activeRosterId: id }),
  setSectionFilter: (section) => set({ sectionFilter: section }),
}));
