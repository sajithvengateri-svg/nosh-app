// Audit store — stub for future implementation
import { create } from 'zustand';

interface AuditState {
  scores: Record<string, number>;
}

export const useAuditStore = create<AuditState>(() => ({
  scores: {},
}));
