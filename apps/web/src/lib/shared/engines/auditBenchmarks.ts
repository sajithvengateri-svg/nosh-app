/**
 * Audit Benchmarks — venue-type-specific targets for all 7 modules.
 * Pure TypeScript, no web APIs. Portable to React Native.
 */

export type VenueType = 'fine_dining' | 'casual_dining' | 'cafe' | 'bar_pub' | 'fast_casual';

export interface VenueBenchmarks {
  food_cost_pct: number;
  bev_cost_pct: number;
  labour_pct: number;
  rent_pct: number;
  prime_cost_pct: number;
  net_profit_pct: number;
  waste_pct: number;
  void_rate_pct: number;
  discount_pct: number;
  cash_variance_pct: number;
  bev_revenue_mix_pct: number;
  avg_spend_per_head: number;
}

const BENCHMARKS: Record<VenueType, VenueBenchmarks> = {
  fine_dining: {
    food_cost_pct: 32,
    bev_cost_pct: 20,
    labour_pct: 30,
    rent_pct: 8,
    prime_cost_pct: 62,
    net_profit_pct: 12,
    waste_pct: 3,
    void_rate_pct: 2,
    discount_pct: 2,
    cash_variance_pct: 0.5,
    bev_revenue_mix_pct: 35,
    avg_spend_per_head: 150,
  },
  casual_dining: {
    food_cost_pct: 30,
    bev_cost_pct: 22,
    labour_pct: 28,
    rent_pct: 10,
    prime_cost_pct: 60,
    net_profit_pct: 10,
    waste_pct: 3,
    void_rate_pct: 2,
    discount_pct: 3,
    cash_variance_pct: 0.5,
    bev_revenue_mix_pct: 30,
    avg_spend_per_head: 65,
  },
  cafe: {
    food_cost_pct: 28,
    bev_cost_pct: 18,
    labour_pct: 32,
    rent_pct: 12,
    prime_cost_pct: 60,
    net_profit_pct: 8,
    waste_pct: 3,
    void_rate_pct: 1.5,
    discount_pct: 2,
    cash_variance_pct: 0.5,
    bev_revenue_mix_pct: 25,
    avg_spend_per_head: 22,
  },
  bar_pub: {
    food_cost_pct: 28,
    bev_cost_pct: 25,
    labour_pct: 25,
    rent_pct: 10,
    prime_cost_pct: 55,
    net_profit_pct: 12,
    waste_pct: 2,
    void_rate_pct: 2,
    discount_pct: 3,
    cash_variance_pct: 0.5,
    bev_revenue_mix_pct: 60,
    avg_spend_per_head: 45,
  },
  fast_casual: {
    food_cost_pct: 25,
    bev_cost_pct: 15,
    labour_pct: 25,
    rent_pct: 12,
    prime_cost_pct: 55,
    net_profit_pct: 10,
    waste_pct: 2,
    void_rate_pct: 1,
    discount_pct: 2,
    cash_variance_pct: 0.3,
    bev_revenue_mix_pct: 15,
    avg_spend_per_head: 18,
  },
};

export function getBenchmarks(venueType: VenueType): VenueBenchmarks {
  return BENCHMARKS[venueType] ?? BENCHMARKS.casual_dining;
}

export function getBenchmark(venueType: VenueType, metric: keyof VenueBenchmarks): number {
  return getBenchmarks(venueType)[metric];
}

// ─── Score Band Utilities ────────────────────────────────
export type ScoreBand = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export function scoreBand(score: number): ScoreBand {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
}

export const MODULE_WEIGHTS: Record<string, number> = {
  food: 0.15,
  beverage: 0.10,
  labour: 0.20,
  overhead: 0.20,
  service: 0.15,
  marketing: 0.10,
  compliance: 0.10,
};

