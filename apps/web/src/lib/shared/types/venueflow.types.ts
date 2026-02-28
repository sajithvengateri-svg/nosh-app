// VenueFlow types — RN-portable, no web-specific APIs

// ============================================================
// Enums
// ============================================================

export type VFPipelineStage =
  | 'INQUIRY'
  | 'SITE_VISIT'
  | 'PROPOSAL'
  | 'DEPOSIT'
  | 'CONFIRMED'
  | 'PRE_EVENT'
  | 'EVENT_DAY'
  | 'COMPLETED'
  | 'POST_EVENT'
  | 'LOST';

export type VFRoomType =
  | 'PRIVATE_DINING'
  | 'CHEFS_TABLE'
  | 'TERRACE'
  | 'GARDEN'
  | 'MAIN_DINING'
  | 'WINE_CELLAR'
  | 'ROOFTOP';

export type VFMenuTier = 'STANDARD' | 'PREMIUM' | 'DEGUSTATION' | 'COCKTAIL';

export type VFBeverageTier = 'HOUSE' | 'PREMIUM' | 'PRESTIGE' | 'NON_ALCOHOLIC';

export type VFLeadSource = 'DIRECT' | 'WIDGET' | 'ENGINE' | 'REFERRAL' | 'PHONE' | 'WALK_IN' | 'EMAIL';

export type VFLeadTemperature = 'COLD' | 'WARM' | 'HOT';

export type VFLeadStatus = 'DELIVERED' | 'OPENED' | 'CLICKED' | 'INQUIRED' | 'CONVERTED' | 'UNSUBSCRIBED';

export type VFAutomationTrigger =
  | 'POST_EVENT_THANKYOU'
  | 'FEEDBACK_REQUEST'
  | 'REFERRAL_INVITE'
  | 'ANNIVERSARY_OUTREACH'
  | 'DEPOSIT_REMINDER'
  | 'FOLLOW_UP_NUDGE'
  | 'PRE_EVENT_CHECKLIST';

export type VFAutomationQueueStatus = 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

export type VFReferralStatus = 'INVITED' | 'INQUIRED' | 'BOOKED' | 'REWARDED';

export type VFActivityType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'SITE_VISIT'
  | 'TASTING'
  | 'PROPOSAL_SENT'
  | 'DEPOSIT_RECEIVED'
  | 'FOLLOW_UP'
  | 'NOTE'
  | 'STAGE_CHANGE'
  | 'SYSTEM_AUTO';

export type VFSubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';

export type VFReportType = 'DAILY_SUMMARY' | 'WEEKLY_DIGEST' | 'MONTHLY_ANALYTICS';

export type VFSyncStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

// ============================================================
// Pipeline stage config
// ============================================================

