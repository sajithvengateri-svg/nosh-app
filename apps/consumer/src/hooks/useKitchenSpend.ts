import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthProvider";

export type SpendPeriod = "week" | "month" | "year";

export interface ReceiptRow {
  id: string;
  store_name: string | null;
  total: number;
  receipt_date: string;
  image_url: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

function periodDays(period: SpendPeriod): number {
  switch (period) {
    case "week":
      return 7;
    case "month":
      return 30;
    case "year":
      return 365;
  }
}

function getDateRange(
  period: SpendPeriod,
  offset: number,
): { start: Date; end: Date; label: string } {
  const now = new Date();

  switch (period) {
    case "week": {
      const end = new Date(now);
      end.setDate(end.getDate() - offset * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
      return {
        start,
        end,
        label: offset === 0 ? "This Week" : `${fmt(start)} – ${fmt(end)}`,
      };
    }
    case "month": {
      const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const start = new Date(target);
      const end =
        offset === 0
          ? new Date(now)
          : new Date(target.getFullYear(), target.getMonth() + 1, 0);
      return {
        start,
        end,
        label:
          offset === 0
            ? "This Month"
            : target.toLocaleDateString("en-AU", {
                month: "long",
                year: "numeric",
              }),
      };
    }
    case "year": {
      const year = now.getFullYear() - offset;
      const start = new Date(year, 0, 1);
      const end = offset === 0 ? new Date(now) : new Date(year, 11, 31);
      return {
        start,
        end,
        label: offset === 0 ? "This Year" : `${year}`,
      };
    }
  }
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useKitchenSpend() {
  const { profile } = useAuth();
  const [period, setPeriodRaw] = useState<SpendPeriod>("week");
  const [offset, setOffset] = useState(0);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const householdSize = profile?.household_size ?? 1;
  const { start, end, label } = getDateRange(period, offset);
  const totalSpend = receipts.reduce((sum, r) => sum + (r.total ?? 0), 0);
  const days = periodDays(period);
  const mealsPerPeriod = householdSize * 3 * days;
  const costPerMeal = mealsPerPeriod > 0 ? totalSpend / mealsPerPeriod : 0;

  const fetchReceipts = useCallback(async () => {
    const { start: s, end: e } = getDateRange(period, offset);
    setIsLoading(true);
    const startStr = s.toISOString().slice(0, 10);
    const endStr = e.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("ds_receipts")
      .select("id, store_name, total, receipt_date, image_url, created_at")
      .gte("receipt_date", startStr)
      .lte("receipt_date", endStr)
      .order("receipt_date", { ascending: false });

    if (error) {
      console.warn("fetchReceipts:", error.message);
    } else {
      setReceipts((data ?? []) as ReceiptRow[]);
    }
    setIsLoading(false);
  }, [period, offset]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const setPeriod = useCallback((p: SpendPeriod) => {
    setPeriodRaw(p);
    setOffset(0);
  }, []);

  return {
    period,
    setPeriod,
    periodLabel: label,
    offset,
    goBack: () => setOffset((o) => o + 1),
    goForward: () => setOffset((o) => Math.max(0, o - 1)),
    canGoForward: offset > 0,
    totalSpend,
    costPerMeal,
    mealsPerPeriod,
    receipts,
    isLoading,
    refresh: fetchReceipts,
  };
}
