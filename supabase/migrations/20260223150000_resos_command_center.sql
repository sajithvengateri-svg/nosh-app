-- ResOS Command Center: journey events, audit suggestions, sidebar config, tags, efficiency snapshots
-- Also: proposal media + proposal enhancements for landing page redesign

-- ─── Service periods config on res_settings ──────────
ALTER TABLE public.res_settings ADD COLUMN IF NOT EXISTS
  service_periods jsonb NOT NULL DEFAULT '[
    {"key":"breakfast","label":"Breakfast","start":"06:00","end":"11:00"},
    {"key":"lunch","label":"Lunch","start":"11:30","end":"15:00"},
    {"key":"dinner","label":"Dinner","start":"17:00","end":"23:00"}
  ]';

-- ─── Journey event log (replaces [BILL_DROPPED] hack) ──────
CREATE TABLE IF NOT EXISTS public.res_journey_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  reservation_id uuid REFERENCES res_reservations(id) ON DELETE CASCADE,
  stage text NOT NULL,  -- 'ARRIVED','SEATED','ORDERED','IN_SERVICE','BILL','LEFT'
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}',
  created_by uuid
);
ALTER TABLE public.res_journey_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_member_journey_events" ON public.res_journey_events
  FOR ALL USING (org_id IN (SELECT get_user_org_ids()));
CREATE INDEX IF NOT EXISTS idx_journey_events_res ON public.res_journey_events(reservation_id);
CREATE INDEX IF NOT EXISTS idx_journey_events_org_date ON public.res_journey_events(org_id, occurred_at);

-- ─── Pre-service audit suggestions ──────────────────
CREATE TABLE IF NOT EXISTS public.res_audit_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  reservation_id uuid REFERENCES res_reservations(id) ON DELETE CASCADE,
  service_date text NOT NULL,
  service_period text NOT NULL,
  suggestion_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  action_text text,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.res_audit_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_member_audit_suggestions" ON public.res_audit_suggestions
  FOR ALL USING (org_id IN (SELECT get_user_org_ids()));
CREATE INDEX IF NOT EXISTS idx_audit_suggestions_date ON public.res_audit_suggestions(org_id, service_date);

-- ─── Web sidebar configuration ──────────────────────
CREATE TABLE IF NOT EXISTS public.res_sidebar_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  section_key text NOT NULL,
  label text NOT NULL,
  icon_name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  required_role text,
  items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, section_key)
);
ALTER TABLE public.res_sidebar_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_member_sidebar_config" ON public.res_sidebar_config
  FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

-- ─── Org-level tag definitions ──────────────────────
CREATE TABLE IF NOT EXISTS public.res_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280',
  icon text,
  category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, name)
);
ALTER TABLE public.res_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_member_tags" ON public.res_tags
  FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

-- Tags on reservations
ALTER TABLE public.res_reservations
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- ─── Weekly efficiency snapshots ────────────────────
CREATE TABLE IF NOT EXISTS public.res_efficiency_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_reservations integer NOT NULL DEFAULT 0,
  total_covers integer NOT NULL DEFAULT 0,
  total_walk_ins integer NOT NULL DEFAULT 0,
  avg_turn_time_minutes numeric,
  avg_wait_to_seat_minutes numeric,
  avg_order_to_serve_minutes numeric,
  no_show_count integer NOT NULL DEFAULT 0,
  no_show_rate numeric,
  cancellation_count integer NOT NULL DEFAULT 0,
  late_arrival_count integer NOT NULL DEFAULT 0,
  avg_occupancy_rate numeric,
  peak_occupancy_rate numeric,
  covers_per_table numeric,
  revenue_per_cover numeric,
  channel_breakdown jsonb DEFAULT '{}',
  period_breakdown jsonb DEFAULT '{}',
  efficiency_score numeric,
  ai_recommendations jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, week_start)
);
ALTER TABLE public.res_efficiency_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_member_efficiency" ON public.res_efficiency_snapshots
  FOR ALL USING (org_id IN (SELECT get_user_org_ids()));

-- ─── Proposal media gallery ────────────────────────
CREATE TABLE IF NOT EXISTS public.res_proposal_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES res_function_proposals(id) ON DELETE CASCADE,
  url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  section text DEFAULT 'hero',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.res_proposal_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_member_proposal_media" ON public.res_proposal_media
  FOR ALL USING (
    proposal_id IN (
      SELECT id FROM res_function_proposals WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

-- ─── Proposal enhancements for landing page ────────
ALTER TABLE public.res_function_proposals
  ADD COLUMN IF NOT EXISTS sections_config jsonb NOT NULL DEFAULT '{
    "hero": true, "event_details": true, "menu": true, "beverages": true,
    "venue_map": true, "runsheet": false, "add_ons": true, "pricing": true,
    "deposit": true, "terms": true, "invite_card": false
  }',
  ADD COLUMN IF NOT EXISTS hero_headline text,
  ADD COLUMN IF NOT EXISTS hero_subheadline text,
  ADD COLUMN IF NOT EXISTS venue_address text,
  ADD COLUMN IF NOT EXISTS venue_parking_notes text,
  ADD COLUMN IF NOT EXISTS runsheet jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS add_ons jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS invite_message text,
  ADD COLUMN IF NOT EXISTS invite_rsvp_enabled boolean DEFAULT false;
