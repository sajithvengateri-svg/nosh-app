import { create } from "zustand";

export type GamePhase = "idle" | "countdown" | "playing" | "paused" | "ended";

interface GameState {
  phase: GamePhase;
  score: number;
  timeRemaining: number;
  // Edge
  sharpness: number;
  currentAngle: number;
  timeInZone: number;
  totalTime: number;
  // Actions
  setPhase: (p: GamePhase) => void;
  setScore: (s: number) => void;
  setTimeRemaining: (t: number) => void;
  setSharpness: (s: number) => void;
  setCurrentAngle: (a: number) => void;
  setTimeInZone: (t: number) => void;
  setTotalTime: (t: number) => void;
  resetGame: () => void;
}

const INITIAL: Omit<GameState, "setPhase" | "setScore" | "setTimeRemaining" | "setSharpness" | "setCurrentAngle" | "setTimeInZone" | "setTotalTime" | "resetGame"> = {
  phase: "idle",
  score: 0,
  timeRemaining: 60,
  sharpness: 0,
  currentAngle: 22.5,
  timeInZone: 0,
  totalTime: 0,
};

export const useGameStore = create<GameState>((set) => ({
  ...INITIAL,
  setPhase: (phase) => set({ phase }),
  setScore: (score) => set({ score }),
  setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
  setSharpness: (sharpness) => set({ sharpness }),
  setCurrentAngle: (currentAngle) => set({ currentAngle }),
  setTimeInZone: (timeInZone) => set({ timeInZone }),
  setTotalTime: (totalTime) => set({ totalTime }),
  resetGame: () => set(INITIAL),
}));
