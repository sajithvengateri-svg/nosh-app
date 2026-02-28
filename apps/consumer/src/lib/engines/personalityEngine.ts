/**
 * Personality Engine — Pure utility functions
 *
 * Four cooking personalities:
 *   Humpday Nosher  — plan midweek, shop weekend, cook confident
 *   Weekend Warrior  — Saturday morning blitz, one trip, done by lunch
 *   Thrill Seeker    — 5pm sprint, nearest store, 15 min cook
 *   OCD Planner      — full spreadsheet, batch prep, project cooks
 */

import React from "react";
import { CalendarDays, Waves, Zap, Ruler } from "lucide-react-native";
import type { Recipe } from "../stores/recipeStore";

// ── Types ────────────────────────────────────────────────────────

export type PersonalityType =
  | "humpday_nosher"
  | "weekend_warrior"
  | "thrill_seeker"
  | "ocd_planner";

export type CookingStyle = "sprint" | "run" | "jog" | "spread";

export interface PersonalityProfile {
  primary: PersonalityType;
  primaryWeight: number;
  secondary?: PersonalityType;
  secondaryWeight?: number;
  confidence: number;
  style: CookingStyle;
}

export interface PersonalityConstraints {
  maxCookTimeWeekday: number;
  maxCookTimeWeekend: number;
  maxSteps: number;
  maxIngredients: number;
  style: CookingStyle;
}

export interface RecipePersonalityTags {
  thrill_seeker?: {
    eligible: boolean;
    sprint_time?: number;
    one_store?: boolean;
    pantry_heavy?: boolean;
  };
  weekend_warrior?: {
    eligible: boolean;
    quick_cook?: boolean;
    batch_friendly?: boolean;
  };
  humpday_nosher?: {
    eligible: boolean;
    weeknight_friendly?: boolean;
    hero_meal?: boolean;
    leftover_potential?: "low" | "medium" | "high";
  };
  ocd_planner?: {
    eligible: boolean;
    batch_prep_steps?: number;
    freezer_friendly?: boolean;
    pairs_with?: string[];
  };
}

// ── Constraints per personality ──────────────────────────────────

const CONSTRAINTS: Record<PersonalityType, PersonalityConstraints> = {
  thrill_seeker: {
    maxCookTimeWeekday: 15,
    maxCookTimeWeekend: 15,
    maxSteps: 4,
    maxIngredients: 7,
    style: "sprint",
  },
  weekend_warrior: {
    maxCookTimeWeekday: 30,
    maxCookTimeWeekend: 45,
    maxSteps: 5,
    maxIngredients: 8,
    style: "run",
  },
  humpday_nosher: {
    maxCookTimeWeekday: 45,
    maxCookTimeWeekend: 45,
    maxSteps: 6,
    maxIngredients: 10,
    style: "jog",
  },
  ocd_planner: {
    maxCookTimeWeekday: 45,
    maxCookTimeWeekend: 60,
    maxSteps: 8,
    maxIngredients: 12,
    style: "spread",
  },
};

// Per-day weekday time limits
const DAILY_LIMITS: Record<PersonalityType, number[]> = {
  // Mon, Tue, Wed, Thu, Fri
  humpday_nosher: [35, 30, 40, 25, 45],
  weekend_warrior: [25, 30, 25, 30, 30],
  thrill_seeker: [15, 15, 15, 15, 15],
  ocd_planner: [40, 35, 45, 30, 45],
};

const ICON_MAP: Record<PersonalityType, React.ComponentType<any>> = {
  humpday_nosher: CalendarDays,
  weekend_warrior: Waves,
  thrill_seeker: Zap,
  ocd_planner: Ruler,
};

const LABEL_MAP: Record<PersonalityType, string> = {
  humpday_nosher: "Humpday Preper",
  weekend_warrior: "Weekend Warrior",
  thrill_seeker: "Thrill Seeker",
  ocd_planner: "OCD Planner",
};

const STYLE_MAP: Record<PersonalityType, CookingStyle> = {
  thrill_seeker: "sprint",
  weekend_warrior: "run",
  humpday_nosher: "jog",
  ocd_planner: "spread",
};

// ── Functions ────────────────────────────────────────────────────

/**
 * Get recipe constraints for a personality type.
 */
export function getConstraints(type: PersonalityType): PersonalityConstraints {
  return CONSTRAINTS[type];
}

