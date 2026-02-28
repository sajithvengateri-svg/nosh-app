/**
 * Labour Audit Engine — Quiet System integration scoring
 * Checks compliance health for the LabourOS module.
 */

import type { EmployeeProfile, LabourRosterShift } from '../types/labour.types';
import { assessFatigueRisk } from '../calculations/labour';

export interface LabourAuditResult {
  score: number; // 0-100
  category: string;
  checks: LabourAuditCheck[];
}

export interface LabourAuditCheck {
  name: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

export function runLabourAudit(
  employees: EmployeeProfile[],
  shifts: LabourRosterShift[],
): LabourAuditResult {
  const checks: LabourAuditCheck[] = [];

  // Check 1: All employees have classification set
  const missingClass = employees.filter(e => !e.classification);
  checks.push({
    name: 'Employee Classifications',
    passed: missingClass.length === 0,
    severity: missingClass.length > 0 ? 'critical' : 'info',
    message: missingClass.length > 0
      ? `${missingClass.length} employee(s) missing classification`
      : 'All employees have classifications set',
  });

  // Check 2: Fatigue risk across all staff
  const employeeShiftMap = new Map<string, typeof shifts>();
  shifts.forEach(s => {
    const arr = employeeShiftMap.get(s.user_id) || [];
    arr.push(s);
    employeeShiftMap.set(s.user_id, arr);
  });

  let highFatigueCount = 0;
  employeeShiftMap.forEach((userShifts) => {
    const assessment = assessFatigueRisk(userShifts);
    if (assessment.risk_level === 'HIGH') highFatigueCount++;
  });

  checks.push({
    name: 'Fatigue Risk',
    passed: highFatigueCount === 0,
    severity: highFatigueCount > 0 ? 'critical' : 'info',
    message: highFatigueCount > 0
      ? `${highFatigueCount} staff member(s) at HIGH fatigue risk`
      : 'No high fatigue risk detected',
  });

  // Check 3: Super details present
  const missingSuperCount = employees.filter(e => !e.super_fund_name && e.employment_type !== 'CASUAL').length;
  checks.push({
    name: 'Super Fund Details',
    passed: missingSuperCount === 0,
    severity: missingSuperCount > 0 ? 'warning' : 'info',
    message: missingSuperCount > 0
      ? `${missingSuperCount} permanent employee(s) missing super fund details`
      : 'All permanent employees have super fund details',
  });

  // Score: weighted average
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return { score, category: 'Labour Compliance', checks };
}
