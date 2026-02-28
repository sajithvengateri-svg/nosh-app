-- ============================================================
-- GCC UAE Variant: Schema additions for Dubai, Abu Dhabi, Sharjah
-- ============================================================

-- 1. Add app_variant and country columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS app_variant TEXT DEFAULT 'chefos',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'AU';

-- Add emirate column to org_venues for per-venue compliance detection
ALTER TABLE org_venues
  ADD COLUMN IF NOT EXISTS emirate TEXT,
  ADD COLUMN IF NOT EXISTS compliance_framework TEXT;

-- 2. GCC compliance daily logs — extends daily_compliance_logs with UAE-specific fields
-- The existing daily_compliance_logs table works for temp/hygiene checks.
-- We add a GCC-specific extension table for halal, health certs, etc.
CREATE TABLE IF NOT EXISTS gcc_compliance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES org_venues(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  emirate TEXT NOT NULL DEFAULT 'dubai',
  compliance_framework TEXT NOT NULL DEFAULT 'dm',
  log_type TEXT NOT NULL,
  -- Temperature fields (reuses pattern from daily_compliance_logs)
  temperature_reading NUMERIC(5,1),
  is_within_safe_zone BOOLEAN,
  -- Pass/fail for non-temp checks
  check_passed BOOLEAN DEFAULT true,
  -- Halal-specific
  halal_cert_supplier TEXT,
  halal_cert_expiry DATE,
  -- Severity classification
  severity TEXT CHECK (severity IN ('critical', 'major', 'minor')),
  -- Notes and corrective action
  notes TEXT,
  corrective_action TEXT,
  requires_followup BOOLEAN DEFAULT false,
  -- Who logged it
  logged_by_name TEXT,
  shift TEXT CHECK (shift IN ('AM', 'PM', 'NIGHT')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. GCC inspection grades — tracks Dubai Municipality grades, ADAFSA stars
CREATE TABLE IF NOT EXISTS gcc_inspection_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES org_venues(id) ON DELETE SET NULL,
  emirate TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  inspector_name TEXT,
  -- Dubai: letter grade (A/B/C/D); Abu Dhabi: star count (1-5)
  grade_type TEXT NOT NULL CHECK (grade_type IN ('letter', 'star', 'pass_fail')),
  grade_value TEXT NOT NULL, -- 'A', 'B', '5', '4', 'pass', 'fail'
  score_percent NUMERIC(5,2),
  -- Violations found
  critical_violations INTEGER DEFAULT 0,
  major_violations INTEGER DEFAULT 0,
  minor_violations INTEGER DEFAULT 0,
  -- Fine
  fine_amount_aed NUMERIC(10,2) DEFAULT 0,
  closure_ordered BOOLEAN DEFAULT false,
  -- Evidence
  report_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Halal certificate tracking per supplier
CREATE TABLE IF NOT EXISTS gcc_halal_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  certificate_number TEXT,
  issuing_authority TEXT,
  issue_date DATE,
  expiry_date DATE NOT NULL,
  -- Status
  is_valid BOOLEAN DEFAULT true,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  -- Document
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Staff health/medical certificate tracking (mandatory in GCC)
CREATE TABLE IF NOT EXISTS gcc_staff_medical_certs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_name TEXT NOT NULL,
  -- Medical fitness certificate
  medical_cert_number TEXT,
  medical_cert_expiry DATE NOT NULL,
  -- Food handler certificate
  food_handler_cert_number TEXT,
  food_handler_cert_expiry DATE,
  -- Visa/residency (relevant for compliance)
  visa_expiry DATE,
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_medical_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gcc_compliance_logs_lookup
  ON gcc_compliance_logs(org_id, venue_id, log_date, log_type);
CREATE INDEX IF NOT EXISTS idx_gcc_compliance_logs_emirate
  ON gcc_compliance_logs(emirate, log_date);
CREATE INDEX IF NOT EXISTS idx_gcc_inspection_grades_venue
  ON gcc_inspection_grades(org_id, venue_id, inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_gcc_halal_certs_expiry
  ON gcc_halal_certificates(org_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_gcc_staff_medical_expiry
  ON gcc_staff_medical_certs(org_id, medical_cert_expiry);

-- ── RLS ──────────────────────────────────────────────────────────────

ALTER TABLE gcc_compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gcc_inspection_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE gcc_halal_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gcc_staff_medical_certs ENABLE ROW LEVEL SECURITY;

-- Policies: users can read/write within their own org
CREATE POLICY gcc_compliance_logs_policy ON gcc_compliance_logs
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY gcc_inspection_grades_policy ON gcc_inspection_grades
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY gcc_halal_certs_policy ON gcc_halal_certificates
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY gcc_staff_medical_policy ON gcc_staff_medical_certs
  FOR ALL USING (
    org_id IN (SELECT org_id FROM org_memberships WHERE user_id = auth.uid() AND is_active = true)
  );
