/**
 * Quiet Audit Engine — Master scoring orchestrator for all 7 modules.
 * Pure TypeScript, no web APIs. Portable to React Native.
 */

import {
  VenueType, getBenchmark, scoreBand, ScoreBand, MODULE_WEIGHTS,
  scoreFromThresholds, scoreNetProfit,
  FOOD_AVT_THRESHOLDS, WASTE_THRESHOLDS, POUR_COST_THRESHOLDS,
  DEAD_STOCK_THRESHOLDS, VOID_RATE_THRESHOLDS, DISCOUNT_THRESHOLDS,
  CASH_VARIANCE_THRESHOLDS, RENT_THRESHOLDS, PRIME_COST_THRESHOLDS,
} from './auditBenchmarks';

// ─── Types ───────────────────────────────────────────────
export interface SubScore {
  name: string;
  weight: number;
  score: number;
  value: string;
  target: string;
  status: 'GOOD' | 'FAIR' | 'POOR';
  dataSource: 'INTERNAL' | 'DOCUMENT' | 'QUESTIONNAIRE' | 'ESTIMATED';
  recommendation: Recommendation | null;
}

export interface Recommendation {
  action: string;
  how: string;
  savingsMonthly: number;
  liabilityReduction?: number;
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH';
  timeToEffect: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  module: string;
}

