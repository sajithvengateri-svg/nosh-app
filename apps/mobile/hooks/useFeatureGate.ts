import { useEffect, useState, useMemo } from "react";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import {
  VARIANT_BASE_FEATURES,
  VARIANT_RELEASE_MODULES,
} from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

export function useFeatureGate() {
  const variant = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
  const { currentOrg } = useOrg();
  const [releasedModules, setReleasedModules] = useState<string[]>([]);

  // If org has been upgraded to pro/enterprise, all release modules are unlocked
  const isUpgraded = useMemo(() => {
    const tier = (currentOrg as any)?.subscription_tier;
    return tier === "pro" || tier === "enterprise";
  }, [(currentOrg as any)?.subscription_tier]);

  const aiAddonActive = useMemo(
    () => !!(currentOrg as any)?.ai_addon_active,
    [(currentOrg as any)?.ai_addon_active]
  );

  useEffect(() => {
    if (!currentOrg?.id) return;

    const fetchReleased = async () => {
      try {
        const { data } = await supabase
          .from("feature_releases")
          .select("feature_key")
          .eq("org_id", currentOrg.id)
          .eq("status", "released");

        setReleasedModules((data ?? []).map((r: any) => r.feature_key));
      } catch {
        // Non-critical — fall back to base features only
      }
    };

    fetchReleased();
  }, [currentOrg?.id]);

  function canAccess(featureSlug: string): boolean {
    // Upgraded orgs get full ChefOS access regardless of variant
    if (isUpgraded) return true;

    // AI features require the add-on
    if (featureSlug === "ai-companion" || featureSlug === "ai-assistant") {
      return aiAddonActive;
    }

    // 1. Check variant ceiling
    const base = VARIANT_BASE_FEATURES[variant];
    if (base !== null && !base.includes(featureSlug)) {
      // For EatSafe/HomeChef, check if this module has been released
      const releaseModules = VARIANT_RELEASE_MODULES[variant];
      if (releaseModules?.includes(featureSlug)) {
        return releasedModules.includes(featureSlug);
      }
      return false;
    }
    return true;
  }

  return { variant, canAccess, releasedModules, isUpgraded, aiAddonActive };
}
