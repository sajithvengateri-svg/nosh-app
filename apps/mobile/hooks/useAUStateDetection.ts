import { useMemo } from "react";
import Constants from "expo-constants";
import { useOrg } from "../contexts/OrgProvider";
import {
  detectAUState,
  getStateCompliance,
  AU_STATE_CONFIGS,
  isAUEatSafeVariant,
} from "@queitos/shared";
import type { AUState, ComplianceFramework, AUStateConfig } from "@queitos/shared";

interface AUStateDetectionResult {
  /** Detected Australian state based on venue postcode */
  state: AUState;
  /** Compliance framework for this state */
  complianceFramework: ComplianceFramework;
  /** Full config for the detected state */
  config: AUStateConfig;
  /** Whether this app is an AU EatSafe variant */
  isAU: boolean;
}

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as string;

/**
 * Detects which Australian state the current venue belongs to
 * by reading the venue's postcode.
 *
 * Falls back to QLD (BCC) if no match.
 */
export function useAUStateDetection(): AUStateDetectionResult {
  const { currentOrg } = useOrg();

  return useMemo(() => {
    const isAU = isAUEatSafeVariant(APP_VARIANT);

    if (!isAU) {
      return {
        state: "qld" as AUState,
        complianceFramework: "bcc" as ComplianceFramework,
        config: AU_STATE_CONFIGS.qld,
        isAU: false,
      };
    }

    // Read venue postcode from org's venues
    const venues = (currentOrg as any)?.org_venues ?? [];
    const activeVenue = venues[0];
    const postcodeInput = activeVenue?.postcode ?? "";

    const state = detectAUState(postcodeInput);
    const complianceFramework = getStateCompliance(state);

    return {
      state,
      complianceFramework,
      config: AU_STATE_CONFIGS[state],
      isAU: true,
    };
  }, [currentOrg]);
}
