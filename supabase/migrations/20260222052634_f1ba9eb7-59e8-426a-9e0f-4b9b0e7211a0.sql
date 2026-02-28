
-- =============================================
-- BCC Eat Safe Compliance — Phase 1 Tables
-- =============================================

-- 1. Compliance Profiles
CREATE TABLE public.compliance_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  bcc_licence_number TEXT,
  licence_expiry DATE,
  licence_displayed BOOLEAN DEFAULT false,
  business_category TEXT NOT NULL DEFAULT 'category_1' CHECK (business_category IN ('category_1', 'category_2')),
  food_safety_program_accredited BOOLEAN DEFAULT false,
  food_safety_program_auditor TEXT,
  next_audit_date DATE,
  last_star_rating INTEGER CHECK (last_star_rating BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id)
);
ALTER TABLE public.compliance_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage compliance profiles" ON public.compliance_profiles FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE TRIGGER update_compliance_profiles_updated_at BEFORE UPDATE ON public.compliance_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Food Safety Supervisors
CREATE TABLE public.food_safety_supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  certificate_number TEXT,
  certificate_rto TEXT,
  certificate_date DATE,
  certificate_expiry DATE,
  certificate_document_url TEXT,
  is_primary BOOLEAN DEFAULT true,
  is_contactable BOOLEAN DEFAULT true,
  notified_council BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.food_safety_supervisors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage FSS" ON public.food_safety_supervisors FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 3. Food Handler Training
CREATE TABLE public.food_handler_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  handler_name TEXT NOT NULL,
  role TEXT,
  training_type TEXT NOT NULL DEFAULT 'food_safety_course',
  training_provider TEXT,
  training_date DATE,
  certificate_url TEXT,
  expiry_date DATE,
  covers_safe_handling BOOLEAN DEFAULT false,
  covers_contamination BOOLEAN DEFAULT false,
  covers_cleaning BOOLEAN DEFAULT false,
  covers_personal_hygiene BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.food_handler_training ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage training" ON public.food_handler_training FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 4. Daily Compliance Logs
CREATE TABLE public.daily_compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_by UUID REFERENCES auth.users(id),
  logged_by_name TEXT,
  log_type TEXT NOT NULL,
  temperature_reading NUMERIC,
  is_within_safe_zone BOOLEAN,
  item_description TEXT,
  supplier_name TEXT,
  visual_check_passed BOOLEAN,
  sanitiser_type TEXT,
  sanitiser_concentration_ppm NUMERIC,
  staff_name TEXT,
  staff_fit_to_work BOOLEAN,
  staff_illness_details TEXT,
  photo_url TEXT,
  notes TEXT,
  requires_corrective_action BOOLEAN DEFAULT false,
  corrective_action_id UUID,
  shift TEXT,
  location TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.daily_compliance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage compliance logs" ON public.daily_compliance_logs FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));
CREATE INDEX idx_daily_compliance_logs_org_date ON public.daily_compliance_logs (org_id, log_date);
CREATE INDEX idx_daily_compliance_logs_type ON public.daily_compliance_logs (log_type);
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_compliance_logs;

-- 5. Corrective Actions
CREATE TABLE public.corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  log_id UUID REFERENCES public.daily_compliance_logs(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
  category TEXT,
  description TEXT,
  action_taken TEXT,
  action_taken_by TEXT,
  action_taken_at TIMESTAMPTZ,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.corrective_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage corrective actions" ON public.corrective_actions FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 6. Cleaning Schedules
CREATE TABLE public.bcc_cleaning_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  area TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'daily',
  method TEXT,
  sanitiser_required BOOLEAN DEFAULT false,
  responsible_role TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bcc_cleaning_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage cleaning schedules" ON public.bcc_cleaning_schedules FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 7. Cleaning Completions
CREATE TABLE public.bcc_cleaning_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.bcc_cleaning_schedules(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  completed_by TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sanitiser_concentration_ppm NUMERIC,
  photo_url TEXT,
  notes TEXT,
  signed_off_by TEXT,
  signed_off_at TIMESTAMPTZ
);
ALTER TABLE public.bcc_cleaning_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage cleaning completions" ON public.bcc_cleaning_completions FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 8. Pest Control Logs
CREATE TABLE public.bcc_pest_control_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL DEFAULT 'self_inspection' CHECK (log_type IN ('professional', 'self_inspection')),
  service_provider TEXT,
  technician_name TEXT,
  date_of_service DATE NOT NULL DEFAULT CURRENT_DATE,
  findings TEXT,
  treatment_applied TEXT,
  next_service_date DATE,
  areas_inspected TEXT[],
  pests_found BOOLEAN DEFAULT false,
  pest_types TEXT[],
  corrective_action TEXT,
  report_document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bcc_pest_control_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage pest logs" ON public.bcc_pest_control_logs FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 9. Equipment Calibration Logs
CREATE TABLE public.bcc_equipment_calibration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  equipment_type TEXT,
  serial_number TEXT,
  log_type TEXT NOT NULL DEFAULT 'calibration' CHECK (log_type IN ('calibration', 'service', 'repair')),
  performed_by TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT,
  result TEXT,
  passed BOOLEAN,
  next_due_date DATE,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bcc_equipment_calibration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage equipment logs" ON public.bcc_equipment_calibration_logs FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 10. Supplier Register
CREATE TABLE public.bcc_supplier_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  abn TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  products_supplied TEXT[],
  delivery_schedule TEXT,
  is_approved BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bcc_supplier_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage supplier register" ON public.bcc_supplier_register FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 11. Audit Self Assessments
CREATE TABLE public.audit_self_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assessed_by UUID REFERENCES auth.users(id),
  assessed_by_name TEXT,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_minor INTEGER DEFAULT 0,
  total_major INTEGER DEFAULT 0,
  total_critical INTEGER DEFAULT 0,
  predicted_star_rating INTEGER DEFAULT 5 CHECK (predicted_star_rating BETWEEN 0 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_self_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage self assessments" ON public.audit_self_assessments FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));

-- 12. BCC Section Toggles
CREATE TABLE public.bcc_section_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, section_key)
);
ALTER TABLE public.bcc_section_toggles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can manage section toggles" ON public.bcc_section_toggles FOR ALL TO authenticated USING (public.is_org_member(auth.uid(), org_id)) WITH CHECK (public.is_org_member(auth.uid(), org_id));
