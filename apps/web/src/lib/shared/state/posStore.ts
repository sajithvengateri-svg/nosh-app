// POS Zustand Store — offline-ready, RN-compatible via persist adapter swap

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, POSOrderType, SyncQueueEntry, POSStaff } from '../types/pos.types';

interface POSState {
  // Active staff session
  activeStaff: POSStaff | null;
  setActiveStaff: (staff: POSStaff | null) => void;

  // Cart
  cart: CartItem[];
  orderType: POSOrderType;
  tableNumber: string;
  tabId: string | null;
  orderNotes: string;
  addToCart: (item: CartItem) => void;
  removeFromCart: (tempId: string) => void;
  updateCartItemQty: (tempId: string, qty: number) => void;
  clearCart: () => void;
  setOrderType: (type: POSOrderType) => void;
  setTableNumber: (num: string) => void;
  setTabId: (id: string | null) => void;
  setOrderNotes: (notes: string) => void;

  // Active order
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;

  // Terminal
  terminalStatus: 'connected' | 'busy' | 'disconnected';
  setTerminalStatus: (s: 'connected' | 'busy' | 'disconnected') => void;

  // Offline sync queue
  syncQueue: SyncQueueEntry[];
  addToSyncQueue: (entry: Omit<SyncQueueEntry, 'id' | 'timestamp' | 'synced'>) => void;
  markSynced: (id: string) => void;
  clearSyncedEntries: () => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set) => ({
      activeStaff: null,
      setActiveStaff: (staff) => set({ activeStaff: staff }),

      cart: [],
      orderType: 'DINE_IN',
      tableNumber: '',
      tabId: null,
      orderNotes: '',
      addToCart: (item) => set((s) => ({ cart: [...s.cart, item] })),
      removeFromCart: (tempId) => set((s) => ({ cart: s.cart.filter(i => i.tempId !== tempId) })),
      updateCartItemQty: (tempId, qty) =>
        set((s) => ({
          cart: qty <= 0
            ? s.cart.filter(i => i.tempId !== tempId)
            : s.cart.map(i => (i.tempId === tempId ? { ...i, quantity: qty } : i)),
        })),
      clearCart: () => set({ cart: [], orderNotes: '', tableNumber: '', tabId: null }),
      setOrderType: (type) => set({ orderType: type }),
      setTableNumber: (num) => set({ tableNumber: num }),
      setTabId: (id) => set({ tabId: id }),
      setOrderNotes: (notes) => set({ orderNotes: notes }),

      activeOrderId: null,
      setActiveOrderId: (id) => set({ activeOrderId: id }),

      terminalStatus: 'disconnected',
      setTerminalStatus: (s) => set({ terminalStatus: s }),

      syncQueue: [],
      addToSyncQueue: (entry) =>
        set((s) => ({
          syncQueue: [
            ...s.syncQueue,
            { ...entry, id: crypto.randomUUID(), timestamp: Date.now(), synced: false },
          ],
        })),
      markSynced: (id) =>
        set((s) => ({
          syncQueue: s.syncQueue.map(e => (e.id === id ? { ...e, synced: true } : e)),
        })),
      clearSyncedEntries: () =>
        set((s) => ({ syncQueue: s.syncQueue.filter(e => !e.synced) })),
    }),
    {
      name: 'pos-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        orderType: state.orderType,
        tableNumber: state.tableNumber,
        tabId: state.tabId,
        orderNotes: state.orderNotes,
        syncQueue: state.syncQueue,
        activeStaff: state.activeStaff,
      }),
    }
  )
);
