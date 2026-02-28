import { create } from "zustand";
import { supabase } from "../supabase";

// ── Types ──────────────────────────────────────────────────────────

export interface RecipePageView {
  recipe_id: string;
  time_on_page_ms: number;
  scroll_depth_pct: number;
  sections_viewed: string[];
  cta_tapped: string | null;
  ingredients_viewed: boolean;
  vendor_matches_shown: number;
  entered_from: string;
}

export interface FeedSwipeEvent {
  card_id: string;
  card_type: string;
  swipe_direction: "left" | "right";
  time_on_card_ms?: number;
}

// ── Store ──────────────────────────────────────────────────────────

export interface TimerEvent {
  recipeId: string;
  cardId: string;
  action: "start" | "pause" | "resume" | "complete" | "adjust";
}

export interface ShareEvent {
  recipeId: string;
  platform: string;
  format: "square" | "story";
  completed: boolean;
}

export interface CardViewEvent {
  recipeId: string;
  cardId: string;
  durationMs: number;
}

export interface ShoppingEvent {
  recipeId: string;
  action: "start_run" | "complete_run" | "add_item" | "remove_item";
}

export interface FeedbackEvent {
  recipeId: string;
  rating: number;
  wouldCookAgain: boolean | null;
}

interface TrackingStore {
  currentView: Partial<RecipePageView> | null;
  viewStartTime: number | null;

  startPageView: (recipeId: string, enteredFrom: string) => void;
  trackSection: (section: string) => void;
  trackScrollDepth: (depth: number) => void;
  trackCta: (cta: string) => void;
  trackIngredientsViewed: () => void;
  trackVendorMatchesShown: (count: number) => void;
  endPageView: () => void;

  logFeedSwipe: (event: FeedSwipeEvent) => void;
  logTimerEvent: (event: TimerEvent) => void;
  logShareEvent: (event: ShareEvent) => void;
  logCardViewEvent: (event: CardViewEvent) => void;
  logShoppingEvent: (event: ShoppingEvent) => void;
  logFeedbackEvent: (event: FeedbackEvent) => void;
}

export const useTrackingStore = create<TrackingStore>((set, get) => ({
  currentView: null,
  viewStartTime: null,

  startPageView: (recipeId, enteredFrom) => {
    set({
      currentView: {
        recipe_id: recipeId,
        sections_viewed: [],
        scroll_depth_pct: 0,
        cta_tapped: null,
        ingredients_viewed: false,
        vendor_matches_shown: 0,
        entered_from: enteredFrom,
      },
      viewStartTime: Date.now(),
    });
  },

  trackSection: (section) => {
    set((s) => {
      if (!s.currentView) return s;
      const sections = new Set(s.currentView.sections_viewed ?? []);
      sections.add(section);
      return {
        currentView: { ...s.currentView, sections_viewed: [...sections] },
      };
    });
  },

  trackScrollDepth: (depth) => {
    set((s) => {
      if (!s.currentView) return s;
      const current = s.currentView.scroll_depth_pct ?? 0;
      return {
        currentView: {
          ...s.currentView,
          scroll_depth_pct: Math.max(current, Math.min(100, Math.round(depth))),
        },
      };
    });
  },

  trackCta: (cta) => {
    set((s) => {
      if (!s.currentView) return s;
      return { currentView: { ...s.currentView, cta_tapped: cta } };
    });
  },

  trackIngredientsViewed: () => {
    set((s) => {
      if (!s.currentView) return s;
      return {
        currentView: { ...s.currentView, ingredients_viewed: true },
      };
    });
  },

  trackVendorMatchesShown: (count) => {
    set((s) => {
      if (!s.currentView) return s;
      return {
        currentView: { ...s.currentView, vendor_matches_shown: count },
      };
    });
  },

  endPageView: () => {
    const { currentView, viewStartTime } = get();
    if (!currentView?.recipe_id || !viewStartTime) {
      set({ currentView: null, viewStartTime: null });
      return;
    }

    const timeOnPage = Date.now() - viewStartTime;

    // Fire-and-forget insert
    supabase
      .from("ds_recipe_page_views")
      .insert({
        recipe_id: currentView.recipe_id,
        time_on_page_ms: timeOnPage,
        scroll_depth_pct: currentView.scroll_depth_pct ?? 0,
        sections_viewed: currentView.sections_viewed ?? [],
        cta_tapped: currentView.cta_tapped,
        ingredients_viewed: currentView.ingredients_viewed ?? false,
        vendor_matches_shown: currentView.vendor_matches_shown ?? 0,
        entered_from: currentView.entered_from ?? "feed",
      })
      .then(({ error }) => {
        if (error) console.warn("trackingStore.endPageView:", error.message);
      });

    set({ currentView: null, viewStartTime: null });
  },

  logFeedSwipe: (event) => {
    supabase
      .from("ds_feed_impressions")
      .insert({
        card_type: event.card_type,
        card_ref_id: event.card_id,
        interacted: true,
        interaction_type:
          event.swipe_direction === "right" ? "like" : "dismiss",
        swipe_direction: event.swipe_direction,
        time_on_card_ms: event.time_on_card_ms,
        interacted_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("trackingStore.logFeedSwipe:", error.message);
      });
  },

  logTimerEvent: (event) => {
    supabase
      .from("ds_analytics_events")
      .insert({
        event_type: "timer",
        recipe_id: event.recipeId,
        metadata: { card_id: event.cardId, action: event.action },
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("trackingStore.logTimerEvent:", error.message);
      });
  },

  logShareEvent: (event) => {
    supabase
      .from("ds_analytics_events")
      .insert({
        event_type: "share",
        recipe_id: event.recipeId,
        metadata: { platform: event.platform, format: event.format, completed: event.completed },
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("trackingStore.logShareEvent:", error.message);
      });
  },

  logCardViewEvent: (event) => {
    supabase
      .from("ds_analytics_events")
      .insert({
        event_type: "card_view",
        recipe_id: event.recipeId,
        metadata: { card_id: event.cardId, duration_ms: event.durationMs },
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("trackingStore.logCardViewEvent:", error.message);
      });
  },

  logShoppingEvent: (event) => {
    supabase
      .from("ds_analytics_events")
      .insert({
        event_type: "shopping",
        recipe_id: event.recipeId,
        metadata: { action: event.action },
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("trackingStore.logShoppingEvent:", error.message);
      });
  },

  logFeedbackEvent: (event) => {
    supabase
      .from("ds_analytics_events")
      .insert({
        event_type: "feedback",
        recipe_id: event.recipeId,
        metadata: { rating: event.rating, would_cook_again: event.wouldCookAgain },
        created_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("trackingStore.logFeedbackEvent:", error.message);
      });
  },
}));
