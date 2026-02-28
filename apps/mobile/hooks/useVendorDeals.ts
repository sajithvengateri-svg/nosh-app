import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import { useVendorAuth } from "../contexts/VendorAuthProvider";

const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl ??
  "https://rahociztfiuzyolqvdcz.supabase.co";

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
  updated_at: string;
}

export interface DealRedemption {
  id: string;
  deal_id: string;
  consumer_user_id: string;
  vendor_id: string;
  qr_code_token: string;
  status: "claimed" | "redeemed" | "expired" | "cancelled";
  claimed_at: string;
  redeemed_at: string | null;
  created_at: string;
}

interface CreateDealInput {
  title: string;
  description?: string;
  discount_percent?: number;
  discount_amount?: number;
  min_order_value?: number;
  applicable_categories?: string[];
  start_date: string;
  end_date: string;
}

/**
 * Fetches all deals for the current vendor.
 */
export function useVendorDeals() {
  const { vendorProfile } = useVendorAuth();

  return useQuery({
    queryKey: ["vendor-deals", vendorProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_deals")
        .select("*")
        .eq("vendor_id", vendorProfile!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as VendorDeal[];
    },
    staleTime: 60 * 1000,
    enabled: !!vendorProfile?.id,
  });
}

/**
 * Creates a new deal for the current vendor.
 */
export function useCreateDeal() {
  const { vendorProfile } = useVendorAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDealInput) => {
      const { data, error } = await supabase
        .from("vendor_deals")
        .insert({
          vendor_id: vendorProfile!.id,
          title: input.title,
          description: input.description ?? null,
          discount_percent: input.discount_percent ?? null,
          discount_amount: input.discount_amount ?? null,
          min_order_value: input.min_order_value ?? null,
          applicable_categories: input.applicable_categories ?? [],
          start_date: input.start_date,
          end_date: input.end_date,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as VendorDeal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-deals"] });
    },
  });
}

/**
 * Toggles a deal's active status.
 */
export function useToggleDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("vendor_deals")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-deals"] });
    },
  });
}

/**
 * Fetches redemptions for a specific deal (vendor side).
 */
export function useDealRedemptions(dealId: string | null) {
  return useQuery({
    queryKey: ["deal-redemptions", dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_redemptions")
        .select("*")
        .eq("deal_id", dealId!)
        .order("claimed_at", { ascending: false });

      if (error) throw error;
      return (data || []) as DealRedemption[];
    },
    staleTime: 30 * 1000,
    enabled: !!dealId,
  });
}

/**
 * Verifies and redeems a QR code scanned by the vendor.
 * @deprecated Use useValidateDealCode + useConfirmRedemption for new deal_codes flow
 */
export function useRedeemDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ redemptionId, qrCodeToken }: { redemptionId: string; qrCodeToken: string }) => {
      const { data: redemption, error: fetchError } = await supabase
        .from("deal_redemptions")
        .select("*")
        .eq("id", redemptionId)
        .eq("qr_code_token", qrCodeToken)
        .eq("status", "claimed")
        .single();

      if (fetchError || !redemption) {
        throw new Error("Invalid or already redeemed code");
      }

      const { error: updateError } = await supabase
        .from("deal_redemptions")
        .update({
          status: "redeemed",
          redeemed_at: new Date().toISOString(),
        })
        .eq("id", redemptionId);

      if (updateError) throw updateError;

      return redemption as DealRedemption;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deal-redemptions", data.deal_id] });
    },
  });
}

// ── New deal_codes hooks (monetisation system) ──────────────────

export interface DealCodeInfo {
  valid: boolean;
  deal_code_id: string;
  code: string;
  consumer_first_name: string;
  deal: {
    title: string;
    description: string | null;
    discount_percent: number | null;
    discount_amount: number | null;
    min_order_value: number | null;
  };
  vendor: { business_name: string };
  claimed_at: string;
  expires_at: string;
}

export interface DealCode {
  id: string;
  code: string;
  deal_id: string;
  vendor_id: string;
  user_id: string;
  status: "active" | "redeemed" | "expired";
  claimed_at: string;
  expires_at: string;
  redeemed_at: string | null;
  scanned_by: string | null;
  transaction_amount: number | null;
  created_at: string;
  deal_title?: string;
}

export interface VendorInvoice {
  id: string;
  vendor_id: string;
  invoice_type: "listing" | "usage";
  period_start: string;
  period_end: string;
  redemption_count: number;
  tracked_sales_total: number;
  usage_fee_amount: number;
  gst_amount: number;
  total_amount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "disputed";
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
}

