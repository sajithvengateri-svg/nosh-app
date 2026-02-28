import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WorkflowCompletion {
  completedAt: string; // ISO date
  version: number;
}

interface WorkflowState {
  completions: Record<string, WorkflowCompletion>; // keyed by workflow_key
  markComplete: (key: string) => void;
  getCompletionDate: (key: string) => string | null;
  isCompleted: (key: string) => boolean;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      completions: {},
      markComplete: (key) =>
        set((state) => ({
          completions: {
            ...state.completions,
            [key]: { completedAt: new Date().toISOString(), version: 1 },
          },
        })),
      getCompletionDate: (key) => get().completions[key]?.completedAt ?? null,
      isCompleted: (key) => !!get().completions[key],
    }),
    {
      name: "nosh-workflows",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
