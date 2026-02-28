/** XP thresholds and level progression */

export interface Level {
  title: string;
  minXP: number;
  color: string;
}

export const LEVELS: Level[] = [
  { title: "Scullery Hand", minXP: 0, color: "#78716c" },
  { title: "Commis", minXP: 100, color: "#22c55e" },
  { title: "Chef de Partie", minXP: 500, color: "#3b82f6" },
  { title: "Sous Chef", minXP: 1500, color: "#a855f7" },
  { title: "Head Chef", minXP: 5000, color: "#f59e0b" },
  { title: "Master Chef", minXP: 10000, color: "#ef4444" },
];

export function getLevel(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelIndex(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return i;
  }
  return 0;
}

export function getNextLevel(xp: number): Level | null {
  const idx = getLevelIndex(xp);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getLevelProgress(xp: number): number {
  const idx = getLevelIndex(xp);
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1];
  if (!next) return 1;
  return (xp - current.minXP) / (next.minXP - current.minXP);
}

/** Game grading interface */
export interface GameGrade {
  grade: string;
  label: string;
  color: string;
  xp: number;
  minPercent: number;
}

/** Edge grading — based on precision % (time in zone) */
export const EDGE_GRADES: GameGrade[] = [
  { grade: "Razor Edge", label: "Master Sharpener", color: "#059669", xp: 40, minPercent: 90 },
  { grade: "Sharp", label: "Well Done", color: "#22c55e", xp: 30, minPercent: 70 },
  { grade: "Dull", label: "Needs Practice", color: "#f59e0b", xp: 20, minPercent: 50 },
  { grade: "Butter Knife", label: "Try Again", color: "#ef4444", xp: 10, minPercent: 0 },
];

export function getEdgeGrade(precisionPercent: number): GameGrade {
  for (const g of EDGE_GRADES) {
    if (precisionPercent >= g.minPercent) return g;
  }
  return EDGE_GRADES[EDGE_GRADES.length - 1];
}

/** Onion Blitz grading — based on slice accuracy % */
export const ONION_GRADES: GameGrade[] = [
  { grade: "Master Slicer", label: "Knife Skills: Legendary", color: "#ec4899", xp: 45, minPercent: 90 },
  { grade: "Sous Slicer", label: "Clean Cuts", color: "#22c55e", xp: 35, minPercent: 75 },
  { grade: "Prep Cook", label: "Decent Chops", color: "#3b82f6", xp: 25, minPercent: 55 },
  { grade: "Butterfingers", label: "Slippery Hands", color: "#ef4444", xp: 10, minPercent: 0 },
];

export function getOnionGrade(accuracyPercent: number): GameGrade {
  for (const g of ONION_GRADES) {
    if (accuracyPercent >= g.minPercent) return g;
  }
  return ONION_GRADES[ONION_GRADES.length - 1];
}

/** Alley Cat grading — based on calm score % */
export const CAT_GRADES: GameGrade[] = [
  { grade: "Cat Whisperer", label: "Purrfect Zen", color: "#8b5cf6", xp: 40, minPercent: 90 },
  { grade: "Friendly", label: "Good Vibes", color: "#22c55e", xp: 30, minPercent: 70 },
  { grade: "Nervous", label: "Too Jittery", color: "#f59e0b", xp: 20, minPercent: 50 },
  { grade: "Scaredy Cat", label: "Cat Ran Away", color: "#ef4444", xp: 10, minPercent: 0 },
];

export function getCatGrade(calmPercent: number): GameGrade {
  for (const g of CAT_GRADES) {
    if (calmPercent >= g.minPercent) return g;
  }
  return CAT_GRADES[CAT_GRADES.length - 1];
}
