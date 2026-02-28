/**
 * LabourOS Award Calculation Engine
 * Pure TypeScript — no UI dependencies, no Supabase imports.
 * All data passed in as arguments for testability + React Native portability.
 */

import type {
  AwardRate, PenaltyRule, AllowanceRate, EmployeeProfile,
  LabourRosterShift, ShiftPayBreakdown, AllowanceDetail,
  FatigueAssessment, FatigueRisk, ShiftGapResult, DayType,
} from '../types/labour.types';
import type { BreakEvent, RoleChange } from '../types/hr.types';

// ===================== CLASSIFICATION LEVELS =====================

const CLASSIFICATION_LEVELS: Record<string, number> = {
  FB_INTRO: 0, FB_1: 1, FB_2: 2, FB_3: 3, FB_4: 4, FB_5: 5,
  K_INTRO: 0, K_1: 1, K_2: 2, K_3: 3,
  COOK_1: 2, COOK_2: 3, COOK_3: 4, COOK_4: 5, COOK_5: 6,
};

export function getClassificationLevel(classification: string): number {
  return CLASSIFICATION_LEVELS[classification] ?? 0;
}

// ===================== RATE LOOKUP =====================

export function getRate(
  rates: AwardRate[],
  classification: string,
  employmentType: string,
  date: string
): AwardRate | undefined {
  return rates
    .filter(r =>
      r.classification === classification &&
      r.employment_type === employmentType &&
      r.effective_from <= date &&
      (r.effective_to === null || r.effective_to >= date)
    )
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0];
}

// ===================== DAY TYPE =====================

export function getDayType(
  date: string,
  publicHolidayDates: string[]
): DayType {
  if (publicHolidayDates.includes(date)) return 'PUBLIC_HOLIDAY';
  const day = new Date(date).getDay(); // 0=Sun, 6=Sat
  if (day === 0) return 'SUNDAY';
  if (day === 6) return 'SATURDAY';
  return 'WEEKDAY';
}

// ===================== TIME HELPERS =====================

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesBetween(start: string, end: string, breakMins: number): number {
  let s = timeToMinutes(start);
  let e = timeToMinutes(end);
  if (e <= s) e += 24 * 60; // overnight
  return Math.max(0, e - s - breakMins);
}

function hoursInRange(shiftStart: string, shiftEnd: string, rangeStart: string, rangeEnd: string): number {
  let ss = timeToMinutes(shiftStart);
  let se = timeToMinutes(shiftEnd);
  if (se <= ss) se += 24 * 60;
  let rs = timeToMinutes(rangeStart);
  let re = timeToMinutes(rangeEnd);
  if (re <= rs) re += 24 * 60;

  const overlapStart = Math.max(ss, rs);
  const overlapEnd = Math.min(se, re);
  return Math.max(0, (overlapEnd - overlapStart) / 60);
}

// ===================== SHIFT PAY CALCULATION =====================

