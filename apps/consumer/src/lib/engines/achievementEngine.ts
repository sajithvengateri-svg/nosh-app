/**
 * Achievement Engine — Pure utility functions
 *
 * 14 achievement definitions + eligibility checker.
 * No store imports. Takes data in, returns results out.
 */

import type { PersonalityType } from "./personalityEngine";
import type { SignalSummary } from "./nudgeEngine";

// ── Types ────────────────────────────────────────────────────────────

export interface AchievementDef {
  key: string;
  label: string;
  iconName: string;
  description: string;
  personalityType?: PersonalityType;
  /** Return true if summary meets the criteria. Confidence-based ones use special logic. */
  check: (summary: SignalSummary) => boolean;
}

export interface AchievementResult {
  key: string;
  label: string;
  iconName: string;
  description: string;
  personalityType?: PersonalityType;
  earned: boolean;
}

// ── Achievement Definitions ──────────────────────────────────────────

const ACHIEVEMENTS: AchievementDef[] = [
  // Streak
  {
    key: "first_cook",
    iconName: "utensils_crossed",
    label: "First Nosh",
    description: "Cooked your first recipe",
    check: (s) => s.totalCooks >= 1,
  },
  {
    key: "streak_5",
    iconName: "flame",
    label: "On Fire",
    description: "5-day cooking streak",
    check: (s) => s.streakDays >= 5,
  },
  {
    key: "streak_10",
    iconName: "flame",
    label: "Unstoppable",
    description: "10-day cooking streak",
    check: (s) => s.streakDays >= 10,
  },
  {
    key: "streak_25",
    iconName: "star",
    label: "Legend",
    description: "25-day cooking streak",
    check: (s) => s.streakDays >= 25,
  },

  // Personality mastery (confidence-based -- checked via special logic)
  {
    key: "identity_found",
    iconName: "dna",
    label: "DNA Decoded",
    description: "Reached 70% personality confidence",
    check: () => false,
  },
  {
    key: "fully_known",
    iconName: "target",
    label: "Fully Known",
    description: "Reached 90% personality confidence",
    check: () => false,
  },

  // Personality-specific
  {
    key: "sprint_master",
    iconName: "zap",
    label: "Sprint Master",
    description: "Cooked 5 recipes under 15 minutes",
    personalityType: "thrill_seeker",
    check: (s) => s.recentCooks.filter((c) => c.cookTime <= 15).length >= 5,
  },
  {
    key: "batch_boss",
    iconName: "ruler",
    label: "Batch Boss",
    description: "Cooked 5 recipes with 8+ ingredients",
    personalityType: "ocd_planner",
    check: (s) =>
      s.recentCooks.filter((c) => c.ingredients >= 8).length >= 5,
  },
  {
    key: "weekend_blitz",
    iconName: "waves",
    label: "Weekend Blitz",
    description: "Cooked 3 recipes in one weekend",
    personalityType: "weekend_warrior",
    check: (s) => {
      // Group weekend cooks by week, check if any week has 3+
      const byWeek: Record<string, number> = {};
      for (const c of s.weekendCooks) {
        const d = new Date(c.cookedAt);
        // Use ISO week start (Mon) to group weekends
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        byWeek[key] = (byWeek[key] ?? 0) + 1;
      }
      return Object.values(byWeek).some((count) => count >= 3);
    },
  },

  // Variety
  {
    key: "world_tour",
    iconName: "globe",
    label: "World Tour",
    description: "Cooked 5 different cuisines",
    check: (s) => {
      const cuisines = new Set(
        s.recentCooks
          .concat(s.weekdayCooks, s.weekendCooks)
          .map((c) => c.cuisine)
          .filter((c) => c !== "unknown"),
      );
      return cuisines.size >= 5;
    },
  },
  {
    key: "social_host",
    iconName: "users",
    label: "Social Host",
    description: "Hosted 3 social cooking events",
    check: (s) => s.socialEventsCreated >= 3,
  },

  // Shopping
  {
    key: "smart_shopper",
    iconName: "shopping_cart",
    label: "Smart Shopper",
    description: "Completed 5 Nosh Runs",
    check: (s) => s.noshRunsCompleted >= 5,
  },
  {
    key: "pantry_pro",
    iconName: "home",
    label: "Pantry Pro",
    description: "80%+ recipes match your personality with 10+ cooks",
    check: (s) => s.personalityFitRate >= 0.8 && s.totalCooks >= 10,
  },

  // Engagement
  {
    key: "feed_curator",
    iconName: "trophy",
    label: "Feed Curator",
    description: "Liked 20 recipes in the feed",
    check: (s) => s.feedLikes >= 20,
  },
];

// ── Functions ────────────────────────────────────────────────────────

/**
 * Check all achievements, return newly earned keys.
 * Confidence-based achievements are checked via the `confidence` param.
 */
export function checkAchievements(
  summary: SignalSummary,
  earnedKeys: string[],
  confidence: number,
): string[] {
  const earned = new Set(earnedKeys);
  const newlyEarned: string[] = [];

  for (const a of ACHIEVEMENTS) {
    if (earned.has(a.key)) continue;

    // Special confidence-based checks
    if (a.key === "identity_found" && confidence >= 0.7) {
      newlyEarned.push(a.key);
      continue;
    }
    if (a.key === "fully_known" && confidence >= 0.9) {
      newlyEarned.push(a.key);
      continue;
    }

    // Normal check
    if (a.check(summary)) {
      newlyEarned.push(a.key);
    }
  }

  return newlyEarned;
}

/**
 * Get a single achievement definition by key.
 */
export function getAchievement(key: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key);
}

/**
 * Get all achievements with earned status.
 */
export function getAllAchievements(
  earnedKeys: string[],
): AchievementResult[] {
  const earned = new Set(earnedKeys);
  return ACHIEVEMENTS.map((a) => ({
    key: a.key,
    label: a.label,
    emoji: a.emoji,
    description: a.description,
    personalityType: a.personalityType,
    earned: earned.has(a.key),
  }));
}