export interface VFPipelineStageConfig {
  value: VFPipelineStage;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

export const VF_PIPELINE_STAGES: VFPipelineStageConfig[] = [
  { value: 'INQUIRY', label: 'Inquiry', color: 'text-blue-600', bgColor: 'bg-blue-500/10', description: 'New inquiry received' },
  { value: 'SITE_VISIT', label: 'Site Visit', color: 'text-indigo-600', bgColor: 'bg-indigo-500/10', description: 'Site visit or tasting scheduled' },
  { value: 'PROPOSAL', label: 'Proposal', color: 'text-purple-600', bgColor: 'bg-purple-500/10', description: 'Proposal sent to client' },
  { value: 'DEPOSIT', label: 'Deposit', color: 'text-amber-600', bgColor: 'bg-amber-500/10', description: 'Deposit received' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'text-emerald-600', bgColor: 'bg-emerald-500/10', description: 'Event confirmed' },
  { value: 'PRE_EVENT', label: 'Pre-Event', color: 'text-teal-600', bgColor: 'bg-teal-500/10', description: '7 days before event' },
  { value: 'EVENT_DAY', label: 'Event Day', color: 'text-orange-600', bgColor: 'bg-orange-500/10', description: 'Event is today' },
  { value: 'COMPLETED', label: 'Completed', color: 'text-slate-600', bgColor: 'bg-slate-500/10', description: 'Event completed' },
  { value: 'POST_EVENT', label: 'Post-Event', color: 'text-rose-600', bgColor: 'bg-rose-500/10', description: 'Follow-up phase' },
  { value: 'LOST', label: 'Lost', color: 'text-red-600', bgColor: 'bg-red-500/10', description: 'Deal lost' },
];

// ============================================================
// Interfaces
// ============================================================

export interface VFMenuTemplate {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  tier: VFMenuTier;
  price_per_head: number;
  sections: VFMenuSection[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VFMenuSection {
  title: string;
  items: VFMenuItem[];
}

export interface VFMenuItem {
  name: string;
  description: string;
  dietary_flags: string[]; // ['V', 'VG', 'GF', 'DF']
}

export interface VFBeveragePackage {
  id: string;
  org_id: string;
  name: string;
  tier: VFBeverageTier;
  price_per_head: number;
  duration_hours: number;
  includes: VFBeverageCategory[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VFBeverageCategory {
  category: string; // 'Wine', 'Beer', 'Spirits', 'Cocktails', 'Soft'
  items: string[];
}

export interface VFPipelineActivity {
  id: string;
  org_id: string;
  client_id: string | null;
  function_id: string | null;
  activity_type: VFActivityType;
  from_stage: VFPipelineStage | null;
  to_stage: VFPipelineStage | null;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export interface VFAutomation {
  id: string;
  org_id: string;
  trigger_type: VFAutomationTrigger;
  delay_hours: number;
  email_subject: string | null;
  email_body: string | null;
  sms_template: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VFAutomationQueueItem {
  id: string;
  org_id: string;
  automation_id: string;
  client_id: string;
  function_id: string | null;
  scheduled_for: string;
  status: VFAutomationQueueStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface VFReferral {
  id: string;
  org_id: string;
  referrer_client_id: string;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string | null;
  status: VFReferralStatus;
  reward_type: string | null;
  reward_amount: number | null;
  reward_delivered: boolean;
  source_function_id: string | null;
  converted_client_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VFLeadPlanTier {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  price_monthly: number;
  leads_quota_monthly: number;
  description: string | null;
  features: string[];
  stripe_price_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface VFLeadSubscription {
  id: string;
  org_id: string;
  plan_tier_id: string | null;
  status: VFSubscriptionStatus;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  targeting_preferences: VFTargetingPrefs;
  leads_delivered_this_month: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  plan_tier?: VFLeadPlanTier;
}

export interface VFTargetingPrefs {
  niches?: string[];
  radius_km?: number;
  keywords?: string[];
}

export interface VFLead {
  id: string;
  org_id: string;
  subscription_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string | null;
  source: string;
  temperature: VFLeadTemperature;
  status: VFLeadStatus;
  campaign_batch: string | null;
  delivered_at: string;
  last_activity_at: string | null;
  converted_to_client_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface VFIntegrationSyncLog {
  id: string;
  org_id: string;
  provider: string;
  sync_type: string;
  entity_type: string | null;
  records_synced: number;
  errors: unknown[];
  started_at: string;
  completed_at: string | null;
  status: VFSyncStatus;
}

export interface VFReportPreference {
  id: string;
  org_id: string;
  user_id: string;
  report_type: VFReportType;
  is_enabled: boolean;
  delivery_email: string | null;
  created_at: string;
}

// ============================================================
// Extended existing types (additions to res_function_clients)
// ============================================================

export interface VFClientExtended {
  id: string;
  org_id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  pipeline_stage: VFPipelineStage;
  lead_source: VFLeadSource;
  temperature: VFLeadTemperature;
  source: string | null;
  total_spend: number;
  total_events: number;
  last_contacted_at: string | null;
  next_follow_up: string | null;
  assigned_to: string | null;
  archived_at: string | null;
  reactivated_from: string | null;
  anniversary_date: string | null;
  do_not_contact: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Extended res_venue_spaces with room features
export interface VFVenueSpace {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  hire_type: string;
  capacity_min: number;
  capacity_max: number;
  room_hire_fee: number;
  minimum_spend: number;
  is_active: boolean;
  sort_order: number;
  room_type: VFRoomType;
  ambiance: string | null;
  features: string[];
  photo_urls: string[];
  color_code: string;
  created_at: string;
  updated_at: string;
}

// Extended proposal with share token
export interface VFProposal {
  id: string;
  org_id: string;
  client_id: string | null;
  function_id: string | null;
  title: string;
  cover_message: string | null;
  event_date: string;
  start_time: string;
  end_time: string | null;
  party_size: number;
  venue_space_id: string | null;
  menu_template_id: string | null;
  beverage_package_id: string | null;
  room_hire_fee: number;
  minimum_spend: number;
  tax_rate: number;
  terms_and_conditions: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  share_token: string | null;
  stripe_checkout_session_id: string | null;
  expires_at: string | null;
  signature_name: string | null;
  signature_date: string | null;
  total_amount: number | null;
  deposit_amount: number | null;
  created_at: string;
  updated_at: string;
  // Joined
  venue_space?: VFVenueSpace;
  menu_template?: VFMenuTemplate;
  beverage_package?: VFBeveragePackage;
  menu_sections?: VFProposalMenuSection[];
}

export interface VFProposalMenuSection {
  id: string;
  proposal_id: string;
  title: string;
  description: string | null;
  pricing_type: 'PER_HEAD' | 'FLAT';
  per_head_price: number;
  flat_price: number;
  sort_order: number;
  items: { name: string; description: string }[];
}

// ============================================================
// Dashboard / analytics types
// ============================================================

export interface VFPipelineMetrics {
  total_pipeline_value: number;
  confirmed_revenue: number;
  collected_deposits: number;
  avg_deal_size: number;
  stage_counts: Record<VFPipelineStage, number>;
  stage_values: Record<VFPipelineStage, number>;
}

export interface VFConversionFunnel {
  inquiry: number;
  site_visit: number;
  proposal: number;
  deposit: number;
  confirmed: number;
  completed: number;
  lost: number;
}

export interface VFRoomUtilisation {
  room_id: string;
  room_name: string;
  color_code: string;
  bookings_this_month: number;
  revenue: number;
  capacity_utilisation: number; // 0-100%
}

export interface VFTodayView {
  events_today: VFTodayEvent[];
  overdue_follow_ups: VFClientExtended[];
  deposits_due: VFProposal[];
  new_inquiries: VFClientExtended[];
  upcoming_events: VFTodayEvent[]; // next 7 days
}

export interface VFTodayEvent {
  function_id: string;
  client_name: string;
  event_type: string;
  party_size: number;
  room_name: string;
  room_color: string;
  start_time: string;
  end_time: string | null;
  status: string;
}
