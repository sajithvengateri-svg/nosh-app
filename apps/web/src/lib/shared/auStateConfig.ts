/**
 * Australian state configuration — re-exports from packages/shared/src/lib/auStateConfig.ts
 * The web app uses @/lib/shared/ as its import path for shared modules.
 */
export {
  detectAUState,
  getStateCompliance,
  AU_STATE_CONFIGS,
  AU_TEMP_THRESHOLDS,
  auTempStatus,
  AU_COMPLIANCE_CATEGORIES,
  AU_STAR_GRADES,
  VIC_SCORES_ON_DOORS,
  getAUStarGrade,
  formatAUD,
  isAUEatSafeVariant,
} from "../../../../../packages/shared/src/lib/auStateConfig";

export type {
  AUStateConfig,
  TempThreshold,
  ComplianceCheckCategory,
  ComplianceCheck,
  AUStarGrade,
} from "../../../../../packages/shared/src/lib/auStateConfig";

export type {
  AUState,
  ComplianceFramework,
} from "../../../../../packages/shared/src/types/store.types";
