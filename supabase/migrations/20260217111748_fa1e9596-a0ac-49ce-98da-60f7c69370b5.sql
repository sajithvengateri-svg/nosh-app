
-- ============================================================
-- LabourOS Module 1: 16 Tables + RLS + Seed Data
-- Australian Award Engine Foundation
-- ============================================================

-- ===================== REFERENCE TABLES =====================

-- 1. Award Rates (date-range based for annual updates)
CREATE TABLE public.award_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_code TEXT NOT NULL DEFAULT 'MA000009',
  classification TEXT NOT NULL,
  employment_type TEXT NOT NULL CHECK (employment_type IN ('FULL_TIME','PART_TIME','CASUAL')),
  effective_from DATE NOT NULL,
  effective_to DATE,
  base_hourly_rate NUMERIC(8,2) NOT NULL,
  casual_loading_pct NUMERIC(5,2) DEFAULT 0,
  casual_hourly_rate NUMERIC(8,2),
  weekly_rate NUMERIC(10,2),
  annual_rate NUMERIC(12,2),
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_award_rates_lookup ON public.award_rates(award_code, classification, employment_type, effective_from);

ALTER TABLE public.award_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read award rates" ON public.award_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage award rates" ON public.award_rates FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 2. Penalty Rules
CREATE TABLE public.penalty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_code TEXT NOT NULL DEFAULT 'MA000009',
  employment_type TEXT NOT NULL,
  condition TEXT NOT NULL,
  multiplier NUMERIC(5,2),
  flat_addition NUMERIC(8,2),
  applies_from_time TIME,
  applies_to_time TIME,
  applies_to_day TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_penalty_rules_lookup ON public.penalty_rules(award_code, employment_type, condition);

ALTER TABLE public.penalty_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read penalty rules" ON public.penalty_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage penalty rules" ON public.penalty_rules FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 3. Public Holidays (per state per year)
CREATE TABLE public.public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  is_national BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(date, state)
);

ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read public holidays" ON public.public_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage public holidays" ON public.public_holidays FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- 4. Allowance Rates (date-range based)
CREATE TABLE public.allowance_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  award_code TEXT NOT NULL DEFAULT 'MA000009',
  allowance_type TEXT NOT NULL,
  amount NUMERIC(8,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'PER_OCCURRENCE',
  effective_from DATE NOT NULL,
  effective_to DATE,
  description TEXT,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.allowance_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read allowance rates" ON public.allowance_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage allowance rates" ON public.allowance_rates FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ===================== EMPLOYEE & HR =====================

-- 5. Employee Profiles
CREATE TABLE public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('FULL_TIME','PART_TIME','CASUAL')),
  pay_type TEXT NOT NULL DEFAULT 'AWARD_HOURLY' CHECK (pay_type IN ('AWARD_HOURLY','AWARD_ANNUALISED','ABOVE_AWARD_SALARY')),
  classification TEXT NOT NULL,
  award_code TEXT NOT NULL DEFAULT 'MA000009',
  annual_salary NUMERIC(12,2),
  agreed_hours_per_week NUMERIC(5,2),
  tax_file_number_encrypted TEXT,
  date_of_birth DATE,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  bank_bsb TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  super_fund_name TEXT,
  super_fund_usi TEXT,
  super_member_number TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  termination_reason TEXT,
  section_tags JSONB DEFAULT '[]'::jsonb,
  supplies_own_tools BOOLEAN DEFAULT false,
  is_first_aid_officer BOOLEAN DEFAULT false,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employee_profiles_org ON public.employee_profiles(org_id);
CREATE INDEX idx_employee_profiles_user ON public.employee_profiles(user_id);

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view employee profiles" ON public.employee_profiles FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage employee profiles" ON public.employee_profiles FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update employee profiles" ON public.employee_profiles FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete employee profiles" ON public.employee_profiles FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Staff Availability
CREATE TABLE public.staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  available BOOLEAN DEFAULT true,
  preferred_start TIME,
  preferred_end TIME,
  max_hours NUMERIC(5,2),
  notes TEXT,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_availability_user ON public.staff_availability(user_id, day_of_week);

ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view availability" ON public.staff_availability FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Users can manage own availability" ON public.staff_availability FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Users can update own availability" ON public.staff_availability FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Users can delete own availability" ON public.staff_availability FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- ===================== ROSTERING =====================

