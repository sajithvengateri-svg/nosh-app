/**
 * Nudge Engine — Pure utility functions
 *
 * Analyzes cooking signals to ramp personality confidence (0.4 → 0.95),
 * detect behavioral drift / hybrid modes, and decide when to nudge.
 *
 * No store imports. Takes data in, returns decisions out.
 */

import type {
  PersonalityType,
  PersonalityProfile,
  PersonalityConstraints,
} from "./personalityEngine";
import { getConstraints } from "./personalityEngine";
import type { CookLogEntry } from "../stores/favouritesStore";
import type { FeedInteraction } from "../stores/feedStore";
import type { SmartBubble } from "../companion/companionStore";

// ── Types ────────────────────────────────────────────────────────────

export interface CookSignal {
  recipeId: string;
  cookTime: number;
  ingredients: number;
  cuisine: string;
  personalityFit: boolean;
  isWeekend: boolean;
  cookedAt: string;
}

export interface SignalSummary {
  totalCooks: number;
  recentCooks: CookSignal[]; // last 14 days
  avgCookTime: number;
  avgIngredients: number;
  weekdayCooks: CookSignal[];
  weekendCooks: CookSignal[];
  topCuisines: string[]; // top 3
  personalityFitRate: number; // 0-1
  feedLikes: number;
  feedDismisses: number;
  noshRunsCompleted: number;
  socialEventsCreated: number;
  streakDays: number;
}

export type NudgeType =
  | "confidence_milestone"
  | "personality_shift"
  | "try_something_new"
  | "streak_celebration"
  | "hybrid_detected"
  | "social_prompt"
  | "dna_reveal";

export interface NudgePayload {
  type: NudgeType;
  message: string;
  smartBubbles?: SmartBubble[];
  recipeId?: string;
  achievementKey?: string;
  openOverlay?: string;
}

export interface NudgeDecision {
  shouldNudge: boolean;
  payload?: NudgePayload;
}

export interface NudgeState {
  lastNudgeAt: string | null;
  nudgePaused: boolean;
  nudgesSent: number;
  nudgesAccepted: number;
  nudgesDeclined: number;
}

export interface HybridMode {
  weekdayMode: PersonalityType;
  weekendMode: PersonalityType;
}

// ── Helpers ──────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

function isWeekendDate(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

/** Count unique dates with at least one cook, working backwards from today. */
function computeStreak(cooks: CookSignal[]): number {
  if (cooks.length === 0) return 0;

  const dateSet = new Set(
    cooks.map((c) => new Date(c.cookedAt).toISOString().slice(0, 10)),
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * DAY_MS)
      .toISOString()
      .slice(0, 10);
    if (dateSet.has(d)) {
      streak++;
    } else if (i > 0) {
      // Allow today to be missing (user hasn't cooked yet today)
      break;
    }
  }
  return streak;
}

