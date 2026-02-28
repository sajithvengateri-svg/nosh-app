import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Wine } from '../data/mockWines';

interface CellarItem {
  wine: Wine;
  quantity: number;
  addedAt: string;
  purchasePrice: number;
}

interface CartItem {
  wine: Wine;
  quantity: number;
}

interface WingState {
  // Palate
  palateAnswers: Record<string, string>;
  flavorCluster: string | null;
  userName: string;
  hasCompletedAssessment: boolean;

  // Cart
  cart: CartItem[];

  // Virtual Cellar
  cellar: CellarItem[];

  // Actions - Palate
  setPalateAnswer: (questionId: string, answer: string) => void;
  setFlavorCluster: (cluster: string) => void;
  setUserName: (name: string) => void;
  completeAssessment: () => void;

  // Actions - Cart
  addToCart: (wine: Wine, quantity?: number) => void;
  removeFromCart: (wineId: string) => void;
  clearCart: () => void;

  // Actions - Cellar
  addToCellar: (wine: Wine, quantity?: number) => void;
  removeFromCellar: (wineId: string) => void;
}

export const useWingStore = create<WingState>()(
  persist(
    (set, get) => ({
      palateAnswers: {},
      flavorCluster: null,
      userName: 'James',
      hasCompletedAssessment: false,
      cart: [],
      cellar: [
        // Pre-seed some cellar items for demo
      ],

      setPalateAnswer: (questionId, answer) =>
        set((state) => ({
          palateAnswers: { ...state.palateAnswers, [questionId]: answer },
        })),

      setFlavorCluster: (cluster) => set({ flavorCluster: cluster }),

      setUserName: (name) => set({ userName: name }),

      completeAssessment: () => set({ hasCompletedAssessment: true }),

      addToCart: (wine, quantity = 1) =>
        set((state) => {
          const existing = state.cart.find((item) => item.wine.id === wine.id);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.wine.id === wine.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { cart: [...state.cart, { wine, quantity }] };
        }),

      removeFromCart: (wineId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.wine.id !== wineId),
        })),

      clearCart: () => set({ cart: [] }),

      addToCellar: (wine, quantity = 1) =>
        set((state) => {
          const existing = state.cellar.find((item) => item.wine.id === wine.id);
          if (existing) {
            return {
              cellar: state.cellar.map((item) =>
                item.wine.id === wine.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            cellar: [
              ...state.cellar,
              {
                wine,
                quantity,
                addedAt: new Date().toISOString(),
                purchasePrice: wine.memberPrice,
              },
            ],
          };
        }),

      removeFromCellar: (wineId) =>
        set((state) => ({
          cellar: state.cellar.filter((item) => item.wine.id !== wineId),
        })),
    }),
    {
      name: 'wing-store',
    }
  )
);
