-- ============================================================
-- VenueFlow Schema Migration
-- Fine dining functions sales engine, CRM & reservation system
-- ============================================================

-- ============================================================
-- 1. ALTER EXISTING TABLES
-- ============================================================

-- Extend res_venue_spaces for fine dining rooms
ALTER TABLE res_venue_spaces ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'PRIVATE_DINING';
ALTER TABLE res_venue_spaces ADD COLUMN IF NOT EXISTS ambiance TEXT;
ALTER TABLE res_venue_spaces ADD COLUMN IF NOT EXISTS features TEXT[];
ALTER TABLE res_venue_spaces ADD COLUMN IF NOT EXISTS photo_urls TEXT[];
ALTER TABLE res_venue_spaces ADD COLUMN IF NOT EXISTS color_code TEXT DEFAULT '#1B2A4A';

-- Extend res_function_clients for 9-stage pipeline
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'DIRECT';
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS temperature TEXT DEFAULT 'WARM';
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS next_follow_up TIMESTAMPTZ;
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS reactivated_from UUID;
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS anniversary_date DATE;
ALTER TABLE res_function_clients ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN DEFAULT false;

-- Extend res_functions for fine dining events
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS venue_space_id UUID REFERENCES res_venue_spaces(id);
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS menu_template_id UUID;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS beverage_package_id UUID;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS setup_time TIME;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS pack_down_time TIME;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS av_requirements TEXT;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS floral_requirements TEXT;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS beo_generated BOOLEAN DEFAULT false;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS feedback_score INTEGER;
ALTER TABLE res_functions ADD COLUMN IF NOT EXISTS feedback_text TEXT;

-- Extend res_reservations for credit card holds
ALTER TABLE res_reservations ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;
ALTER TABLE res_reservations ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE res_reservations ADD COLUMN IF NOT EXISTS card_last_four TEXT;
ALTER TABLE res_reservations ADD COLUMN IF NOT EXISTS no_show_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE res_reservations ADD COLUMN IF NOT EXISTS no_show_charged BOOLEAN DEFAULT false;

-- Extend res_function_proposals for public share links
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS signature_name TEXT;
ALTER TABLE res_function_proposals ADD COLUMN IF NOT EXISTS signature_date TIMESTAMPTZ;

-- ============================================================
-- 2. NEW TABLES
-- ============================================================

-- Menu templates (2-5 per venue, reusable across proposals)
CREATE TABLE IF NOT EXISTS vf_menu_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL DEFAULT 'STANDARD',
  price_per_head DECIMAL(10,2) NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Beverage packages
CREATE TABLE IF NOT EXISTS vf_beverage_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'HOUSE',
  price_per_head DECIMAL(10,2) NOT NULL,
  duration_hours DECIMAL(3,1) DEFAULT 3.0,
  includes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline activity log
