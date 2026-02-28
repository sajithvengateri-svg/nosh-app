import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import {
  VARIANT_BASE_FEATURES,
  VARIANT_RELEASE_MODULES,
} from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

/**
 * Web equivalent of the mobile useFeatureGate hook.
 * Gates features based on subscription tier, AI addon, and variant.
 */
export function useFeatureGate() {
  const { currentOrg, storeMode } = useOrg();

  // Map store_mode to the closest AppVariant
  const variant = useMemo<AppVariant>(() => {
    const mode = storeMode || "restaurant";
    if (mode === "home_cook") return "homechef";
    if (mode === "food_safety") return "eatsafe_au";
    return "chefos";
  }, [storeMode]);

  const isUpgraded = useMemo(() => {
    const tier = (currentOrg as any)?.subscription_tier;
    return tier === "pro" || tier === "enterprise";
  }, [(currentOrg as any)?.subscription_tier]);

  const aiAddonActive = useMemo(
    () => !!(currentOrg as any)?.ai_addon_active,
    [(currentOrg as any)?.ai_addon_active],
  );

  const [releasedModules, setReleasedModules] = useState<string[]>([]);

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
    // Upgraded orgs get full access regardless of variant
    if (isUpgraded) return true;

    // AI features require the add-on
    if (featureSlug.startsWith("ai-")) {
      return aiAddonActive;
    }

    // Check variant ceiling
    const base = VARIANT_BASE_FEATURES[variant];
    if (base !== null && !base.includes(featureSlug)) {
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
