import type { ComplianceFramework, AUState } from "../types/store.types.ts";

// ── Australian Postcode → State Mapping ─────────────────────────────
//
// Australian postcodes are 4-digit numbers strictly mapped to states.
// ACT/NT share some ranges. The mapping below covers all standard
// Australia Post allocations.

const AU_POSTCODE_RANGES: Array<{ state: AUState; ranges: [number, number][] }> = [
  { state: "act", ranges: [[200, 299], [2600, 2618], [2900, 2920]] },
  { state: "nsw", ranges: [[1000, 1999], [2000, 2599], [2619, 2899], [2921, 2999]] },
  { state: "vic", ranges: [[3000, 3999], [8000, 8999]] },
  { state: "qld", ranges: [[4000, 4999], [9000, 9999]] },
  { state: "sa",  ranges: [[5000, 5799], [5800, 5999]] },
  { state: "wa",  ranges: [[6000, 6797], [6800, 6999]] },
  { state: "tas", ranges: [[7000, 7999]] },
  { state: "nt",  ranges: [[800, 899], [900, 999]] },
];

/**
 * Detect which Australian state a venue belongs to based on its postcode.
 * Extracts the first 3-4 digit number from the input string.
 * Falls back to QLD (existing BCC baseline) if no match.
 */
export function detectAUState(postcodeOrAddress: string): AUState {
  if (!postcodeOrAddress) return "qld";

  const match = postcodeOrAddress.match(/\b(\d{3,4})\b/);
  if (!match) return "qld";

  const code = parseInt(match[1], 10);

  for (const { state, ranges } of AU_POSTCODE_RANGES) {
    for (const [min, max] of ranges) {
      if (code >= min && code <= max) return state;
    }
  }

  return "qld";
}

// ── State → Compliance Framework ────────────────────────────────────

const STATE_COMPLIANCE: Record<AUState, ComplianceFramework> = {
  qld: "bcc",
  nsw: "nsw_fa",
  vic: "vic_dh",
  sa:  "sa_health",
  wa:  "wa_doh",
  tas: "tas_doh",
  act: "act_health",
  nt:  "nt_doh",
};

/** Maps an Australian state to its compliance framework */
export function getStateCompliance(state: AUState): ComplianceFramework {
  return STATE_COMPLIANCE[state];
}

// ── State Metadata ──────────────────────────────────────────────────

export interface AUStateConfig {
  state: AUState;
  name: string;
  abbreviation: string;
  regulatoryBody: string;
  foodAct: string;
  complianceFramework: ComplianceFramework;
  gradingSystem: "star" | "scores_on_doors" | "percentage" | "none";
  gradingScale: string;
  supervisorTitle: string;
  certValidityYears: number;
  requiresFoodSafetyProgram: boolean;
  councilExamples: string[];
  currency: "AUD";
  timezone: string;
}

