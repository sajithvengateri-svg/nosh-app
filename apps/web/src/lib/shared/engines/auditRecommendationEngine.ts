/**
 * Audit Recommendation Engine — generates prioritised, costed recommendations.
 * Works with output from quietAuditEngine.
 */

import type { AuditResult, Recommendation } from './quietAuditEngine';

export interface RecoverySummary {
  totalAnnualSavings: number;
  totalLiabilities: number;
  immediateActions: Recommendation[];
  shortTermActions: Recommendation[];
  mediumTermActions: Recommendation[];
  foundMoney: number;
}

export function buildRecoverySummary(result: AuditResult): RecoverySummary {
  const immediate = result.recommendations.filter(
    r => r.priority === 'HIGH' && r.difficulty !== 'HIGH'
  );
  const shortTerm = result.recommendations.filter(
    r => (r.priority === 'HIGH' && r.difficulty === 'HIGH') || r.priority === 'MEDIUM'
  );
  const mediumTerm = result.recommendations.filter(r => r.priority === 'LOW');

  const foundMoney = result.recommendations
    .filter(r => r.savingsMonthly > 0)
    .reduce((s, r) => s + r.savingsMonthly * 12, 0)
    + result.totalLiabilities;

  return {
    totalAnnualSavings: result.totalAnnualSavings,
    totalLiabilities: result.totalLiabilities,
    immediateActions: immediate,
    shortTermActions: shortTerm,
    mediumTermActions: mediumTerm,
    foundMoney: Math.round(foundMoney),
  };
}

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatSavings(rec: Recommendation): string {
  if (rec.savingsMonthly > 0) return `Save ${formatCurrency(rec.savingsMonthly)}/month`;
  if (rec.savingsMonthly < 0) return `Est. revenue lift: ${formatCurrency(Math.abs(rec.savingsMonthly))}/month`;
  if (rec.liabilityReduction) return `Liability: ${formatCurrency(rec.liabilityReduction)}`;
  return 'Compliance';
}
