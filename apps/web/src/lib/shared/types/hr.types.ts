// HR & Clock types for LabourOS / ClockOS

export interface HRRecord {
  id: string;
  staffId: string;
  type: string;
  details: string;
  date: string;
}

export interface Certification {
  id: string;
  staffId: string;
  name: string;
  issuedAt: string;
  expiresAt: string;
  status: 'valid' | 'expiring' | 'expired';
}

export interface SOP {
  id: string;
  title: string;
  content: string;
  category: string;
  version: number;
  updatedAt: string;
}

// Clock-in related types used across ClockOS + LabourOS
export interface ClockInRequest {
  user_id: string;
  org_id: string;
  device_type: 'IPAD' | 'PHONE' | 'BROWSER';
  device_id?: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  photo_url?: string;
}

export interface ClockComplianceCheck {
  can_clock_in: boolean;
  hours_since_last_shift: number | null;
  warning: string | null;
  requires_manager_override: boolean;
}

export interface BreakEvent {
  id: string;
  event_type: 'BREAK_START' | 'BREAK_END';
  event_time: string;
  break_type: 'MEAL_UNPAID' | 'REST_PAID';
  duration_minutes?: number;
}

export interface RoleChange {
  from_classification: string;
  to_classification: string;
  start_time: string;
  duration_hours: number;
}
