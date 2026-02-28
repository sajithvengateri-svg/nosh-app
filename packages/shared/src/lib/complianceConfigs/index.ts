import type { ComplianceFramework, AppVariant } from "../../types/store.types.ts";
import type { ComplianceFrameworkConfig } from "../complianceConfig.ts";
import { BCC_CONFIG } from "../complianceConfig.ts";
import { getCompliance } from "../variantRegistry.ts";
import { FSSAI_CONFIG } from "./fssai.ts";
import { DM_CONFIG, ADAFSA_CONFIG, SM_SHARJAH_CONFIG } from "./dm.ts";
import { FSA_CONFIG } from "./fsa.ts";
import { SFA_CONFIG } from "./sfa.ts";
import { FDA_CONFIG } from "./fda.ts";
import { NSW_FA_CONFIG } from "./nsw.ts";
import { VIC_DH_CONFIG } from "./vic.ts";
import { SA_HEALTH_CONFIG } from "./sa.ts";
import { WA_DOH_CONFIG } from "./wa.ts";
import { TAS_DOH_CONFIG } from "./tas.ts";
import { ACT_HEALTH_CONFIG } from "./act.ts";
import { NT_DOH_CONFIG } from "./nt.ts";

// ── Framework Config Registry ────────────────────────────────────────

const FRAMEWORK_CONFIGS: Record<ComplianceFramework, ComplianceFrameworkConfig> = {
  bcc: BCC_CONFIG,
  fssai: FSSAI_CONFIG,
  dm: DM_CONFIG,
  adafsa: ADAFSA_CONFIG,
  sm_sharjah: SM_SHARJAH_CONFIG,
  fsa: FSA_CONFIG,
  sfa: SFA_CONFIG,
  fda: FDA_CONFIG,
  // Australian states
  nsw_fa: NSW_FA_CONFIG,
  vic_dh: VIC_DH_CONFIG,
  sa_health: SA_HEALTH_CONFIG,
  wa_doh: WA_DOH_CONFIG,
  tas_doh: TAS_DOH_CONFIG,
  act_health: ACT_HEALTH_CONFIG,
  nt_doh: NT_DOH_CONFIG,
  none: BCC_CONFIG, // fallback
};

/**
 * Get the compliance framework config for a given framework ID.
 * Returns BCC_CONFIG as fallback for unknown frameworks.
 */
export function getFrameworkConfig(framework: ComplianceFramework): ComplianceFrameworkConfig {
  return FRAMEWORK_CONFIGS[framework] ?? BCC_CONFIG;
}

/**
 * Get the compliance framework config for a given app variant.
 * Convenience function: variant → region → compliance framework → config.
 */
export function getVariantFrameworkConfig(variant: AppVariant): ComplianceFrameworkConfig {
  const framework = getCompliance(variant);
  return getFrameworkConfig(framework);
}

// Re-export individual configs for direct access
export { BCC_CONFIG } from "../complianceConfig.ts";
export { FSSAI_CONFIG } from "./fssai.ts";
export { DM_CONFIG, ADAFSA_CONFIG, SM_SHARJAH_CONFIG } from "./dm.ts";
export { FSA_CONFIG } from "./fsa.ts";
export { SFA_CONFIG } from "./sfa.ts";
export { FDA_CONFIG } from "./fda.ts";
export { NSW_FA_CONFIG } from "./nsw.ts";
export { VIC_DH_CONFIG } from "./vic.ts";
export { SA_HEALTH_CONFIG } from "./sa.ts";
export { WA_DOH_CONFIG } from "./wa.ts";
export { TAS_DOH_CONFIG } from "./tas.ts";
export { ACT_HEALTH_CONFIG } from "./act.ts";
export { NT_DOH_CONFIG } from "./nt.ts";
