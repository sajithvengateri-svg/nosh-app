// GrowthOS — Marketing types

export type CampaignType = 'DEMAND_FILL' | 'WIN_BACK' | 'BIRTHDAY' | 'PROMOTION' | 'EVENT' | 'CUSTOM';
export type CampaignTrigger = 'MANUAL' | 'AUTO_LOW_DEMAND' | 'AUTO_LAPSED' | 'AUTO_BIRTHDAY' | 'AUTO_MILESTONE';
export type CampaignChannel = 'EMAIL' | 'SMS' | 'SOCIAL' | 'MULTI';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENT' | 'COMPLETED';
export type RecipientStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'UNSUBSCRIBED';
export type CommChannel = 'SMS' | 'EMAIL' | 'PUSH';
export type CommType = 'CONFIRMATION' | 'REMINDER' | 'WAITLIST' | 'MARKETING' | 'FEEDBACK';
export type CommStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED';

export interface Campaign {
  id: string;
  org_id: string;
  name: string;
  type: CampaignType;
  trigger_type: CampaignTrigger;
  channel: CampaignChannel;
  segment: Record<string, unknown>;
  subject: string | null;
  body: string | null;
  cta_text: string | null;
  cta_url: string | null;
  social_caption: string | null;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipients_count: number;
  opened_count: number;
  clicked_count: number;
  bookings_attributed: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  guest_id: string;
  status: RecipientStatus;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

export interface Communication {
  id: string;
  org_id: string;
  guest_id: string | null;
  channel: CommChannel;
  type: CommType;
  campaign_id: string | null;
  subject: string | null;
  body: string | null;
  status: CommStatus;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  booking_link_utm: string | null;
  created_at: string;
}

// Guest segment definitions (computed from res_guests, not stored)
export type GuestSegment =
  | 'NEW' | 'RETURNING' | 'REGULAR' | 'VIP' | 'CHAMPION'
  | 'LAPSED' | 'AT_RISK' | 'BIRTHDAY_SOON' | 'HIGH_BEV' | 'HIGH_FOOD';

export interface SegmentDefinition {
  key: GuestSegment;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export const SEGMENT_DEFINITIONS: SegmentDefinition[] = [
  { key: 'NEW', label: 'New Guests', description: '1 visit', color: 'bg-blue-500', icon: 'UserPlus' },
  { key: 'RETURNING', label: 'Returning', description: '2-3 visits', color: 'bg-cyan-500', icon: 'RefreshCw' },
  { key: 'REGULAR', label: 'Regulars', description: '4+ visits in 3 months', color: 'bg-green-500', icon: 'Heart' },
  { key: 'VIP', label: 'VIPs', description: 'Top 10% by spend', color: 'bg-amber-500', icon: 'Star' },
  { key: 'CHAMPION', label: 'Champions', description: 'Top 2% + 12+ visits', color: 'bg-purple-500', icon: 'Crown' },
  { key: 'LAPSED', label: 'Lapsed', description: 'No visit in 4+ weeks', color: 'bg-red-500', icon: 'Clock' },
  { key: 'AT_RISK', label: 'At Risk', description: 'Declining frequency', color: 'bg-orange-500', icon: 'AlertTriangle' },
  { key: 'BIRTHDAY_SOON', label: 'Birthday Soon', description: 'Within 30 days', color: 'bg-pink-500', icon: 'Cake' },
  { key: 'HIGH_BEV', label: 'High Bev', description: 'Above avg bev spend', color: 'bg-indigo-500', icon: 'Wine' },
  { key: 'HIGH_FOOD', label: 'High Food', description: 'Above avg food spend', color: 'bg-emerald-500', icon: 'UtensilsCrossed' },
];

export interface CampaignSuggestion {
  type: CampaignType;
  trigger_type: CampaignTrigger;
  name: string;
  subject: string;
  body: string;
  channel: CampaignChannel;
  segment: Record<string, unknown>;
  reason: string;
}
