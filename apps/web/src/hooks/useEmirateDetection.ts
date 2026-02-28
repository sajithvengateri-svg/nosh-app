import { useMemo } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { detectEmirate, getEmirateCompliance, EMIRATE_CONFIGS } from "@/lib/shared/gccConfig";
import type { UAEEmirate, ComplianceFramework, EmirateConfig } from "@/lib/shared/gccConfig";

interface EmirateDetectionResult {
  /** Detected emirate based on venue postcode/address */
  emirate: UAEEmirate;
  /** Compliance framework for this emirate */
  complianceFramework: ComplianceFramework;
  /** Full config for the detected emirate */
  config: EmirateConfig;
  /** Whether this org is using the GCC variant */
  isGCC: boolean;
}

/**
 * Detects which UAE emirate the current venue belongs to
 * by reading the venue's postcode and/or address.
 *
 * Uses the first active venue's postcode + address for detection.
 * Falls back to Dubai if no match.
 */
export function useEmirateDetection(): EmirateDetectionResult {
  const { currentOrg, venues } = useOrg();

  return useMemo(() => {
    const isGCC = (currentOrg as any)?.app_variant === "gcc_uae";

    if (!isGCC) {
      // Return Dubai defaults but mark as non-GCC
      return {
        emirate: "dubai" as UAEEmirate,
        complianceFramework: "dm" as ComplianceFramework,
        config: EMIRATE_CONFIGS.dubai,
        isGCC: false,
      };
    }

    // Try to detect from venue postcode or address
    const activeVenue = venues[0]; // Primary venue
    const postcodeInput = [
      activeVenue?.postcode,
      activeVenue?.address,
    ].filter(Boolean).join(" ");

    const emirate = detectEmirate(postcodeInput);
    const complianceFramework = getEmirateCompliance(emirate);

    return {
      emirate,
      complianceFramework,
      config: EMIRATE_CONFIGS[emirate],
      isGCC: true,
    };
  }, [currentOrg, venues]);
}
