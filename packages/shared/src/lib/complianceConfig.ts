import type { ComplianceFramework } from "../types/store.types.ts";

// ── Types ────────────────────────────────────────────────────────────

export type Severity = "critical" | "major" | "minor";
export type ScoringModel = "star_rating" | "percentage" | "letter_grade";

export interface AssessmentItem {
  code: string;
  category: string;
  text: string;
  detail?: string;
  severities: Severity[];
  hasEvidence?: boolean;
}

export interface AssessmentSection {
  key: string;
  label: string;
  items: AssessmentItem[];
}

export interface ScoringTier {
  min: number;
  label: string;
  color: string;
}

export interface ScoringConfig {
  model: ScoringModel;
  /** For star_rating: BCC-style function from answers to star count */
  computeStarRating?: (answers: Record<string, { status: string; severity?: string }>) => number;
  /** Score tiers for display */
  tiers: ScoringTier[];
}

export interface SectionDefinition {
  key: string;
  label: string;
  defaultOn: boolean;
  homeCookDefault?: boolean;
}

export interface ProfileFieldConfig {
  key: string;
  label: string;
  type: "text" | "date" | "boolean" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
}

export interface WizardStep {
  key: string;
  title: string;
  subtitle: string;
  fields: ProfileFieldConfig[];
}

export interface TableMapping {
  complianceProfiles: string;
  sectionToggles: string;
  auditSelfAssessments: string;
  supplierRegister: string;
  cleaningSchedules: string;
  cleaningCompletions: string;
  pestControlLogs: string;
  equipmentCalibrationLogs: string;
  correctiveActions: string;
  dailyComplianceLogs: string;
  foodSafetySupervisors: string;
  foodHandlerTraining: string;
}

export interface RegulatoryLabels {
  frameworkName: string;
  frameworkShort: string;
  licenceLabel: string;
  licenceFieldKey: string;
  supervisorRole: string;
  certBody: string;
  assessmentTitle: string;
  assessmentSubtitle: string;
  accentColor: string;
}

export interface SupplierConfig {
  businessIdLabel: string;
  businessIdPlaceholder: string;
}

export interface FeatureFlags {
  hasSupervisors: boolean;
  hasTrainingRegister: boolean;
  hasSeverityLevels: boolean;
  hasEvidenceChecks: boolean;
  hasStarRating: boolean;
  hasGradingSystem: boolean;
  hasHalalTracking: boolean;
}

export interface ComplianceFrameworkConfig {
  id: ComplianceFramework;
  regionId: string;
  locale: string;
  labels: RegulatoryLabels;
  assessmentSections: AssessmentSection[];
  scoring: ScoringConfig;
  sections: SectionDefinition[];
  wizardSteps: WizardStep[];
  tables: TableMapping;
  features: FeatureFlags;
  supplier: SupplierConfig;
  availableTabs: string[];
  /** Framework value to filter audit_self_assessments by (undefined = no filter) */
  assessmentFrameworkFilter?: string;
}

// ── Deep merge utility ───────────────────────────────────────────────

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? U[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

function deepMerge<T extends Record<string, any>>(base: T, overrides: DeepPartial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const val = overrides[key];
    if (val === undefined) continue;
    if (
      val !== null &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key] as any, val as any);
    } else {
      result[key] = val as T[keyof T];
    }
  }
  return result;
}

// ── BCC Assessment Items (A1-A40) ────────────────────────────────────