async function callEdgeFunction(
  fnName: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fnName}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      apikey:
        Constants.expoConfig?.extra?.supabaseAnonKey ??
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaG9jaXp0Zml1enlvbHF2ZGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzE5NTUsImV4cCI6MjA4NjgwNzk1NX0.IPRKpotD-LeUjrYdnnxksV1zUnZ0ZePpUd-jIuY3lyg",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Edge function failed (${res.status})`);
  return data;
}

/**
 * Validates a deal code via the deal-redeem edge function.
 * Returns deal info + consumer first name for the confirm screen.
 */
export function useValidateDealCode() {
  return useMutation({
    mutationFn: async ({ code }: { code: string }) => {
      return (await callEdgeFunction("deal-redeem", { code })) as DealCodeInfo;
    },
  });
}

/**
 * Confirms redemption with transaction amount via deal-redeem edge function.
 */
export function useConfirmRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      code,
      transaction_amount,
    }: {
      code: string;
      transaction_amount: number;
    }) => {
      return (await callEdgeFunction("deal-redeem", {
        code,
        transaction_amount,
        confirm: true,
      })) as { success: boolean; redeemed: boolean; deal_title: string; transaction_amount: number; consumer_first_name: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-codes"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-usage"] });
    },
  });
}

/**
 * Fetches vendor's recent redeemed deal codes for the dashboard feed.
 */
export function useVendorRedemptionFeed(limit = 20) {
  const { vendorProfile } = useVendorAuth();

  return useQuery({
    queryKey: ["deal-codes", "feed", vendorProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_codes")
        .select("*, vendor_deals(title)")
        .eq("vendor_id", vendorProfile!.id)
        .eq("status", "redeemed")
        .order("redeemed_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        ...d,
        deal_title: d.vendor_deals?.title,
      })) as DealCode[];
    },
    staleTime: 30 * 1000,
    enabled: !!vendorProfile?.id,
  });
}

/**
 * Aggregates vendor's deal code data for the usage summary card.
 */
export function useVendorUsageSummary() {
  const { vendorProfile } = useVendorAuth();

  return useQuery({
    queryKey: ["vendor-usage", vendorProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_codes")
        .select("status, transaction_amount, redeemed_at")
        .eq("vendor_id", vendorProfile!.id);

      if (error) throw error;

      const redeemed = (data ?? []).filter((d) => d.status === "redeemed");
      const totalSales = redeemed.reduce(
        (sum, d) => sum + (Number(d.transaction_amount) || 0),
        0
      );

      // This week (Mon-Sun)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // Monday
      weekStart.setHours(0, 0, 0, 0);

      const thisWeek = redeemed.filter(
        (d) => d.redeemed_at && new Date(d.redeemed_at) >= weekStart
      );
      const weekSales = thisWeek.reduce(
        (sum, d) => sum + (Number(d.transaction_amount) || 0),
        0
      );

      const LISTING_WEEKLY = 9 / 4; // $9/month pro-rated weekly
      const USAGE_RATE = 0.02;
      const weekUsageFee = weekSales * USAGE_RATE;
      const weekTotalCost = LISTING_WEEKLY + weekUsageFee;
      const weekROI = weekTotalCost > 0 ? Math.round(weekSales / weekTotalCost) : 0;

      return {
        total_customers: redeemed.length,
        total_tracked_sales: Math.round(totalSales * 100) / 100,
        week_customers: thisWeek.length,
        week_tracked_sales: Math.round(weekSales * 100) / 100,
        week_usage_fee: Math.round(weekUsageFee * 100) / 100,
        week_listing_cost: Math.round(LISTING_WEEKLY * 100) / 100,
        week_total_cost: Math.round(weekTotalCost * 100) / 100,
        week_roi: weekROI,
      };
    },
    staleTime: 60 * 1000,
    enabled: !!vendorProfile?.id,
  });
}

/**
 * Fetches vendor's invoices ordered by most recent.
 */
export function useVendorInvoices() {
  const { vendorProfile } = useVendorAuth();

  return useQuery({
    queryKey: ["vendor-invoices", vendorProfile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_invoices")
        .select("*")
        .eq("vendor_id", vendorProfile!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as VendorInvoice[];
    },
    staleTime: 120 * 1000,
    enabled: !!vendorProfile?.id,
  });
}