-- 7. Rosters
CREATE TABLE public.rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT DEFAULT 'WEEKLY' CHECK (period_type IN ('WEEKLY','FORTNIGHTLY')),
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  labour_budget NUMERIC(10,2),
  total_rostered_hours NUMERIC(8,2),
  total_estimated_cost NUMERIC(10,2),
  published_at TIMESTAMPTZ,
  published_by UUID,
  template_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rosters_org_period ON public.rosters(org_id, period_start);

ALTER TABLE public.rosters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view rosters" ON public.rosters FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage rosters" ON public.rosters FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update rosters" ON public.rosters FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete rosters" ON public.rosters FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

CREATE TRIGGER update_rosters_updated_at BEFORE UPDATE ON public.rosters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Labour Roster Shifts
CREATE TABLE public.labour_roster_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_id UUID NOT NULL REFERENCES public.rosters(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 30,
  section TEXT,
  sub_section TEXT,
  shift_type TEXT DEFAULT 'REGULAR' CHECK (shift_type IN ('REGULAR','SPLIT','ON_CALL','TRAINING')),
  higher_duties_classification TEXT,
  higher_duties_reason TEXT,
  notes TEXT,
  estimated_hours NUMERIC(5,2),
  estimated_cost NUMERIC(10,2),
  is_published BOOLEAN DEFAULT false,
  notification_sent BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','CONFIRMED','SWAPPED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_labour_shifts_roster ON public.labour_roster_shifts(roster_id);
CREATE INDEX idx_labour_shifts_user_date ON public.labour_roster_shifts(user_id, date);
CREATE INDEX idx_labour_shifts_org_date ON public.labour_roster_shifts(org_id, date);

ALTER TABLE public.labour_roster_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view shifts" ON public.labour_roster_shifts FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage shifts" ON public.labour_roster_shifts FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update shifts" ON public.labour_roster_shifts FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete shifts" ON public.labour_roster_shifts FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- 9. Minimum Staffing Rules
CREATE TABLE public.minimum_staffing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  day_type TEXT NOT NULL,
  service_period TEXT NOT NULL,
  min_staff INTEGER NOT NULL,
  min_covers_threshold INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.minimum_staffing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view minimum staffing" ON public.minimum_staffing FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage minimum staffing" ON public.minimum_staffing FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update minimum staffing" ON public.minimum_staffing FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete minimum staffing" ON public.minimum_staffing FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- 10. Roster Templates
CREATE TABLE public.roster_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  shifts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.roster_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view templates" ON public.roster_templates FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage templates" ON public.roster_templates FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update templates" ON public.roster_templates FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete templates" ON public.roster_templates FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- ===================== LEAVE =====================

-- 11. Leave Requests
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours_requested NUMERIC(8,2) NOT NULL,
  reason TEXT,
  medical_cert_url TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','DECLINED','CANCELLED')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  decline_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leave_requests_user ON public.leave_requests(user_id, status);
CREATE INDEX idx_leave_requests_org ON public.leave_requests(org_id, status);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view leave requests" ON public.leave_requests FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Users can create own leave requests" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Managers can update leave requests" ON public.leave_requests FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Managers can delete leave requests" ON public.leave_requests FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- 12. Leave Balances
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  leave_type TEXT NOT NULL,
  accrued_hours NUMERIC(10,2) DEFAULT 0,
  taken_hours NUMERIC(10,2) DEFAULT 0,
  balance_hours NUMERIC(10,2) DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, leave_type)
);

ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view leave balances" ON public.leave_balances FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Managers can manage leave balances" ON public.leave_balances FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Managers can update leave balances" ON public.leave_balances FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- ===================== PAYROLL =====================

