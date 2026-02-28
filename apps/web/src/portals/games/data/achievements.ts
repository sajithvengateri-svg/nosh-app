/**
 * Achievement/badge definitions for the Mastery Suite.
 */

export interface Achievement {
  key: string;
  title: string;
  description: string;
  /** Lucide icon name */
  icon: string;
  /** Colour for the badge */
  color: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // ── Streak badges ──
  {
    key: "streak_5",
    title: "5-Day Streak",
    description: "Completed compliance 5 days in a row",
    icon: "Flame",
    color: "#f59e0b",
  },
  {
    key: "streak_10",
    title: "10-Day Streak",
    description: "Completed compliance 10 days in a row",
    icon: "Flame",
    color: "#ef4444",
  },
  {
    key: "streak_30",
    title: "Iron Chef",
    description: "Completed compliance 30 days in a row",
    icon: "Flame",
    color: "#8b5cf6",
  },
  {
    key: "streak_100",
    title: "Legend of the Line",
    description: "Completed compliance 100 days in a row",
    icon: "Crown",
    color: "#fbbf24",
  },

  // ── Gauntlet badges ──
  {
    key: "gauntlet_first",
    title: "First Shift",
    description: "Completed your first Kitchen Gauntlet",
    icon: "Shield",
    color: "#3b82f6",
  },
  {
    key: "gauntlet_a_plus",
    title: "Perfect Service",
    description: "Scored A+ on the Kitchen Gauntlet",
    icon: "Star",
    color: "#fbbf24",
  },
  {
    key: "gauntlet_10_games",
    title: "Veteran of the Line",
    description: "Completed 10 Kitchen Gauntlet games",
    icon: "Shield",
    color: "#8b5cf6",
  },

  // ── Edge badges ──
  {
    key: "edge_first",
    title: "First Whetstone",
    description: "Completed your first sharpening session",
    icon: "Sword",
    color: "#3b82f6",
  },
  {
    key: "edge_razor",
    title: "Razor's Edge",
    description: "Achieved 'Razor Edge' grade on The 15° Edge",
    icon: "Sword",
    color: "#fbbf24",
  },

  // ── League badges ──
  {
    key: "pro_qualified",
    title: "Pro League",
    description: "Qualified for the Pro League with a 7-day streak",
    icon: "Trophy",
    color: "#ef4444",
  },

  // ── Level-up badges ──
  {
    key: "level_commis",
    title: "Commis",
    description: "Reached 100 XP — promoted to Commis",
    icon: "ChefHat",
    color: "#3b82f6",
  },
  {
    key: "level_cdp",
    title: "Chef de Partie",
    description: "Reached 500 XP — promoted to Chef de Partie",
    icon: "ChefHat",
    color: "#8b5cf6",
  },
  {
    key: "level_sous",
    title: "Sous Chef",
    description: "Reached 1500 XP — promoted to Sous Chef",
    icon: "ChefHat",
    color: "#f59e0b",
  },
  {
    key: "level_head",
    title: "Head Chef",
    description: "Reached 5000 XP — promoted to Head Chef",
    icon: "ChefHat",
    color: "#ef4444",
  },
  {
    key: "level_master",
    title: "Master Chef",
    description: "Reached 10000 XP — achieved Master Chef status",
    icon: "Crown",
    color: "#fbbf24",
  },

  // ── Onion Blitz badges ──
  {
    key: "onion_first",
    title: "First Slice",
    description: "Completed your first Onion Blitz",
    icon: "Cherry",
    color: "#ec4899",
  },
  {
    key: "onion_master",
    title: "Master Slicer",
    description: "Achieved 'Master Slicer' grade on Onion Blitz",
    icon: "Cherry",
    color: "#fbbf24",
  },

  // ── Alley Cat badges ──
  {
    key: "cat_first",
    title: "First Pet",
    description: "Completed your first Alley Cat session",
    icon: "Cat",
    color: "#8b5cf6",
  },
  {
    key: "cat_whisperer",
    title: "Cat Whisperer",
    description: "Achieved 'Cat Whisperer' grade on The Alley Cat",
    icon: "Cat",
    color: "#fbbf24",
  },
];

/** Streak milestones that trigger achievement checks */
export const STREAK_MILESTONES = [5, 10, 30, 100] as const;

/** Map streak count to achievement key */
export function getStreakAchievementKey(streak: number): string | null {
  if (streak >= 100) return "streak_100";
  if (streak >= 30) return "streak_30";
  if (streak >= 10) return "streak_10";
  if (streak >= 5) return "streak_5";
  return null;
}

/** Map XP to level achievement key */
export function getLevelAchievementKey(xp: number): string | null {
  if (xp >= 10000) return "level_master";
  if (xp >= 5000) return "level_head";
  if (xp >= 1500) return "level_sous";
  if (xp >= 500) return "level_cdp";
  if (xp >= 100) return "level_commis";
  return null;
}
