// LabourOS — Full type definitions for Australian Award compliance

// ===================== ENUMS / LITERALS =====================

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CASUAL';
export type PayType = 'AWARD_HOURLY' | 'AWARD_ANNUALISED' | 'ABOVE_AWARD_SALARY';
export type ShiftType = 'REGULAR' | 'SPLIT' | 'ON_CALL' | 'TRAINING';
export type ShiftStatus = 'SCHEDULED' | 'CONFIRMED' | 'SWAPPED' | 'CANCELLED';
export type RosterStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type PeriodType = 'WEEKLY' | 'FORTNIGHTLY';
export type LeaveType = 'ANNUAL' | 'PERSONAL' | 'COMPASSIONATE' | 'LONG_SERVICE' | 'PARENTAL' | 'FDV' | 'COMMUNITY' | 'PUBLIC_HOLIDAY' | 'UNPAID' | 'TOIL';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PROCESSED' | 'FINALISED';
export type PaymentStatus = 'PENDING' | 'PAID';
export type ClockEventType = 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END' | 'ROLE_CHANGE';
export type DeviceType = 'IPAD' | 'PHONE' | 'BROWSER';
export type GeofenceResult = 'ON_SITE' | 'REMOTE' | 'UNKNOWN';
export type RoundingRule = 'EXACT' | 'NEAREST_6' | 'NEAREST_15';
export type DayType = 'WEEKDAY' | 'SATURDAY' | 'SUNDAY' | 'PUBLIC_HOLIDAY';
export type FatigueRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type Classification =
  | 'FB_INTRO' | 'FB_1' | 'FB_2' | 'FB_3' | 'FB_4' | 'FB_5'
  | 'K_INTRO' | 'K_1' | 'K_2' | 'K_3'
  | 'COOK_1' | 'COOK_2' | 'COOK_3' | 'COOK_4' | 'COOK_5';

// ===================== DATABASE ROW TYPES =====================

export interface AwardRate {
  id: string;
  award_code: string;
  classification: string;
  employment_type: EmploymentType;
  effective_from: string;
  effective_to: string | null;
  base_hourly_rate: number;
  casual_loading_pct: number;
  casual_hourly_rate: number | null;
  weekly_rate: number | null;
  annual_rate: number | null;
  is_current: boolean;
}

export interface PenaltyRule {
  id: string;
  award_code: string;
  employment_type: string;
  condition: string;
  multiplier: number | null;
  flat_addition: number | null;
  applies_from_time: string | null;
  applies_to_time: string | null;
  applies_to_day: string | null;
  notes: string | null;
}

export interface PublicHoliday {
  id: string;
  date: string;
  name: string;
  state: string;
  is_national: boolean;
}

export interface AllowanceRate {
  id: string;
  award_code: string;
  allowance_type: string;
  amount: number;
  unit: string;
  effective_from: string;
  effective_to: string | null;
  description: string | null;
  is_current: boolean;
}