-- 13. Payroll Runs
CREATE TABLE public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pay_cycle TEXT DEFAULT 'WEEKLY',
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','CALCULATED','APPROVED','PROCESSED','FINALISED')),
  total_gross NUMERIC(12,2),
  total_tax NUMERIC(12,2),
  total_super NUMERIC(12,2),
  total_net NUMERIC(12,2),
  total_employees INTEGER,
  bank_file_generated BOOLEAN DEFAULT false,
  bank_file_url TEXT,
  stp_submitted BOOLEAN DEFAULT false,
  super_file_generated BOOLEAN DEFAULT false,
  super_file_url TEXT,
  super_due_date DATE,
  super_confirmed BOOLEAN DEFAULT false,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_runs_org ON public.payroll_runs(org_id, period_start);

ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view payroll runs" ON public.payroll_runs FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage payroll runs" ON public.payroll_runs FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update payroll runs" ON public.payroll_runs FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete payroll runs" ON public.payroll_runs FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- 14. Payroll Items
CREATE TABLE public.payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  employment_type TEXT NOT NULL,
  classification TEXT NOT NULL,
  ordinary_hours NUMERIC(8,2) DEFAULT 0,
  overtime_hours_150 NUMERIC(8,2) DEFAULT 0,
  overtime_hours_200 NUMERIC(8,2) DEFAULT 0,
  saturday_hours NUMERIC(8,2) DEFAULT 0,
  sunday_hours NUMERIC(8,2) DEFAULT 0,
  public_holiday_hours NUMERIC(8,2) DEFAULT 0,
  evening_hours NUMERIC(8,2) DEFAULT 0,
  late_night_hours NUMERIC(8,2) DEFAULT 0,
  leave_hours NUMERIC(8,2) DEFAULT 0,
  total_hours NUMERIC(8,2) DEFAULT 0,
  base_pay NUMERIC(10,2) DEFAULT 0,
  penalty_pay NUMERIC(10,2) DEFAULT 0,
  overtime_pay NUMERIC(10,2) DEFAULT 0,
  leave_pay NUMERIC(10,2) DEFAULT 0,
  leave_loading NUMERIC(10,2) DEFAULT 0,
  allowances NUMERIC(10,2) DEFAULT 0,
  allowance_details JSONB DEFAULT '[]'::jsonb,
  gross_pay NUMERIC(10,2) DEFAULT 0,
  payg_tax NUMERIC(10,2) DEFAULT 0,
  salary_sacrifice NUMERIC(10,2) DEFAULT 0,
  other_deductions NUMERIC(10,2) DEFAULT 0,
  deduction_details JSONB DEFAULT '[]'::jsonb,
  net_pay NUMERIC(10,2) DEFAULT 0,
  super_guarantee NUMERIC(10,2) DEFAULT 0,
  super_salary_sacrifice NUMERIC(10,2) DEFAULT 0,
  super_total NUMERIC(10,2) DEFAULT 0,
  ytd_gross NUMERIC(12,2) DEFAULT 0,
  ytd_tax NUMERIC(12,2) DEFAULT 0,
  ytd_super NUMERIC(12,2) DEFAULT 0,
  -- STP Phase 2 fields
  stp_gross_salary NUMERIC(10,2),
  stp_paid_leave NUMERIC(10,2),
  stp_paid_leave_type TEXT,
  stp_allowances JSONB DEFAULT '[]'::jsonb,
  stp_overtime NUMERIC(10,2),
  stp_lump_sum_type TEXT,
  stp_lump_sum_amount NUMERIC(10,2),
  stp_resc NUMERIC(10,2),
  stp_submitted BOOLEAN DEFAULT false,
  stp_event_id TEXT,
  payslip_url TEXT,
  payslip_sent BOOLEAN DEFAULT false,
  bank_bsb TEXT,
  bank_account TEXT,
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PAID')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payroll_items_run ON public.payroll_items(payroll_run_id);
CREATE INDEX idx_payroll_items_user ON public.payroll_items(user_id);

