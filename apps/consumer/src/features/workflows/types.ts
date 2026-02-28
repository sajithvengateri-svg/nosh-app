/**
 * Workflow Framework Types
 *
 * Shared types for the Typeform-style stepper used by
 * Profile Builder, Walkthrough, and Personality Quiz.
 */

export type StepType =
  | "text_input"
  | "single_select"
  | "multi_select"
  | "slider"
  | "icon_cards"
  | "grid_select"
  | "scale"
  | "household_count"
  | "info_card"
  | "personality_pick";

export interface SelectOption {
  label: string;
  value: string;
  icon?: string; // lucide icon name
  description?: string;
  color?: string; // accent color for grid/cards
  personality?: string; // for quiz scoring
  points?: number; // for quiz scoring
}

export interface WorkflowStep {
  id: string;
  type: StepType;
  question: string;
  subtitle?: string;
  options?: SelectOption[];
  required?: boolean;
  min?: number; // for slider
  max?: number; // for slider
  step?: number; // for slider increment
  unit?: string; // for slider label ("min", "$")
  skipIf?: (answers: Record<string, any>) => boolean;
  validate?: (value: any) => string | null; // return error message or null
}

export interface WorkflowConfig {
  id: string;
  title: string;
  steps: WorkflowStep[];
  showProgress?: boolean;
  allowBack?: boolean;
  allowSkip?: boolean;
}