const BCC_ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    key: "general_requirements",
    label: "General Requirements",
    items: [
      { code: "A1", category: "General Requirements", text: "Licence \u2013 Is your Council food business licence current?", detail: "i.e. no outstanding fees", severities: ["minor"] },
      { code: "A2", category: "General Requirements", text: "Licence \u2013 Is the current licence displayed prominently on the premises?", severities: ["minor", "major"] },
      { code: "A3", category: "General Requirements", text: "Licence Conditions \u2013 Is your business complying with all site specific licence conditions (if applicable)?", severities: ["minor"] },
      { code: "A4", category: "General Requirements", text: "Previous non-compliances \u2013 Has your business fixed all previous non-compliance items?", severities: ["minor", "major"] },
      { code: "A5", category: "General Requirements", text: "Design \u2013 Does your business comply with the structural requirements of the Food Safety Standards?", severities: ["minor"] },
      { code: "A6", category: "General Requirements", text: "Food Safety Supervisor \u2013 Have you notified Council who your Food Safety Supervisor is/are?", severities: ["major"] },
      { code: "A7", category: "General Requirements", text: "Food Safety Supervisor \u2013 Is the Food Safety Supervisor reasonably available/contactable?", severities: ["minor", "major"] },
      { code: "A8", category: "General Requirements", text: "Food Safety Supervisor \u2013 Does the FSS have an RTO issued certificate that is no more than 5 years old?", severities: ["minor", "major"] },
      { code: "A9", category: "General Requirements", text: "Food Safety Program \u2013 If required, does your food business have an accredited Food Safety Program?", detail: "Category 1 and 2 businesses only", severities: ["major"] },
      { code: "A10", category: "General Requirements", text: "Skills and knowledge \u2013 Do you and your employees have appropriate skills and knowledge in food safety and hygiene matters?", severities: ["minor", "critical"] },
    ],
  },
  {
    key: "food_handling_controls",
    label: "Food Handling Controls",
    items: [
      { code: "A11", category: "Food Handling Controls", text: "Receival \u2013 Is food protected from contamination at receival and are potentially hazardous foods accepted at the correct temperature?", severities: ["minor", "critical"], hasEvidence: true },
      { code: "A12", category: "Food Handling Controls", text: "Food storage \u2013 Is all food stored appropriately so that it is protected from contamination?", detail: "cold room / fridge \u2022 freezer \u2022 dry store", severities: ["minor", "major"] },
      { code: "A13", category: "Food Handling Controls", text: "Food storage \u2013 Is potentially hazardous food stored under temperature control?", detail: "cold food = 5\u00B0C and below \u2022 hot food = 60\u00B0C and above \u2022 frozen food = remain frozen", severities: ["minor", "major"], hasEvidence: true },
      { code: "A14", category: "Food Handling Controls", text: "Food processing \u2013 Are suitable measures in place to prevent contamination?", detail: "e.g. cross contamination", severities: ["minor", "major"] },
      { code: "A15", category: "Food Handling Controls", text: "Food processing \u2013 Is potentially hazardous food that is ready to eat and held outside of temperature control monitored correctly?", detail: "e.g. 2 hour / 4 hour rule", severities: ["minor", "critical"], hasEvidence: true },
      { code: "A16", category: "Food Handling Controls", text: "Thawing \u2013 Are acceptable methods used to thaw food?", severities: ["minor", "major"], hasEvidence: true },
      { code: "A17", category: "Food Handling Controls", text: "Cooling \u2013 Are acceptable methods used to cool food?", severities: ["minor", "major"], hasEvidence: true },
      { code: "A18", category: "Food Handling Controls", text: "Reheating \u2013 Are appropriate reheating procedures followed?", severities: ["minor", "critical"], hasEvidence: true },
      { code: "A19", category: "Food Handling Controls", text: "Food display \u2013 Is food on display protected from contamination?", severities: ["minor", "major"] },
      { code: "A20", category: "Food Handling Controls", text: "Food display \u2013 Is potentially hazardous food displayed under correct temperature control?", severities: ["minor", "major"], hasEvidence: true },
      { code: "A21", category: "Food Handling Controls", text: "Food packaging \u2013 Is food packaged in a manner that protects it from contamination?", severities: ["minor"] },
      { code: "A22", category: "Food Handling Controls", text: "Food transportation \u2013 Is food transported in a manner that protects it from contamination and keeps it at the appropriate temperature?", severities: ["minor"], hasEvidence: true },
      { code: "A23", category: "Food Handling Controls", text: "Food for disposal \u2013 Do you use acceptable arrangements for throwing out food?", severities: ["minor"] },
      { code: "A24", category: "Food Handling Controls", text: "Food recall \u2013 If you are a wholesale supplier, manufacturer or importer of food, does your food business comply with the food recall requirements?", severities: ["minor"] },
      { code: "A25", category: "Food Handling Controls", text: "Alternative methods \u2013 Are your documented alternative compliance methods acceptable?", detail: "i.e. receipt, storage, cooling, reheating, display, transport", severities: ["minor"] },
    ],
  },
  {
    key: "health_hygiene",
    label: "Health and Hygiene Requirements",
    items: [
      { code: "A26", category: "Health and Hygiene Requirements", text: "Contact with food \u2013 Does your business minimise the risk of contamination of food and food contact surfaces?", severities: ["minor", "critical"] },
      { code: "A27", category: "Health and Hygiene Requirements", text: "Health of food handlers \u2013 Do you ensure staff members do not engage in food handling if they are suffering from a food-borne illness or are sick?", severities: ["minor", "major"] },
      { code: "A28", category: "Health and Hygiene Requirements", text: "Hygiene \u2013 Do food handlers exercise good hygiene practices?", detail: "e.g. cleanliness of clothing, not eating over surfaces, washing hands correctly and at appropriate times, jewellery", severities: ["minor", "critical"] },
      { code: "A29", category: "Health and Hygiene Requirements", text: "Hand washing facilities \u2013 Does your business have adequate hand washing facilities?", detail: "soap \u2022 warm running water \u2022 single use towel \u2022 easily accessible basin", severities: ["minor", "critical"] },
      { code: "A30", category: "Health and Hygiene Requirements", text: "Duty of food business \u2013 Do you inform food handlers of their obligations and take measures to ensure they do not contaminate food?", severities: ["minor", "critical"] },
    ],
  },
  {
    key: "cleaning_maintenance",
    label: "Cleaning, Sanitising and Maintenance",
    items: [
      { code: "A31", category: "Cleaning, Sanitising and Maintenance", text: "Cleanliness \u2013 Are the floors, walls and ceilings maintained in a clean condition?", severities: ["minor", "critical"] },
      { code: "A32", category: "Cleaning, Sanitising and Maintenance", text: "Cleanliness \u2013 Are the fixtures, fittings and equipment maintained in a clean condition?", detail: "mechanical exhaust ventilation \u2022 fridges, coolrooms, freezers \u2022 benches, shelves, cooking equipment", severities: ["minor", "major", "critical"], hasEvidence: true },
      { code: "A33", category: "Cleaning, Sanitising and Maintenance", text: "Sanitation \u2013 Has your business provided clean and sanitary equipment including eating/drinking utensils and food contact surfaces? Are food contact surfaces sanitised correctly?", severities: ["minor", "major"], hasEvidence: true },
      { code: "A34", category: "Cleaning, Sanitising and Maintenance", text: "Maintenance \u2013 Does your business ensure no damaged (cracked/broken) utensils, crockery, cutting boards are used?", severities: ["minor", "critical"] },
      { code: "A35", category: "Cleaning, Sanitising and Maintenance", text: "Maintenance \u2013 Are your premises\u2019 fixtures, fittings and equipment maintained in a good state of repair and working order?", detail: "floors, walls & ceilings \u2022 fixtures, fittings & equipment \u2022 mechanical exhaust ventilation", severities: ["minor", "critical"] },
    ],
  },
  {
    key: "miscellaneous",
    label: "Miscellaneous",
    items: [
      { code: "A36", category: "Miscellaneous", text: "Thermometer \u2013 Does your food business (if handling potentially hazardous food) have a thermometer?", severities: ["minor", "critical"] },
      { code: "A37", category: "Miscellaneous", text: "Single Use Items \u2013 Are single use items protected from contamination until use and not used more than once?", severities: ["minor"] },
      { code: "A38", category: "Miscellaneous", text: "Toilet \u2013 Are adequate staff toilets provided and in a clean state?", severities: ["minor", "critical"] },
      { code: "A39", category: "Miscellaneous", text: "Animals and pests \u2013 Is your food business completely free from animals or vermin (assistance animals exempt)?", severities: ["minor", "major"] },
      { code: "A40", category: "Miscellaneous", text: "Animals and pests \u2013 Are animals and pests prevented from being on the premises?", severities: ["minor", "critical"] },
    ],
  },
];

