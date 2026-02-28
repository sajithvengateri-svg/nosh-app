/**
 * XP thresholds and level titles for the chef progression system.
 * Titles follow real kitchen brigade hierarchy.
 */

export interface Level {
  title: string;
  minXP: number;
  /** Colour accent for the level badge */
  color: string;
}

export const LEVELS: Level[] = [
  { title: "Scullery Hand", minXP: 0, color: "#6b7280" },       // gray-500
  { title: "Commis", minXP: 100, color: "#3b82f6" },            // blue-500
  { title: "Chef de Partie", minXP: 500, color: "#8b5cf6" },    // violet-500
  { title: "Sous Chef", minXP: 1500, color: "#f59e0b" },        // amber-500
  { title: "Head Chef", minXP: 5000, color: "#ef4444" },        // red-500
  { title: "Master Chef", minXP: 10000, color: "#fbbf24" },     // gold
];

/** Get the current level for a given XP total */
export function getLevelForXP(xp: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXP) current = level;
    else break;
  }
  return current;
}

/** Get XP needed for the next level. Returns null if max level. */
export function getNextLevelXP(xp: number): number | null {
  for (const level of LEVELS) {
    if (xp < level.minXP) return level.minXP;
  }
  return null;
}

/** Get progress percentage toward next level (0-100) */
export function getLevelProgress(xp: number): number {
  const current = getLevelForXP(xp);
  const nextXP = getNextLevelXP(xp);
  if (nextXP === null) return 100; // Max level

  const range = nextXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.round((progress / range) * 100);
}

/** Gauntlet grade thresholds */
export const GAUNTLET_GRADES = [
  { grade: "A+", minAccuracy: 95, xp: 50 },
  { grade: "A", minAccuracy: 85, xp: 40 },
  { grade: "B", minAccuracy: 70, xp: 30 },
  { grade: "C", minAccuracy: 55, xp: 20 },
  { grade: "D", minAccuracy: 40, xp: 10 },
  { grade: "F", minAccuracy: 0, xp: 5 },
] as const;

export function getGauntletGrade(accuracy: number) {
  for (const g of GAUNTLET_GRADES) {
    if (accuracy >= g.minAccuracy) return g;
  }
  return GAUNTLET_GRADES[GAUNTLET_GRADES.length - 1];
}

/** Edge (sharpening) grade thresholds */
export const EDGE_GRADES = [
  { grade: "Razor Edge", minPrecision: 90, xp: 40 },
  { grade: "Sharp", minPrecision: 70, xp: 30 },
  { grade: "Dull", minPrecision: 50, xp: 20 },
  { grade: "Butter Knife", minPrecision: 0, xp: 10 },
] as const;

export function getEdgeGrade(precision: number) {
  for (const g of EDGE_GRADES) {
    if (precision >= g.minPrecision) return g;
  }
  return EDGE_GRADES[EDGE_GRADES.length - 1];
}

/** Onion Blitz grade thresholds */
export const ONION_GRADES = [
  { grade: "Master Slicer", label: "Knife Skills: Legendary", minAccuracy: 90, xp: 45, color: "#ec4899" },
  { grade: "Sous Slicer", label: "Clean Cuts", minAccuracy: 75, xp: 35, color: "#22c55e" },
  { grade: "Prep Cook", label: "Decent Chops", minAccuracy: 55, xp: 25, color: "#3b82f6" },
  { grade: "Butterfingers", label: "Slippery Hands", minAccuracy: 0, xp: 10, color: "#ef4444" },
] as const;

export function getOnionGrade(accuracy: number) {
  for (const g of ONION_GRADES) {
    if (accuracy >= g.minAccuracy) return g;
  }
  return ONION_GRADES[ONION_GRADES.length - 1];
}

/** Alley Cat grade thresholds */
export const CAT_GRADES = [
  { grade: "Cat Whisperer", label: "Purrfect Zen", minCalmPercent: 90, xp: 40, color: "#8b5cf6" },
  { grade: "Friendly", label: "Good Vibes", minCalmPercent: 70, xp: 30, color: "#22c55e" },
  { grade: "Nervous", label: "Too Jittery", minCalmPercent: 50, xp: 20, color: "#f59e0b" },
  { grade: "Scaredy Cat", label: "Cat Ran Away", minCalmPercent: 0, xp: 10, color: "#ef4444" },
] as const;

export function getCatGrade(calmPercent: number) {
  for (const g of CAT_GRADES) {
    if (calmPercent >= g.minCalmPercent) return g;
  }
  return CAT_GRADES[CAT_GRADES.length - 1];
}
