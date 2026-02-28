import { create } from "zustand";
import { persist } from "zustand/middleware";

type CalculationMode = "reverse" | "forward" | "target";

interface CalcState {
  mode: CalculationMode;
  sellPrice: number;
  targetPercent: number;
  actualCost: number;
  servings: number;
  includeGST: boolean;
  gstRate: number;
  setMode: (mode: CalculationMode) => void;
  setSellPrice: (v: number) => void;
  setTargetPercent: (v: number) => void;
  setActualCost: (v: number) => void;
  setServings: (v: number) => void;
  setIncludeGST: (v: boolean) => void;
  setGstRate: (v: number) => void;
  reset: () => void;
}

export const useCalcStore = create<CalcState>()(
  persist(
    (set) => ({
      mode: "reverse",
      sellPrice: 0,
      targetPercent: 30,
      actualCost: 0,
      servings: 1,
      includeGST: true,
      gstRate: 10,
      setMode: (mode) => set({ mode }),
      setSellPrice: (sellPrice) => set({ sellPrice }),
      setTargetPercent: (targetPercent) => set({ targetPercent }),
      setActualCost: (actualCost) => set({ actualCost }),
      setServings: (servings) => set({ servings }),
      setIncludeGST: (includeGST) => set({ includeGST }),
      setGstRate: (gstRate) => set({ gstRate }),
      reset: () => set({ mode: "reverse", sellPrice: 0, targetPercent: 30, actualCost: 0, servings: 1 }),
    }),
    { name: "chefos-calc-state" }
  )
);