// ── BCC Star Rating Formula ──────────────────────────────────────────

function bccStarRating(answers: Record<string, { status: string; severity?: string }>): number {
  const values = Object.values(answers);
  const criticals = values.filter((a) => a.status === "non_compliant" && a.severity === "critical").length;
  const majors = values.filter((a) => a.status === "non_compliant" && a.severity === "major").length;
  const minors = values.filter((a) => a.status === "non_compliant" && a.severity === "minor").length;

  if (majors >= 3 || criticals >= 2) return 0;
  if (criticals >= 1 || majors >= 1 || minors >= 6) return 2;
  if (minors >= 4) return 3;
  if (minors >= 1) return 4;
  return 5;
}

// ── BCC Sections ─────────────────────────────────────────────────────

const BCC_SECTIONS: SectionDefinition[] = [
  { key: "fridge_temps", label: "Fridge Temps", defaultOn: true },
  { key: "freezer_temps", label: "Freezer Temps", defaultOn: true },
  { key: "staff_health", label: "Staff Health Checks", defaultOn: true },
  { key: "handwash_stations", label: "Handwash Station Checks", defaultOn: true },
  { key: "sanitiser_check", label: "Sanitiser Checks", defaultOn: true },
  { key: "kitchen_clean", label: "Kitchen Cleanliness", defaultOn: true },
  { key: "pest_check", label: "Pest Checks", defaultOn: true },
  { key: "receiving_logs", label: "Receiving Logs", defaultOn: true },
  { key: "cooking_logs", label: "Cooking Logs", defaultOn: true },
  { key: "cooling_logs", label: "Cooling Logs", defaultOn: true },
  { key: "reheating_logs", label: "Reheating Logs", defaultOn: true },
  { key: "display_monitoring", label: "Display Monitoring", defaultOn: false, homeCookDefault: false },
  { key: "transport_logs", label: "Transport Logs", defaultOn: false, homeCookDefault: false },
  { key: "cleaning_schedules", label: "Cleaning Schedules", defaultOn: true },
  { key: "equipment_calibration", label: "Equipment & Calibration", defaultOn: true, homeCookDefault: false },
  { key: "supplier_register", label: "Supplier Register", defaultOn: true, homeCookDefault: false },
  { key: "self_assessment", label: "Self-Assessment (A1\u2013A40)", defaultOn: true },
  { key: "grease_trap", label: "Grease Trap", defaultOn: true, homeCookDefault: false },
  { key: "hood_cleaning", label: "Hood Cleaning", defaultOn: true, homeCookDefault: false },
  { key: "chemical_safety", label: "Chemical Safety", defaultOn: true },
  { key: "haccp", label: "HACCP Plan", defaultOn: true, homeCookDefault: false },
  { key: "audit_docs", label: "Audit & Documents", defaultOn: true, homeCookDefault: false },
  { key: "eq_training", label: "Equipment Training", defaultOn: true, homeCookDefault: false },
];

