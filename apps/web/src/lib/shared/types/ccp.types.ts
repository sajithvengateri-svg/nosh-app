// Critical Control Point Types

export type CCPStepType = 'prep' | 'cook' | 'hold' | 'cool' | 'reheat' | 'serve';
export type HazardType = 'biological' | 'chemical' | 'physical';
export type MonitoringFrequency = 'each_batch' | 'hourly' | 'per_item';

export interface RecipeCCP {
  id: string;
  recipe_id: string;
  step_name: string;
  step_order: number;
  step_type: CCPStepType;
  target_temp: number | null;
  temp_unit: 'C' | 'F';
  time_limit: number | null;
  is_critical: boolean;
  hazard_type: HazardType | null;
  hazard_description: string | null;
  critical_limit_min: number | null;
  critical_limit_max: number | null;
  monitoring_procedure: string | null;
  monitoring_frequency: MonitoringFrequency | null;
  corrective_action: string | null;
  verification_method: string | null;
  record_keeping_notes: string | null;
  timeline_position: number;
  created_at: string;
  updated_at: string;
}

export interface CCPFormData {
  step_name: string;
  step_type: CCPStepType;
  target_temp: number | null;
  temp_unit: 'C' | 'F';
  time_limit: number | null;
  is_critical: boolean;
  timeline_position: number;
  hazard_type: HazardType | null;
  hazard_description: string;
  critical_limit_min: number | null;
  critical_limit_max: number | null;
  monitoring_procedure: string;
  monitoring_frequency: MonitoringFrequency | null;
  corrective_action: string;
  verification_method: string;
  record_keeping_notes: string;
}

export const STEP_TYPE_CONFIG: Record<CCPStepType, { label: string; color: string; icon: string }> = {
  prep: { label: 'Prep', color: 'bg-blue-500', icon: '🔪' },
  cook: { label: 'Cook', color: 'bg-orange-500', icon: '🔥' },
  hold: { label: 'Hold', color: 'bg-yellow-500', icon: '⏸️' },
  cool: { label: 'Cool', color: 'bg-cyan-500', icon: '❄️' },
  reheat: { label: 'Reheat', color: 'bg-red-500', icon: '♨️' },
  serve: { label: 'Serve', color: 'bg-green-500', icon: '🍽️' },
};

export const HAZARD_TYPE_CONFIG: Record<HazardType, { label: string; color: string }> = {
  biological: { label: 'Biological', color: 'text-red-500' },
  chemical: { label: 'Chemical', color: 'text-purple-500' },
  physical: { label: 'Physical', color: 'text-orange-500' },
};

export const DANGER_ZONE = {
  min: 5,
  max: 60,
};

export const convertTemp = (temp: number, from: 'C' | 'F', to: 'C' | 'F'): number => {
  if (from === to) return temp;
  if (from === 'C') return (temp * 9/5) + 32;
  return (temp - 32) * 5/9;
};