/** Top N values from a frequency map. */
function topN(counts: Record<string, number>, n: number): string[] {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/** Check if a cook fits a personality's constraints. */
function cookFitsPersonality(
  cook: { cookTime: number; ingredients: number },
  constraints: PersonalityConstraints,
  isWeekend: boolean,
): boolean {
  const maxTime = isWeekend
    ? constraints.maxCookTimeWeekend
    : constraints.maxCookTimeWeekday;
  return cook.cookTime <= maxTime && cook.ingredients <= constraints.maxIngredients;
}

// ── Core Functions ───────────────────────────────────────────────────

/**
 * Build a signal summary from raw store data.
 */
export function buildSignalSummary(
  cookLog: CookLogEntry[],
  feedInteractions: FeedInteraction[],
  noshRunCount: number,
  socialEventCount: number,
  personalityType: PersonalityType,
): SignalSummary {
  const constraints = getConstraints(personalityType);
  const cutoff = daysAgo(14).toISOString();

  // Convert cook log to signals
  const allCooks: CookSignal[] = cookLog.map((entry) => {
    const cookedDate = new Date(entry.cooked_at);
    const weekend = isWeekendDate(cookedDate);
    const cookTime = entry.recipe?.total_time_minutes ?? 30;
    const ingredients = 8; // default — cook log doesn't store ingredient count
    return {
      recipeId: entry.recipe_id,
      cookTime,
      ingredients,
      cuisine: entry.recipe?.cuisine ?? "unknown",
      personalityFit: cookFitsPersonality({ cookTime, ingredients }, constraints, weekend),
      isWeekend: weekend,
      cookedAt: entry.cooked_at,
    };
  });

  const recentCooks = allCooks.filter((c) => c.cookedAt >= cutoff);
  const weekdayCooks = allCooks.filter((c) => !c.isWeekend);
  const weekendCooks = allCooks.filter((c) => c.isWeekend);

  // Average cook time
  const avgCookTime =
    allCooks.length > 0
      ? allCooks.reduce((s, c) => s + c.cookTime, 0) / allCooks.length
      : 0;

  // Average ingredients
  const avgIngredients =
    allCooks.length > 0
      ? allCooks.reduce((s, c) => s + c.ingredients, 0) / allCooks.length
      : 0;

  // Top cuisines
  const cuisineCounts: Record<string, number> = {};
  for (const c of allCooks) {
    cuisineCounts[c.cuisine] = (cuisineCounts[c.cuisine] ?? 0) + 1;
  }

  // Personality fit rate
  const fitCount = allCooks.filter((c) => c.personalityFit).length;
  const personalityFitRate = allCooks.length > 0 ? fitCount / allCooks.length : 0;

  // Feed interactions
  const feedLikes = feedInteractions.filter((i) => i.type === "like").length;
  const feedDismisses = feedInteractions.filter((i) => i.type === "dismiss").length;

  return {
    totalCooks: allCooks.length,
    recentCooks,
    avgCookTime,
    avgIngredients,
    weekdayCooks,
    weekendCooks,
    topCuisines: topN(cuisineCounts, 3),
    personalityFitRate,
    feedLikes,
    feedDismisses,
    noshRunsCompleted: noshRunCount,
    socialEventsCreated: socialEventCount,
    streakDays: computeStreak(allCooks),
  };
}

/**
 * Compute new confidence from signals.
 * Starts at 0.4 (onboarding), ramps per consistent cook, caps at 0.95.
 */
export function computeConfidence(
  currentConfidence: number,
  summary: SignalSummary,
  personalityType: PersonalityType,
): number {
  const constraints = getConstraints(personalityType);

  // Only process recent cooks for confidence delta
  let delta = 0;
  for (const cook of summary.recentCooks) {
    const maxTime = cook.isWeekend
      ? constraints.maxCookTimeWeekend
      : constraints.maxCookTimeWeekday;

    let perCook = 0;
    if (cook.cookTime <= maxTime) perCook += 0.04;
    if (cook.ingredients <= constraints.maxIngredients) perCook += 0.02;
    if (cook.personalityFit) perCook += 0.02;

    // Non-matching cooks still contribute a small amount
    if (perCook === 0) perCook = 0.01;

    delta += Math.min(perCook, 0.08);
  }

  // Dampen: don't jump too fast — max +0.15 per check
  delta = Math.min(delta, 0.15);

  return Math.min(currentConfidence + delta, 0.95);
}

/**
 * Detect if weekday vs weekend behavior diverges enough for hybrid mode.
 * Needs 3+ cooks on each side to evaluate.
 */
export function detectHybridMode(
  summary: SignalSummary,
): HybridMode | null {
  if (summary.weekdayCooks.length < 3 || summary.weekendCooks.length < 3) {
    return null;
  }

  const wdAvg =
    summary.weekdayCooks.reduce((s, c) => s + c.cookTime, 0) /
    summary.weekdayCooks.length;
  const weAvg =
    summary.weekendCooks.reduce((s, c) => s + c.cookTime, 0) /
    summary.weekendCooks.length;

  const weekdayMode = classifyByTime(wdAvg);
  const weekendMode = classifyByTime(weAvg);

  if (weekdayMode === weekendMode) return null;

  return { weekdayMode, weekendMode };
}

function classifyByTime(avgTime: number): PersonalityType {
  if (avgTime <= 15) return "thrill_seeker";
  if (avgTime <= 30) return "weekend_warrior";
  if (avgTime <= 45) return "humpday_nosher";
  return "ocd_planner";
}

/**
 * Detect drift: user's actual behavior doesn't match declared personality.
 * Looks at last 5+ recent cooks — if most fit a different personality better.
 */
export function detectDrift(
  summary: SignalSummary,
  declaredType: PersonalityType,
): PersonalityType | null {
  if (summary.recentCooks.length < 5) return null;

  const last5 = summary.recentCooks.slice(-5);
  const avgTime =
    last5.reduce((s, c) => s + c.cookTime, 0) / last5.length;

  const actual = classifyByTime(avgTime);
  if (actual === declaredType) return null;

  // Require at least 4/5 cooks to align with the different type
  const actualConstraints = getConstraints(actual);
  const matchCount = last5.filter((c) =>
    cookFitsPersonality(c, actualConstraints, c.isWeekend),
  ).length;

  return matchCount >= 4 ? actual : null;
}

// ── Nudge Evaluation ─────────────────────────────────────────────────

const NUDGE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Main nudge evaluation — called max once per app session.
 * Priority: dna_reveal > confidence_milestone > streak > shift > hybrid > variety > social
 */
export function evaluateNudge(
  summary: SignalSummary,
  profile: PersonalityProfile,
  nudgeState: NudgeState,
  newConfidence: number,
  oldConfidence: number,
  hybridMode: HybridMode | null,
  drift: PersonalityType | null,
  newAchievements: string[],
): NudgeDecision {
  // Throttle: no nudge if paused or too recent
  if (nudgeState.nudgePaused) return { shouldNudge: false };
  if (nudgeState.lastNudgeAt) {
    const elapsed = Date.now() - new Date(nudgeState.lastNudgeAt).getTime();
    if (elapsed < NUDGE_COOLDOWN_MS) return { shouldNudge: false };
  }

  // Need at least 1 cook to nudge
  if (summary.totalCooks === 0) return { shouldNudge: false };

  // Priority 1: DNA reveal — first time hitting 70%
  if (oldConfidence < 0.7 && newConfidence >= 0.7) {
    return {
      shouldNudge: true,
      payload: {
        type: "dna_reveal",
        message: "Your Prep DNA is ready! I've been watching how you cook — want to see what I found?",
        openOverlay: "nosh_dna",
        achievementKey: "identity_found",
        smartBubbles: [
          { id: "dna_reveal", label: "Show me!", action: "open_nosh_dna", iconName: "dna" },
          { id: "dna_later", label: "Later", action: "dismiss_nudge" },
        ],
      },
    };
  }

  // Priority 2: Confidence milestones (50%, 90%)
  if (oldConfidence < 0.5 && newConfidence >= 0.5) {
    return {
      shouldNudge: true,
      payload: {
        type: "confidence_milestone",
        message: "I'm getting to know your cooking style! 50% confidence and climbing.",
        smartBubbles: [
          { id: "dna_check", label: "My DNA", action: "open_nosh_dna", iconName: "dna" },
        ],
      },
    };
  }
  if (oldConfidence < 0.9 && newConfidence >= 0.9) {
    return {
      shouldNudge: true,
      payload: {
        type: "confidence_milestone",
        message: "I know you really well now -- 90% confidence! Your feed is fully tuned to you.",
        achievementKey: "fully_known",
        openOverlay: "nosh_dna",
        smartBubbles: [
          { id: "dna_check", label: "See DNA", action: "open_nosh_dna", iconName: "dna" },
        ],
      },
    };
  }

  // Priority 3: Streak celebrations (5, 10, 25)
  const streakMilestones = [25, 10, 5] as const;
  for (const m of streakMilestones) {
    if (
      summary.streakDays >= m &&
      newAchievements.includes(`streak_${m}`)
    ) {
      const labels: Record<number, string> = {
        5: "5-day streak! You're on fire!",
        10: "10-day streak! Unstoppable!",
        25: "25-day streak! You're a legend!",
      };
      return {
        shouldNudge: true,
        payload: {
          type: "streak_celebration",
          message: labels[m],
          achievementKey: `streak_${m}`,
          smartBubbles: [
            { id: "dna_check", label: "My DNA", action: "open_nosh_dna", iconName: "flame" },
          ],
        },
      };
    }
  }

  // Priority 4: Personality shift
  if (drift) {
    const ICON_NAME: Record<PersonalityType, string> = {
      humpday_nosher: "calendar_days",
      weekend_warrior: "waves",
      thrill_seeker: "zap",
      ocd_planner: "ruler",
    };
    const LABEL: Record<PersonalityType, string> = {
      humpday_nosher: "Humpday Preper",
      weekend_warrior: "Weekend Warrior",
      thrill_seeker: "Thrill Seeker",
      ocd_planner: "OCD Planner",
    };
    return {
      shouldNudge: true,
      payload: {
        type: "personality_shift",
        message: `Hmm, you've been cooking more like a ${LABEL[drift]} lately. Want to update your profile?`,
        smartBubbles: [
          { id: "shift_yes", label: "Update it", action: "accept_shift", iconName: ICON_NAME[drift] },
          { id: "shift_no", label: "Keep mine", action: "dismiss_nudge" },
        ],
      },
    };
  }

  // Priority 5: Hybrid mode detected
  if (hybridMode) {
    const LABEL: Record<PersonalityType, string> = {
      humpday_nosher: "Humpday Preper",
      weekend_warrior: "Weekend Warrior",
      thrill_seeker: "Thrill Seeker",
      ocd_planner: "OCD Planner",
    };
    return {
      shouldNudge: true,
      payload: {
        type: "hybrid_detected",
        message: `Interesting -- you cook like a ${LABEL[hybridMode.weekdayMode]} on weekdays and a ${LABEL[hybridMode.weekendMode]} on weekends! I'll tune your feed for both.`,
        smartBubbles: [
          { id: "hybrid_ok", label: "Cool!", action: "dismiss_nudge", iconName: "target" },
          { id: "dna_check", label: "My DNA", action: "open_nosh_dna", iconName: "dna" },
        ],
      },
    };
  }

  // Priority 6: Try something new — last 10 cooks all same cuisine
  if (summary.recentCooks.length >= 10) {
    const cuisines = new Set(summary.recentCooks.slice(-10).map((c) => c.cuisine));
    if (cuisines.size === 1) {
      return {
        shouldNudge: true,
        payload: {
          type: "try_something_new",
          message: "You've been on a single-cuisine streak! Want to explore something different tonight?",
          smartBubbles: [
            { id: "explore", label: "Surprise me", action: "random_recipe", iconName: "dice" },
            { id: "nah", label: "I'm good", action: "dismiss_nudge" },
          ],
        },
      };
    }
  }

  // Priority 7: Social prompt — 10+ cooks but no social events
  if (summary.totalCooks >= 10 && summary.socialEventsCreated === 0) {
    return {
      shouldNudge: true,
      payload: {
        type: "social_prompt",
        message: "You've cooked 10+ recipes — ever thought about hosting a Prep night with friends?",
        smartBubbles: [
          { id: "social_go", label: "Tell me more", action: "open_social_cooking", iconName: "users" },
          { id: "social_skip", label: "Not now", action: "dismiss_nudge" },
        ],
      },
    };
  }

  return { shouldNudge: false };
}
