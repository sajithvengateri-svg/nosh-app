import { useMemo } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { detectAUState, getStateCompliance, AU_STATE_CONFIGS, isAUEatSafeVariant } from "@/lib/shared/auStateConfig";
import type { AUState, ComplianceFramework, AUStateConfig } from "@/lib/shared/auStateConfig";

interface AUStateDetectionResult {
  /** Detected Australian state based on venue postcode */
  state: AUState;
  /** Compliance framework for this state */
  complianceFramework: ComplianceFramework;
  /** Full config for the detected state */
  config: AUStateConfig;
  /** Whether this org is using an AU EatSafe variant */
  isAU: boolean;
}

/**
 * Detects which Australian state the current venue belongs to
 * by reading the venue's postcode.
 *
 * Uses the first venue's postcode for detection.
 * Falls back to QLD (BCC) if no match.
 */
export function useAUStateDetection(): AUStateDetectionResult {
  const { currentOrg, venues } = useOrg();

  return useMemo(() => {
    const variant = (currentOrg as any)?.app_variant ?? "";
    const isAU = isAUEatSafeVariant(variant);

    if (!isAU) {
      return {
        state: "qld" as AUState,
        complianceFramework: "bcc" as ComplianceFramework,
        config: AU_STATE_CONFIGS.qld,
        isAU: false,
      };
    }

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
  }, [currentOrg, venues]);
}
