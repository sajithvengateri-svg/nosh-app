import { useSubscriptionStore } from "../lib/stores/subscriptionStore";

/**
 * Feature-gating hook for Nosh+ premium features.
 */
export function useNoshPlus() {
  const isNoshPlus = useSubscriptionStore((s) => s.isNoshPlus());

  return {
    isNoshPlus,
    canUseAutopilot: isNoshPlus,
    canViewSavings: isNoshPlus,
    canTrackLeftovers: isNoshPlus,
    canViewPremiumRecipes: isNoshPlus,
  };
}