export interface ModuleResult {
  module: string;
  label: string;
  icon: string;
  weight: number;
  score: number;
  prevScore: number;
  band: ScoreBand;
  trend: 'up' | 'down' | 'stable';
  subScores: SubScore[];
  dataCompleteness: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AuditResult {
  overallScore: number;
  overallBand: ScoreBand;
  modules: ModuleResult[];
  recommendations: Recommendation[];
  totalAnnualSavings: number;
  totalLiabilities: number;
  dataCompleteness: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  complianceRedLines: string[];
}

export interface AuditInputData {
  venueType: VenueType;
  source: 'INTERNAL' | 'EXTERNAL';
  // Food
  actualFoodCostPct?: number;
  theoreticalFoodCostPct?: number;
  wastePct?: number;
  menuStarsPct?: number;
  menuPlowhorsePct?: number;
  menuDogsCount?: number;
  menuPuzzlesCount?: number;
  supplierCount?: number;
  supplierPriceCompare?: boolean;
  usePrepLists?: boolean;
  prepCompletionRate?: number;
  monthlyFoodRevenue?: number;
  monthlyFoodPurchases?: number;
  // Beverage
  actualBevCostPct?: number;
  deadStockPct?: number;
  stocktakeVariancePct?: number;
  listReviewDays?: number;
  coravinYieldPct?: number;
  useCoravin?: boolean;
  bevRevenueMixPct?: number;
  // Labour
  labourCostPct?: number;
  overtimeHoursWeekly?: number;
  overtimeBudgetHours?: number;
  awardCompliant?: boolean;
  casualLoadingApplied?: boolean;
  casualConversionOffered?: boolean;
  superRate?: number;
  paysSuperOnTime?: boolean;
  staffCount?: number;
  casualCount?: number;
  coversPerDay?: number;
  fatigueCompliant?: boolean;
  breakCompliant?: boolean;
  monthlyLabourCost?: number;
  // Overhead
  totalOverheadPct?: number;
  rentPct?: number;
  primeCostPct?: number;
  netProfitPct?: number;
  breakEvenDayOfMonth?: number;
  prevBreakEvenDay?: number;
  pnlDataCompletePct?: number;
  monthlyRevenue?: number;
  monthlyRent?: number;
  // Service
  voidRatePct?: number;
  avgServiceMinutes?: number;
  paymentEfficiencyScore?: number;
  discountPct?: number;
  cashVariancePct?: number;
  // Marketing
  campaignsPerMonth?: number;
  emailOpenRate?: number;
  roas?: number;
  quietNightsTargeted?: boolean;
  repeatCustomerPct?: number;
  databaseSize?: number;
  monthlyMarketingSpend?: number;
  // Compliance
  liquorLicenseCurrent?: boolean;
  foodSafetyCertCurrent?: boolean;
  rsaCurrent?: boolean;
  workersCompCurrent?: boolean;
  stpPhase2Compliant?: boolean;
  payslipCompliant?: boolean;
  rightToDisconnectPolicy?: boolean;
  inductionRecordsComplete?: boolean;
  recordRetentionYears?: number;
  writtenContracts?: boolean;
  // Previous scores for trend
  prevScores?: Record<string, number>;
}

// ─── Helpers ─────────────────────────────────────────────
function statusFromScore(s: number): 'GOOD' | 'FAIR' | 'POOR' {
  return s >= 75 ? 'GOOD' : s >= 60 ? 'FAIR' : 'POOR';
}

function trend(current: number, prev: number | undefined): 'up' | 'down' | 'stable' {
  if (prev === undefined) return 'stable';
  const diff = current - prev;
  return diff >= 2 ? 'up' : diff <= -2 ? 'down' : 'stable';
}

function dataSource(src: 'INTERNAL' | 'EXTERNAL'): SubScore['dataSource'] {
  return src === 'INTERNAL' ? 'INTERNAL' : 'QUESTIONNAIRE';
}

function weightedAverage(scores: SubScore[]): number {
  const totalWeight = scores.reduce((s, sc) => s + sc.weight, 0);
  if (totalWeight === 0) return 0;
  return Math.round(scores.reduce((s, sc) => s + sc.score * sc.weight, 0) / totalWeight);
}

// ─── Module Scoring Functions ────────────────────────────

function scoreFood(d: AuditInputData): ModuleResult {
  const benchmark = getBenchmark(d.venueType, 'food_cost_pct');
  const src = dataSource(d.source);
  const subScores: SubScore[] = [];

  // 1. AvT Variance
  const avtGap = d.theoreticalFoodCostPct != null && d.actualFoodCostPct != null
    ? Math.abs(d.actualFoodCostPct - d.theoreticalFoodCostPct) : 3;
  subScores.push({
    name: 'AvT Variance', weight: 0.25,
    score: scoreFromThresholds(avtGap, FOOD_AVT_THRESHOLDS),
    value: `${avtGap.toFixed(1)}% gap`, target: '< 2%',
    status: statusFromScore(scoreFromThresholds(avtGap, FOOD_AVT_THRESHOLDS)),
    dataSource: src,
    recommendation: avtGap > 2 ? {
      action: `Reduce AvT gap from ${avtGap.toFixed(1)}% to under 2%`,
      how: 'Implement portion control on top 10 dishes. Cross-check supplier invoices against recipe costs.',
      savingsMonthly: (d.monthlyFoodRevenue ?? 40000) * (avtGap - 2) / 100,
      difficulty: 'MEDIUM', timeToEffect: '2-4 weeks', priority: 'HIGH', module: 'Food',
    } : null,
  });

  // 2. Food Cost % vs Benchmark
  const fcPct = d.actualFoodCostPct ?? 31;
  const deviation = fcPct - benchmark;
  const fcScore = deviation <= -2 ? 100 : deviation <= 0 ? 90 : deviation <= 2 ? 70 : deviation <= 4 ? 50 : deviation <= 6 ? 30 : 10;
  subScores.push({
    name: 'Food Cost % vs Benchmark', weight: 0.20,
    score: fcScore, value: `${fcPct.toFixed(1)}%`, target: `≤ ${benchmark}%`,
    status: statusFromScore(fcScore), dataSource: src,
    recommendation: deviation > 0 ? {
      action: `Reduce food cost from ${fcPct.toFixed(1)}% to ${benchmark}%`,
      how: 'Menu rationalisation, supplier consolidation, portion control.',
      savingsMonthly: (d.monthlyFoodRevenue ?? 40000) * deviation / 100,
      difficulty: 'MEDIUM', timeToEffect: '4-8 weeks', priority: deviation > 3 ? 'HIGH' : 'MEDIUM', module: 'Food',
    } : null,
  });

  // 3. Waste %
  const wastePct = d.wastePct ?? 4.8;
  const wasteScore = scoreFromThresholds(wastePct, WASTE_THRESHOLDS);
  subScores.push({
    name: 'Food Waste', weight: 0.20,
    score: wasteScore, value: `${wastePct.toFixed(1)}%`, target: '≤ 3%',
    status: statusFromScore(wasteScore), dataSource: src,
    recommendation: wastePct > 3 ? {
      action: `Reduce waste from ${wastePct.toFixed(1)}% to under 3%`,
      how: 'Daily waste logging. Adjust prep volumes. Cross-utilise trim.',
      savingsMonthly: (d.monthlyFoodPurchases ?? 12000) * (wastePct - 3) / 100,
      difficulty: 'LOW', timeToEffect: '1-2 weeks', priority: 'MEDIUM', module: 'Food',
    } : null,
  });

  // 4. Menu Engineering
  const starsPlows = (d.menuStarsPct ?? 40) + (d.menuPlowhorsePct ?? 25);
  const menuScore = starsPlows >= 80 ? 100 : starsPlows >= 65 ? 80 : starsPlows >= 50 ? 60 : starsPlows >= 35 ? 40 : 20;
  subScores.push({
    name: 'Menu Engineering', weight: 0.15,
    score: menuScore, value: `${starsPlows}% Stars+Plowhorses`, target: '≥ 65%',
    status: statusFromScore(menuScore), dataSource: src,
    recommendation: starsPlows < 65 ? {
      action: 'Rationalise menu — remove Dogs, reprice Puzzles',
      how: `Remove ${d.menuDogsCount ?? 4} Dogs. Reposition ${d.menuPuzzlesCount ?? 3} Puzzles.`,
      savingsMonthly: (d.menuDogsCount ?? 4) * 150,
      difficulty: 'MEDIUM', timeToEffect: '2-4 weeks', priority: 'MEDIUM', module: 'Food',
    } : null,
  });

  // 5. Supplier Monitoring
  const suppScore = (d.supplierCount ?? 3) >= 3 && d.supplierPriceCompare !== false ? 80 : (d.supplierCount ?? 3) >= 3 ? 60 : 40;
  subScores.push({
    name: 'Supplier Monitoring', weight: 0.10,
    score: suppScore, value: `${d.supplierCount ?? 3} suppliers`, target: '3+ with price comparison',
    status: statusFromScore(suppScore), dataSource: src,
    recommendation: suppScore < 75 ? {
      action: 'Implement regular supplier price comparison',
      how: 'Compare top 10 ingredients across 3+ suppliers monthly.',
      savingsMonthly: 200, difficulty: 'LOW', timeToEffect: '1-2 weeks', priority: 'LOW', module: 'Food',
    } : null,
  });

  // 6. Prep Accuracy
  const prepScore = d.usePrepLists !== false ? (d.prepCompletionRate ?? 85) : 30;
  subScores.push({
    name: 'Prep Accuracy', weight: 0.10,
    score: prepScore, value: d.usePrepLists !== false ? `${d.prepCompletionRate ?? 85}% completion` : 'No prep lists',
    target: '≥ 95% completion', status: statusFromScore(prepScore), dataSource: src,
    recommendation: prepScore < 85 ? {
      action: 'Implement daily prep lists with completion tracking',
      how: 'Use ChefOS prep module. Track completion rate daily.',
      savingsMonthly: 150, difficulty: 'LOW', timeToEffect: '1 week', priority: 'LOW', module: 'Food',
    } : null,
  });

  const moduleScore = weightedAverage(subScores);
  const filled = subScores.filter(s => s.dataSource !== 'ESTIMATED').length;
  return {
    module: 'food', label: 'Food', icon: 'ChefHat', weight: MODULE_WEIGHTS.food,
    score: moduleScore, prevScore: d.prevScores?.food ?? moduleScore - 3,
    band: scoreBand(moduleScore), trend: trend(moduleScore, d.prevScores?.food),
    subScores, dataCompleteness: filled / subScores.length, confidence: d.source === 'INTERNAL' ? 'HIGH' : 'MEDIUM',
  };
}

function scoreBeverage(d: AuditInputData): ModuleResult {
  const src = dataSource(d.source);
  const subScores: SubScore[] = [];

  const pourCost = d.actualBevCostPct ?? 24;
  subScores.push({
    name: 'Pour Cost vs Target', weight: 0.25,
    score: scoreFromThresholds(pourCost, POUR_COST_THRESHOLDS),
    value: `${pourCost}%`, target: `≤ ${getBenchmark(d.venueType, 'bev_cost_pct')}%`,
    status: statusFromScore(scoreFromThresholds(pourCost, POUR_COST_THRESHOLDS)), dataSource: src,
    recommendation: pourCost > getBenchmark(d.venueType, 'bev_cost_pct') ? {
      action: `Reduce pour cost from ${pourCost}% to ${getBenchmark(d.venueType, 'bev_cost_pct')}%`,
      how: 'Portion control, speed rail optimisation, supplier review.',
      savingsMonthly: 300, difficulty: 'MEDIUM', timeToEffect: '2-4 weeks', priority: 'MEDIUM', module: 'Beverage',
    } : null,
  });

  const deadStock = d.deadStockPct ?? 7;
  subScores.push({
    name: 'Dead Stock', weight: 0.20,
    score: scoreFromThresholds(deadStock, DEAD_STOCK_THRESHOLDS),
    value: `${deadStock}%`, target: '< 5%',
    status: statusFromScore(scoreFromThresholds(deadStock, DEAD_STOCK_THRESHOLDS)), dataSource: src,
    recommendation: deadStock > 5 ? {
      action: `Reduce dead stock from ${deadStock}% to under 5%`,
      how: 'Rotate slow wines into BTG or staff tastings. Review purchasing.',
      savingsMonthly: 200, difficulty: 'LOW', timeToEffect: '2 weeks', priority: 'MEDIUM', module: 'Beverage',
    } : null,
  });

  const stockVar = d.stocktakeVariancePct ?? 3;
  subScores.push({
    name: 'Stocktake Accuracy', weight: 0.20,
    score: stockVar <= 1 ? 100 : stockVar <= 2 ? 90 : stockVar <= 5 ? 65 : stockVar <= 10 ? 35 : 10,
    value: `${stockVar}% variance`, target: '< 2%',
    status: statusFromScore(stockVar <= 2 ? 90 : stockVar <= 5 ? 65 : 35), dataSource: src,
    recommendation: stockVar > 2 ? {
      action: `Improve stocktake accuracy from ${stockVar}% to under 2%`,
      how: 'Weekly partial counts, full monthly stocktake, blind counts.',
      savingsMonthly: 150, difficulty: 'LOW', timeToEffect: '2 weeks', priority: 'LOW', module: 'Beverage',
    } : null,
  });

  const listDays = d.listReviewDays ?? 120;
  const listScore = listDays < 30 ? 100 : listDays < 60 ? 85 : listDays < 90 ? 70 : listDays < 180 ? 40 : 15;
  subScores.push({
    name: 'List Turnover', weight: 0.15,
    score: listScore, value: `${listDays} days since review`, target: '< 90 days',
    status: statusFromScore(listScore), dataSource: src,
    recommendation: listDays >= 90 ? {
      action: 'Review and refresh wine/cocktail list',
      how: 'Quarterly review cycle. Remove low-sellers, add seasonal items.',
      savingsMonthly: 100, difficulty: 'LOW', timeToEffect: '1-2 weeks', priority: 'LOW', module: 'Beverage',
    } : null,
  });

  const coravinScore = d.useCoravin ? (d.coravinYieldPct ?? 85) : 50;
  subScores.push({
    name: 'Coravin/BTG Yield', weight: 0.10,
    score: coravinScore, value: d.useCoravin ? `${d.coravinYieldPct ?? 85}% yield` : 'Not using Coravin',
    target: '≥ 85% yield', status: statusFromScore(coravinScore), dataSource: src,
    recommendation: null,
  });

  const bevMix = d.bevRevenueMixPct ?? 28;
  const bevMixTarget = getBenchmark(d.venueType, 'bev_revenue_mix_pct');
  const bevMixScore = bevMix >= bevMixTarget ? 90 : bevMix >= bevMixTarget - 5 ? 70 : bevMix >= bevMixTarget - 10 ? 50 : 30;
  subScores.push({
    name: 'Bev Revenue Mix', weight: 0.10,
    score: bevMixScore, value: `${bevMix}%`, target: `${bevMixTarget}%`,
    status: statusFromScore(bevMixScore), dataSource: src,
    recommendation: bevMix < bevMixTarget ? {
      action: `Increase bev revenue from ${bevMix}% to ${bevMixTarget}%`,
      how: 'Staff upselling training, food+bev pairing suggestions, BTG expansion.',
      savingsMonthly: 400, difficulty: 'MEDIUM', timeToEffect: '4-8 weeks', priority: 'MEDIUM', module: 'Beverage',
    } : null,
  });

  const moduleScore = weightedAverage(subScores);
  return {
    module: 'beverage', label: 'Beverage', icon: 'Wine', weight: MODULE_WEIGHTS.beverage,
    score: moduleScore, prevScore: d.prevScores?.beverage ?? moduleScore - 2,
    band: scoreBand(moduleScore), trend: trend(moduleScore, d.prevScores?.beverage),
    subScores, dataCompleteness: 0.85, confidence: d.source === 'INTERNAL' ? 'HIGH' : 'MEDIUM',
  };
}

function scoreLabour(d: AuditInputData): ModuleResult {
  const src = dataSource(d.source);
  const subScores: SubScore[] = [];
  const benchmark = getBenchmark(d.venueType, 'labour_pct');

  const labPct = d.labourCostPct ?? 29;
  const labDev = labPct - benchmark;
  const labScore = labDev <= -2 ? 100 : labDev <= 0 ? 90 : labDev <= 2 ? 70 : labDev <= 5 ? 50 : labDev <= 8 ? 30 : 10;
  subScores.push({
    name: 'Labour Cost %', weight: 0.20,
    score: labScore, value: `${labPct}%`, target: `≤ ${benchmark}%`,
    status: statusFromScore(labScore), dataSource: src,
    recommendation: labDev > 0 ? {
      action: `Reduce labour from ${labPct}% to ${benchmark}%`,
      how: 'Roster optimisation, cross-training, demand-based scheduling.',
      savingsMonthly: (d.monthlyLabourCost ?? 25000) * labDev / 100,
      difficulty: 'HIGH', timeToEffect: '4-8 weeks', priority: 'HIGH', module: 'Labour',
    } : null,
  });

  const otHours = d.overtimeHoursWeekly ?? 4.5;
  const otBudget = d.overtimeBudgetHours ?? 2;
  const otScore = otHours <= otBudget ? 90 : otHours <= otBudget * 1.5 ? 70 : otHours <= otBudget * 2 ? 50 : otHours <= otBudget * 3 ? 30 : 10;
  subScores.push({
    name: 'Overtime Management', weight: 0.15,
    score: otScore, value: `${otHours}h/week`, target: `≤ ${otBudget}h/week`,
    status: statusFromScore(otScore), dataSource: src,
    recommendation: otHours > otBudget ? {
      action: `Reduce OT from ${otHours}h to ${otBudget}h/week`,
      how: 'Hire 1 casual for peak shifts. Cross-train existing staff.',
      savingsMonthly: (otHours - otBudget) * 4.33 * 35,
      difficulty: 'MEDIUM', timeToEffect: '2-4 weeks', priority: 'HIGH', module: 'Labour',
    } : null,
  });

  const awardOk = d.awardCompliant !== false && d.casualLoadingApplied !== false;
  const awardScore = awardOk ? 95 : d.casualLoadingApplied === false ? 40 : 60;
  subScores.push({
    name: 'Award Compliance', weight: 0.20,
    score: awardScore, value: awardOk ? 'Compliant' : 'Violations detected',
    target: '100% compliant', status: statusFromScore(awardScore), dataSource: src,
    recommendation: !awardOk ? {
      action: 'Rectify award compliance violations immediately',
      how: 'Review all pay rates against HIGA MA000009. Apply 25% casual loading. Ensure penalty rates on weekends/PH.',
      savingsMonthly: 0, liabilityReduction: 3200, difficulty: 'HIGH', timeToEffect: '1-2 weeks', priority: 'HIGH', module: 'Labour',
    } : null,
  });

  const coversPerStaff = d.coversPerDay && d.staffCount ? d.coversPerDay / d.staffCount : 12;
  const rosterScore = coversPerStaff >= 15 ? 90 : coversPerStaff >= 12 ? 75 : coversPerStaff >= 9 ? 55 : 35;
  subScores.push({
    name: 'Roster Efficiency', weight: 0.15,
    score: rosterScore, value: `${coversPerStaff.toFixed(1)} covers/staff`, target: '≥ 12',
    status: statusFromScore(rosterScore), dataSource: src,
    recommendation: coversPerStaff < 12 ? {
      action: 'Improve covers-per-staff ratio',
      how: 'Reduce staffing on quiet shifts. Cross-train FOH/BOH.',
      savingsMonthly: 500, difficulty: 'MEDIUM', timeToEffect: '2-4 weeks', priority: 'MEDIUM', module: 'Labour',
    } : null,
  });

  const superOk = (d.superRate ?? 12) >= 12 && d.paysSuperOnTime !== false;
  const superScore = superOk ? 95 : (d.superRate ?? 12) >= 12 ? 70 : (d.superRate ?? 11) >= 11 ? 50 : 20;
  subScores.push({
    name: 'Super Compliance', weight: 0.10,
    score: superScore, value: `${d.superRate ?? 12}%`, target: '12% on time',
    status: statusFromScore(superScore), dataSource: src,
    recommendation: !superOk ? {
      action: `Update super from ${d.superRate ?? 11.5}% to 12%`,
      how: 'Required since 1 July 2025. Calculate back-payment. Rectify immediately.',
      savingsMonthly: 0, liabilityReduction: 3200, difficulty: 'HIGH', timeToEffect: '1 week', priority: 'HIGH', module: 'Labour',
    } : null,
  });

  const fatigueOk = d.fatigueCompliant !== false && d.breakCompliant !== false;
  const fatigueScore = fatigueOk ? 85 : 45;
  subScores.push({
    name: 'Fatigue & Breaks', weight: 0.10,
    score: fatigueScore, value: fatigueOk ? 'Compliant' : 'Issues detected',
    target: '10h gap + meal breaks', status: statusFromScore(fatigueScore), dataSource: src,
    recommendation: !fatigueOk ? {
      action: 'Address fatigue and break compliance',
      how: 'Ensure 10-hour gap between shifts. Schedule 30-min meal breaks after 5 hours.',
      savingsMonthly: 0, liabilityReduction: 1000, difficulty: 'MEDIUM', timeToEffect: '1-2 weeks', priority: 'HIGH', module: 'Labour',
    } : null,
  });

  const convOk = d.casualConversionOffered !== false;
  const convScore = convOk ? 90 : 35;
  subScores.push({
    name: 'Casual Conversion', weight: 0.10,
    score: convScore, value: convOk ? 'Offered' : 'Not offered',
    target: 'Offered to all eligible', status: statusFromScore(convScore), dataSource: src,
    recommendation: !convOk ? {
      action: 'Offer casual conversion to eligible casuals',
      how: 'Review all casuals with 6+ months regular pattern. Offer conversion per Fair Work Act.',
      savingsMonthly: 100, liabilityReduction: 500, difficulty: 'MEDIUM', timeToEffect: '2-3 weeks', priority: 'HIGH', module: 'Labour',
    } : null,
  });

  const moduleScore = weightedAverage(subScores);
  return {
    module: 'labour', label: 'Labour', icon: 'Users', weight: MODULE_WEIGHTS.labour,
    score: moduleScore, prevScore: d.prevScores?.labour ?? moduleScore + 2,
    band: scoreBand(moduleScore), trend: trend(moduleScore, d.prevScores?.labour),
    subScores, dataCompleteness: 0.9, confidence: d.source === 'INTERNAL' ? 'HIGH' : 'MEDIUM',
  };
}

function scoreOverhead(d: AuditInputData): ModuleResult {
  const src = dataSource(d.source);
  const subScores: SubScore[] = [];

  const overPct = d.totalOverheadPct ?? 22;
  const overScore = overPct <= 18 ? 100 : overPct <= 22 ? 80 : overPct <= 26 ? 60 : overPct <= 30 ? 40 : 20;
  subScores.push({
    name: 'Total Overhead %', weight: 0.15,
    score: overScore, value: `${overPct}%`, target: '≤ 22%',
    status: statusFromScore(overScore), dataSource: src,
    recommendation: overPct > 22 ? {
      action: `Reduce overheads from ${overPct}% to 22%`,
      how: 'Audit all recurring costs. Renegotiate contracts. Eliminate unnecessary subscriptions.',
      savingsMonthly: (d.monthlyRevenue ?? 80000) * (overPct - 22) / 100,
      difficulty: 'MEDIUM', timeToEffect: '4-8 weeks', priority: 'MEDIUM', module: 'Overhead',
    } : null,
  });

  const rentPct = d.rentPct ?? 11;
  subScores.push({
    name: 'Rent % of Revenue', weight: 0.20,
    score: scoreFromThresholds(rentPct, RENT_THRESHOLDS),
    value: `${rentPct}%`, target: '≤ 10%',
    status: statusFromScore(scoreFromThresholds(rentPct, RENT_THRESHOLDS)), dataSource: src,
    recommendation: rentPct > 10 ? {
      action: `Rent at ${rentPct}% — structural challenge`,
      how: 'Explore subletting, breakfast pop-up, renegotiation at lease renewal.',
      savingsMonthly: (d.monthlyRent ?? 8000) * 0.1,
      difficulty: 'HIGH', timeToEffect: '3-6 months', priority: rentPct > 12 ? 'HIGH' : 'MEDIUM', module: 'Overhead',
    } : null,
  });

  const primePct = d.primeCostPct ?? 66;
  subScores.push({
    name: 'Prime Cost %', weight: 0.20,
    score: scoreFromThresholds(primePct, PRIME_COST_THRESHOLDS),
    value: `${primePct}%`, target: '≤ 65%',
    status: statusFromScore(scoreFromThresholds(primePct, PRIME_COST_THRESHOLDS)), dataSource: src,
    recommendation: primePct > 65 ? {
      action: `Reduce prime cost from ${primePct}% to 65%`,
      how: 'Combined food cost + labour optimisation. This is the single most important metric.',
      savingsMonthly: (d.monthlyRevenue ?? 80000) * (primePct - 65) / 100,
      difficulty: 'HIGH', timeToEffect: '4-12 weeks', priority: 'HIGH', module: 'Overhead',
    } : null,
  });

  const npPct = d.netProfitPct ?? 8;
  subScores.push({
    name: 'Net Profit %', weight: 0.20,
    score: scoreNetProfit(npPct),
    value: `${npPct}%`, target: `≥ ${getBenchmark(d.venueType, 'net_profit_pct')}%`,
    status: statusFromScore(scoreNetProfit(npPct)), dataSource: src,
    recommendation: npPct < getBenchmark(d.venueType, 'net_profit_pct') ? {
      action: `Improve net profit from ${npPct}% to ${getBenchmark(d.venueType, 'net_profit_pct')}%`,
      how: 'Revenue intensification + cost control across all modules.',
      savingsMonthly: (d.monthlyRevenue ?? 80000) * (getBenchmark(d.venueType, 'net_profit_pct') - npPct) / 100,
      difficulty: 'HIGH', timeToEffect: '8-16 weeks', priority: 'HIGH', module: 'Overhead',
    } : null,
  });

  const beDayScore = d.breakEvenDayOfMonth ? (d.breakEvenDayOfMonth <= 15 ? 90 : d.breakEvenDayOfMonth <= 20 ? 70 : d.breakEvenDayOfMonth <= 25 ? 45 : 20) : 70;
  subScores.push({
    name: 'Break-Even Trend', weight: 0.15,
    score: beDayScore, value: d.breakEvenDayOfMonth ? `Day ${d.breakEvenDayOfMonth}` : 'Day ~18',
    target: '≤ Day 15', status: statusFromScore(beDayScore), dataSource: src,
    recommendation: null,
  });

  const dataComp = d.pnlDataCompletePct ?? 75;
  subScores.push({
    name: 'Data Completeness', weight: 0.10,
    score: dataComp, value: `${dataComp}%`, target: '≥ 90%',
    status: statusFromScore(dataComp), dataSource: src,
    recommendation: dataComp < 90 ? {
      action: 'Improve P&L data completeness',
      how: 'Connect all data sources to OverheadOS. Automate invoice ingestion.',
      savingsMonthly: 0, difficulty: 'LOW', timeToEffect: '1-2 weeks', priority: 'LOW', module: 'Overhead',
    } : null,
  });

  const moduleScore = weightedAverage(subScores);
  return {
    module: 'overhead', label: 'Overhead', icon: 'BarChart3', weight: MODULE_WEIGHTS.overhead,
    score: moduleScore, prevScore: d.prevScores?.overhead ?? moduleScore,
    band: scoreBand(moduleScore), trend: trend(moduleScore, d.prevScores?.overhead),
    subScores, dataCompleteness: dataComp / 100, confidence: d.source === 'INTERNAL' ? 'HIGH' : 'MEDIUM',
  };
}

function scoreService(d: AuditInputData): ModuleResult {
  const src = dataSource(d.source);
  const subScores: SubScore[] = [];

  const voidRate = d.voidRatePct ?? 1.8;
  subScores.push({
    name: 'Order Accuracy (Void Rate)', weight: 0.25,
    score: scoreFromThresholds(voidRate, VOID_RATE_THRESHOLDS),
    value: `${voidRate}%`, target: '< 2%',
    status: statusFromScore(scoreFromThresholds(voidRate, VOID_RATE_THRESHOLDS)), dataSource: src,
    recommendation: voidRate > 2 ? {
      action: `Reduce void rate from ${voidRate}% to under 2%`,
      how: 'Order confirmation before sending. Staff training on POS accuracy.',
      savingsMonthly: 200, difficulty: 'LOW', timeToEffect: '1-2 weeks', priority: 'MEDIUM', module: 'Service',
    } : null,
  });

  const svcMin = d.avgServiceMinutes ?? 18;
  const svcScore = svcMin <= 12 ? 100 : svcMin <= 15 ? 90 : svcMin <= 20 ? 75 : svcMin <= 25 ? 55 : 30;
  subScores.push({
    name: 'Speed of Service', weight: 0.20,
    score: svcScore, value: `${svcMin} min`, target: '≤ 15 min',
    status: statusFromScore(svcScore), dataSource: src,
    recommendation: svcMin > 15 ? {
      action: `Reduce service time from ${svcMin}min to 15min`,
      how: 'KDS optimisation, prep improvements, station layout review.',
      savingsMonthly: 300, difficulty: 'MEDIUM', timeToEffect: '2-4 weeks', priority: 'MEDIUM', module: 'Service',
    } : null,
  });

  const payEff = d.paymentEfficiencyScore ?? 88;
  subScores.push({
    name: 'Payment Efficiency', weight: 0.15,
    score: payEff, value: `${payEff}/100`, target: '≥ 90',
    status: statusFromScore(payEff), dataSource: src,
    recommendation: null,
  });

  const discPct = d.discountPct ?? 3.5;
  subScores.push({
    name: 'Discount Control', weight: 0.20,
    score: scoreFromThresholds(discPct, DISCOUNT_THRESHOLDS),
    value: `${discPct}%`, target: '< 3%',
    status: statusFromScore(scoreFromThresholds(discPct, DISCOUNT_THRESHOLDS)), dataSource: src,
    recommendation: discPct > 3 ? {
      action: `Reduce discounts from ${discPct}% to under 3%`,
      how: 'Review discount authority. Implement approval workflows.',
      savingsMonthly: (d.monthlyRevenue ?? 80000) * (discPct - 3) / 100,
      difficulty: 'LOW', timeToEffect: '1 week', priority: discPct > 5 ? 'HIGH' : 'MEDIUM', module: 'Service',
    } : null,
  });

  const cashVar = d.cashVariancePct ?? 1.2;
  subScores.push({
    name: 'Cash Variance', weight: 0.20,
    score: scoreFromThresholds(cashVar, CASH_VARIANCE_THRESHOLDS),
    value: `${cashVar}%`, target: '< 0.5%',
    status: statusFromScore(scoreFromThresholds(cashVar, CASH_VARIANCE_THRESHOLDS)), dataSource: src,
    recommendation: cashVar > 0.5 ? {
      action: `Reduce cash variance from ${cashVar}% to under 0.5%`,
      how: 'Daily cash-up SOPs, blind counts, surprise audits.',
      savingsMonthly: (d.monthlyRevenue ?? 80000) * 0.15 * cashVar / 100,
      difficulty: 'LOW', timeToEffect: '1-2 weeks', priority: cashVar > 1.5 ? 'HIGH' : 'MEDIUM', module: 'Service',
    } : null,
  });

  const moduleScore = weightedAverage(subScores);
  return {
    module: 'service', label: 'Service', icon: 'Utensils', weight: MODULE_WEIGHTS.service,
    score: moduleScore, prevScore: d.prevScores?.service ?? moduleScore - 2,
    band: scoreBand(moduleScore), trend: trend(moduleScore, d.prevScores?.service),
    subScores, dataCompleteness: 0.9, confidence: d.source === 'INTERNAL' ? 'HIGH' : 'MEDIUM',
  };
}

function scoreMarketing(d: AuditInputData): ModuleResult {
  const src = dataSource(d.source);
  const subScores: SubScore[] = [];

  const campaigns = d.campaignsPerMonth ?? 1;
  const campScore = campaigns >= 4 ? 100 : campaigns >= 3 ? 80 : campaigns >= 2 ? 60 : campaigns >= 1 ? 40 : 15;
  subScores.push({
    name: 'Campaign Frequency', weight: 0.20,
    score: campScore, value: `${campaigns}/month`, target: '≥ 3/month',
    status: statusFromScore(campScore), dataSource: src,
    recommendation: campaigns < 3 ? {
      action: `Increase campaigns from ${campaigns} to 3+/month`,
      how: 'Target quiet nights (Tue/Wed). Launch email/SMS for events. Seasonal promotions.',
      savingsMonthly: -800, difficulty: 'LOW', timeToEffect: '1-2 weeks', priority: 'MEDIUM', module: 'Marketing',
    } : null,
  });

  const openRate = d.emailOpenRate ?? 22;
  const emailScore = openRate >= 30 ? 100 : openRate >= 25 ? 80 : openRate >= 20 ? 65 : openRate >= 15 ? 45 : 20;
  subScores.push({
    name: 'Email/SMS Engagement', weight: 0.20,
    score: emailScore, value: `${openRate}% open rate`, target: '≥ 25%',
    status: statusFromScore(emailScore), dataSource: src,
    recommendation: openRate < 25 ? {
      action: 'Improve email engagement',
      how: 'Segment lists. Better subject lines. Test send times.',
      savingsMonthly: 0, difficulty: 'LOW', timeToEffect: '2-4 weeks', priority: 'LOW', module: 'Marketing',
    } : null,
  });

  const roas = d.roas ?? 3.5;
  const roasScore = roas >= 5 ? 100 : roas >= 4 ? 85 : roas >= 3 ? 70 : roas >= 2 ? 50 : roas >= 1 ? 30 : 10;
  subScores.push({
    name: 'ROAS', weight: 0.25,
    score: roasScore, value: `${roas}x`, target: '≥ 4x',
    status: statusFromScore(roasScore), dataSource: src,
    recommendation: roas < 4 ? {
      action: `Improve ROAS from ${roas}x to 4x+`,
      how: 'Focus spend on high-converting channels. Cut underperforming ads.',
      savingsMonthly: (d.monthlyMarketingSpend ?? 500) * 0.2,
      difficulty: 'MEDIUM', timeToEffect: '4-8 weeks', priority: 'MEDIUM', module: 'Marketing',
    } : null,
  });

  const quietTargeted = d.quietNightsTargeted ?? false;
  const demandScore = quietTargeted ? 80 : 35;
  subScores.push({
    name: 'Demand Filling', weight: 0.20,
    score: demandScore, value: quietTargeted ? 'Active' : 'Not targeted',
    target: 'Quiet nights targeted', status: statusFromScore(demandScore), dataSource: src,
    recommendation: !quietTargeted ? {
      action: 'Launch campaigns for quiet nights',
      how: 'Tue/Wed promotions, happy hour, locals nights, industry nights.',
      savingsMonthly: -800, difficulty: 'LOW', timeToEffect: '1-2 weeks', priority: 'HIGH', module: 'Marketing',
    } : null,
  });

  const repeat = d.repeatCustomerPct ?? 35;
  const retScore = repeat >= 60 ? 100 : repeat >= 45 ? 80 : repeat >= 30 ? 55 : repeat >= 20 ? 35 : 15;
  subScores.push({
    name: 'Guest Retention', weight: 0.15,
    score: retScore, value: `${repeat}%`, target: '≥ 45%',
    status: statusFromScore(retScore), dataSource: src,
    recommendation: repeat < 45 ? {
      action: `Improve retention from ${repeat}% to 45%+`,
      how: 'Loyalty program, post-visit emails, birthday offers.',
      savingsMonthly: -200, difficulty: 'MEDIUM', timeToEffect: '4-8 weeks', priority: 'MEDIUM', module: 'Marketing',
    } : null,
  });

  const moduleScore = weightedAverage(subScores);
  return {
    module: 'marketing', label: 'Marketing', icon: 'Megaphone', weight: MODULE_WEIGHTS.marketing,
    score: moduleScore, prevScore: d.prevScores?.marketing ?? moduleScore - 3,
    band: scoreBand(moduleScore), trend: trend(moduleScore, d.prevScores?.marketing),
    subScores, dataCompleteness: 0.7, confidence: d.source === 'INTERNAL' ? 'HIGH' : 'LOW',
  };
}

function scoreCompliance(d: AuditInputData): ModuleResult {
  const src = dataSource(d.source);
  const subScores: SubScore[] = [];
  const redLines: string[] = [];

  // Award compliance
  const awardOk = d.awardCompliant !== false;
  subScores.push({
    name: 'Award Rate Correctness', weight: 0.20,
    score: awardOk ? 95 : 20, value: awardOk ? 'Compliant' : 'VIOLATIONS',
    target: '100%', status: awardOk ? 'GOOD' : 'POOR', dataSource: src,
    recommendation: !awardOk ? {
      action: 'Rectify award underpayments immediately',
      how: 'Audit all rates against HIGA MA000009. Calculate and pay back-pay.',
      savingsMonthly: 0, liabilityReduction: 5000, difficulty: 'HIGH', timeToEffect: '1-2 weeks', priority: 'HIGH', module: 'Compliance',
    } : null,
  });
  if (!awardOk) redLines.push('Staff paid below Award minimum rate — score capped at CRITICAL');

  // STP Phase 2
  const stpOk = d.stpPhase2Compliant !== false;
  subScores.push({
    name: 'STP Phase 2', weight: 0.10,
    score: stpOk ? 100 : 40, value: stpOk ? 'Compliant' : 'Non-compliant',
    target: 'Compliant', status: stpOk ? 'GOOD' : 'POOR', dataSource: src,
    recommendation: !stpOk ? {
      action: 'Implement STP Phase 2 compliance',
      how: 'Update payroll system to report disaggregated gross to ATO.',
      savingsMonthly: 0, difficulty: 'MEDIUM', timeToEffect: '2-4 weeks', priority: 'HIGH', module: 'Compliance',
    } : null,
  });

  // Super
  const superOk = (d.superRate ?? 12) >= 12;
  subScores.push({
    name: 'Super Guarantee', weight: 0.15,
    score: superOk ? 95 : 30, value: `${d.superRate ?? 12}%`, target: '12%',
    status: superOk ? 'GOOD' : 'POOR', dataSource: src,
    recommendation: !superOk ? {
      action: `Update super from ${d.superRate}% to 12%`,
      how: 'Required since 1 July 2025. Rectify immediately.',
      savingsMonthly: 0, liabilityReduction: 3200, difficulty: 'HIGH', timeToEffect: '1 week', priority: 'HIGH', module: 'Compliance',
    } : null,
  });
  if ((d.superRate ?? 12) === 0) redLines.push('No super being paid — score capped at CRITICAL');

  // Certificates
  const licOk = d.liquorLicenseCurrent !== false;
  const fsOk = d.foodSafetyCertCurrent !== false;
  const rsaOk = d.rsaCurrent !== false;
  const wcOk = d.workersCompCurrent !== false;
  const certCount = [licOk, fsOk, rsaOk, wcOk].filter(Boolean).length;
  const certScore = certCount === 4 ? 95 : certCount === 3 ? 70 : certCount === 2 ? 45 : 15;
  subScores.push({
    name: 'Certificates & Licenses', weight: 0.15,
    score: certScore, value: `${certCount}/4 current`, target: '4/4',
    status: statusFromScore(certScore), dataSource: src,
    recommendation: certCount < 4 ? {
      action: 'Renew expired certificates/licenses',
      how: `${!licOk ? 'Liquor license expired. ' : ''}${!fsOk ? 'Food Safety cert expired. ' : ''}${!rsaOk ? 'RSA certs expired. ' : ''}${!wcOk ? 'Workers Comp missing. ' : ''}Renew immediately.`,
      savingsMonthly: 0, liabilityReduction: 10000, difficulty: 'MEDIUM', timeToEffect: '1-4 weeks', priority: 'HIGH', module: 'Compliance',
    } : null,
  });
  if (!licOk) redLines.push('Liquor license expired — score capped at CRITICAL');
  if (!wcOk) redLines.push('Workers Compensation missing — score capped at CRITICAL');

  // Record Retention
  const retYears = d.recordRetentionYears ?? 7;
  const retScore = retYears >= 7 ? 95 : retYears >= 5 ? 70 : retYears >= 3 ? 45 : 15;
  subScores.push({
    name: 'Record Retention', weight: 0.10,
    score: retScore, value: `${retYears} years`, target: '≥ 7 years',
    status: statusFromScore(retScore), dataSource: src,
    recommendation: retYears < 7 ? {
      action: `Extend record retention from ${retYears} to 7 years`,
      how: 'Digitise and back up all payroll records. Legal requirement.',
      savingsMonthly: 0, difficulty: 'LOW', timeToEffect: '2 weeks', priority: 'MEDIUM', module: 'Compliance',
    } : null,
  });
  if (retYears < 1) redLines.push('No payroll records older than 12 months — score capped at CRITICAL');

  // Payslip Compliance
  const payslipOk = d.payslipCompliant !== false;
  subScores.push({
    name: 'Payslip Compliance', weight: 0.10,
    score: payslipOk ? 90 : 40, value: payslipOk ? 'Compliant' : 'Issues',
    target: 'All required fields', status: payslipOk ? 'GOOD' : 'POOR', dataSource: src,
    recommendation: null,
  });

  // Breaks
  const breakOk = d.breakCompliant !== false;
  subScores.push({
    name: 'Break & Fatigue', weight: 0.10,
    score: breakOk ? 85 : 40, value: breakOk ? 'Compliant' : 'Violations',
    target: 'Compliant', status: breakOk ? 'GOOD' : 'POOR', dataSource: src,
    recommendation: null,
  });

  // Right to Disconnect
  const rtdOk = d.rightToDisconnectPolicy === true;
  subScores.push({
    name: 'Right to Disconnect', weight: 0.05,
    score: rtdOk ? 90 : 30, value: rtdOk ? 'Policy in place' : 'No policy',
    target: 'Written policy', status: rtdOk ? 'GOOD' : 'POOR', dataSource: src,
    recommendation: !rtdOk ? {
      action: 'Implement Right to Disconnect policy',
      how: 'Draft written policy per Fair Work Act. Communicate to all staff.',
      savingsMonthly: 0, difficulty: 'LOW', timeToEffect: '1 week', priority: 'MEDIUM', module: 'Compliance',
    } : null,
  });

  // Induction
  const indOk = d.inductionRecordsComplete !== false;
  subScores.push({
    name: 'Induction & Training', weight: 0.05,
    score: indOk ? 85 : 35, value: indOk ? 'Complete' : 'Incomplete',
    target: 'All staff inducted', status: indOk ? 'GOOD' : 'POOR', dataSource: src,
    recommendation: null,
  });

  let moduleScore = weightedAverage(subScores);

  // Apply compliance red lines
  const hasCriticalRedLine = redLines.some(r => r.includes('CRITICAL'));
  const hasPoorRedLine = !stpOk || !rsaOk || !fsOk || !d.writtenContracts;
  if (hasCriticalRedLine) moduleScore = Math.min(moduleScore, 39);
  else if (hasPoorRedLine) moduleScore = Math.min(moduleScore, 59);

  return {
    module: 'compliance', label: 'Compliance', icon: 'Scale', weight: MODULE_WEIGHTS.compliance,
    score: moduleScore, prevScore: d.prevScores?.compliance ?? moduleScore - 1,
    band: scoreBand(moduleScore), trend: trend(moduleScore, d.prevScores?.compliance),
    subScores, dataCompleteness: 0.85, confidence: d.source === 'INTERNAL' ? 'HIGH' : 'MEDIUM',
  };
}

// ─── Master Orchestrator ─────────────────────────────────
export function runQuietAudit(data: AuditInputData): AuditResult {
  const modules = [
    scoreFood(data),
    scoreBeverage(data),
    scoreLabour(data),
    scoreOverhead(data),
    scoreService(data),
    scoreMarketing(data),
    scoreCompliance(data),
  ];

  const overallScore = Math.round(
    modules.reduce((s, m) => s + m.score * m.weight, 0) /
    modules.reduce((s, m) => s + m.weight, 0)
  );

  const allRecs = modules
    .flatMap(m => m.subScores.filter(s => s.recommendation).map(s => s.recommendation!))
    .sort((a, b) => {
      const pri = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return pri[a.priority] - pri[b.priority];
    });

  const totalSavings = allRecs.reduce((s, r) => s + Math.max(0, r.savingsMonthly) * 12, 0);
  const totalLiabilities = allRecs.reduce((s, r) => s + (r.liabilityReduction ?? 0), 0);

  const complianceRedLines: string[] = [];
  const compMod = modules.find(m => m.module === 'compliance');
  if (compMod && compMod.score <= 39) complianceRedLines.push('CRITICAL compliance violations detected');
  if (compMod && compMod.score <= 59 && compMod.score > 39) complianceRedLines.push('Significant compliance issues detected');

  const avgCompleteness = modules.reduce((s, m) => s + m.dataCompleteness, 0) / modules.length;

  return {
    overallScore,
    overallBand: scoreBand(overallScore),
    modules,
    recommendations: allRecs,
    totalAnnualSavings: Math.round(totalSavings),
    totalLiabilities: Math.round(totalLiabilities),
    dataCompleteness: Math.round(avgCompleteness * 100),
    confidence: data.source === 'INTERNAL' ? 'HIGH' : avgCompleteness > 0.7 ? 'MEDIUM' : 'LOW',
    complianceRedLines,
  };
}

// ─── Demo Data Generator ─────────────────────────────────
export function getDemoAuditData(): AuditInputData {
  return {
    venueType: 'casual_dining',
    source: 'INTERNAL',
    actualFoodCostPct: 31.2,
    theoreticalFoodCostPct: 28.5,
    wastePct: 4.8,
    menuStarsPct: 35,
    menuPlowhorsePct: 30,
    menuDogsCount: 4,
    menuPuzzlesCount: 3,
    supplierCount: 5,
    supplierPriceCompare: true,
    usePrepLists: true,
    prepCompletionRate: 84,
    monthlyFoodRevenue: 48000,
    monthlyFoodPurchases: 14400,
    actualBevCostPct: 24,
    deadStockPct: 7,
    stocktakeVariancePct: 3.2,
    listReviewDays: 95,
    useCoravin: true,
    coravinYieldPct: 88,
    bevRevenueMixPct: 28,
    labourCostPct: 29.5,
    overtimeHoursWeekly: 4.5,
    overtimeBudgetHours: 2,
    awardCompliant: true,
    casualLoadingApplied: true,
    casualConversionOffered: false,
    superRate: 11.5,
    paysSuperOnTime: true,
    staffCount: 14,
    casualCount: 6,
    coversPerDay: 120,
    fatigueCompliant: true,
    breakCompliant: true,
    monthlyLabourCost: 23600,
    totalOverheadPct: 24,
    rentPct: 13,
    primeCostPct: 66,
    netProfitPct: 7.5,
    breakEvenDayOfMonth: 19,
    pnlDataCompletePct: 75,
    monthlyRevenue: 80000,
    monthlyRent: 10400,
    voidRatePct: 1.8,
    avgServiceMinutes: 16,
    paymentEfficiencyScore: 90,
    discountPct: 3.2,
    cashVariancePct: 2.8,
    campaignsPerMonth: 1,
    emailOpenRate: 22,
    roas: 3.5,
    quietNightsTargeted: false,
    repeatCustomerPct: 35,
    databaseSize: 1200,
    monthlyMarketingSpend: 500,
    liquorLicenseCurrent: true,
    foodSafetyCertCurrent: true,
    rsaCurrent: true,
    workersCompCurrent: true,
    stpPhase2Compliant: true,
    payslipCompliant: true,
    rightToDisconnectPolicy: false,
    inductionRecordsComplete: true,
    recordRetentionYears: 7,
    writtenContracts: true,
    prevScores: {
      food: 79, beverage: 76, labour: 73, overhead: 74,
      service: 86, marketing: 62, compliance: 91,
    },
  };
}

// ─── Score Trend Demo Data ───────────────────────────────
export function getDemoScoreTrend() {
  return [
    { week: 'W1', overall: 68, food: 74, bev: 72, labour: 70, overhead: 71, service: 82, marketing: 55, compliance: 88 },
    { week: 'W2', overall: 70, food: 76, bev: 73, labour: 71, overhead: 72, service: 83, marketing: 58, compliance: 89 },
    { week: 'W3', overall: 72, food: 78, bev: 75, labour: 72, overhead: 73, service: 85, marketing: 60, compliance: 90 },
    { week: 'W4', overall: 74, food: 80, bev: 76, labour: 73, overhead: 74, service: 86, marketing: 62, compliance: 91 },
    { week: 'W5', overall: 76, food: 82, bev: 78, labour: 71, overhead: 74, service: 88, marketing: 65, compliance: 92 },
  ];
}
