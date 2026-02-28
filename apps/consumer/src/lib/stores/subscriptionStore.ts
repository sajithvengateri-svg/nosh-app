import { create } from "zustand";
import { supabase } from "../supabase";
import * as WebBrowser from "expo-web-browser";

// ── Types ──────────────────────────────────────────────────────────

type SubStatus = "active" | "cancelled" | "expired" | "trial" | "none";

interface SubscriptionState {
  status: SubStatus;
  expiresAt: string | null;
  isLoading: boolean;

  isNoshPlus: () => boolean;
  fetchSubscription: () => Promise<void>;
  startCheckout: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

// ── Store ──────────────────────────────────────────────────────────

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  status: "none",
  expiresAt: null,
  isLoading: false,

  isNoshPlus: () => {
    const s = get().status;
    return s === "active" || s === "trial";
  },

  fetchSubscription: async () => {
    set({ isLoading: true });
    try {
      const { data } = await supabase
        .from("ds_subscriptions")
        .select("status, current_period_end")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        set({
          status: data.status as SubStatus,
          expiresAt: data.current_period_end,
        });
      }
    } catch {
      // No subscription found
    }
    set({ isLoading: false });
  },

  startCheckout: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await supabase.functions.invoke("nosh-plus-checkout", {
        body: { return_url: "nosh://subscription/success" },
      });

      if (res.data?.url) {
        await WebBrowser.openBrowserAsync(res.data.url);
        // Re-fetch after checkout
        get().fetchSubscription();
      }
    } catch {
      // Silent
    }
  },

  cancelSubscription: async () => {
    try {
      await supabase.functions.invoke("nosh-plus-cancel");
      set({ status: "cancelled" });
    } catch {
      // Silent
    }
  },
}));
