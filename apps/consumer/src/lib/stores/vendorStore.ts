import { create } from "zustand";
import { supabase } from "../supabase";
import { SEED_VENDORS, type SeedVendor, type VendorCategory } from "../../data/seedVendors";
import {
  generateDealCode,
  buildQRPayload,
  getExpiresAt,
  isCodeExpired,
} from "../services/dealCodeService";

// ── Types ──────────────────────────────────────────────────────────

export interface VendorDeal {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_value: number | null;
  applicable_categories: string[] | null;
  start_date: string;
  end_date: string;
  is_active: boolean | null;
  created_at: string;
  // Joined vendor info
  vendor_name?: string;
  vendor_logo?: string | null;
}

export interface DealRedemption {
  id: string;
  deal_id: string;
  user_id: string;
  vendor_id: string;
  code: string;
  qr_payload: string;
  status: "active" | "redeemed" | "expired" | "cancelled";
  claimed_at: string;
  expires_at: string;
  redeemed_at: string | null;
  transaction_amount: number | null;
  created_at: string;
  // Joined deal info
  deal_title?: string;
  vendor_name?: string;
}

// ── Store ──────────────────────────────────────────────────────────

interface VendorState {
  vendors: SeedVendor[];
  favouriteIds: Set<string>;
  selectedId: string | null;
  selectedCategory: VendorCategory | null;

  // Deals
  deals: VendorDeal[];
  dealsLoading: boolean;
  myRedemptions: DealRedemption[];
  redemptionsLoading: boolean;
  claimingDealId: string | null;

  loadVendors: () => void;
  toggleFavourite: (vendorId: string) => void;
  selectVendor: (id: string | null) => void;
  setCategory: (cat: VendorCategory | null) => void;

  // Deal actions
  loadActiveDeals: () => Promise<void>;
  claimDeal: (dealId: string, vendorId: string) => Promise<DealRedemption | null>;
  loadMyRedemptions: () => Promise<void>;
  cancelRedemption: (redemptionId: string) => Promise<void>;
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  favouriteIds: new Set<string>(),
  selectedId: null,
  selectedCategory: null,

  deals: [],
  dealsLoading: false,
  myRedemptions: [],
  redemptionsLoading: false,
  claimingDealId: null,

  loadVendors: () => {
    set({ vendors: SEED_VENDORS });
  },

  toggleFavourite: (vendorId: string) => {
    const favs = new Set(get().favouriteIds);
    if (favs.has(vendorId)) {
      favs.delete(vendorId);
    } else {
      favs.add(vendorId);
    }
    set({ favouriteIds: favs });

    // Fire-and-forget to DB
    supabase
      .from("ds_vendor_loyalty")
      .upsert(
        { vendor_id: vendorId, is_favourite: favs.has(vendorId) },
        { onConflict: "user_id,vendor_id" },
      )
      .then(() => {});
  },

  selectVendor: (id) => set({ selectedId: id }),

  setCategory: (cat) => set({ selectedCategory: cat }),

  // ── Deals ──────────────────────────────────────────────────────

  loadActiveDeals: async () => {
    set({ dealsLoading: true });
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("vendor_deals")
        .select("*, vendor_profiles!inner(business_name, logo_url)")
        .eq("is_active", true)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const deals: VendorDeal[] = (data ?? []).map((d: any) => ({
        id: d.id,
        vendor_id: d.vendor_id,
        title: d.title,
        description: d.description,
        discount_percent: d.discount_percent,
        discount_amount: d.discount_amount,
        min_order_value: d.min_order_value,
        applicable_categories: d.applicable_categories,
        start_date: d.start_date,
        end_date: d.end_date,
        is_active: d.is_active,
        created_at: d.created_at,
        vendor_name: d.vendor_profiles?.business_name,
        vendor_logo: d.vendor_profiles?.logo_url,
      }));

      set({ deals, dealsLoading: false });
    } catch (err) {
      console.error("loadActiveDeals error:", err);
      set({ dealsLoading: false });
    }
  },

  claimDeal: async (dealId, vendorId) => {
    set({ claimingDealId: dealId });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const code = generateDealCode();
      const expiresAt = getExpiresAt();
      const qrPayload = buildQRPayload(code);

      const { data, error } = await supabase
        .from("deal_codes")
        .insert({
          code,
          deal_id: dealId,
          vendor_id: vendorId,
          user_id: user.user.id,
          expires_at: expiresAt,
          qr_payload: qrPayload,
        })
        .select()
        .single();

      if (error) throw error;

      const redemption = data as DealRedemption;

      // Add to local redemptions
      set((s) => ({
        myRedemptions: [redemption, ...s.myRedemptions],
        claimingDealId: null,
      }));

      return redemption;
    } catch (err) {
      console.error("claimDeal error:", err);
      set({ claimingDealId: null });
      return null;
    }
  },

  loadMyRedemptions: async () => {
    set({ redemptionsLoading: true });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        set({ redemptionsLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from("deal_codes")
        .select("*, vendor_deals(title), vendor_profiles(business_name)")
        .eq("user_id", user.user.id)
        .order("claimed_at", { ascending: false });

      if (error) throw error;

      // Auto-expire locally if server hasn't caught up
      const redemptions: DealRedemption[] = (data ?? []).map((r: any) => ({
        ...r,
        status: r.status === "active" && isCodeExpired(r.expires_at) ? "expired" : r.status,
        deal_title: r.vendor_deals?.title,
        vendor_name: r.vendor_profiles?.business_name,
      }));

      set({ myRedemptions: redemptions, redemptionsLoading: false });
    } catch (err) {
      console.error("loadMyRedemptions error:", err);
      set({ redemptionsLoading: false });
    }
  },

  cancelRedemption: async (redemptionId) => {
    try {
      const { error } = await supabase
        .from("deal_codes")
        .update({ status: "cancelled" })
        .eq("id", redemptionId);

      if (error) throw error;

      set((s) => ({
        myRedemptions: s.myRedemptions.map((r) =>
          r.id === redemptionId ? { ...r, status: "cancelled" as const } : r
        ),
      }));
    } catch (err) {
      console.error("cancelRedemption error:", err);
    }
  },
}));
