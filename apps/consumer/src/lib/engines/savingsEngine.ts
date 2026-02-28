/**
 * Savings Engine
 *
 * Calculates weekly savings from meal planning vs ad-hoc buying,
 * aggregates historical data, and provides comparison metrics.
 */

import type { NoshRunRecord } from "../stores/noshRunStore";

// ── Types ──────────────────────────────────────────────────────────

export interface WeekSavings {
  planned: number;
  actual: number;
  savings: number;
  savingsPercent: number;
  mealsCookedAtHome: number;
}

export interface SavingsSnapshot {
  weekStart: string;
  plannedTotal: number;
  actualTotal: number;
  savingsAmount: number;
  mealsCooked: number;
}

export interface AggregatedSavings {
  totalSaved: number;
  avgWeekly: number;
  bestWeek: number;
  totalWeeks: number;
}

// Estimated cost of eating out per person
const AVG_DELIVERY_COST_PER_MEAL = 22;
const AVG_DINE_OUT_COST_PER_MEAL = 35;
const BLENDED_EATING_OUT_COST = 28;

// ── Core Functions ─────────────────────────────────────────────────

/**
 * Calculate savings for a given week from nosh run history.
 */
export function calculateWeekSavings(
  noshRuns: NoshRunRecord[],
  weekStart: Date,
  householdSize: number,
): WeekSavings {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekRuns = noshRuns.filter((r) => {
    const d = new Date(r.date);
    return d >= weekStart && d < weekEnd;
  });

  const actual = weekRuns.reduce((sum, r) => sum + r.totalSpent, 0);
  const mealsCookedAtHome = weekRuns.length;

  // What it would have cost to eat out for these meals
  const planned = mealsCookedAtHome * BLENDED_EATING_OUT_COST * householdSize;
  const savings = Math.max(0, planned - actual);
  const savingsPercent = planned > 0 ? (savings / planned) * 100 : 0;

  return {
    planned: Math.round(planned * 100) / 100,
    actual: Math.round(actual * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    savingsPercent: Math.round(savingsPercent),
    mealsCookedAtHome,
  };
}

/**
 * Aggregate savings across multiple weekly snapshots.
 */
export function aggregateSavings(snapshots: SavingsSnapshot[]): AggregatedSavings {
  if (snapshots.length === 0) {
    return { totalSaved: 0, avgWeekly: 0, bestWeek: 0, totalWeeks: 0 };
  }

  const totalSaved = snapshots.reduce((sum, s) => sum + s.savingsAmount, 0);
  const bestWeek = Math.max(...snapshots.map((s) => s.savingsAmount));

  return {
    totalSaved: Math.round(totalSaved * 100) / 100,
    avgWeekly: Math.round((totalSaved / snapshots.length) * 100) / 100,
    bestWeek: Math.round(bestWeek * 100) / 100,
    totalWeeks: snapshots.length,
  };
}