export function calculateShiftPay(
  shift: LabourRosterShift,
  employee: EmployeeProfile,
  rates: AwardRate[],
  penaltyRules: PenaltyRule[],
  publicHolidayDates: string[],
  breaks: BreakEvent[] = [],
  roleChanges: RoleChange[] = [],
  weeklyHoursSoFar: number = 0,
  allowanceRates: AllowanceRate[] = [],
): ShiftPayBreakdown {
  const dayType = getDayType(shift.date, publicHolidayDates);
  const empType = employee.employment_type;
  const penaltyEmpType = empType === 'CASUAL' ? 'CASUAL' : 'PERMANENT';

  // Higher duties check (Update 2)
  const effectiveClassification = calculateHigherDuties(
    employee.classification,
    shift.higher_duties_classification,
    roleChanges
  );

  const rate = getRate(rates, effectiveClassification, empType, shift.date);
  if (!rate) {
    return emptyBreakdown(effectiveClassification);
  }

  const baseRate = empType === 'CASUAL' ? (rate.casual_hourly_rate ?? rate.base_hourly_rate * 1.25) : rate.base_hourly_rate;
  const totalMinutes = minutesBetween(shift.start_time, shift.end_time, shift.break_minutes);
  const totalHours = totalMinutes / 60;

  const result: ShiftPayBreakdown = {
    base_hours: 0, base_pay: 0,
    saturday_hours: 0, saturday_pay: 0,
    sunday_hours: 0, sunday_pay: 0,
    public_holiday_hours: 0, public_holiday_pay: 0,
    evening_hours: 0, evening_loading: 0,
    late_night_hours: 0, late_night_loading: 0,
    overtime_hours_150: 0, overtime_pay_150: 0,
    overtime_hours_200: 0, overtime_pay_200: 0,
    missed_break_penalty: 0,
    higher_duties_applied: effectiveClassification !== employee.classification,
    effective_classification: effectiveClassification,
    allowances: [],
    total_gross: 0,
  };

  // Penalty multiplier by day type
  const rules = penaltyRules.filter(r => r.award_code === employee.award_code && r.employment_type === penaltyEmpType);

  if (dayType === 'PUBLIC_HOLIDAY') {
    const phRule = rules.find(r => r.condition === 'PUBLIC_HOLIDAY');
    const mult = phRule?.multiplier ?? (empType === 'CASUAL' ? 2.5 : 2.25);
    result.public_holiday_hours = totalHours;
    result.public_holiday_pay = totalHours * rate.base_hourly_rate * mult;
  } else if (dayType === 'SATURDAY') {
    const satRule = rules.find(r => r.condition === 'SATURDAY');
    const mult = satRule?.multiplier ?? (empType === 'CASUAL' ? 1.5 : 1.25);
    result.saturday_hours = totalHours;
    result.saturday_pay = totalHours * rate.base_hourly_rate * mult;
  } else if (dayType === 'SUNDAY') {
    const sunRule = rules.find(r => r.condition === 'SUNDAY');
    const mult = sunRule?.multiplier ?? (empType === 'CASUAL' ? 1.75 : 1.5);
    result.sunday_hours = totalHours;
    result.sunday_pay = totalHours * rate.base_hourly_rate * mult;
  } else {
    result.base_hours = totalHours;
    result.base_pay = totalHours * baseRate;
  }

  // Evening loading (7pm-midnight)
  const eveningHrs = hoursInRange(shift.start_time, shift.end_time, '19:00', '00:00');
  if (eveningHrs > 0) {
    const evRule = rules.find(r => r.condition === 'EVENING');
    result.evening_hours = eveningHrs;
    result.evening_loading = eveningHrs * (evRule?.flat_addition ?? 2.81);
  }

  // Late night loading (midnight-7am)
  const lateHrs = hoursInRange(shift.start_time, shift.end_time, '00:00', '07:00');
  if (lateHrs > 0) {
    const lnRule = rules.find(r => r.condition === 'LATE_NIGHT');
    result.late_night_hours = lateHrs;
    result.late_night_loading = lateHrs * (lnRule?.flat_addition ?? 4.22);
  }

  // Overtime detection
  const maxOrdinary = empType === 'FULL_TIME' ? 38 : (employee.agreed_hours_per_week ?? 38);
  const newWeeklyTotal = weeklyHoursSoFar + totalHours;
  if (newWeeklyTotal > maxOrdinary) {
    const otHours = Math.min(totalHours, newWeeklyTotal - maxOrdinary);
    const otFirst2 = Math.min(otHours, 2);
    const otAfter2 = Math.max(0, otHours - 2);
    const otBase = rate.base_hourly_rate; // OT on base rate (not casual loaded)

    const ot150Rule = rules.find(r => r.condition === 'OVERTIME_FIRST2');
    const ot200Rule = rules.find(r => r.condition === 'OVERTIME_AFTER2');

    result.overtime_hours_150 = otFirst2;
    result.overtime_pay_150 = otFirst2 * otBase * (ot150Rule?.multiplier ?? 1.5);
    result.overtime_hours_200 = otAfter2;
    result.overtime_pay_200 = otAfter2 * otBase * (ot200Rule?.multiplier ?? 2.0);
  }

  // Missed break penalty (Update 5)
  result.missed_break_penalty = calculateMissedBreakPenalty(
    shift.start_time, shift.end_time, totalHours, breaks, rate.base_hourly_rate
  );

  // Allowances (Update 12)
  result.allowances = calculateAllowances(shift, employee, allowanceRates);

  // Total
  result.total_gross =
    result.base_pay + result.saturday_pay + result.sunday_pay + result.public_holiday_pay +
    result.evening_loading + result.late_night_loading +
    result.overtime_pay_150 + result.overtime_pay_200 +
    result.missed_break_penalty +
    result.allowances.reduce((sum, a) => sum + a.amount, 0);

  return result;
}