// ── BCC Wizard Steps ─────────────────────────────────────────────────

const BCC_WIZARD_STEPS: WizardStep[] = [
  {
    key: "licence",
    title: "Licence Details",
    subtitle: "Enter your BCC food business licence information",
    fields: [
      { key: "bcc_licence_number", label: "BCC Licence Number", type: "text", required: true, placeholder: "e.g. FBL-12345" },
      { key: "licence_expiry", label: "Licence Expiry Date", type: "date" },
      { key: "licence_displayed", label: "Licence Displayed on Premises", type: "boolean" },
    ],
  },
  {
    key: "category",
    title: "Business Category",
    subtitle: "Select your category under FSANZ Standard 3.2.2A",
    fields: [
      {
        key: "business_category",
        label: "Business Category",
        type: "select",
        options: [
          { label: "Category 1 \u2013 Higher risk (e.g. restaurants, caterers)", value: "category_1" },
          { label: "Category 2 \u2013 Lower risk (e.g. retail, packaged food)", value: "category_2" },
        ],
      },
    ],
  },
  {
    key: "fss",
    title: "Food Safety Supervisor",
    subtitle: "Enter your primary FSS details and certificate info",
    fields: [
      { key: "name", label: "Supervisor Name", type: "text", required: true },
      { key: "certificate_number", label: "Certificate Number", type: "text" },
      { key: "certificate_date", label: "Certificate Date", type: "date" },
      { key: "notified_council", label: "Council Notified", type: "boolean" },
    ],
  },
  {
    key: "program",
    title: "Food Safety Program",
    subtitle: "Is your food safety program accredited?",
    fields: [
      { key: "food_safety_program_accredited", label: "Program Accredited", type: "boolean" },
      { key: "food_safety_program_auditor", label: "Auditor Name", type: "text", placeholder: "e.g. AUS-QUAL, SAI Global" },
    ],
  },
  {
    key: "sections",
    title: "Compliance Sections",
    subtitle: "Choose which compliance sections to enable",
    fields: [],
  },
];