/**
 * Get per-day constraints (adjusts weekday cook time by day of week).
 * dayOfWeek: 0=Sun, 1=Mon, 2=Tue, ... 6=Sat
 */
export function getDailyConstraints(
  type: PersonalityType,
  dayOfWeek: number,
  isWeekend: boolean,
): PersonalityConstraints {
  const base = CONSTRAINTS[type];

  if (isWeekend) {
    return base;
  }

  // Mon-Fri: use per-day limits (dayOfWeek 1-5 → index 0-4)
  const dailyIdx = dayOfWeek - 1;
  const dailyMax =
    dailyIdx >= 0 && dailyIdx < 5
      ? DAILY_LIMITS[type][dailyIdx]
      : base.maxCookTimeWeekday;

  return { ...base, maxCookTimeWeekday: dailyMax };
}

/**
 * Map onboarding selection to initial personality profile (40% confidence).
 */
export function classifyFromOnboarding(
  selection: PersonalityType,
): PersonalityProfile {
  return {
    primary: selection,
    primaryWeight: 0.4,
    confidence: 0.4,
    style: STYLE_MAP[selection],
  };
}

/**
 * Score how well a recipe fits a personality (0-20 points).
 */
export function scoreRecipeForPersonality(
  recipe: Recipe,
  personalityType: PersonalityType,
  constraints: PersonalityConstraints,
): number {
  let score = 0;

  // Time fit (0-8)
  if (recipe.total_time_minutes <= constraints.maxCookTimeWeekday) {
    score += 8;
  } else if (
    recipe.total_time_minutes <=
    constraints.maxCookTimeWeekday + 10
  ) {
    score += 4;
  }

  // Ingredient count fit (0-4)
  const ingCount = recipe.ingredients?.length ?? 8;
  if (ingCount <= constraints.maxIngredients) {
    score += 4;
  }

  // Personality tag match (0-8)
  const tags = recipe.personality_tags as RecipePersonalityTags | undefined;
  if (tags) {
    const myTags = tags[personalityType];
    if (myTags?.eligible) {
      score += 8;
    }
  }

  return score;
}

/**
 * Auto-generate personality tags from recipe data.
 */
export function generatePersonalityTags(
  recipe: Recipe,
): RecipePersonalityTags {
  const time = recipe.total_time_minutes;
  const steps = recipe.workflow_cards?.length ?? 6;
  const ingCount = recipe.ingredients?.length ?? 8;
  const hasFreezer =
    recipe.storage_notes?.toLowerCase().includes("freeze") ?? false;
  const hasLeftovers = recipe.leftover_ideas.length > 0;

  return {
    thrill_seeker: {
      eligible: time <= 15 && steps <= 4 && ingCount <= 7,
      sprint_time: time <= 15 ? time : undefined,
      one_store: ingCount <= 5,
      pantry_heavy: ingCount <= 5,
    },
    weekend_warrior: {
      eligible: time <= 30,
      quick_cook: time <= 20,
      batch_friendly: hasFreezer,
    },
    humpday_nosher: {
      eligible: time <= 45,
      weeknight_friendly: time <= 35,
      hero_meal: time >= 35 && recipe.difficulty >= 3,
      leftover_potential: hasLeftovers
        ? recipe.leftover_ideas.length >= 2
          ? "high"
          : "medium"
        : "low",
    },
    ocd_planner: {
      eligible: true, // OCD planners can handle anything
      batch_prep_steps: steps >= 4 ? Math.min(steps - 2, 4) : 1,
      freezer_friendly: hasFreezer,
    },
  };
}

/**
 * Get icon component for a personality type.
 */
export function getPersonalityIcon(type: PersonalityType): React.ComponentType<any> {
  return ICON_MAP[type];
}

/**
 * Get display label for a personality type.
 */
export function getPersonalityLabel(type: PersonalityType): string {
  return LABEL_MAP[type];
}

/**
 * Get short feed badge text for a personality type.
 */
export function getPersonalityBadge(type: PersonalityType): string {
  switch (type) {
    case "thrill_seeker":
      return "Sprint Ready";
    case "weekend_warrior":
      return "Quick Win";
    case "humpday_nosher":
      return "Weeknight Win";
    case "ocd_planner":
      return "Full Format";
  }
}
