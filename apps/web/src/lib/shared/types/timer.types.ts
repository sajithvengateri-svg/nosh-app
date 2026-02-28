// Smart Timer System — Type Definitions

export type TimerType = 'COUNTDOWN' | 'COUNT_UP' | 'STAGED' | 'MINIMUM_WAIT';
export type TimerStatus = 'RUNNING' | 'PAUSED' | 'COMPLETE' | 'OVERDUE' | 'DISMISSED' | 'CANCELLED';
export type AlertType = 'CHIME' | 'BELL' | 'BUZZER' | 'SILENT';
export type TimerSourceType = 'RECIPE' | 'ORDER' | 'PREP' | 'INFUSION' | 'ADHOC' | 'CHEATSHEET';
export type TimerCategory = 'kitchen' | 'bar' | 'prep' | 'cheatsheet';
export type TimerIcon = 'clock' | 'flame' | 'snowflake' | 'droplet' | 'thermometer' | 'timer';

export interface TimerStage {
  at_seconds: number;
  label: string;
  alert: boolean;
}

export interface RecipeTimer {
  id: string;
  org_id: string;
  recipe_id: string;
  step_number: number;
  label: string;
  duration_seconds: number;
  timer_type: TimerType;
  stages: TimerStage[] | null;
  is_minimum_time: boolean;
  alert_type: AlertType;
  colour: string | null;
  icon: string;
  critical: boolean;
  notes: string | null;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
}

export interface ActiveTimer {
  id: string;
  org_id: string;
  source_type: TimerSourceType;
  recipe_id: string | null;
  order_id: string | null;
  prep_task_id: string | null;
  label: string;
  duration_seconds: number;
  timer_type: TimerType;
  stages: TimerStage[] | null;
  is_minimum_time: boolean;
  status: TimerStatus;
  started_at: string;
  paused_at: string | null;
  paused_duration_seconds: number;
  completed_at: string | null;
  dismissed_at: string | null;
  dismissed_by: string | null;
  chain_id: string | null;
  chain_position: number | null;
  auto_start_after: string | null;
  station: string | null;
  colour: string;
  icon: string;
  alert_type: AlertType;
  critical: boolean;
  notes: string | null;
  started_by: string | null;
  snooze_count: number;
  snooze_until: string | null;
  created_at: string;
}

export interface SavedTimer {
  id: string;
  org_id: string;
  created_by: string;
  label: string;
  duration_seconds: number;
  timer_type: TimerType;
  alert_type: AlertType;
  icon: string;
  station: string | null;
  category: TimerCategory;
  use_count: number;
  created_at: string;
}

export interface TimerHistory {
  id: string;
  org_id: string;
  timer_id: string;
  recipe_id: string | null;
  order_id: string | null;
  label: string;
  duration_seconds: number;
  actual_duration_seconds: number | null;
  was_overdue: boolean;
  overdue_seconds: number;
  station: string | null;
  started_by: string | null;
  completed_at: string;
}

export interface StartTimerConfig {
  org_id: string;
  label: string;
  duration_seconds: number;
  source_type?: TimerSourceType;
  timer_type?: TimerType;
  recipe_id?: string;
  order_id?: string;
  prep_task_id?: string;
  stages?: TimerStage[];
  is_minimum_time?: boolean;
  station?: string;
  colour?: string;
  icon?: string;
  alert_type?: AlertType;
  critical?: boolean;
  notes?: string;
  started_by?: string;
  chain_id?: string;
  chain_position?: number;
  auto_start_after?: string;
}

/** Colour thresholds for timer urgency */
export type TimerUrgency = 'safe' | 'warning' | 'danger' | 'complete' | 'overdue' | 'info';

export const getTimerUrgency = (remaining: number, total: number, timerType: TimerType, status: TimerStatus): TimerUrgency => {
  if (status === 'COMPLETE' || status === 'DISMISSED') return 'complete';
  if (status === 'OVERDUE') return 'overdue';
  if (timerType === 'COUNT_UP') return 'info';
  if (timerType === 'MINIMUM_WAIT' && remaining <= 0) return 'safe';
  
  const pct = total > 0 ? remaining / total : 0;
  if (pct > 0.5) return 'safe';
  if (pct > 0.25) return 'warning';
  return 'danger';
};