CREATE TABLE IF NOT EXISTS vf_pipeline_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  client_id UUID REFERENCES res_function_clients(id) ON DELETE CASCADE,
  function_id UUID REFERENCES res_functions(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  from_stage TEXT,
  to_stage TEXT,
  subject TEXT,
  body TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Automation rules
CREATE TABLE IF NOT EXISTS vf_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  trigger_type TEXT NOT NULL,
  delay_hours INTEGER NOT NULL DEFAULT 24,
  email_subject TEXT,
  email_body TEXT,
  sms_template TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Automation queue (scheduled instances)
CREATE TABLE IF NOT EXISTS vf_automation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  automation_id UUID REFERENCES vf_automations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES res_function_clients(id) ON DELETE CASCADE,
  function_id UUID REFERENCES res_functions(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'PENDING',
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS vf_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  referrer_client_id UUID REFERENCES res_function_clients(id) ON DELETE CASCADE,
  referred_name TEXT NOT NULL,
  referred_email TEXT,
  referred_phone TEXT,
  status TEXT DEFAULT 'INVITED',
  reward_type TEXT,
  reward_amount DECIMAL(10,2),
  reward_delivered BOOLEAN DEFAULT false,
  source_function_id UUID REFERENCES res_functions(id) ON DELETE SET NULL,
  converted_client_id UUID REFERENCES res_function_clients(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lead gen tier pricing (configurable per deployment)
CREATE TABLE IF NOT EXISTS vf_lead_plan_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  leads_quota_monthly INTEGER NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]',
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead gen subscriptions
CREATE TABLE IF NOT EXISTS vf_lead_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  plan_tier_id UUID REFERENCES vf_lead_plan_tiers(id),
  status TEXT DEFAULT 'ACTIVE',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  targeting_preferences JSONB DEFAULT '{}',
  leads_delivered_this_month INTEGER DEFAULT 0,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Delivered leads
CREATE TABLE IF NOT EXISTS vf_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  subscription_id UUID REFERENCES vf_lead_subscriptions(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  source TEXT DEFAULT 'ENGINE',
  temperature TEXT DEFAULT 'COLD',
  status TEXT DEFAULT 'DELIVERED',
  campaign_batch TEXT,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ,
  converted_to_client_id UUID REFERENCES res_function_clients(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Integration sync log
CREATE TABLE IF NOT EXISTS vf_integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  provider TEXT NOT NULL,
  sync_type TEXT NOT NULL,
  entity_type TEXT,
  records_synced INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'RUNNING'
);

-- Report preferences
CREATE TABLE IF NOT EXISTS vf_report_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  report_type TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  delivery_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id, report_type)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vf_pipeline_activities_client ON vf_pipeline_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_vf_pipeline_activities_org ON vf_pipeline_activities(org_id);
CREATE INDEX IF NOT EXISTS idx_vf_automation_queue_scheduled ON vf_automation_queue(scheduled_for) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_vf_automation_queue_org ON vf_automation_queue(org_id);
CREATE INDEX IF NOT EXISTS idx_vf_leads_org ON vf_leads(org_id);
CREATE INDEX IF NOT EXISTS idx_vf_leads_email ON vf_leads(email);
CREATE INDEX IF NOT EXISTS idx_vf_leads_status ON vf_leads(org_id, status);
CREATE INDEX IF NOT EXISTS idx_vf_referrals_org ON vf_referrals(org_id);
CREATE INDEX IF NOT EXISTS idx_res_function_clients_pipeline ON res_function_clients(org_id, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_res_function_proposals_token ON res_function_proposals(share_token) WHERE share_token IS NOT NULL;

-- ============================================================
-- 4. AUTO-UPDATE TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_vf_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'vf_menu_templates', 'vf_beverage_packages', 'vf_automations',
    'vf_lead_subscriptions', 'vf_referrals'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %s;
       CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION update_vf_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 5. ROW LEVEL SECURITY — MULTI-TENANT ISOLATION
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE vf_menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_beverage_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_pipeline_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_automation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_lead_plan_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_lead_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_integration_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE vf_report_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: vf_menu_templates
-- ============================================================
CREATE POLICY "vf_menu_templates_select_org" ON vf_menu_templates
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_menu_templates_insert_org" ON vf_menu_templates
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_menu_templates_update_org" ON vf_menu_templates
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_menu_templates_delete_org" ON vf_menu_templates
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_beverage_packages
-- ============================================================
CREATE POLICY "vf_beverage_packages_select_org" ON vf_beverage_packages
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_beverage_packages_insert_org" ON vf_beverage_packages
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_beverage_packages_update_org" ON vf_beverage_packages
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_beverage_packages_delete_org" ON vf_beverage_packages
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_pipeline_activities
-- ============================================================
CREATE POLICY "vf_pipeline_activities_select_org" ON vf_pipeline_activities
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_pipeline_activities_insert_org" ON vf_pipeline_activities
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_pipeline_activities_update_org" ON vf_pipeline_activities
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_pipeline_activities_delete_org" ON vf_pipeline_activities
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_automations
-- ============================================================
CREATE POLICY "vf_automations_select_org" ON vf_automations
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_automations_insert_org" ON vf_automations
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_automations_update_org" ON vf_automations
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_automations_delete_org" ON vf_automations
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_automation_queue
-- ============================================================
CREATE POLICY "vf_automation_queue_select_org" ON vf_automation_queue
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_automation_queue_insert_org" ON vf_automation_queue
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_automation_queue_update_org" ON vf_automation_queue
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_automation_queue_delete_org" ON vf_automation_queue
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_referrals
-- ============================================================
CREATE POLICY "vf_referrals_select_org" ON vf_referrals
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_referrals_insert_org" ON vf_referrals
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_referrals_update_org" ON vf_referrals
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_referrals_delete_org" ON vf_referrals
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_lead_plan_tiers
-- ============================================================
CREATE POLICY "vf_lead_plan_tiers_select_org" ON vf_lead_plan_tiers
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_lead_plan_tiers_insert_org" ON vf_lead_plan_tiers
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_lead_plan_tiers_update_org" ON vf_lead_plan_tiers
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_lead_plan_tiers_delete_org" ON vf_lead_plan_tiers
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_lead_subscriptions
-- ============================================================
CREATE POLICY "vf_lead_subscriptions_select_org" ON vf_lead_subscriptions
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_lead_subscriptions_insert_org" ON vf_lead_subscriptions
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_lead_subscriptions_update_org" ON vf_lead_subscriptions
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_lead_subscriptions_delete_org" ON vf_lead_subscriptions
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_leads
-- ============================================================
CREATE POLICY "vf_leads_select_org" ON vf_leads
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_leads_insert_org" ON vf_leads
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_leads_update_org" ON vf_leads
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_leads_delete_org" ON vf_leads
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_integration_sync_log
-- ============================================================
CREATE POLICY "vf_integration_sync_log_select_org" ON vf_integration_sync_log
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_integration_sync_log_insert_org" ON vf_integration_sync_log
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_integration_sync_log_update_org" ON vf_integration_sync_log
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_integration_sync_log_delete_org" ON vf_integration_sync_log
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- RLS POLICIES: vf_report_preferences
-- ============================================================
CREATE POLICY "vf_report_preferences_select_org" ON vf_report_preferences
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_report_preferences_insert_org" ON vf_report_preferences
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_report_preferences_update_org" ON vf_report_preferences
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids(auth.uid())));
CREATE POLICY "vf_report_preferences_delete_org" ON vf_report_preferences
  FOR DELETE USING (is_org_owner(auth.uid(), org_id) OR is_org_head_chef(auth.uid(), org_id));

-- ============================================================
-- 6. PUBLIC PROPOSAL ACCESS (no auth required, token-scoped)
-- ============================================================
CREATE POLICY "proposal_public_view_by_token" ON res_function_proposals
  FOR SELECT USING (
    share_token IS NOT NULL
    AND status IN ('sent', 'accepted')
    AND (expires_at IS NULL OR expires_at > now())
  );

-- ============================================================
-- 7. STORAGE BUCKET for venue photos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "venue_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'venue-photos');

CREATE POLICY "venue_photos_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "venue_photos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "venue_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'venue-photos'
    AND auth.role() = 'authenticated'
  );