ALTER TABLE public.payroll_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view payroll items" ON public.payroll_items FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage payroll items" ON public.payroll_items FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update payroll items" ON public.payroll_items FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete payroll items" ON public.payroll_items FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- ===================== COMPLIANCE =====================

-- 15. Communication Rules (Right to Disconnect)
CREATE TABLE public.communication_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  message_type TEXT NOT NULL,
  allowed_window_start TIME DEFAULT '08:00',
  allowed_window_end TIME DEFAULT '21:00',
  respect_rtd BOOLEAN DEFAULT true,
  emergency_override BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.communication_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view communication rules" ON public.communication_rules FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage communication rules" ON public.communication_rules FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update communication rules" ON public.communication_rules FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete communication rules" ON public.communication_rules FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- 16. Geofence Locations
CREATE TABLE public.geofence_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  radius_meters INTEGER DEFAULT 100,
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.geofence_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view geofence locations" ON public.geofence_locations FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage geofence locations" ON public.geofence_locations FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update geofence locations" ON public.geofence_locations FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can delete geofence locations" ON public.geofence_locations FOR DELETE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- 17. Clock Events (Time & Attendance)
CREATE TABLE public.clock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('CLOCK_IN','CLOCK_OUT','BREAK_START','BREAK_END','ROLE_CHANGE')),
  event_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  gps_accuracy NUMERIC(8,2),
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('IPAD','PHONE','BROWSER')),
  photo_url TEXT,
  geofence_result TEXT CHECK (geofence_result IN ('ON_SITE','REMOTE','UNKNOWN')),
  role_change_from TEXT,
  role_change_to TEXT,
  notes TEXT,
  shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clock_events_user_date ON public.clock_events(user_id, shift_date);
CREATE INDEX idx_clock_events_org_date ON public.clock_events(org_id, shift_date);

ALTER TABLE public.clock_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view clock events" ON public.clock_events FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Users can create own clock events" ON public.clock_events FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Managers can update clock events" ON public.clock_events FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

-- 18. Labour Settings (per org)
CREATE TABLE public.labour_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  default_award_code TEXT DEFAULT 'MA000009',
  pay_cycle TEXT DEFAULT 'WEEKLY',
  rounding_rule TEXT DEFAULT 'EXACT' CHECK (rounding_rule IN ('EXACT','NEAREST_6','NEAREST_15')),
  default_super_rate NUMERIC(5,2) DEFAULT 12.0,
  payday_super_enabled BOOLEAN DEFAULT true,
  record_retention_years INTEGER DEFAULT 7,
  overtime_approval_required BOOLEAN DEFAULT false,
  auto_break_deduction BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.labour_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view labour settings" ON public.labour_settings FOR SELECT TO authenticated USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage labour settings" ON public.labour_settings FOR INSERT TO authenticated WITH CHECK (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));
CREATE POLICY "Org managers can update labour settings" ON public.labour_settings FOR UPDATE TO authenticated USING (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id));

CREATE TRIGGER update_labour_settings_updated_at BEFORE UPDATE ON public.labour_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===================== SEED DATA =====================

