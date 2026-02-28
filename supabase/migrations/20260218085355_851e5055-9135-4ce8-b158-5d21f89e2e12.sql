
-- =============================================
-- SMART TIMER SYSTEM — 5 Tables + RLS + Realtime
-- =============================================

-- 1. Recipe Timers (attached to recipe steps)
CREATE TABLE public.recipe_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  recipe_id UUID NOT NULL,
  step_number INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  timer_type TEXT NOT NULL DEFAULT 'COUNTDOWN'
    CHECK (timer_type IN ('COUNTDOWN', 'COUNT_UP', 'STAGED', 'MINIMUM_WAIT')),
  stages JSONB,
  is_minimum_time BOOLEAN NOT NULL DEFAULT FALSE,
  alert_type TEXT NOT NULL DEFAULT 'CHIME'
    CHECK (alert_type IN ('CHIME', 'BELL', 'BUZZER', 'SILENT')),
  colour TEXT,
  icon TEXT DEFAULT 'clock',
  critical BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recipe_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view recipe timers"
  ON public.recipe_timers FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert recipe timers"
  ON public.recipe_timers FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update recipe timers"
  ON public.recipe_timers FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete recipe timers"
  ON public.recipe_timers FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE INDEX idx_recipe_timers_recipe ON public.recipe_timers(recipe_id);

-- 2. Active Timers (live during service — realtime-enabled)
CREATE TABLE public.active_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'ADHOC'
    CHECK (source_type IN ('RECIPE', 'ORDER', 'PREP', 'INFUSION', 'ADHOC', 'CHEATSHEET')),
  recipe_id UUID,
  order_id UUID,
  prep_task_id UUID,
  label TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  timer_type TEXT NOT NULL DEFAULT 'COUNTDOWN'
    CHECK (timer_type IN ('COUNTDOWN', 'COUNT_UP', 'STAGED', 'MINIMUM_WAIT')),
  stages JSONB,
  is_minimum_time BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'RUNNING'
    CHECK (status IN ('RUNNING', 'PAUSED', 'COMPLETE', 'OVERDUE', 'DISMISSED', 'CANCELLED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at TIMESTAMPTZ,
  paused_duration_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID,
  chain_id UUID,
  chain_position INTEGER,
  auto_start_after UUID,
  station TEXT,
  colour TEXT DEFAULT '#10b981',
  icon TEXT DEFAULT 'clock',
  alert_type TEXT NOT NULL DEFAULT 'CHIME'
    CHECK (alert_type IN ('CHIME', 'BELL', 'BUZZER', 'SILENT')),
  critical BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  started_by UUID,
  snooze_count INTEGER NOT NULL DEFAULT 0,
  snooze_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.active_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view active timers"
  ON public.active_timers FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert active timers"
  ON public.active_timers FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update active timers"
  ON public.active_timers FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete active timers"
  ON public.active_timers FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE INDEX idx_active_timers_org_status ON public.active_timers(org_id, status);
CREATE INDEX idx_active_timers_chain ON public.active_timers(chain_id, chain_position);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_timers;

-- 3. Timer History (analytics archive)
CREATE TABLE public.timer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  timer_id UUID NOT NULL,
  recipe_id UUID,
  order_id UUID,
  label TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  actual_duration_seconds INTEGER,
  was_overdue BOOLEAN NOT NULL DEFAULT FALSE,
  overdue_seconds INTEGER NOT NULL DEFAULT 0,
  station TEXT,
  started_by UUID,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.timer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view timer history"
  ON public.timer_history FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert timer history"
  ON public.timer_history FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE INDEX idx_timer_history_org ON public.timer_history(org_id, completed_at DESC);

-- 4. Saved Timers (favourites / commonly used)
CREATE TABLE public.saved_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  created_by UUID NOT NULL,
  label TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  timer_type TEXT NOT NULL DEFAULT 'COUNTDOWN'
    CHECK (timer_type IN ('COUNTDOWN', 'COUNT_UP', 'STAGED', 'MINIMUM_WAIT')),
  alert_type TEXT NOT NULL DEFAULT 'CHIME'
    CHECK (alert_type IN ('CHIME', 'BELL', 'BUZZER', 'SILENT')),
  icon TEXT DEFAULT 'clock',
  station TEXT,
  category TEXT NOT NULL DEFAULT 'kitchen'
    CHECK (category IN ('kitchen', 'bar', 'prep', 'cheatsheet')),
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view saved timers"
  ON public.saved_timers FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert saved timers"
  ON public.saved_timers FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update saved timers"
  ON public.saved_timers FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete saved timers"
  ON public.saved_timers FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));

-- 5. Bev Infusions (bar-specific long-running tracking)
CREATE TABLE public.bev_infusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  recipe_id UUID,
  timer_id UUID REFERENCES public.active_timers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  spirit_base TEXT,
  infusion_ingredient TEXT,
  volume_ml INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  target_completion TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  yield_ml INTEGER,
  tasting_notes TEXT,
  status TEXT NOT NULL DEFAULT 'INFUSING'
    CHECK (status IN ('INFUSING', 'READY', 'STRAINED', 'DISCARDED')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bev_infusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view bev infusions"
  ON public.bev_infusions FOR SELECT
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can insert bev infusions"
  ON public.bev_infusions FOR INSERT
  WITH CHECK (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can update bev infusions"
  ON public.bev_infusions FOR UPDATE
  USING (public.is_org_member(auth.uid(), org_id));

CREATE POLICY "Org members can delete bev infusions"
  ON public.bev_infusions FOR DELETE
  USING (public.is_org_member(auth.uid(), org_id));