export const AU_STATE_CONFIGS: Record<AUState, AUStateConfig> = {
  qld: {
    state: "qld",
    name: "Queensland",
    abbreviation: "QLD",
    regulatoryBody: "Queensland Health / Local Councils",
    foodAct: "Food Act 2006 (QLD)",
    complianceFramework: "bcc",
    gradingSystem: "star",
    gradingScale: "0–5 Stars (Eat Safe)",
    supervisorTitle: "Food Safety Supervisor",
    certValidityYears: 5,
    requiresFoodSafetyProgram: true,
    councilExamples: ["Brisbane City Council", "Gold Coast", "Cairns", "Sunshine Coast"],
    currency: "AUD",
    timezone: "Australia/Brisbane",
  },
  nsw: {
    state: "nsw",
    name: "New South Wales",
    abbreviation: "NSW",
    regulatoryBody: "NSW Food Authority",
    foodAct: "Food Act 2003 (NSW)",
    complianceFramework: "nsw_fa",
    gradingSystem: "star",
    gradingScale: "Scores on Doors (pilot councils)",
    supervisorTitle: "Food Safety Supervisor",
    certValidityYears: 5,
    requiresFoodSafetyProgram: true,
    councilExamples: ["City of Sydney", "Parramatta", "Northern Beaches", "Blue Mountains"],
    currency: "AUD",
    timezone: "Australia/Sydney",
  },
  vic: {
    state: "vic",
    name: "Victoria",
    abbreviation: "VIC",
    regulatoryBody: "Department of Health Victoria",
    foodAct: "Food Act 1984 (VIC)",
    complianceFramework: "vic_dh",
    gradingSystem: "scores_on_doors",
    gradingScale: "1–5 Stars (Scores on Doors)",
    supervisorTitle: "Food Safety Supervisor",
    certValidityYears: 5,
    requiresFoodSafetyProgram: true,
    councilExamples: ["City of Melbourne", "Yarra", "Stonnington", "Port Phillip"],
    currency: "AUD",
    timezone: "Australia/Melbourne",
  },
  sa: {
    state: "sa",
    name: "South Australia",
    abbreviation: "SA",
    regulatoryBody: "SA Health",
    foodAct: "Food Act 2001 (SA)",
    complianceFramework: "sa_health",
    gradingSystem: "star",
    gradingScale: "Star rating",
    supervisorTitle: "Food Safety Supervisor",
    certValidityYears: 5,
    requiresFoodSafetyProgram: true,
    councilExamples: ["City of Adelaide", "Marion", "Onkaparinga", "Charles Sturt"],
    currency: "AUD",
    timezone: "Australia/Adelaide",
  },
  wa: {
    state: "wa",
    name: "Western Australia",
    abbreviation: "WA",
    regulatoryBody: "Department of Health WA",
    foodAct: "Food Act 2008 (WA)",
    complianceFramework: "wa_doh",
    gradingSystem: "star",
    gradingScale: "Star rating",
    supervisorTitle: "Food Safety Supervisor",
    certValidityYears: 5,
    requiresFoodSafetyProgram: true,
    councilExamples: ["City of Perth", "Stirling", "Joondalup", "Fremantle"],
    currency: "AUD",
    timezone: "Australia/Perth",
  },
  tas: {
    state: "tas",
    name: "Tasmania",
    abbreviation: "TAS",
    regulatoryBody: "Department of Health Tasmania",
    foodAct: "Food Act 2003 (TAS)",
    complianceFramework: "tas_doh",
    gradingSystem: "none",
    gradingScale: "Pass / Fail inspection",
    supervisorTitle: "Food Safety Supervisor",
    certValidityYears: 5,
    requiresFoodSafetyProgram: true,
    councilExamples: ["City of Hobart", "Launceston", "Clarence", "Glenorchy"],
    currency: "AUD",
    timezone: "Australia/Hobart",
  },
  act: {
    state: "act",
    name: "Australian Capital Territory",
    abbreviation: "ACT",
    regulatoryBody: "ACT Health",
    foodAct: "Food Act 2001 (ACT)",
    complianceFramework: "act_health",
    gradingSystem: "star",
    gradingScale: "Star rating",
    supervisorTitle: "Food Safety Supervisor",
    certValidityYears: 5,
    requiresFoodSafetyProgram: true,
    councilExamples: ["Canberra"],
    currency: "AUD",
    timezone: "Australia/Sydney",
  },
  nt: {
    state: "nt",
    name: "Northern Territory",
    abbreviation: "NT",
    regulatoryBody: "NT Department of Health",
    foodAct: "Food Act 2004 (NT)",
    complianceFramework: "nt_doh",
    gradingSystem: "none",
    gradingScale: "Pass / Fail inspection",
    supervisorTitle: "Food Safety Supervisor",
    certValidityYears: 5,
    requiresFoodSafetyProgram: true,
    councilExamples: ["City of Darwin", "Alice Springs", "Palmerston"],
    currency: "AUD",
    timezone: "Australia/Darwin",
  },
};