// ─── HIGA Award Rates MA000009 (effective 1 July 2025) ───
export const HIGA_AWARD_RATES = {
  level_1: 23.54,
  level_2: 24.29,
  level_3: 25.05,
  level_4: 25.96,
  level_5: 27.22,
  level_6: 28.13,
  casual_loading: 0.25,
  saturday_loading: 0.25,
  sunday_loading_ft: 0.50,
  sunday_loading_casual: 0.75,
  public_holiday_ft: 1.00,
  public_holiday_casual: 1.25,
  overtime_first_2h: 1.50,
  overtime_after_2h: 2.00,
  split_shift_allowance: 5.22,
  super_rate: 0.12,
  min_break_hours: 10,
  meal_break_after_hours: 5,
  meal_break_minutes: 30,
  casual_conversion_months: 6,
  record_retention_years: 7,
};

// ─── Score Threshold Tables ──────────────────────────────
export interface ThresholdEntry {
  max: number;
  score: number;
}

export const FOOD_AVT_THRESHOLDS: ThresholdEntry[] = [
  { max: 1, score: 100 },
  { max: 2, score: 90 },
  { max: 3, score: 75 },
  { max: 5, score: 55 },
  { max: 8, score: 35 },
  { max: Infinity, score: 15 },
];

export const WASTE_THRESHOLDS: ThresholdEntry[] = [
  { max: 1.5, score: 100 },
  { max: 3, score: 85 },
  { max: 5, score: 60 },
  { max: 8, score: 35 },
  { max: Infinity, score: 15 },
];

export const POUR_COST_THRESHOLDS: ThresholdEntry[] = [
  { max: 20, score: 100 },
  { max: 22, score: 90 },
  { max: 25, score: 70 },
  { max: 28, score: 50 },
  { max: 32, score: 30 },
  { max: Infinity, score: 10 },
];

export const DEAD_STOCK_THRESHOLDS: ThresholdEntry[] = [
  { max: 2, score: 100 },
  { max: 5, score: 85 },
  { max: 10, score: 60 },
  { max: 15, score: 35 },
  { max: Infinity, score: 15 },
];

export const VOID_RATE_THRESHOLDS: ThresholdEntry[] = [
  { max: 1, score: 100 },
  { max: 2, score: 90 },
  { max: 3, score: 70 },
  { max: 5, score: 45 },
  { max: Infinity, score: 15 },
];

export const DISCOUNT_THRESHOLDS: ThresholdEntry[] = [
  { max: 1, score: 100 },
  { max: 3, score: 85 },
  { max: 5, score: 60 },
  { max: 8, score: 35 },
  { max: Infinity, score: 10 },
];

export const CASH_VARIANCE_THRESHOLDS: ThresholdEntry[] = [
  { max: 0.3, score: 100 },
  { max: 0.5, score: 90 },
  { max: 1, score: 70 },
  { max: 2, score: 45 },
  { max: Infinity, score: 10 },
];

export const RENT_THRESHOLDS: ThresholdEntry[] = [
  { max: 7, score: 100 },
  { max: 10, score: 85 },
  { max: 12, score: 65 },
  { max: 15, score: 40 },
  { max: Infinity, score: 10 },
];

export const PRIME_COST_THRESHOLDS: ThresholdEntry[] = [
  { max: 60, score: 100 },
  { max: 65, score: 85 },
  { max: 68, score: 70 },
  { max: 72, score: 50 },
  { max: 75, score: 30 },
  { max: Infinity, score: 10 },
];

export const NET_PROFIT_THRESHOLDS: ThresholdEntry[] = [
  { max: -Infinity, score: 0 }, // handled separately in engine
];

export function scoreFromThresholds(value: number, thresholds: ThresholdEntry[]): number {
  for (const t of thresholds) {
    if (value <= t.max) return t.score;
  }
  return thresholds[thresholds.length - 1]?.score ?? 0;
}

/** Net profit is inverse — higher is better */
export function scoreNetProfit(pct: number): number {
  if (pct >= 15) return 100;
  if (pct >= 12) return 90;
  if (pct >= 10) return 80;
  if (pct >= 8) return 70;
  if (pct >= 5) return 50;
  if (pct >= 0) return 25;
  return 0;
}
