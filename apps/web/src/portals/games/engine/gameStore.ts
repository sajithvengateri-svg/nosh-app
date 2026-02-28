import { create } from "zustand";

export type GamePhase = "idle" | "countdown" | "playing" | "paused" | "ended";

interface GameState {
  // Current game session
  phase: GamePhase;
  score: number;
  timeRemaining: number;
  lives: number;

  // Gauntlet-specific
  hazardsCleared: number;
  hazardsMissed: number;
  heatLevel: number; // 0-100

  // Edge-specific
  sharpness: number; // 0-100
  timeInZone: number; // seconds in perfect angle zone
  totalTime: number; // total elapsed seconds

  // Actions
  setPhase: (phase: GamePhase) => void;
  addScore: (points: number) => void;
  setScore: (score: number) => void;
  setTimeRemaining: (time: number) => void;
  loseLife: () => void;
  clearHazard: () => void;
  missHazard: () => void;
  setHeatLevel: (level: number) => void;
  setSharpness: (value: number) => void;
  addTimeInZone: (seconds: number) => void;
  setTotalTime: (seconds: number) => void;
  resetGame: () => void;
}

const INITIAL_STATE = {
  phase: "idle" as GamePhase,
  score: 0,
  timeRemaining: 60,
  lives: 3,
  hazardsCleared: 0,
  hazardsMissed: 0,
  heatLevel: 0,
  sharpness: 0,
  timeInZone: 0,
  totalTime: 0,
};

export const useGameStore = create<GameState>((set) => ({
  ...INITIAL_STATE,

  setPhase: (phase) => set({ phase }),
  addScore: (points) => set((s) => ({ score: s.score + points })),
  setScore: (score) => set({ score }),
  setTimeRemaining: (time) => set({ timeRemaining: Math.max(0, time) }),
  loseLife: () =>
    set((s) => ({
      lives: Math.max(0, s.lives - 1),
      phase: s.lives <= 1 ? "ended" : s.phase,
    })),
  clearHazard: () =>
    set((s) => ({
      hazardsCleared: s.hazardsCleared + 1,
      score: s.score + 10,
    })),
  missHazard: () =>
    set((s) => ({
      hazardsMissed: s.hazardsMissed + 1,
      heatLevel: Math.min(100, s.heatLevel + 10),
    })),
  setHeatLevel: (level) => set({ heatLevel: Math.max(0, Math.min(100, level)) }),
  setSharpness: (value) => set({ sharpness: Math.max(0, Math.min(100, value)) }),
  addTimeInZone: (seconds) =>
    set((s) => ({ timeInZone: s.timeInZone + seconds })),
  setTotalTime: (seconds) => set({ totalTime: seconds }),
  resetGame: () => set(INITIAL_STATE),
}));