-- MA000009 Hospitality Award Rates (effective 1 Jul 2025)
INSERT INTO public.award_rates (award_code, classification, employment_type, effective_from, base_hourly_rate, casual_loading_pct, casual_hourly_rate, weekly_rate) VALUES
-- Full-Time
('MA000009','FB_INTRO','FULL_TIME','2025-07-01',23.23,0,NULL,882.74),
('MA000009','FB_1','FULL_TIME','2025-07-01',24.73,0,NULL,939.74),
('MA000009','FB_2','FULL_TIME','2025-07-01',25.85,0,NULL,982.30),
('MA000009','FB_3','FULL_TIME','2025-07-01',26.70,0,NULL,1014.60),
('MA000009','FB_4','FULL_TIME','2025-07-01',27.86,0,NULL,1058.68),
('MA000009','FB_5','FULL_TIME','2025-07-01',29.38,0,NULL,1116.44),
('MA000009','K_INTRO','FULL_TIME','2025-07-01',23.23,0,NULL,882.74),
('MA000009','K_1','FULL_TIME','2025-07-01',24.73,0,NULL,939.74),
('MA000009','K_2','FULL_TIME','2025-07-01',25.85,0,NULL,982.30),
('MA000009','K_3','FULL_TIME','2025-07-01',26.70,0,NULL,1014.60),
('MA000009','COOK_1','FULL_TIME','2025-07-01',25.85,0,NULL,982.30),
('MA000009','COOK_2','FULL_TIME','2025-07-01',26.70,0,NULL,1014.60),
('MA000009','COOK_3','FULL_TIME','2025-07-01',27.86,0,NULL,1058.68),
('MA000009','COOK_4','FULL_TIME','2025-07-01',29.38,0,NULL,1116.44),
('MA000009','COOK_5','FULL_TIME','2025-07-01',30.68,0,NULL,1165.84),
-- Part-Time (same base rates)
('MA000009','FB_1','PART_TIME','2025-07-01',24.73,0,NULL,NULL),
('MA000009','FB_2','PART_TIME','2025-07-01',25.85,0,NULL,NULL),
('MA000009','FB_3','PART_TIME','2025-07-01',26.70,0,NULL,NULL),
('MA000009','FB_4','PART_TIME','2025-07-01',27.86,0,NULL,NULL),
('MA000009','FB_5','PART_TIME','2025-07-01',29.38,0,NULL,NULL),
('MA000009','COOK_1','PART_TIME','2025-07-01',25.85,0,NULL,NULL),
('MA000009','COOK_2','PART_TIME','2025-07-01',26.70,0,NULL,NULL),
('MA000009','COOK_3','PART_TIME','2025-07-01',27.86,0,NULL,NULL),
('MA000009','COOK_4','PART_TIME','2025-07-01',29.38,0,NULL,NULL),
('MA000009','COOK_5','PART_TIME','2025-07-01',30.68,0,NULL,NULL),
-- Casual (25% loading)
('MA000009','FB_1','CASUAL','2025-07-01',24.73,25.0,30.91,NULL),
('MA000009','FB_2','CASUAL','2025-07-01',25.85,25.0,32.31,NULL),
('MA000009','FB_3','CASUAL','2025-07-01',26.70,25.0,33.38,NULL),
('MA000009','FB_4','CASUAL','2025-07-01',27.86,25.0,34.83,NULL),
('MA000009','FB_5','CASUAL','2025-07-01',29.38,25.0,36.73,NULL),
('MA000009','COOK_1','CASUAL','2025-07-01',25.85,25.0,32.31,NULL),
('MA000009','COOK_2','CASUAL','2025-07-01',26.70,25.0,33.38,NULL),
('MA000009','COOK_3','CASUAL','2025-07-01',27.86,25.0,34.83,NULL),
('MA000009','COOK_4','CASUAL','2025-07-01',29.38,25.0,36.73,NULL),
('MA000009','COOK_5','CASUAL','2025-07-01',30.68,25.0,38.35,NULL);

