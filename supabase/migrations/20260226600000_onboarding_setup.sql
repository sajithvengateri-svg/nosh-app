-- Onboarding wizard: progress tracking & document fields

-- 1. Completion flag on org
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz DEFAULT NULL;

-- 2. Progress tracking (resume where left off)
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  current_phase integer NOT NULL DEFAULT 0,
  phase_data jsonb DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding progress"
  ON public.onboarding_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own onboarding progress"
  ON public.onboarding_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own onboarding progress"
  ON public.onboarding_progress FOR UPDATE
  USING (user_id = auth.uid());

-- 3. Licence document URL (FSS cert URL already exists on food_safety_supervisors)
ALTER TABLE public.compliance_profiles
  ADD COLUMN IF NOT EXISTS licence_document_url text DEFAULT NULL;

-- 4. Green shield
ALTER TABLE public.compliance_profiles
  ADD COLUMN IF NOT EXISTS green_shield_active boolean DEFAULT false;

ALTER TABLE public.compliance_profiles
  ADD COLUMN IF NOT EXISTS green_shield_activated_at timestamptz DEFAULT NULL;