export interface EmployeeProfile {
  id: string;
  org_id: string;
  user_id: string;
  employment_type: EmploymentType;
  pay_type: PayType;
  classification: string;
  award_code: string;
  annual_salary: number | null;
  agreed_hours_per_week: number | null;
  tax_file_number_encrypted: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  bank_bsb: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  super_fund_name: string | null;
  super_fund_usi: string | null;
  super_member_number: string | null;
  start_date: string;
  end_date: string | null;
  termination_reason: string | null;
  section_tags: string[];
  supplies_own_tools: boolean;
  is_first_aid_officer: boolean;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StaffAvailability {
  id: string;
  org_id: string;
  user_id: string;
  day_of_week: number;
  available: boolean;
  preferred_start: string | null;
  preferred_end: string | null;
  max_hours: number | null;
  notes: string | null;
  effective_from: string | null;
  effective_to: string | null;
}

export interface Roster {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;
  period_type: PeriodType;
  status: RosterStatus;
  labour_budget: number | null;
  total_rostered_hours: number | null;
  total_estimated_cost: number | null;
  published_at: string | null;
  published_by: string | null;
  template_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LabourRosterShift {
  id: string;
  roster_id: string;
  org_id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  section: string | null;
  sub_section: string | null;
  shift_type: ShiftType;
  higher_duties_classification: string | null;
  higher_duties_reason: string | null;
  notes: string | null;
  estimated_hours: number | null;
  estimated_cost: number | null;
  is_published: boolean;
  notification_sent: boolean;
  status: ShiftStatus;
}

export interface MinimumStaffing {
  id: string;
  org_id: string;
  section: string;
  day_type: string;
  service_period: string;
  min_staff: number;
  min_covers_threshold: number | null;
  notes: string | null;
}

export interface RosterTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  shifts: unknown[];
  created_by: string | null;
}

export interface LeaveRequest {
  id: string;
  org_id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  hours_requested: number;
  reason: string | null;
  medical_cert_url: string | null;
  status: LeaveRequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  decline_reason: string | null;
  created_at: string;
}

export interface LeaveBalance {
  id: string;
  org_id: string;
  user_id: string;
  leave_type: string;
  accrued_hours: number;
  taken_hours: number;
  balance_hours: number;
  last_calculated: string;
}

export interface PayrollRun {
  id: string;
  org_id: string;
  period_start: string;
  period_end: string;
  pay_cycle: string;
  status: PayrollStatus;
  total_gross: number | null;
  total_tax: number | null;
  total_super: number | null;
  total_net: number | null;
  total_employees: number | null;
  bank_file_generated: boolean;
  bank_file_url: string | null;
  stp_submitted: boolean;
  super_file_generated: boolean;
  super_file_url: string | null;
  super_due_date: string | null;
  super_confirmed: boolean;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface PayrollItem {
  id: string;
  payroll_run_id: string;
  org_id: string;
  user_id: string;
  employment_type: string;
  classification: string;
  ordinary_hours: number;
  overtime_hours_150: number;
  overtime_hours_200: number;
  saturday_hours: number;
  sunday_hours: number;
  public_holiday_hours: number;
  evening_hours: number;
  late_night_hours: number;
  leave_hours: number;
  total_hours: number;
  base_pay: number;
  penalty_pay: number;
  overtime_pay: number;
  leave_pay: number;
  leave_loading: number;
  allowances: number;
  allowance_details: AllowanceDetail[];
  gross_pay: number;
  payg_tax: number;
  salary_sacrifice: number;
  other_deductions: number;
  deduction_details: unknown[];
  net_pay: number;
  super_guarantee: number;
  super_salary_sacrifice: number;
  super_total: number;
  ytd_gross: number;
  ytd_tax: number;
  ytd_super: number;
  stp_gross_salary: number | null;
  stp_paid_leave: number | null;
  stp_paid_leave_type: string | null;
  stp_allowances: unknown[];
  stp_overtime: number | null;
  stp_submitted: boolean;
  stp_event_id: string | null;
  payslip_url: string | null;
  payslip_sent: boolean;
  payment_status: PaymentStatus;
}

export interface ClockEvent {
  id: string;
  org_id: string;
  user_id: string;
  event_type: ClockEventType;
  event_time: string;
  latitude: number | null;
  longitude: number | null;
  gps_accuracy: number | null;
  device_id: string | null;
  device_type: DeviceType | null;
  photo_url: string | null;
  geofence_result: GeofenceResult | null;
  role_change_from: string | null;
  role_change_to: string | null;
  notes: string | null;
  shift_date: string;
}

export interface CommunicationRule {
  id: string;
  org_id: string;
  channel: string;
  message_type: string;
  allowed_window_start: string;
  allowed_window_end: string;
  respect_rtd: boolean;
  emergency_override: boolean;
}

export interface GeofenceLocation {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  is_primary: boolean;
  is_active: boolean;
}

export interface LabourSettings {
  id: string;
  org_id: string;
  default_award_code: string;
  pay_cycle: string;
  rounding_rule: RoundingRule;
  default_super_rate: number;
  payday_super_enabled: boolean;
  record_retention_years: number;
  overtime_approval_required: boolean;
  auto_break_deduction: boolean;
}

// ===================== CALCULATION TYPES =====================

export interface AllowanceDetail {
  type: string;
  amount: number;
  description: string;
}

export interface ShiftPayBreakdown {
  base_hours: number;
  base_pay: number;
  saturday_hours: number;
  saturday_pay: number;
  sunday_hours: number;
  sunday_pay: number;
  public_holiday_hours: number;
  public_holiday_pay: number;
  evening_hours: number;
  evening_loading: number;
  late_night_hours: number;
  late_night_loading: number;
  overtime_hours_150: number;
  overtime_pay_150: number;
  overtime_hours_200: number;
  overtime_pay_200: number;
  missed_break_penalty: number;
  higher_duties_applied: boolean;
  effective_classification: string;
  allowances: AllowanceDetail[];
  total_gross: number;
}

export interface FatigueAssessment {
  user_id: string;
  consecutive_days: number;
  max_consecutive: number;
  short_gaps: { date: string; gap_hours: number }[];
  long_shifts: { date: string; hours: number }[];
  risk_level: FatigueRisk;
  warnings: string[];
}

export interface ShiftGapResult {
  gap_hours: number;
  is_compliant: boolean;
  overtime_hours_due: number;
  warning: string | null;
}
