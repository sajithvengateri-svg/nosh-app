
-- =============================================
-- ClockOS: Time & Attendance + Workforce Onboarding
-- =============================================

-- 1. ALTER clock_events to add ClockOS-specific columns
ALTER TABLE public.clock_events
  ADD COLUMN IF NOT EXISTS location_type text DEFAULT 'ON_SITE',
  ADD COLUMN IF NOT EXISTS remote_reason text,
  ADD COLUMN IF NOT EXISTS rostered boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS rostered_start time,
  ADD COLUMN IF NOT EXISTS rostered_end time,
  ADD COLUMN IF NOT EXISTS late_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS compliance_status text DEFAULT 'VALID',
  ADD COLUMN IF NOT EXISTS override_by uuid,
  ADD COLUMN IF NOT EXISTS override_reason text,
  ADD COLUMN IF NOT EXISTS break_type text;

CREATE INDEX IF NOT EXISTS idx_clock_events_org_date ON public.clock_events(org_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_clock_events_user_date ON public.clock_events(user_id, event_time DESC);
CREATE INDEX IF NOT EXISTS idx_clock_events_type ON public.clock_events(event_type);

-- 2. Employee PINs (separate table for security)
CREATE TABLE public.employee_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  pin_hash text NOT NULL,
  is_temporary boolean DEFAULT true,
  failed_attempts integer DEFAULT 0,
  locked_until timestamptz,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);
ALTER TABLE public.employee_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read own PIN" ON public.employee_pins
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Org managers can manage PINs" ON public.employee_pins
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );

-- 3. Clock shifts (active shift tracking derived from clock events)
CREATE TABLE public.clock_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  shift_date date NOT NULL,
  clock_in timestamptz NOT NULL,
  clock_out timestamptz,
  status text DEFAULT 'ACTIVE',
  total_hours numeric(5,2),
  break_minutes integer DEFAULT 0,
  paid_hours numeric(5,2),
  section text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clock_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view shifts" ON public.clock_shifts
  FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage shifts" ON public.clock_shifts
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );
CREATE POLICY "Staff can insert own clock shifts" ON public.clock_shifts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );
CREATE POLICY "Staff can update own active shifts" ON public.clock_shifts
  FOR UPDATE USING (
    auth.uid() = user_id AND org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );

CREATE INDEX idx_clock_shifts_org_date ON public.clock_shifts(org_id, shift_date DESC);
CREATE INDEX idx_clock_shifts_user ON public.clock_shifts(user_id, shift_date DESC);
CREATE INDEX idx_clock_shifts_status ON public.clock_shifts(status);

-- 4. Clock devices (registered iPads/stations)
CREATE TABLE public.clock_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  device_name text NOT NULL,
  device_identifier text NOT NULL,
  location_description text,
  is_active boolean DEFAULT true,
  require_photo boolean DEFAULT true,
  allow_remote boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clock_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view devices" ON public.clock_devices
  FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage devices" ON public.clock_devices
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );

-- 5. ClockOS Induction modules
CREATE TABLE public.clock_induction_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  module_type text NOT NULL, -- VIDEO, READ_ACKNOWLEDGE, READ_QUIZ, PRACTICAL_ASSESSMENT, DOCUMENT_SIGN
  content_url text,
  content_text text,
  quiz_questions jsonb DEFAULT '[]',
  quiz_pass_pct integer DEFAULT 80,
  required_for_roles jsonb DEFAULT '["ALL"]',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  estimated_minutes integer,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clock_induction_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view modules" ON public.clock_induction_modules
  FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage modules" ON public.clock_induction_modules
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );

-- 6. ClockOS Induction progress (per employee per module)
CREATE TABLE public.clock_induction_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.clock_induction_modules(id) ON DELETE CASCADE,
  status text DEFAULT 'NOT_STARTED', -- NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED
  started_at timestamptz,
  completed_at timestamptz,
  quiz_score integer,
  quiz_attempts integer DEFAULT 0,
  assessed_by uuid,
  assessment_notes text,
  acknowledged_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);
ALTER TABLE public.clock_induction_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view own progress" ON public.clock_induction_progress
  FOR SELECT USING (
    auth.uid() = user_id OR org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );
CREATE POLICY "Staff can update own progress" ON public.clock_induction_progress
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );

-- 7. Onboarding status (overall checklist per employee)
CREATE TABLE public.onboarding_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'NEW', -- NEW, INVITED, DETAILS_SUBMITTED, INDUCTION_STARTED, INDUCTION_COMPLETE, CERTS_VERIFIED, READY_TO_WORK
  personal_details_complete boolean DEFAULT false,
  employment_docs_signed boolean DEFAULT false,
  bank_details_complete boolean DEFAULT false,
  super_details_complete boolean DEFAULT false,
  tfn_submitted boolean DEFAULT false,
  induction_complete boolean DEFAULT false,
  certs_verified boolean DEFAULT false,
  profile_photo_uploaded boolean DEFAULT false,
  pin_changed_from_temp boolean DEFAULT false,
  welcome_email_sent boolean DEFAULT false,
  welcome_email_sent_at timestamptz,
  invited_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);