-- MA000119 Restaurant Award Rates (effective 1 Jul 2025, similar structure)
INSERT INTO public.award_rates (award_code, classification, employment_type, effective_from, base_hourly_rate, casual_loading_pct, casual_hourly_rate, weekly_rate) VALUES
('MA000119','FB_1','FULL_TIME','2025-07-01',24.73,0,NULL,939.74),
('MA000119','FB_2','FULL_TIME','2025-07-01',25.85,0,NULL,982.30),
('MA000119','FB_3','FULL_TIME','2025-07-01',26.70,0,NULL,1014.60),
('MA000119','FB_4','FULL_TIME','2025-07-01',27.86,0,NULL,1058.68),
('MA000119','COOK_1','FULL_TIME','2025-07-01',25.85,0,NULL,982.30),
('MA000119','COOK_2','FULL_TIME','2025-07-01',26.70,0,NULL,1014.60),
('MA000119','COOK_3','FULL_TIME','2025-07-01',27.86,0,NULL,1058.68),
('MA000119','COOK_4','FULL_TIME','2025-07-01',29.38,0,NULL,1116.44),
('MA000119','COOK_5','FULL_TIME','2025-07-01',30.68,0,NULL,1165.84),
('MA000119','FB_1','CASUAL','2025-07-01',24.73,25.0,30.91,NULL),
('MA000119','FB_2','CASUAL','2025-07-01',25.85,25.0,32.31,NULL),
('MA000119','COOK_1','CASUAL','2025-07-01',25.85,25.0,32.31,NULL),
('MA000119','COOK_2','CASUAL','2025-07-01',26.70,25.0,33.38,NULL),
('MA000119','COOK_3','CASUAL','2025-07-01',27.86,25.0,34.83,NULL),
('MA000119','COOK_4','CASUAL','2025-07-01',29.38,25.0,36.73,NULL),
('MA000119','COOK_5','CASUAL','2025-07-01',30.68,25.0,38.35,NULL);

-- Penalty Rules (MA000009)
INSERT INTO public.penalty_rules (award_code, employment_type, condition, multiplier, flat_addition, applies_from_time, applies_to_time, applies_to_day, notes) VALUES
-- Full-Time/Part-Time penalties
('MA000009','PERMANENT','SATURDAY',1.25,NULL,NULL,NULL,'SATURDAY','Saturday loading'),
('MA000009','PERMANENT','SUNDAY',1.50,NULL,NULL,NULL,'SUNDAY','Sunday loading'),
('MA000009','PERMANENT','PUBLIC_HOLIDAY',2.25,NULL,NULL,NULL,'PUBLIC_HOLIDAY','Public holiday + substitute day'),
('MA000009','PERMANENT','EVENING',NULL,2.81,'19:00','00:00',NULL,'Evening loading 7pm-midnight'),
('MA000009','PERMANENT','LATE_NIGHT',NULL,4.22,'00:00','07:00',NULL,'Late night loading midnight-7am'),
('MA000009','PERMANENT','OVERTIME_FIRST2',1.50,NULL,NULL,NULL,NULL,'First 2 hours overtime'),
('MA000009','PERMANENT','OVERTIME_AFTER2',2.00,NULL,NULL,NULL,NULL,'After 2 hours overtime'),
('MA000009','PERMANENT','MISSED_BREAK',1.50,NULL,NULL,NULL,NULL,'50% loading if break not given within 6hrs'),
('MA000009','PERMANENT','MINIMUM_BREAK_GAP',NULL,NULL,NULL,NULL,NULL,'10hr min gap between shifts, 8hr for roster changeover'),
-- Casual penalties
('MA000009','CASUAL','SATURDAY',1.50,NULL,NULL,NULL,'SATURDAY','Saturday casual rate (1.5x base)'),
('MA000009','CASUAL','SUNDAY',1.75,NULL,NULL,NULL,'SUNDAY','Sunday casual rate (1.75x base)'),
('MA000009','CASUAL','PUBLIC_HOLIDAY',2.50,NULL,NULL,NULL,'PUBLIC_HOLIDAY','Public holiday casual rate'),
('MA000009','CASUAL','EVENING',NULL,2.81,'19:00','00:00',NULL,'Evening loading (on top of casual rate)'),
('MA000009','CASUAL','LATE_NIGHT',NULL,4.22,'00:00','07:00',NULL,'Late night loading (on top of casual rate)'),
('MA000009','CASUAL','OVERTIME_FIRST2',1.50,NULL,NULL,NULL,NULL,'OT first 2hrs on BASE rate (not casual loaded)'),
('MA000009','CASUAL','OVERTIME_AFTER2',2.00,NULL,NULL,NULL,NULL,'OT after 2hrs on BASE rate (not casual loaded)'),
('MA000009','CASUAL','MISSED_BREAK',1.50,NULL,NULL,NULL,NULL,'50% loading if break not given within 6hrs');