// ── Australian Temperature Thresholds (FSANZ National Baseline) ─────

export interface TempThreshold {
  logType: string;
  label: string;
  passMin?: number;
  passMax?: number;
  warningMin?: number;
  warningMax?: number;
  unit: "°C";
}

export const AU_TEMP_THRESHOLDS: TempThreshold[] = [
  { logType: "fridge_temp",        label: "Fridge Temperature",           passMax: 5,   warningMax: 8,   unit: "°C" },
  { logType: "freezer_temp",       label: "Freezer Temperature",          passMax: -18, warningMax: -15, unit: "°C" },
  { logType: "hot_holding",        label: "Hot Holding",                  passMin: 60,  warningMin: 57,  unit: "°C" },
  { logType: "cooking_poultry",    label: "Cooking — Poultry / Mince",    passMin: 75,  warningMin: 72,  unit: "°C" },
  { logType: "cooking_whole",      label: "Cooking — Whole Cuts",         passMin: 63,  warningMin: 60,  unit: "°C" },
  { logType: "reheating",          label: "Reheating",                    passMin: 75,  warningMin: 72,  unit: "°C" },
  { logType: "receiving_chilled",  label: "Receiving — Chilled Goods",    passMax: 5,   warningMax: 8,   unit: "°C" },
  { logType: "receiving_frozen",   label: "Receiving — Frozen Goods",     passMax: -18, warningMax: -15, unit: "°C" },
  { logType: "display_hot",        label: "Display — Hot Food",           passMin: 60,  warningMin: 57,  unit: "°C" },
  { logType: "display_cold",       label: "Display — Cold Food",          passMax: 5,   warningMax: 8,   unit: "°C" },
  { logType: "transport_chilled",  label: "Transport — Chilled",          passMax: 5,   warningMax: 8,   unit: "°C" },
  { logType: "transport_frozen",   label: "Transport — Frozen",           passMax: -18, warningMax: -15, unit: "°C" },
  { logType: "oil_temp",           label: "Oil Temperature (Frying)",     passMax: 180, warningMax: 185, unit: "°C" },
];

/**
 * Auto-detect pass/warning/fail for an Australian temperature reading.
 */
export function auTempStatus(logType: string, temp: number): "pass" | "warning" | "fail" {
  const threshold = AU_TEMP_THRESHOLDS.find((t) => t.logType === logType);
  if (!threshold) return "pass";

  if (threshold.passMax !== undefined) {
    if (temp <= threshold.passMax) return "pass";
    if (threshold.warningMax !== undefined && temp <= threshold.warningMax) return "warning";
    return "fail";
  }

  if (threshold.passMin !== undefined) {
    if (temp >= threshold.passMin) return "pass";
    if (threshold.warningMin !== undefined && temp >= threshold.warningMin) return "warning";
    return "fail";
  }

  return "pass";
}

// ── Daily Compliance Check Categories ───────────────────────────────

export interface ComplianceCheck {
  key: string;
  label: string;
  logType: string;
  requiresTemp?: boolean;
  tempLabel?: string;
}

export interface ComplianceCheckCategory {
  key: string;
  label: string;
  icon: string;
  checks: ComplianceCheck[];
}