ALTER TABLE public.onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view onboarding" ON public.onboarding_status
  FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Staff can view own onboarding" ON public.onboarding_status
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Org managers can manage onboarding" ON public.onboarding_status
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );
CREATE POLICY "Staff can update own onboarding" ON public.onboarding_status
  FOR UPDATE USING (
    auth.uid() = user_id AND org_id IN (SELECT public.get_user_org_ids(auth.uid()))
  );

-- 8. Employee lifecycle events
CREATE TABLE public.employee_lifecycle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- HIRED, ONBOARDING_START, PROBATION_START, PROBATION_PASSED, PROMOTION, WARNING_VERBAL, WARNING_WRITTEN, NOTICE_GIVEN, TERMINATION, RESIGNATION, CASUAL_CONVERSION_ELIGIBLE, etc
  details jsonb DEFAULT '{}',
  notes text,
  conducted_by uuid,
  document_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.employee_lifecycle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org managers can view lifecycle" ON public.employee_lifecycle
  FOR SELECT USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );
CREATE POLICY "Org managers can manage lifecycle" ON public.employee_lifecycle
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );

CREATE INDEX idx_lifecycle_user ON public.employee_lifecycle(user_id, created_at DESC);
CREATE INDEX idx_lifecycle_org ON public.employee_lifecycle(org_id, created_at DESC);

-- 9. Employee notes (performance notes)
CREATE TABLE public.employee_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text NOT NULL, -- POSITIVE, CONCERN, INCIDENT, TRAINING, REVIEW, GENERAL
  note text NOT NULL,
  is_private boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.employee_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org managers can view notes" ON public.employee_notes
  FOR SELECT USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );
CREATE POLICY "Org managers can manage notes" ON public.employee_notes
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );

-- 10. Absence records
CREATE TABLE public.absence_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  date date NOT NULL,
  absence_type text NOT NULL, -- NO_SHOW, CALLED_IN_SICK, LEFT_EARLY, UNAUTHORISED
  hours_missed numeric(5,2),
  reason text,
  medical_cert_required boolean DEFAULT false,
  medical_cert_url text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.absence_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org managers can view absences" ON public.absence_records
  FOR SELECT USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );
CREATE POLICY "Org managers can manage absences" ON public.absence_records
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );

CREATE INDEX idx_absence_user ON public.absence_records(user_id, date DESC);

-- 11. Clock settings (per org)
CREATE TABLE public.clock_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL UNIQUE,
  grace_period_minutes integer DEFAULT 5,
  require_photo boolean DEFAULT true,
  photo_retention_days integer DEFAULT 90,
  allow_remote_clock boolean DEFAULT false,
  max_remote_hours_week numeric(5,2) DEFAULT 8,
  auto_break_end_minutes integer DEFAULT 45,
  meal_break_minutes integer DEFAULT 30,
  rest_break_minutes integer DEFAULT 20,
  meal_break_threshold_hours numeric(3,1) DEFAULT 5,
  rest_break_threshold_hours numeric(3,1) DEFAULT 8,
  min_shift_gap_hours numeric(3,1) DEFAULT 8,
  pin_lockout_attempts integer DEFAULT 5,
  pin_lockout_minutes integer DEFAULT 5,
  probation_months integer DEFAULT 6,
  casual_conversion_months integer DEFAULT 6,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.clock_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view clock settings" ON public.clock_settings
  FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids(auth.uid())));
CREATE POLICY "Org managers can manage clock settings" ON public.clock_settings
  FOR ALL USING (
    org_id IN (SELECT public.get_user_org_ids(auth.uid()))
    AND (public.is_org_owner(auth.uid(), org_id) OR public.is_org_head_chef(auth.uid(), org_id))
  );

-- 12. Storage bucket for clock photos
INSERT INTO storage.buckets (id, name, public) VALUES ('clock-photos', 'clock-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org managers can view clock photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'clock-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload clock photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'clock-photos' AND auth.role() = 'authenticated');

-- 13. Seed default induction modules (will be org-specific, using a placeholder)
-- These get created per-org when ClockOS is first set up

-- 14. Updated_at triggers
CREATE TRIGGER update_employee_pins_updated_at BEFORE UPDATE ON public.employee_pins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clock_shifts_updated_at BEFORE UPDATE ON public.clock_shifts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clock_devices_updated_at BEFORE UPDATE ON public.clock_devices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clock_induction_modules_updated_at BEFORE UPDATE ON public.clock_induction_modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_onboarding_status_updated_at BEFORE UPDATE ON public.onboarding_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clock_settings_updated_at BEFORE UPDATE ON public.clock_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
