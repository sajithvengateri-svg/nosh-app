// Res OS types — RN-portable, no web-specific APIs

export type VipTier = 'NEW' | 'RETURNING' | 'REGULAR' | 'VIP' | 'CHAMPION';
export type ReservationStatus = 'ENQUIRY' | 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
export type ReservationChannel = 'WALK_IN' | 'PHONE' | 'IN_PERSON' | 'WEBSITE' | 'GOOGLE_RESERVE' | 'VOICE_AI';
export type WaitlistStatus = 'WAITING' | 'NOTIFIED' | 'SEATED' | 'LEFT' | 'EXPIRED';
export type FunctionStatus = 'ENQUIRY' | 'QUOTED' | 'CONFIRMED' | 'DEPOSIT_PAID' | 'FULLY_PAID' | 'COMPLETED' | 'CANCELLED';
export type FunctionEventType = 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'PRIVATE' | 'CUSTOM';
export type TableZone = 'INDOOR' | 'OUTDOOR' | 'BAR' | 'PRIVATE';
export type TableShape = 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR' | 'COUNTER' | 'BANQUET';

export interface ResGuest {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  anniversary_date: string | null;
  dietary_requirements: string | null;
  preferences: Record<string, unknown>;
  vip_tier: VipTier;
  total_visits: number;
  total_spend: number;
  avg_spend_per_visit: number;
  last_visit_date: string | null;
  first_visit_date: string | null;
  no_show_count: number;
  guest_score: number;
  sms_opt_in: boolean;
  email_opt_in: boolean;
  tags: string[];
  source: string | null;
  referred_by_guest_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResTable {
  id: string;
  org_id: string;
  name: string;
  zone: TableZone;
  min_capacity: number;
  max_capacity: number;
  is_active: boolean;
  is_blocked: boolean;
  block_reason: string | null;
  group_id: string | null;
  default_turn_time_minutes: number | null;
  sort_order: number;
  x_position: number | null;
  y_position: number | null;
  width: number;
  height: number;
  shape: TableShape;
  rotation: number;
  created_at: string;
  updated_at: string;
}

export interface ResFloorLayout {
  id: string;
  org_id: string;
  name: string;
  canvas_width: number;
  canvas_height: number;
  background_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResReservation {
  id: string;
  org_id: string;
  guest_id: string | null;
  date: string;
  time: string;
  end_time: string | null;
  party_size: number;
  status: ReservationStatus;
  channel: ReservationChannel;
  table_id: string | null;
  occasion: string | null;
  dietary_requirements: string | null;
  special_requests: string | null;
  notes: string | null;
  deposit_required: boolean;
  deposit_amount: number | null;
  deposit_paid: boolean;
  stripe_payment_intent_id: string | null;
  reminder_sent_24h: boolean;
  reminder_sent_2h: boolean;
  confirmation_sent: boolean;
  arrived_at: string | null;
  seated_at: string | null;
  completed_at: string | null;
  turn_time_minutes: number | null;
  is_pre_theatre: boolean;
  show_id: string | null;
  bill_dropped_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResWaitlistEntry {
  id: string;
  org_id: string;
  guest_name: string;
  guest_phone: string | null;
  party_size: number;
  estimated_wait_minutes: number | null;
  status: WaitlistStatus;
  joined_at: string;
  notified_at: string | null;
  seated_at: string | null;
  table_id: string | null;
}

export interface ResFunction {
  id: string;
  org_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  event_date: string;
  start_time: string;
  end_time: string | null;
  party_size: number;
  event_type: FunctionEventType;
  status: FunctionStatus;
  notes: string | null;
  dietary_requirements: string | null;
  run_sheet: string | null;
  room: string | null;
  minimum_spend: number | null;
  quoted_total: number | null;
  final_total: number | null;
  deposit_schedule: unknown;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResFunctionPackage {
  id: string;
  function_id: string;
  description: string;
  type: string;
  per_head_price: number | null;
  flat_price: number | null;
  quantity: number;
  total: number;
}

export interface ResFunctionPayment {
  id: string;
  function_id: string;
  amount: number;
  payment_method: string | null;
  payment_type: string;
  stripe_payment_intent_id: string | null;
  paid_at: string;
  received_by: string | null;
}

export interface ResDemandForecast {
  id: string;
  org_id: string;
  date: string;
  service_period: string;
  predicted_covers: number;
  confirmed_reservations: number;
  predicted_walk_ins: number;
  predicted_no_shows: number;
  predicted_functions_covers: number;
  actual_covers: number | null;
  confidence_score: number;
  chef_os_prep_generated: boolean;
  bev_os_stock_checked: boolean;
  labour_os_coverage_checked: boolean;
  created_at: string;
  updated_at: string;
}

export type DecorElementType = 'WALL' | 'DOOR' | 'PILLAR' | 'STAGE' | 'DANCE_FLOOR' | 'BAR_COUNTER' | 'HOST_STAND' | 'BATHROOM' | 'KITCHEN' | 'STAIRS';

export interface DecorElement {
  id: string;
  type: DecorElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label?: string;
}

// ─── Service Periods ─────────────────────────────
export interface ServicePeriod {
  key: string;
  label: string;
  start: string; // HH:mm
  end: string;   // HH:mm
  default_turn_time_minutes?: number; // e.g. 60, 90, 120, 150
}

// ─── Waiter/Zone Assignment ─────────────────────
export interface ZoneWaiterAssignment {
  zone: string;
  staffId: string;
  staffName: string;
}

// ─── Journey Stages ──────────────────────────────
export type JourneyStage = 'ARRIVING' | 'SEATED' | 'ORDERED' | 'IN_SERVICE' | 'BILL' | 'LEFT';

export interface ResJourneyEvent {
  id: string;
  org_id: string;
  reservation_id: string;
  stage: JourneyStage;
  occurred_at: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
}

// ─── Audit Suggestions ──────────────────────────
export type AuditSuggestionType =
  | 'BIRTHDAY_SURPRISE'
  | 'VIP_UPGRADE'
  | 'ALLERGEN_ALERT'
  | 'REGULAR_WELCOME'
  | 'AMUSE_BOUCHE'
  | 'TABLE_OPTIMIZATION'
  | 'OCCASION_TOUCH';

export type AuditSuggestionStatus = 'pending' | 'approved' | 'declined';

export interface ResAuditSuggestion {
  id: string;
  org_id: string;
  reservation_id: string;
  service_date: string;
  service_period: string;
  suggestion_type: AuditSuggestionType;
  title: string;
  description: string;
  action_text: string | null;
  status: AuditSuggestionStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

// ─── Sidebar Config ─────────────────────────────
export interface SidebarNavItem {
  key: string;
  label: string;
  path: string;
  icon: string;
  is_visible: boolean;
  required_role: string | null;
}

export interface ResSidebarSection {
  id: string;
  org_id: string;
  section_key: string;
  label: string;
  icon_name: string;
  sort_order: number;
  is_visible: boolean;
  required_role: string | null;
  items: SidebarNavItem[];
  created_at: string;
  updated_at: string;
}

// ─── Custom Tags ─────────────────────────────────
export type TagCategory = 'general' | 'dietary' | 'vip' | 'occasion' | 'operational';

export interface ResTag {
  id: string;
  org_id: string;
  name: string;
  color: string;
  icon: string | null;
  category: TagCategory;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ─── Efficiency Snapshots ────────────────────────
export interface ResEfficiencySnapshot {
  id: string;
  org_id: string;
  week_start: string;
  week_end: string;
  total_reservations: number;
  total_covers: number;
  total_walk_ins: number;
  avg_turn_time_minutes: number | null;
  avg_wait_to_seat_minutes: number | null;
  avg_order_to_serve_minutes: number | null;
  no_show_count: number;
  no_show_rate: number | null;
  cancellation_count: number;
  late_arrival_count: number;
  avg_occupancy_rate: number | null;
  peak_occupancy_rate: number | null;
  covers_per_table: number | null;
  revenue_per_cover: number | null;
  channel_breakdown: Record<string, number>;
  period_breakdown: Record<string, unknown>;
  efficiency_score: number | null;
  ai_recommendations: Array<{ title: string; description: string; icon: string }>;
  created_at: string;
}

// ─── Proposal Media ──────────────────────────────
export interface ResProposalMedia {
  id: string;
  proposal_id: string;
  url: string;
  media_type: 'image' | 'video';
  caption: string | null;
  section: 'hero' | 'menu' | 'venue' | 'gallery';
  sort_order: number;
  created_at: string;
}

export interface ProposalAddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  photo_url: string | null;
  is_popular: boolean;
}

export interface RunsheetItem {
  time: string;
  activity: string;
  notes: string;
}

// ─── Pre-Theatre / Shows ────────────────────────
export interface ResShow {
  id: string;
  org_id: string;
  external_id: string | null;
  title: string;
  venue_name: string | null;
  show_date: string;
  doors_time: string | null;
  curtain_time: string;
  end_time: string | null;
  genre: string | null;
  expected_attendance: number | null;
  session_number: number;
  source: 'manual' | 'website' | 'airtable' | 'api';
  source_url: string | null;
  is_active: boolean;
  is_suggestion: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Day/Service Blocking ───────────────────────
export type BlockType = 'closed' | 'venue_hire';

export interface ResBlockedDate {
  id: string;
  org_id: string;
  block_date: string;
  block_type: BlockType;
  service_period_key: string | null;
  reason: string | null;
  guest_message: string | null;
  blocked_by: string | null;
  created_at: string;
}

// ─── FOH Roles / Access ────────────────────────
export type FohRole = 'owner' | 'foh_admin' | 'shift_manager' | 'server' | 'host';

export interface ResAccessToken {
  id: string;
  org_id: string;
  token: string;
  granted_role: FohRole;
  label: string | null;
  granted_by: string | null;
  granted_to_email: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  is_revoked: boolean;
  created_at: string;
}
