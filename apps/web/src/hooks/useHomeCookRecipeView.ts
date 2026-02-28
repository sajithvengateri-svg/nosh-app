import { useState, useCallback } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode } from "@/lib/shared/modeConfig";

const STORAGE_KEY = "homeCookRecipeView";

export interface RecipeViewSections {
  recipeType: boolean;
  costDetails: boolean;
  foodCostAlerts: boolean;
  storageNotes: boolean;
  ccp: boolean;
  platingGuide: boolean;
  tastingNotes: boolean;
  complaints: boolean;
}

interface RecipeViewState {
  viewMode: "simple" | "full";
  sections: RecipeViewSections;
}

const defaultState: RecipeViewState = {
  viewMode: "simple",
  sections: {
    recipeType: false,
    costDetails: false,
    foodCostAlerts: false,
    storageNotes: false,
    ccp: false,
    platingGuide: false,
    tastingNotes: false,
    complaints: false,
  },
};

function loadState(): RecipeViewState {
  if (typeof window === "undefined") return defaultState;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultState, ...parsed, sections: { ...defaultState.sections, ...parsed?.sections } };
    }
  } catch { /* ignore */ }
  return defaultState;
}

export const useHomeCookRecipeView = () => {
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  const [state, setState] = useState<RecipeViewState>(loadState);

  const persist = useCallback((next: RecipeViewState) => {
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateViewMode = useCallback((mode: "simple" | "full") => {
    persist({ ...state, viewMode: mode });
  }, [state, persist]);

  const toggleSection = useCallback((key: keyof RecipeViewSections) => {
    const next = { ...state, sections: { ...state.sections, [key]: !state.sections[key] } };
    persist(next);
  }, [state, persist]);

  const showSection = useCallback((key: keyof RecipeViewSections): boolean => {
    if (!isHomeCook) return true; // professional mode shows everything
    if (state.viewMode === "full") return true;
    return state.sections[key];
  }, [isHomeCook, state]);

  const isSimple = isHomeCook && state.viewMode === "simple";

  return {
    viewMode: state.viewMode,
    sections: state.sections,
    isSimple,
    isHomeCook,
    showSection,
    updateViewMode,
    toggleSection,
  };
};
