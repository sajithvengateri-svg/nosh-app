/** Achievement definitions */

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string; // emoji
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streaks
  { key: "streak_5", title: "On Fire", description: "5-day compliance streak", icon: "🔥" },
  { key: "streak_10", title: "Unstoppable", description: "10-day compliance streak", icon: "⚡" },
  { key: "streak_30", title: "Iron Chef", description: "30-day compliance streak", icon: "🏆" },
  { key: "streak_100", title: "Legend", description: "100-day compliance streak", icon: "👑" },
  // Edge
  { key: "edge_first", title: "First Edge", description: "Complete The 15° Edge", icon: "🔪" },
  { key: "edge_razor", title: "Razor Sharp", description: "Score Razor Edge rating", icon: "💎" },
  // Onion Blitz
  { key: "onion_first", title: "First Slice", description: "Complete Onion Blitz", icon: "🧅" },
  { key: "onion_master", title: "Master Slicer", description: "Score Master Slicer rating", icon: "🏆" },
  // Alley Cat
  { key: "cat_first", title: "First Pet", description: "Complete The Alley Cat", icon: "🐱" },
  { key: "cat_whisperer", title: "Cat Whisperer", description: "Score Cat Whisperer rating", icon: "🐈" },
  // League
  { key: "pro_league", title: "Pro League", description: "Qualify for Pro League (7-day streak)", icon: "🏅" },
  // Levels
  { key: "level_commis", title: "Commis", description: "Reach Commis rank (100 XP)", icon: "📗" },
  { key: "level_cdp", title: "Chef de Partie", description: "Reach Chef de Partie (500 XP)", icon: "📘" },
  { key: "level_sous", title: "Sous Chef", description: "Reach Sous Chef (1500 XP)", icon: "📙" },
  { key: "level_head", title: "Head Chef", description: "Reach Head Chef (5000 XP)", icon: "📕" },
  { key: "level_master", title: "Master Chef", description: "Reach Master Chef (10000 XP)", icon: "🌟" },
];

export function getAchievement(key: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.key === key);
}

export function getStreakAchievementKey(streak: number): string | null {
  if (streak >= 100) return "streak_100";
  if (streak >= 30) return "streak_30";
  if (streak >= 10) return "streak_10";
  if (streak >= 5) return "streak_5";
  return null;
}

export function getLevelAchievementKey(xp: number): string | null {
  if (xp >= 10000) return "level_master";
  if (xp >= 5000) return "level_head";
  if (xp >= 1500) return "level_sous";
  if (xp >= 500) return "level_cdp";
  if (xp >= 100) return "level_commis";
  return null;
}
