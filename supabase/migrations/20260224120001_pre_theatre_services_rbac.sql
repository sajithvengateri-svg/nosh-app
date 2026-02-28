-- ═══════════════════════════════════════════════════════
-- Pre-Theatre System + Day Blocking + FOH RBAC + Turn Times
-- ═══════════════════════════════════════════════════════

-- ═══ 1A: SHOWS TABLE ═══
CREATE TABLE IF NOT EXISTS public.res_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id text,
  title text NOT NULL,
  venue_name text,
  show_date date NOT NULL,
  doors_time time,
  curtain_time time NOT NULL,
  end_time time,
  genre text,
  expected_attendance int,
  session_number int NOT NULL DEFAULT 1,
  source text NOT NULL DEFAULT 'manual',
  source_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_suggestion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_res_shows_org_date ON public.res_shows(org_id, show_date);

-- ═══ 1B: PRE-THEATRE FIELDS ON RESERVATIONS ═══
ALTER TABLE public.res_reservations
  ADD COLUMN IF NOT EXISTS is_pre_theatre boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_id uuid REFERENCES public.res_shows(id),
  ADD COLUMN IF NOT EXISTS bill_dropped_at timestamptz;

-- ═══ 1C: PRE_THEATRE TIMER TYPE ═══
ALTER TABLE public.active_timers
  DROP CONSTRAINT IF EXISTS active_timers_source_type_check,
  ADD CONSTRAINT active_timers_source_type_check
    CHECK (source_type IN ('RECIPE','ORDER','PREP','INFUSION','ADHOC','CHEATSHEET','PRE_THEATRE'));

-- ═══ 1D: DAY/SERVICE BLOCKING ═══
CREATE TABLE IF NOT EXISTS public.res_blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  block_date date NOT NULL,
  block_type text NOT NULL DEFAULT 'closed'
    CHECK (block_type IN ('closed', 'venue_hire')),
  service_period_key text,
  reason text,
  guest_message text,
  blocked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_block ON public.res_blocked_dates (org_id, block_date, COALESCE(service_period_key, '__full_day__'));

CREATE INDEX IF NOT EXISTS idx_res_blocked_dates_org ON public.res_blocked_dates(org_id, block_date);

-- ═══ 1E: FOH ROLES ═══
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'foh_admin';
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'shift_manager';
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'server';
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'host';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═══ 1F: ACCESS TOKENS ═══
CREATE TABLE IF NOT EXISTS public.res_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  granted_role text NOT NULL DEFAULT 'server'
    CHECK (granted_role IN ('foh_admin', 'shift_manager', 'server', 'host')),
  label text,
  granted_by uuid,
  granted_to_email text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '12 hours'),
  used_at timestamptz,
  used_by uuid,
  is_revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ═══ 1G: TURN TIMES ═══
-- Global default turn time per service period (stored in res_settings.service_periods JSONB — each period gets a turn_time_minutes field)
-- Per-table override
ALTER TABLE public.res_tables
  ADD COLUMN IF NOT EXISTS default_turn_time_minutes int;

-- ═══ RLS ═══
ALTER TABLE public.res_shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.res_blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.res_access_tokens ENABLE ROW LEVEL SECURITY;

-- res_shows: any org member can read/write
CREATE POLICY "res_shows_org_access" ON public.res_shows
  FOR ALL USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

-- res_blocked_dates: any org member can read, admin+ can write
CREATE POLICY "res_blocked_dates_read" ON public.res_blocked_dates
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_memberships WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "res_blocked_dates_write" ON public.res_blocked_dates
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'foh_admin', 'shift_manager', 'head_chef')
    )
  );

CREATE POLICY "res_blocked_dates_delete" ON public.res_blocked_dates
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'foh_admin', 'shift_manager', 'head_chef')
    )
  );

-- res_access_tokens: only owner/foh_admin can manage
CREATE POLICY "res_access_tokens_admin" ON public.res_access_tokens
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_memberships
      WHERE user_id = auth.uid() AND is_active = true
        AND role IN ('owner', 'foh_admin')
    )
  );

-- Public view for blocked dates (widget needs to check without auth)
CREATE OR REPLACE VIEW public.res_blocked_dates_public AS
SELECT org_id, block_date, block_type, service_period_key, guest_message
FROM public.res_blocked_dates;

GRANT SELECT ON public.res_blocked_dates_public TO anon, authenticated;

-- Public view for shows (widget needs show list for pre-theatre selection)
CREATE OR REPLACE VIEW public.res_shows_public AS
SELECT id, org_id, title, venue_name, show_date, doors_time, curtain_time, end_time, genre, session_number
FROM public.res_shows
WHERE is_active = true AND is_suggestion = false;

GRANT SELECT ON public.res_shows_public TO anon, authenticated;

-- Update res_settings_public to also expose service_periods
CREATE OR REPLACE VIEW public.res_settings_public AS
SELECT org_id, operating_hours, service_periods
FROM public.res_settings;

GRANT SELECT ON public.res_settings_public TO anon, authenticated;