-- MA000119 Penalty Rules (same structure)
INSERT INTO public.penalty_rules (award_code, employment_type, condition, multiplier, flat_addition, applies_from_time, applies_to_time, applies_to_day, notes) VALUES
('MA000119','PERMANENT','SATURDAY',1.25,NULL,NULL,NULL,'SATURDAY','Saturday loading'),
('MA000119','PERMANENT','SUNDAY',1.50,NULL,NULL,NULL,'SUNDAY','Sunday loading'),
('MA000119','PERMANENT','PUBLIC_HOLIDAY',2.25,NULL,NULL,NULL,'PUBLIC_HOLIDAY','Public holiday'),
('MA000119','PERMANENT','EVENING',NULL,2.81,'19:00','00:00',NULL,'Evening loading'),
('MA000119','PERMANENT','LATE_NIGHT',NULL,4.22,'00:00','07:00',NULL,'Late night loading'),
('MA000119','PERMANENT','OVERTIME_FIRST2',1.50,NULL,NULL,NULL,NULL,'First 2 hours overtime'),
('MA000119','PERMANENT','OVERTIME_AFTER2',2.00,NULL,NULL,NULL,NULL,'After 2 hours overtime'),
('MA000119','CASUAL','SATURDAY',1.50,NULL,NULL,NULL,'SATURDAY','Saturday casual'),
('MA000119','CASUAL','SUNDAY',1.75,NULL,NULL,NULL,'SUNDAY','Sunday casual'),
('MA000119','CASUAL','PUBLIC_HOLIDAY',2.50,NULL,NULL,NULL,'PUBLIC_HOLIDAY','PH casual'),
('MA000119','CASUAL','OVERTIME_FIRST2',1.50,NULL,NULL,NULL,NULL,'OT first 2hrs base rate'),
('MA000119','CASUAL','OVERTIME_AFTER2',2.00,NULL,NULL,NULL,NULL,'OT after 2hrs base rate');

-- QLD 2026 Public Holidays
INSERT INTO public.public_holidays (date, name, state, is_national) VALUES
('2026-01-01','New Year''s Day','QLD',true),
('2026-01-26','Australia Day','QLD',true),
('2026-04-03','Good Friday','QLD',true),
('2026-04-04','Easter Saturday','QLD',true),
('2026-04-06','Easter Monday','QLD',true),
('2026-04-25','Anzac Day','QLD',true),
('2026-08-13','Royal Queensland Show (Brisbane)','QLD',false),
('2026-10-13','Queen''s Birthday','QLD',false),
('2026-12-25','Christmas Day','QLD',true),
('2026-12-26','Boxing Day','QLD',true);

-- Allowance Rates
INSERT INTO public.allowance_rates (award_code, allowance_type, amount, unit, effective_from, description) VALUES
('MA000009','MEAL',16.73,'PER_OCCURRENCE','2025-07-01','Meal allowance for >2hrs unnotified overtime'),
('MA000009','SPLIT_SHIFT',5.34,'PER_OCCURRENCE','2025-07-01','Split shift allowance per qualifying period'),
('MA000009','TOOL',2.50,'PER_WEEK','2025-07-01','Tool and equipment allowance for cooks'),
('MA000009','FIRST_AID',16.07,'PER_WEEK','2025-07-01','Appointed first aid officer allowance'),
('MA000009','UNIFORM',7.50,'PER_WEEK','2025-07-01','Uniform/laundry allowance'),
('MA000119','MEAL',16.73,'PER_OCCURRENCE','2025-07-01','Meal allowance'),
('MA000119','SPLIT_SHIFT',5.34,'PER_OCCURRENCE','2025-07-01','Split shift allowance');
