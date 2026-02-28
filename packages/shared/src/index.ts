// Types
export type { Store, StoreMode, StoreSettings, AppVariant, ComplianceFramework, UAEEmirate, AUState } from "./types/store.types.ts";

// Mode config (feature gating)
export {
  MODE_MODULES,
  MODE_FEATURES,
  VARIANT_BASE_FEATURES,
  EATSAFE_RELEASE_MODULES,
  INDIA_RELEASE_MODULES,
  UAE_RELEASE_MODULES,
  VARIANT_RELEASE_MODULES,
  COMPLIANCE_VARIANTS,
  VARIANT_COMPLIANCE,
  modeSupportsTeam,
  isAppAvailable,
  isFeatureAvailable,
  isVariantFeature,
  isHomeCookMode,
  isGCCVariant,
  isComplianceVariant,
} from "./lib/modeConfig.ts";

// GCC / UAE config
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
} from "./lib/gccConfig.ts";
export type {
  EmirateConfig,
  TempThreshold,
  ComplianceCheckCategory,
  ComplianceCheck,
  FineSchedule,
  DMGrade,
  ADFSAStar,
} from "./lib/gccConfig.ts";

// Home cook labels
export {
  HOME_COOK_ROLE_LABELS,
  HOME_COOK_NAV_LABELS,
  HOME_COOK_PAGE_SUBTITLES,
  homeCookRoleLabel,
  homeCookNavLabel,
} from "./lib/homeCookLabels.ts";

// Unit conversion
export {
  convertUnit,
  calculateIngredientCost,
  getUnitType,
  areUnitsCompatible,
} from "./lib/unitConversion.ts";
export type { Unit } from "./lib/unitConversion.ts";

// Ingredient matching
export {
  normalizeIngredientName,
  calculateSimilarity,
  findSimilarIngredients,
  inferCategory,
  inferUnit,
} from "./lib/ingredientMatcher.ts";
export type { IngredientMatch } from "./lib/ingredientMatcher.ts";

// Variant registry (single source of truth)
export {
  REGIONS,
  STREAMS,
  VARIANT_REGISTRY,
  getVariant,
  getRegion,
  getStream,
  isCompliance,
  isHomeCook,
  isVendor,
  getBaseFeatures,
  getReleaseModules,
  getCompliance,
} from "./lib/variantRegistry.ts";
export type {
  RegionConfig,
  AppStream,
  StreamConfig,
  VariantBrand,
  VariantEntry,
} from "./lib/variantRegistry.ts";

// Compliance framework config (inheritance system — BCC is base, all others derive)
export {
  BCC_CONFIG,
  deriveFramework,
  getAllAssessmentItems,
} from "./lib/complianceConfig.ts";
export type {
  ComplianceFrameworkConfig,
  AssessmentItem,
  AssessmentSection,
  ScoringConfig,
  ScoringTier,
  ScoringModel,
  Severity,
  SectionDefinition,
  ProfileFieldConfig,
  WizardStep,
  TableMapping,
  RegulatoryLabels,
  SupplierConfig,
  FeatureFlags,
} from "./lib/complianceConfig.ts";
export {
  getFrameworkConfig,
  getVariantFrameworkConfig,
  FSSAI_CONFIG,
  DM_CONFIG,
  ADAFSA_CONFIG,
  SM_SHARJAH_CONFIG,
  FSA_CONFIG,
  SFA_CONFIG,
  FDA_CONFIG,
  NSW_FA_CONFIG,
  VIC_DH_CONFIG,
  SA_HEALTH_CONFIG,
  WA_DOH_CONFIG,
  TAS_DOH_CONFIG,
  ACT_HEALTH_CONFIG,
  NT_DOH_CONFIG,
} from "./lib/complianceConfigs/index.ts";

// Australian state config
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
} from "./lib/auStateConfig.ts";
export type {
  AUStateConfig,
  TempThreshold as AUTempThreshold,
  ComplianceCheckCategory as AUComplianceCheckCategory,
  ComplianceCheck as AUComplianceCheck,
  AUStarGrade,
} from "./lib/auStateConfig.ts";

// Australian postcode data (shared between web heatmap + mobile vendor map)
export { AU_POSTCODES, DEMAND_CATEGORIES, CATEGORY_COLORS } from "./lib/auPostcodes.ts";
export type { PostcodeGeo } from "./lib/auPostcodes.ts";

// Currency formatting
export {
  formatCurrency,
  currencySymbol,
  regionCurrencySymbol,
  regionCurrencyCode,
} from "./lib/currencyFormat.ts";

// Supabase types
export type { Database } from "./supabase/types.ts";