// ===================== HIGHER DUTIES (Update 2) =====================

export function calculateHigherDuties(
  baseClassification: string,
  shiftHigherDuties: string | null,
  roleChanges: RoleChange[]
): string {
  // If explicitly tagged on shift
  if (shiftHigherDuties) return shiftHigherDuties;

  // Check role changes for 2+ hours at higher level
  const higherTime = roleChanges
    .filter(rc => getClassificationLevel(rc.to_classification) > getClassificationLevel(baseClassification))
    .reduce((total, rc) => total + rc.duration_hours, 0);

  if (higherTime >= 2) {
    const highest = roleChanges
      .map(rc => rc.to_classification)
      .sort((a, b) => getClassificationLevel(b) - getClassificationLevel(a))[0];
    return highest || baseClassification;
  }

  return baseClassification;
}

// ===================== MISSED BREAK PENALTY (Update 5) =====================

export function calculateMissedBreakPenalty(
  shiftStart: string,
  shiftEnd: string,
  totalHours: number,
  breaks: BreakEvent[],
  baseRate: number
): number {
  if (totalHours <= 5) return 0;

  const startMins = timeToMinutes(shiftStart);
  const sixHourMark = startMins + 360; // 6 hours in minutes

  const mealBreaks = breaks.filter(b => b.event_type === 'BREAK_START');

  if (mealBreaks.length === 0) {
    // No meal break at all — penalty from 6hr mark to shift end
    let endMins = timeToMinutes(shiftEnd);
    if (endMins <= startMins) endMins += 24 * 60;
    const penaltyMins = Math.max(0, endMins - sixHourMark);
    return (penaltyMins / 60) * baseRate * 0.5;
  }

  const firstBreakMins = timeToMinutes(mealBreaks[0].event_time.substring(11, 16));
  if (firstBreakMins > sixHourMark) {
    const penaltyMins = firstBreakMins - sixHourMark;
    return (penaltyMins / 60) * baseRate * 0.5;
  }

  return 0;
}

// ===================== ALLOWANCES (Update 12) =====================

export function calculateAllowances(
  shift: LabourRosterShift,
  employee: EmployeeProfile,
  allowanceRates: AllowanceRate[]
): AllowanceDetail[] {
  const allowances: AllowanceDetail[] = [];
  const currentRates = allowanceRates.filter(r => r.award_code === employee.award_code && r.is_current);

  // Split shift allowance
  if (shift.shift_type === 'SPLIT') {
    const splitRate = currentRates.find(r => r.allowance_type === 'SPLIT_SHIFT');
    if (splitRate) {
      allowances.push({ type: 'SPLIT_SHIFT', amount: splitRate.amount, description: 'Split shift allowance' });
    }
  }

  // Tool allowance (cooks who supply own tools)
  if (employee.classification.startsWith('COOK') && employee.supplies_own_tools) {
    const toolRate = currentRates.find(r => r.allowance_type === 'TOOL');
    if (toolRate) {
      allowances.push({ type: 'TOOL', amount: toolRate.amount, description: 'Tool and equipment allowance' });
    }
  }

  // First aid officer
  if (employee.is_first_aid_officer) {
    const faRate = currentRates.find(r => r.allowance_type === 'FIRST_AID');
    if (faRate) {
      allowances.push({ type: 'FIRST_AID', amount: faRate.amount, description: 'First aid officer allowance' });
    }
  }

  return allowances;
}

// ===================== SUPERANNUATION =====================

export function calculateSuper(ordinaryTimeEarnings: number, rate: number = 12): number {
  return ordinaryTimeEarnings * (rate / 100);
}

// ===================== LEAVE ACCRUAL =====================

export function calculateLeaveAccrual(
  employmentType: string,
  ordinaryHoursWorked: number,
  standardWeeklyHours: number = 38
): { annual: number; personal: number } {
  if (employmentType === 'CASUAL') return { annual: 0, personal: 0 };

  const weeksWorked = ordinaryHoursWorked / standardWeeklyHours;
  return {
    annual: weeksWorked * 2.923,    // ~152hrs/52wks
    personal: weeksWorked * 1.461,  // ~76hrs/52wks
  };
}

// ===================== SHIFT GAP (Update 1 — 10hr rule) =====================