// ── Shared Table Mapping (all frameworks use same physical tables) ────

const SHARED_TABLES: TableMapping = {
  complianceProfiles: "compliance_profiles",
  sectionToggles: "bcc_section_toggles",
  auditSelfAssessments: "audit_self_assessments",
  supplierRegister: "bcc_supplier_register",
  cleaningSchedules: "bcc_cleaning_schedules",
  cleaningCompletions: "bcc_cleaning_completions",
  pestControlLogs: "bcc_pest_control_logs",
  equipmentCalibrationLogs: "bcc_equipment_calibration_logs",
  correctiveActions: "corrective_actions",
  dailyComplianceLogs: "daily_compliance_logs",
  foodSafetySupervisors: "food_safety_supervisors",
  foodHandlerTraining: "food_handler_training",
};

// ── BCC Full Available Tabs ──────────────────────────────────────────

const BCC_TABS = [
  "temp_grid", "burst", "overview", "actions", "a1a40", "equipment",
  "pest", "grease", "hood", "chemical", "haccp", "receiving",
  "training", "eq_training", "cleaning_bcc", "suppliers_bcc", "audit", "sections",
  "staff_health", "cooking_log", "cooling_log", "reheating_log",
  "display_monitoring", "transport_log", "handwash_check", "sanitiser_check", "kitchen_clean",
  "temp_setup", "receiving_setup",
];

// ══════════════════════════════════════════════════════════════════════
// BCC_CONFIG — the base. All other frameworks inherit from this.
// ══════════════════════════════════════════════════════════════════════

export const BCC_CONFIG: ComplianceFrameworkConfig = {
  id: "bcc",
  regionId: "au",
  locale: "en-AU",
  labels: {
    frameworkName: "BCC Eat Safe Compliance",
    frameworkShort: "BCC",
    licenceLabel: "BCC Licence Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Safety Supervisor",
    certBody: "Brisbane City Council",
    assessmentTitle: "Self-Assessment (A1\u2013A40)",
    assessmentSubtitle: "Eat Safe Brisbane Food Safety Checklist",
    accentColor: "#000080",
  },
  assessmentSections: BCC_ASSESSMENT_SECTIONS,
  scoring: {
    model: "star_rating",
    computeStarRating: bccStarRating,
    tiers: [
      { min: 5, label: "Excellent Performer", color: "#10B981" },
      { min: 4, label: "Very Good Performer", color: "#22C55E" },
      { min: 3, label: "Good Performer", color: "#F59E0B" },
      { min: 2, label: "Poor Performer", color: "#EF4444" },
      { min: 0, label: "Non-Compliant Performer", color: "#DC2626" },
    ],
  },
  sections: BCC_SECTIONS,
  wizardSteps: BCC_WIZARD_STEPS,
  tables: SHARED_TABLES,
  features: {
    hasSupervisors: true,
    hasTrainingRegister: true,
    hasSeverityLevels: true,
    hasEvidenceChecks: true,
    hasStarRating: true,
    hasGradingSystem: false,
    hasHalalTracking: false,
  },
  supplier: {
    businessIdLabel: "ABN",
    businessIdPlaceholder: "Australian Business Number",
  },
  availableTabs: BCC_TABS,
};

// ── Inheritance helper ───────────────────────────────────────────────

export type DeepPartialConfig = DeepPartial<ComplianceFrameworkConfig> & { id: ComplianceFramework };

/**
 * Create a derived framework config by deep-merging overrides onto the BCC base.
 * Any field not specified in the override inherits from BCC.
 */
export function deriveFramework(overrides: DeepPartialConfig): ComplianceFrameworkConfig {
  return deepMerge(BCC_CONFIG, overrides as DeepPartial<ComplianceFrameworkConfig>);
}

/** Flatten all assessment items from sections */
export function getAllAssessmentItems(config: ComplianceFrameworkConfig): AssessmentItem[] {
  return config.assessmentSections.flatMap((s) => s.items);
}
