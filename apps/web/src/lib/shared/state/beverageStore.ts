import { create } from 'zustand';
import type { BevMainCategory } from '../types/beverage.types';

interface BeverageState {
  // Cellar filters
  selectedCategory: BevMainCategory | 'all';
  setSelectedCategory: (cat: BevMainCategory | 'all') => void;
  subCategoryFilter: string | null;
  setSubCategoryFilter: (sub: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Flash cards
  flashCardMode: 'browse' | 'quiz';
  setFlashCardMode: (mode: 'browse' | 'quiz') => void;
  flashCardCategory: string | null;
  setFlashCardCategory: (cat: string | null) => void;

  // Active stocktake
  activeStocktakeId: string | null;
  setActiveStocktakeId: (id: string | null) => void;

  // Bar prep
  barPrepDate: string;
  setBarPrepDate: (d: string) => void;

  // Draught
  showLineCleaningDue: boolean;
  setShowLineCleaningDue: (v: boolean) => void;
}

export const useBeverageStore = create<BeverageState>((set) => ({
  selectedCategory: 'all',
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  subCategoryFilter: null,
  setSubCategoryFilter: (sub) => set({ subCategoryFilter: sub }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  flashCardMode: 'browse',
  setFlashCardMode: (mode) => set({ flashCardMode: mode }),
  flashCardCategory: null,
  setFlashCardCategory: (cat) => set({ flashCardCategory: cat }),

  activeStocktakeId: null,
  setActiveStocktakeId: (id) => set({ activeStocktakeId: id }),

  barPrepDate: new Date().toISOString().split('T')[0],
  setBarPrepDate: (d) => set({ barPrepDate: d }),

  showLineCleaningDue: false,
  setShowLineCleaningDue: (v) => set({ showLineCleaningDue: v }),
}));
