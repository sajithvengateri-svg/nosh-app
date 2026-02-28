import { create } from "zustand";
import { Linking, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";
import type { Recipe } from "./recipeStore";
import type { PantryItem } from "./pantryStore";
import { useFeedStore } from "./feedStore";
import { supabase } from "../supabase";
import { SEED_VENDORS } from "../../data/seedVendors";
import {
  buildTieredIngredients,
  calculateTotals,
  applyPreset as applyPresetEngine,
  applySliderPosition as applySliderEngine,
} from "../engines/tierEngine";
import type { Tier, TieredIngredient, NoshBasket } from "../engines/tierEngine";
import {
  buildMapsDeepLink,
  buildClipboardList,
  buildDeliverySearchUrl,
} from "../utils/noshRunUtils";
import {
  buildSmartDefaults,
  applySmartDefaults,
  applyTimeAwareness,
  recordTierSelections,
} from "../engines/smartDefaultsEngine";
import { successNotification } from "../haptics";

// ── Types ──────────────────────────────────────────────────────────

type NoshRunStatus = "idle" | "picking" | "going" | "delivering" | "done";

export interface NoshRunRecord {
  recipeTitle: string;
  date: string;
  totalSpent: number;
  itemCount: number;
}

interface NoshRunState {
  status: NoshRunStatus;
  basket: NoshBasket | null;
  sliderPosition: number;
  activePreset: "tight_week" | "balanced" | "treat" | null;
  storeName: string | null;
  smartDefaultsApplied: boolean;

  // Run history
  runHistory: NoshRunRecord[];

  startRun: (recipe: Recipe, pantryItems: PantryItem[]) => void;
  selectTier: (ingredientId: string, tier: Tier) => void;
  lockIngredient: (ingredientId: string) => void;
  setSlider: (position: number) => void;
  applyPreset: (preset: "tight_week" | "balanced" | "treat") => void;
  goToMaps: (storeName: string) => void;
  goToDelivery: () => void;
  markGotEverything: () => void;
  cancelRun: () => void;
  fetchRunHistory: () => Promise<void>;
}

// ── Store ──────────────────────────────────────────────────────────

export const useNoshRunStore = create<NoshRunState>((set, get) => ({
  status: "idle",
  basket: null,
  sliderPosition: 0,
  activePreset: null,
  storeName: null,
  smartDefaultsApplied: false,
  runHistory: [],

  startRun: (recipe, pantryItems) => {
    const items = buildTieredIngredients(recipe, SEED_VENDORS, pantryItems);
    const totals = calculateTotals(items);

    set({
      status: "picking",
      basket: {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        items,
        totals,
      },
      sliderPosition: 0,
      activePreset: null,
      storeName: null,
      smartDefaultsApplied: false,
    });

    // Silently auto-apply learned tier defaults with time awareness
    buildSmartDefaults().then((raw) => {
      if (!raw.hasData) return;
      const { basket } = get();
      if (!basket || basket.recipeId !== recipe.id) return;

      const now = new Date();
      const defaults = applyTimeAwareness(raw, {
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        isWeekend: now.getDay() === 0 || now.getDay() === 6,
      });

      const updated = applySmartDefaults(basket.items, defaults);
      const newTotals = calculateTotals(updated);
      set({
        basket: { ...basket, items: updated, totals: newTotals },
        smartDefaultsApplied: true,
      });
    });
  },

  selectTier: (ingredientId, tier) => {
    const { basket } = get();
    if (!basket) return;

    const items = basket.items.map((item) =>
      item.ingredient.id === ingredientId
        ? { ...item, selectedTier: tier, isLocked: true }
        : item,
    );
    const totals = calculateTotals(items);

    set({
      basket: { ...basket, items, totals },
      activePreset: null,
    });
  },

  lockIngredient: (ingredientId) => {
    const { basket } = get();
    if (!basket) return;

    const items = basket.items.map((item) =>
      item.ingredient.id === ingredientId
        ? { ...item, isLocked: !item.isLocked }
        : item,
    );
    set({ basket: { ...basket, items } });
  },

  setSlider: (position) => {
    const { basket } = get();
    if (!basket) return;

    const items = applySliderEngine(basket.items, position);
    const totals = calculateTotals(items);

    set({
      sliderPosition: position,
      basket: { ...basket, items, totals },
      activePreset: null,
    });
  },

  applyPreset: (preset) => {
    const { basket } = get();
    if (!basket) return;

    const items = applyPresetEngine(basket.items, preset);
    const totals = calculateTotals(items);

    // Map preset to approximate slider position
    const sliderMap = { tight_week: 0, balanced: 0.4, treat: 0.85 };

    set({
      activePreset: preset,
      sliderPosition: sliderMap[preset],
      basket: { ...basket, items, totals },
    });
  },

  goToMaps: (storeName) => {
    set({ status: "going", storeName });
    const url = buildMapsDeepLink(storeName);
    Linking.openURL(url).catch(() => {
      // Fallback to google maps web
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeName)}`,
      );
    });
  },

  goToDelivery: async () => {
    const { basket } = get();
    if (!basket) return;

    // Copy shopping list to clipboard
    const text = buildClipboardList(basket);
    await Clipboard.setStringAsync(text);

    set({ status: "delivering" });

    // Open a general delivery search
    const url = buildDeliverySearchUrl("grocery delivery near me");
    await WebBrowser.openBrowserAsync(url);
  },

  markGotEverything: () => {
    const { basket } = get();
    if (!basket) return;

    successNotification();

    // Record tier selections for smart defaults learning
    recordTierSelections(basket.items).catch(() => {});

    // Inject ReadyToCookCard into feed
    const feedStore = useFeedStore.getState();
    feedStore.prependCard({
      id: `ready-${basket.recipeId}-${Date.now()}`,
      type: "ready_to_cook",
      data: {
        recipeId: basket.recipeId,
        recipeTitle: basket.recipeTitle,
        basketTotal: basket.totals.current,
        completedAt: Date.now(),
      },
    });

    // Signal enrichment — personality engine
    import("./personalityStore").then(({ usePersonalityStore }) => {
      usePersonalityStore.getState().logSignal("nosh_run_complete", JSON.stringify({
        recipeId: basket.recipeId,
        total: basket.totals.current,
      }));
    });

    // Record run history
    const record: NoshRunRecord = {
      recipeTitle: basket.recipeTitle,
      date: new Date().toISOString(),
      totalSpent: basket.totals.current,
      itemCount: basket.items.length,
    };

    set((s) => ({
      status: "done",
      basket: null,
      sliderPosition: 0,
      activePreset: null,
      storeName: null,
      smartDefaultsApplied: false,
      runHistory: [record, ...s.runHistory].slice(0, 50),
    }));

    // Persist to DB
    supabase
      .from("ds_nosh_runs")
      .insert({
        recipe_title: record.recipeTitle,
        total_spent: record.totalSpent,
        item_count: record.itemCount,
      })
      .then(() => {});
  },

  cancelRun: () => {
    set({
      status: "idle",
      basket: null,
      sliderPosition: 0,
      activePreset: null,
      storeName: null,
      smartDefaultsApplied: false,
    });
  },

  fetchRunHistory: async () => {
    try {
      const { data } = await supabase
        .from("ds_nosh_runs")
        .select("recipe_title, created_at, total_spent, item_count")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        set({
          runHistory: data.map((r) => ({
            recipeTitle: r.recipe_title,
            date: r.created_at,
            totalSpent: r.total_spent,
            itemCount: r.item_count,
          })),
        });
      }
    } catch {
      // Silent
    }
  },
}));
