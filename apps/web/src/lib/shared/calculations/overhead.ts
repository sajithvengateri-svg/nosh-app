/**
 * OverheadOS — Pure calculation functions for P&L, Break-Even, etc.
 */

import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, differenceInDays, startOfDay, endOfDay } from 'date-fns';

export function getPeriodDates(period: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: format(startOfDay(now), 'yyyy-MM-dd'), end: format(endOfDay(now), 'yyyy-MM-dd') };
    case 'this_week':
      return { start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd') };
    case 'this_month':
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
    case 'custom':
      return { start: customStart || format(startOfMonth(now), 'yyyy-MM-dd'), end: customEnd || format(endOfMonth(now), 'yyyy-MM-dd') };
    default:
      return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(endOfMonth(now), 'yyyy-MM-dd') };
  }
}

export function calcPct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

export function calcBreakEven(fixedCosts: number, contributionMarginPct: number): number {
  if (contributionMarginPct <= 0) return 0;
  return Math.round((fixedCosts / (contributionMarginPct / 100)) * 100) / 100;
}

export function calcDepreciation(purchasePrice: number, salvageValue: number, usefulLifeYears: number): number {
  if (usefulLifeYears <= 0) return 0;
  return Math.round(((purchasePrice - salvageValue) / (usefulLifeYears * 12)) * 100) / 100;
}

export function getBenchmarkStatus(actual: number, target: number, comparison: 'ABOVE' | 'BELOW', warningBuffer = 2): 'ok' | 'warning' | 'critical' {
  if (comparison === 'ABOVE') {
    if (actual > target + warningBuffer) return 'critical';
    if (actual > target - warningBuffer) return 'warning';
    return 'ok';
  } else {
    if (actual < target - warningBuffer) return 'critical';
    if (actual < target + warningBuffer) return 'warning';
    return 'ok';
  }
}

export function calcBreakEvenProgress(fixedCosts: number, contributionMarginPct: number, revenueToDate: number, daysInPeriod: number, daysElapsed: number) {
  const breakEvenRevenue = calcBreakEven(fixedCosts, contributionMarginPct);
  const remaining = Math.max(0, breakEvenRevenue - revenueToDate);
  const daysLeft = Math.max(1, daysInPeriod - daysElapsed);
  const requiredDailyAvg = remaining / daysLeft;
  const currentDailyAvg = daysElapsed > 0 ? revenueToDate / daysElapsed : 0;
  const progressPct = breakEvenRevenue > 0 ? Math.min(100, (revenueToDate / breakEvenRevenue) * 100) : 0;

  return {
    breakEvenRevenue,
    revenueToDate,
    remaining,
    daysLeft,
    requiredDailyAvg: Math.round(requiredDailyAvg),
    currentDailyAvg: Math.round(currentDailyAvg),
    progressPct: Math.round(progressPct),
    onTrack: currentDailyAvg >= requiredDailyAvg,
  };
}
