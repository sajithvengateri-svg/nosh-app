
-- Part 1: Add expiry/resting columns to recipes
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS shelf_life_days integer DEFAULT 3 NOT NULL,
  ADD COLUMN IF NOT EXISTS shelf_life_hours integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS storage_temp text DEFAULT 'refrigerated',
  ADD COLUMN IF NOT EXISTS storage_notes text,
  ADD COLUMN IF NOT EXISTS requires_resting boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS resting_type text,
  ADD COLUMN IF NOT EXISTS resting_duration_hours numeric DEFAULT 0 NOT NULL;

-- Part 2: Production Expiry Log
CREATE TABLE public.production_expiry_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_name text,
  batch_code text,
  produced_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  storage_temp text,
  storage_notes text,
  status text DEFAULT 'active' NOT NULL,
  last_checked_at timestamptz,
  checked_by uuid,
  check_notes text,
  alert_hours_before integer DEFAULT 24,
  alert_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.production_expiry_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view expiry logs"
  ON public.production_expiry_log FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert expiry logs"
  ON public.production_expiry_log FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update expiry logs"
  ON public.production_expiry_log FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete expiry logs"
  ON public.production_expiry_log FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));

-- Part 3: Batch Resting Timers
CREATE TABLE public.batch_resting_timers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_name text,
  batch_code text,
  resting_type text,
  started_at timestamptz DEFAULT now(),
  target_duration_hours numeric DEFAULT 0,
  expected_end_at timestamptz,
  actual_end_at timestamptz,
  status text DEFAULT 'resting' NOT NULL,
  check_intervals_hours numeric DEFAULT 0,
  last_check_at timestamptz,
  check_count integer DEFAULT 0,
  notes text,
  started_by uuid,
  completed_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.batch_resting_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view resting timers"
  ON public.batch_resting_timers FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert resting timers"
  ON public.batch_resting_timers FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update resting timers"
  ON public.batch_resting_timers FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete resting timers"
  ON public.batch_resting_timers FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));