export function calculateShiftGap(
  previousShiftEnd: string, // ISO datetime
  nextShiftStart: string,   // ISO datetime
  isRosterChangeover: boolean = false
): ShiftGapResult {
  const endMs = new Date(previousShiftEnd).getTime();
  const startMs = new Date(nextShiftStart).getTime();
  const gapHours = (startMs - endMs) / (1000 * 60 * 60);

  const minGap = isRosterChangeover ? 8 : 10;

  if (gapHours >= 10) {
    return { gap_hours: gapHours, is_compliant: true, overtime_hours_due: 0, warning: null };
  }

  if (gapHours >= 8) {
    const otHours = 10 - gapHours;
    return {
      gap_hours: gapHours,
      is_compliant: isRosterChangeover,
      overtime_hours_due: isRosterChangeover ? 0 : otHours,
      warning: isRosterChangeover
        ? null
        : `${gapHours.toFixed(1)}hr gap — first ${otHours.toFixed(1)}hr at overtime rate`,
    };
  }

  return {
    gap_hours: gapHours,
    is_compliant: false,
    overtime_hours_due: 10 - gapHours,
    warning: `Only ${gapHours.toFixed(1)}hr gap — requires manager override. OT applies for ${(10 - gapHours).toFixed(1)}hrs`,
  };
}

// ===================== FATIGUE ASSESSMENT (Update 9) =====================

export function assessFatigueRisk(
  shifts: { date: string; start_time: string; end_time: string; break_minutes: number }[]
): FatigueAssessment {
  if (shifts.length === 0) {
    return { user_id: '', consecutive_days: 0, max_consecutive: 10, short_gaps: [], long_shifts: [], risk_level: 'LOW', warnings: [] };
  }

  const sorted = [...shifts].sort((a, b) => a.date.localeCompare(b.date));
  const warnings: string[] = [];
  const shortGaps: { date: string; gap_hours: number }[] = [];
  const longShifts: { date: string; hours: number }[] = [];

  // Count consecutive days
  let maxConsecutive = 1;
  let currentStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentStreak++;
      maxConsecutive = Math.max(maxConsecutive, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  if (maxConsecutive >= 10) warnings.push(`${maxConsecutive} consecutive days — must have day off`);
  else if (maxConsecutive >= 8) warnings.push(`${maxConsecutive} consecutive days — approaching limit of 10`);

  // Check shift lengths and gaps
  for (let i = 0; i < sorted.length; i++) {
    const hrs = minutesBetween(sorted[i].start_time, sorted[i].end_time, sorted[i].break_minutes) / 60;
    if (hrs >= 10) longShifts.push({ date: sorted[i].date, hours: hrs });

    if (i > 0) {
      const prevEnd = `${sorted[i - 1].date}T${sorted[i - 1].end_time}`;
      const currStart = `${sorted[i].date}T${sorted[i].start_time}`;
      const gap = calculateShiftGap(prevEnd, currStart);
      if (gap.gap_hours < 10) {
        shortGaps.push({ date: sorted[i].date, gap_hours: gap.gap_hours });
      }
    }
  }

  if (shortGaps.length > 0) warnings.push(`${shortGaps.length} shift gap(s) under 10 hours`);

  let risk: FatigueRisk = 'LOW';
  if (maxConsecutive >= 10 || shortGaps.some(g => g.gap_hours < 8)) risk = 'HIGH';
  else if (maxConsecutive >= 8 || shortGaps.length > 0 || longShifts.length > 4) risk = 'MEDIUM';

  return {
    user_id: '',
    consecutive_days: currentStreak,
    max_consecutive: 10,
    short_gaps: shortGaps,
    long_shifts: longShifts,
    risk_level: risk,
    warnings,
  };
}

// ===================== HELPERS =====================

function emptyBreakdown(classification: string): ShiftPayBreakdown {
  return {
    base_hours: 0, base_pay: 0,
    saturday_hours: 0, saturday_pay: 0,
    sunday_hours: 0, sunday_pay: 0,
    public_holiday_hours: 0, public_holiday_pay: 0,
    evening_hours: 0, evening_loading: 0,
    late_night_hours: 0, late_night_loading: 0,
    overtime_hours_150: 0, overtime_pay_150: 0,
    overtime_hours_200: 0, overtime_pay_200: 0,
    missed_break_penalty: 0,
    higher_duties_applied: false,
    effective_classification: classification,
    allowances: [],
    total_gross: 0,
  };
}
