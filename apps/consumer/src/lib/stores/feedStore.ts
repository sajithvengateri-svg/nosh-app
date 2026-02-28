import { create } from "zustand";
import { supabase } from "../supabase";
import type { FeedCardItem } from "../../features/feed/FeedCard";
import { calculateCooldownDate } from "../engines/recyclingEngine";

// ── Types ──────────────────────────────────────────────────────────

export interface FeedInteraction {
  card_id: string;
  type: "like" | "dismiss" | "save" | "thumbs_down" | "cta_tap";
  reason?: string; // thumbs-down reason
}

// ── Store ──────────────────────────────────────────────────────────

interface FeedState {
  cards: FeedCardItem[];
  isLoading: boolean;
  dismissedIds: Set<string>;

  setCards: (cards: FeedCardItem[]) => void;
  appendCards: (cards: FeedCardItem[]) => void;
  prependCard: (card: FeedCardItem) => void;
  dismissCard: (id: string, permanent?: boolean) => void;
  likeCard: (id: string) => void;
  saveCard: (id: string) => void;
  thumbsDown: (id: string, reason?: string) => void;

  // Log interaction to Supabase (fire-and-forget)
  logInteraction: (interaction: FeedInteraction) => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  cards: [],
  isLoading: false,
  dismissedIds: new Set(),

  setCards: (cards) => set({ cards, isLoading: false }),
  appendCards: (newCards) =>
    set((s) => ({
      cards: [...s.cards, ...newCards.filter((c) => !s.dismissedIds.has(c.id))],
    })),
  prependCard: (card) =>
    set((s) => ({
      cards: [s.cards[0], card, ...s.cards.slice(1)].filter(Boolean) as FeedCardItem[],
    })),

  dismissCard: (id, permanent = false) => {
    set((s) => {
      const dismissedIds = new Set(s.dismissedIds);
      dismissedIds.add(id);
      return {
        cards: s.cards.filter((c) => c.id !== id),
        dismissedIds,
      };
    });

    // Persist cooldown (fire-and-forget)
    // permanent = true → never come back; false → 14-day cooldown
    const cooldownUntil = permanent
      ? new Date(Date.now() + 365 * 10 * 24 * 60 * 60 * 1000) // ~10 years
      : calculateCooldownDate({ reason: "dismissed" });
    supabase
      .from("ds_recipe_cooldowns")
      .upsert(
        {
          recipe_id: id,
          reason: "dismissed",
          cooldown_until: cooldownUntil.toISOString().slice(0, 10),
        },
        { onConflict: "user_id,recipe_id" }
      )
      .then(({ error }) => {
        if (error) console.warn("Cooldown upsert:", error.message);
      });
  },

  likeCard: (id) => {
    get().logInteraction({ card_id: id, type: "like" });
  },

  saveCard: (id) => {
    get().logInteraction({ card_id: id, type: "save" });
  },

  thumbsDown: (id, reason) => {
    get().logInteraction({ card_id: id, type: "thumbs_down", reason });
    get().dismissCard(id);
  },

  logInteraction: async (interaction) => {
    try {
      const card = get().cards.find((c) => c.id === interaction.card_id);
      await supabase.from("ds_feed_impressions").insert({
        card_type: card?.type ?? "unknown",
        card_ref_id: interaction.card_id,
        interacted: true,
        interaction_type: interaction.type,
        interacted_at: new Date().toISOString(),
      });

      // Signal enrichment — personality engine
      if (interaction.type === "like" || interaction.type === "dismiss") {
        const { usePersonalityStore } = await import("./personalityStore");
        usePersonalityStore.getState().logSignal("feed_interaction", JSON.stringify({
          type: interaction.type,
          cardType: card?.type ?? "unknown",
        }));
      }
    } catch (err) {
      // Fire-and-forget — don't block UI
      console.error("logInteraction error:", err);
    }
  },
}));