export const AU_COMPLIANCE_CATEGORIES: ComplianceCheckCategory[] = [
  {
    key: "temperature",
    label: "Temperature Monitoring",
    icon: "Thermometer",
    checks: [
      { key: "fridge",      label: "Fridge Temps",    logType: "fridge_temp",      requiresTemp: true, tempLabel: "°C (0–5 pass)" },
      { key: "freezer",     label: "Freezer Temps",   logType: "freezer_temp",     requiresTemp: true, tempLabel: "°C (≤ -18 pass)" },
      { key: "hot_holding", label: "Hot Holding",      logType: "hot_holding",      requiresTemp: true, tempLabel: "°C (≥ 60 pass)" },
      { key: "cooking",     label: "Cooking Temps",    logType: "cooking_poultry",  requiresTemp: true, tempLabel: "°C (≥ 75 pass)" },
    ],
  },
  {
    key: "food_safety",
    label: "Food Safety",
    icon: "Shield",
    checks: [
      { key: "expiry_check",   label: "Expiry Date Check",       logType: "expiry_check" },
      { key: "cross_contam",   label: "Cross-Contamination",     logType: "cross_contamination" },
      { key: "food_labelling", label: "Date Marking & Labelling", logType: "food_labelling" },
      { key: "allergen_check", label: "Allergen Management",      logType: "allergen_check" },
    ],
  },
  {
    key: "hygiene",
    label: "Personal Hygiene",
    icon: "HeartPulse",
    checks: [
      { key: "staff_health", label: "Staff Health Declaration", logType: "staff_health" },
      { key: "handwash",     label: "Handwash Stations",        logType: "handwash_check" },
      { key: "uniform",      label: "Uniform & Appearance",     logType: "uniform_check" },
    ],
  },
  {
    key: "cleaning",
    label: "Cleaning & Sanitisation",
    icon: "SprayCan",
    checks: [
      { key: "sanitiser",       label: "Sanitiser Check",     logType: "sanitiser_check" },
      { key: "kitchen_clean",   label: "Kitchen Cleanliness",  logType: "kitchen_clean" },
      { key: "equipment_clean", label: "Equipment Clean",      logType: "equipment_clean" },
      { key: "waste_disposal",  label: "Waste Disposal",       logType: "waste_disposal" },
    ],
  },
  {
    key: "pest_control",
    label: "Pest Control",
    icon: "Bug",
    checks: [
      { key: "pest_visual",  label: "Visual Pest Check",      logType: "pest_check" },
      { key: "pest_devices", label: "Pest Control Devices",    logType: "pest_device_check" },
    ],
  },
];

// ── Star Grading Scales ─────────────────────────────────────────────

export interface AUStarGrade {
  stars: number;
  label: string;
  color: string;
}

/** Standard Eat Safe star grades (QLD, NSW, SA, WA, ACT) */
export const AU_STAR_GRADES: AUStarGrade[] = [
  { stars: 5, label: "Excellent Performer",  color: "#10B981" },
  { stars: 4, label: "Very Good Performer",  color: "#22C55E" },
  { stars: 3, label: "Good Performer",       color: "#F59E0B" },
  { stars: 2, label: "Poor Performer",       color: "#EF4444" },
  { stars: 0, label: "Non-Compliant",        color: "#DC2626" },
];

/** VIC Scores on Doors (1-5, different labels) */
export const VIC_SCORES_ON_DOORS: AUStarGrade[] = [
  { stars: 5, label: "Excellent",         color: "#10B981" },
  { stars: 4, label: "Very Good",         color: "#22C55E" },
  { stars: 3, label: "Satisfactory",      color: "#F59E0B" },
  { stars: 2, label: "Needs Improvement", color: "#F97316" },
  { stars: 1, label: "Action Required",   color: "#EF4444" },
];

export function getAUStarGrade(stars: number, state?: AUState): AUStarGrade {
  const scale = state === "vic" ? VIC_SCORES_ON_DOORS : AU_STAR_GRADES;
  return scale.find((g) => stars >= g.stars) ?? scale[scale.length - 1];
}

// ── Currency Formatting ─────────────────────────────────────────────

export function formatAUD(amount: number): string {
  return `$${amount.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Helper: All AU EatSafe variants ─────────────────────────────────

const AU_EATSAFE_VARIANTS = new Set([
  "eatsafe_brisbane", "eatsafe_sydney", "eatsafe_melbourne", "eatsafe_perth",
  "eatsafe_adelaide", "eatsafe_hobart", "eatsafe_canberra", "eatsafe_darwin",
  "eatsafe_au",
]);

export function isAUEatSafeVariant(variant: string): boolean {
  return AU_EATSAFE_VARIANTS.has(variant);
}
