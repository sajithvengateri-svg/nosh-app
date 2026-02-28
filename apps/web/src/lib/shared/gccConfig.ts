/**
 * GCC/UAE configuration — re-exports from packages/shared/src/lib/gccConfig.ts
 * The web app uses @/lib/shared/ as its import path for shared modules.
 */
export {
  detectEmirate,
  getEmirateCompliance,
  EMIRATE_CONFIGS,
  UAE_TEMP_THRESHOLDS,
  uaeTempStatus,
  UAE_COMPLIANCE_CATEGORIES,
  DUBAI_FINE_SCHEDULE,
  DM_GRADES,
  getDMGrade,
  ADAFSA_STARS,
  getADFSAStars,
  formatAED,
  formatAEDAr,
} from "../../../../../packages/shared/src/lib/gccConfig";

export type {
  EmirateConfig,
  TempThreshold,
  ComplianceCheckCategory,
  ComplianceCheck,
  FineSchedule,
  DMGrade,
  ADFSAStar,
} from "../../../../../packages/shared/src/lib/gccConfig";

export type {
  UAEEmirate,
  ComplianceFramework,
} from "../../../../../packages/shared/src/types/store.types";
