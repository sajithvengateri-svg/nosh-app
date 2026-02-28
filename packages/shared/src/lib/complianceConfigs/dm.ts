import { deriveFramework } from "../complianceConfig.ts";
import type { ComplianceFrameworkConfig, AssessmentSection } from "../complianceConfig.ts";

// ══════════════════════════════════════════════════════════════════════
// GCC Assessment Sections — shared base for all UAE Emirates.
// Synthesized from Dubai Food Code, ADAFSA standards, Sharjah SFSP,
// Federal Law No. 10/2015, and GSO requirements.
// ══════════════════════════════════════════════════════════════════════

const GCC_ASSESSMENT_SECTIONS: AssessmentSection[] = [
  // ── I. Documentation & Licensing ──────────────────────────────────
  {
    key: "documentation",
    label: "Documentation & Licensing",
    items: [
      {
        code: "G1",
        category: "Documentation & Licensing",
        text: "Trade Licence — Is the food establishment trade licence valid and does it include the correct food-handling activity?",
        severities: ["critical"],
      },
      {
        code: "G2",
        category: "Documentation & Licensing",
        text: "Person in Charge (PIC) — Is at least one certified PIC (Level 2 or 3) present during all operating hours?",
        severities: ["critical"],
      },
      {
        code: "G3",
        category: "Documentation & Licensing",
        text: "Digital Portal — Are all staff training records and permits updated on the Foodwatch / Zadna system?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G4",
        category: "Documentation & Licensing",
        text: "Staff Health Records — Do all food handlers have valid Occupational Health Cards (OHC)?",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "G5",
        category: "Documentation & Licensing",
        text: "Pest Control Contract — Is there a valid contract with a municipality-approved pest control company?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G6",
        category: "Documentation & Licensing",
        text: "Pest Control Log — Is the pest control log maintained showing recent visits and bait station maps?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G7",
        category: "Documentation & Licensing",
        text: "Water Tank Cleaning — Has the water tank been cleaned and disinfected within the last 6 months, with certificate available?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G8",
        category: "Documentation & Licensing",
        text: "HACCP Plan — Does the food business have a documented HACCP plan or food safety management system?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G9",
        category: "Documentation & Licensing",
        text: "Halal Certificate — Does the establishment have a valid Halal certificate from an approved body (where applicable)?",
        severities: ["critical"],
        hasEvidence: true,
      },
    ],
  },

  // ── II. Temperature Control ───────────────────────────────────────
  {
    key: "temperature_control",
    label: "Temperature Control",
    items: [
      {
        code: "G10",
        category: "Temperature Control",
        text: "Receiving — Are temperature logs maintained showing temps of high-risk foods upon delivery (Cold: <5°C; Frozen: <−18°C)?",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "G11",
        category: "Temperature Control",
        text: "Storage — Are chiller and freezer temperatures recorded at least twice daily?",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "G12",
        category: "Temperature Control",
        text: "Cooking / Reheating — Are internal core temperature logs showing food reached ≥75°C (or equivalent time/temp parameters)?",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "G13",
        category: "Temperature Control",
        text: "Cooling — Is there evidence of rapid cooling (blast chiller or ice bath) ensuring food drops from 60°C to 20°C within 2 hours?",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "G14",
        category: "Temperature Control",
        text: "Calibration — Are thermometers calibrated (ice point/boiling point method) at least monthly, with records available?",
        severities: ["minor", "major"],
        hasEvidence: true,
      },
      {
        code: "G15",
        category: "Temperature Control",
        text: "Hot Holding — Is hot food maintained at ≥60°C during service and display?",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "G16",
        category: "Temperature Control",
        text: "Cold Display — Is cold food displayed at ≤5°C with temperature monitoring?",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "G17",
        category: "Temperature Control",
        text: "Transport — Are temperature-controlled vehicles used for transporting high-risk foods, with records maintained?",
        severities: ["major"],
        hasEvidence: true,
      },
    ],
  },

  // ── III. Structural & Operational Hygiene ─────────────────────────
  {
    key: "structural_hygiene",
    label: "Structural & Operational Hygiene",
    items: [
      {
        code: "G18",
        category: "Structural & Operational Hygiene",
        text: "Kitchen Area — Does the kitchen area meet the minimum size requirement (≥40% of floor area or ≥300 sq. ft)?",
        detail: "Dubai: 40% rule applies",
        severities: ["major"],
      },
      {
        code: "G19",
        category: "Structural & Operational Hygiene",
        text: "Flow of Food — Is there unidirectional flow from raw to ready-to-eat areas (no cross-traffic or back-tracking)?",
        severities: ["major", "critical"],
      },
      {
        code: "G20",
        category: "Structural & Operational Hygiene",
        text: "Handwash Stations — Are dedicated hand-wash stations available (sensor or foot-operated, with liquid soap and paper towels)?",
        detail: "No cloth towels permitted",
        severities: ["critical"],
      },
      {
        code: "G21",
        category: "Structural & Operational Hygiene",
        text: "Prep Sinks — Are separate sinks provided for vegetables and raw meats/poultry?",
        severities: ["major"],
      },
      {
        code: "G22",
        category: "Structural & Operational Hygiene",
        text: "Surfaces — Are all food contact surfaces non-porous (stainless steel Grade 304 or food-grade plastic)? No wood surfaces?",
        severities: ["major"],
      },
      {
        code: "G23",
        category: "Structural & Operational Hygiene",
        text: "Walls & Coving — Are walls tiled/clad up to 2 metres with curved joints (coving) between walls and floors?",
        severities: ["minor", "major"],
      },
      {
        code: "G24",
        category: "Structural & Operational Hygiene",
        text: "Ventilation — Is mechanical exhaust ventilation maintained in a clean and working condition?",
        severities: ["minor", "major"],
      },
      {
        code: "G25",
        category: "Structural & Operational Hygiene",
        text: "Lighting — Is adequate lighting provided in food preparation, storage, and cleaning areas?",
        severities: ["minor"],
      },
      {
        code: "G26",
        category: "Structural & Operational Hygiene",
        text: "Drainage — Are floor drains clean, functioning, and fitted with proper traps to prevent backflow?",
        severities: ["major"],
      },
      {
        code: "G27",
        category: "Structural & Operational Hygiene",
        text: "Toilets — Are adequate staff toilets provided, separate from food areas, and maintained in a clean state?",
        severities: ["minor", "major"],
      },
    ],
  },

  // ── IV. Cross-Contamination & Storage ─────────────────────────────
  {
    key: "cross_contamination",
    label: "Cross-Contamination & Storage",
    items: [
      {
        code: "G28",
        category: "Cross-Contamination & Storage",
        text: "Color Coding — Are specific colour-coded boards/knives used? (Red: Raw Meat; Blue: Raw Fish; Green: Veg; White: Dairy/Bakery)",
        severities: ["major", "critical"],
      },
      {
        code: "G29",
        category: "Cross-Contamination & Storage",
        text: "Dry Storage — Are all food items stored at least 15cm (6 inches) off the floor on stainless steel or plastic shelving?",
        severities: ["minor", "major"],
      },
      {
        code: "G30",
        category: "Cross-Contamination & Storage",
        text: "Date Labelling — Do all prepped items have a date label (Prep Date + Expiry Date)?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G31",
        category: "Cross-Contamination & Storage",
        text: "Chemical Storage — Are cleaning chemicals stored in a locked cabinet, separate from food storage areas?",
        severities: ["critical"],
      },
      {
        code: "G32",
        category: "Cross-Contamination & Storage",
        text: "FEFO / FIFO — Is the First-Expiry-First-Out stock rotation system followed for all stored food items?",
        severities: ["major"],
      },
      {
        code: "G33",
        category: "Cross-Contamination & Storage",
        text: "Raw/Cooked Separation — Are raw and ready-to-eat foods stored separately with raw foods placed below cooked?",
        severities: ["critical"],
      },
      {
        code: "G34",
        category: "Cross-Contamination & Storage",
        text: "Allergens — Are allergens identified and managed with clear labelling and staff awareness?",
        severities: ["major"],
      },
    ],
  },

  // ── V. Personal Hygiene & Health ──────────────────────────────────
  {
    key: "personal_hygiene",
    label: "Personal Hygiene & Health",
    items: [
      {
        code: "G35",
        category: "Personal Hygiene & Health",
        text: "Staff Health — Are staff members excluded from food handling if suffering from a food-borne illness (vomiting, diarrhoea, jaundice)?",
        severities: ["critical"],
      },
      {
        code: "G36",
        category: "Personal Hygiene & Health",
        text: "Handwashing — Do food handlers wash hands correctly and at appropriate times (after breaks, handling raw food, etc.)?",
        severities: ["major", "critical"],
      },
      {
        code: "G37",
        category: "Personal Hygiene & Health",
        text: "Uniforms — Are food handlers wearing clean uniforms, hair nets/caps, and no jewellery (except plain wedding band)?",
        severities: ["minor", "major"],
      },
      {
        code: "G38",
        category: "Personal Hygiene & Health",
        text: "Gloves — Are single-use gloves used when handling ready-to-eat food, and changed between tasks?",
        severities: ["major"],
      },
      {
        code: "G39",
        category: "Personal Hygiene & Health",
        text: "Smoking & Eating — Is there no smoking, eating, or drinking in food preparation areas?",
        severities: ["minor", "major"],
      },
      {
        code: "G40",
        category: "Personal Hygiene & Health",
        text: "Wounds — Are cuts and wounds properly covered with blue waterproof dressings?",
        severities: ["major"],
      },
    ],
  },

  // ── VI. Cleaning, Sanitising & Pest Control ───────────────────────
  {
    key: "cleaning_pest",
    label: "Cleaning, Sanitising & Pest Control",
    items: [
      {
        code: "G41",
        category: "Cleaning, Sanitising & Pest Control",
        text: "Cleaning Schedule — Is a written cleaning schedule maintained and followed for all areas and equipment?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G42",
        category: "Cleaning, Sanitising & Pest Control",
        text: "Sanitising — Are food contact surfaces sanitised correctly using approved sanitising agents at the correct concentration?",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "G43",
        category: "Cleaning, Sanitising & Pest Control",
        text: "Equipment Maintenance — Are all fixtures, fittings, and equipment maintained in a good state of repair and working order?",
        severities: ["minor", "major"],
      },
      {
        code: "G44",
        category: "Cleaning, Sanitising & Pest Control",
        text: "Grease Trap — Is the grease trap cleaned and maintained regularly with records available?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G45",
        category: "Cleaning, Sanitising & Pest Control",
        text: "Pest Evidence — Is the establishment completely free from evidence of live or dead pests (cockroaches, rodents, flies)?",
        severities: ["critical"],
      },
      {
        code: "G46",
        category: "Cleaning, Sanitising & Pest Control",
        text: "Pest Prevention — Are pest prevention measures in place (mesh screens, door strips, sealed entry points, bait stations)?",
        severities: ["major"],
      },
      {
        code: "G47",
        category: "Cleaning, Sanitising & Pest Control",
        text: "Waste Management — Are waste bins lidded, lined, and emptied frequently? Is the waste storage area clean and enclosed?",
        severities: ["minor", "major"],
      },
    ],
  },

  // ── VII. Traceability & Halal ─────────────────────────────────────
  {
    key: "traceability_halal",
    label: "Traceability & Halal",
    items: [
      {
        code: "G48",
        category: "Traceability & Halal",
        text: "Supplier Records — Are invoices and certificates maintained for all raw materials, with Lot/Batch tracking for outgoing items?",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "G49",
        category: "Traceability & Halal",
        text: "Food Recall — Does the business have a documented food recall/withdrawal procedure?",
        severities: ["major"],
      },
      {
        code: "G50",
        category: "Traceability & Halal",
        text: "Halal Integrity — Is halal meat stored, handled, and prepared separately from non-halal products (where applicable)?",
        severities: ["critical"],
      },
      {
        code: "G51",
        category: "Traceability & Halal",
        text: "Food Labels (GSO 9/2013) — Do all prepackaged foods have Arabic labels with ingredients, allergens, and expiry dates?",
        severities: ["major"],
      },
      {
        code: "G52",
        category: "Traceability & Halal",
        text: "Nutritional Labelling (GSO 2233) — Do food labels comply with GSO nutritional labelling requirements?",
        severities: ["minor"],
      },
    ],
  },

  // ── VIII. Red Flag / Critical Items ───────────────────────────────
  {
    key: "critical_items",
    label: "Red Flag / Critical Items",
    items: [
      {
        code: "G53",
        category: "Red Flag / Critical Items",
        text: "Sewage — Are there any sewage leaks, odours, or grease trap overflows on the premises?",
        detail: "Immediate fail if sewage issues found",
        severities: ["critical"],
      },
      {
        code: "G54",
        category: "Red Flag / Critical Items",
        text: "Running Water — Is hot and cold running water available at all times in food preparation areas?",
        severities: ["critical"],
      },
      {
        code: "G55",
        category: "Red Flag / Critical Items",
        text: "Expired Food — Is the premises completely free from any expired food products?",
        severities: ["critical"],
      },
    ],
  },
];

// ── DM Letter Grading (Dubai Municipality) ──────────────────────────

function dmLetterGrade(answers: Record<string, { status: string; severity?: string }>): number {
  const values = Object.values(answers);
  const total = values.length;
  if (total === 0) return 0;

  // Count non-compliant items
  const criticals = values.filter((a) => a.status === "non_compliant" && a.severity === "critical").length;
  const majors = values.filter((a) => a.status === "non_compliant" && a.severity === "major").length;
  const minors = values.filter((a) => a.status === "non_compliant" && a.severity === "minor").length;
  const compliant = values.filter((a) => a.status === "compliant").length;

  // Any critical = maximum D grade (score capped at 54)
  if (criticals > 0) {
    return Math.min(54, Math.round((compliant / total) * 100));
  }

  // Percentage-based with penalty weights
  const penaltyPoints = (majors * 3) + (minors * 1);
  const maxPoints = total;
  const rawScore = Math.round(((maxPoints - penaltyPoints) / maxPoints) * 100);
  return Math.max(0, Math.min(100, rawScore));
}

// ── ADAFSA Star Grading (Abu Dhabi) ─────────────────────────────────
// Mapped to star rating: 5=Outstanding(90+), 4=VeryGood(75-89), 3=Good(60-74), 2=Acceptable(45-59), 1=NeedsImprovement(<45)

function adfasStarRating(answers: Record<string, { status: string; severity?: string }>): number {
  const values = Object.values(answers);
  const total = values.length;
  if (total === 0) return 0;

  const criticals = values.filter((a) => a.status === "non_compliant" && a.severity === "critical").length;
  const majors = values.filter((a) => a.status === "non_compliant" && a.severity === "major").length;
  const minors = values.filter((a) => a.status === "non_compliant" && a.severity === "minor").length;
  const compliant = values.filter((a) => a.status === "compliant").length;

  // Critical items severely impact rating
  if (criticals >= 2) return 1;
  if (criticals >= 1) return Math.min(2, Math.round((compliant / total) * 5));

  const penaltyPoints = (majors * 3) + (minors * 1);
  const rawPct = Math.round(((total - penaltyPoints) / total) * 100);

  if (rawPct >= 90) return 5;
  if (rawPct >= 75) return 4;
  if (rawPct >= 60) return 3;
  if (rawPct >= 45) return 2;
  return 1;
}

// ── GCC Section Definitions ─────────────────────────────────────────

const GCC_SECTIONS = [
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
  { key: "display_monitoring", label: "Display Monitoring", defaultOn: true },
  { key: "transport_logs", label: "Transport Logs", defaultOn: false },
  { key: "cleaning_schedules", label: "Cleaning Schedules", defaultOn: true },
  { key: "equipment_calibration", label: "Equipment & Calibration", defaultOn: true },
  { key: "supplier_register", label: "Supplier Register", defaultOn: true },
  { key: "halal_tracking", label: "Halal Tracking", defaultOn: true },
  { key: "self_assessment", label: "Self-Assessment (G1–G55)", defaultOn: true },
];

// ══════════════════════════════════════════════════════════════════════
// DM_CONFIG — Dubai Municipality
// Uses letter grading (A-D), percentage-based scoring
// ══════════════════════════════════════════════════════════════════════

export const DM_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "dm",
  regionId: "uae",
  locale: "en-AE",
  labels: {
    frameworkName: "Dubai Municipality Compliance",
    frameworkShort: "DM",
    licenceLabel: "Trade Licence Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Person in Charge (PIC)",
    certBody: "Dubai Municipality — Food Safety Department",
    assessmentTitle: "Food Safety Self-Assessment",
    assessmentSubtitle: "Dubai Food Code Compliance Checklist (G1–G55)",
    accentColor: "#059669",
  },
  assessmentSections: GCC_ASSESSMENT_SECTIONS,
  scoring: {
    model: "percentage",
    tiers: [
      { min: 85, label: "Grade A — Excellent", color: "#22c55e" },
      { min: 70, label: "Grade B — Good", color: "#3b82f6" },
      { min: 55, label: "Grade C — Acceptable", color: "#f59e0b" },
      { min: 0, label: "Grade D — Poor", color: "#ef4444" },
    ],
  },
  sections: GCC_SECTIONS,
  features: {
    hasSupervisors: true,
    hasTrainingRegister: true,
    hasSeverityLevels: true,
    hasEvidenceChecks: true,
    hasStarRating: false,
    hasGradingSystem: true,
    hasHalalTracking: true,
  },
  supplier: {
    businessIdLabel: "Trade Licence",
    businessIdPlaceholder: "Dubai Trade Licence Number",
  },
  assessmentFrameworkFilter: "dm",
  wizardSteps: [
    {
      key: "licence",
      title: "Trade Licence",
      subtitle: "Enter your Dubai Municipality food trade licence",
      fields: [
        { key: "bcc_licence_number", label: "Trade Licence Number", type: "text", required: true, placeholder: "e.g. TL-12345" },
        { key: "licence_expiry", label: "Licence Expiry Date", type: "date" },
        { key: "licence_displayed", label: "Licence Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss",
      title: "Person in Charge (PIC)",
      subtitle: "Enter your certified PIC details",
      fields: [
        { key: "name", label: "PIC Name", type: "text", required: true },
        { key: "certificate_number", label: "PIC Certificate Number", type: "text" },
        { key: "certificate_date", label: "Certificate Date", type: "date" },
      ],
    },
    {
      key: "sections",
      title: "Compliance Sections",
      subtitle: "Choose which compliance sections to enable",
      fields: [],
    },
  ],
});

// ══════════════════════════════════════════════════════════════════════
// ADAFSA_CONFIG — Abu Dhabi Agriculture & Food Safety Authority
// Uses star rating (1-5 stars, Zadna system)
// ══════════════════════════════════════════════════════════════════════

export const ADAFSA_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "adafsa",
  regionId: "uae",
  locale: "en-AE",
  labels: {
    frameworkName: "ADAFSA Compliance",
    frameworkShort: "ADAFSA",
    licenceLabel: "ADAFSA Licence Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Person in Charge (PIC)",
    certBody: "Abu Dhabi Agriculture and Food Safety Authority",
    assessmentTitle: "Zadna Self-Assessment",
    assessmentSubtitle: "ADAFSA Food Safety Checklist (G1–G55)",
    accentColor: "#059669",
  },
  assessmentSections: GCC_ASSESSMENT_SECTIONS,
  scoring: {
    model: "star_rating",
    computeStarRating: adfasStarRating,
    tiers: [
      { min: 5, label: "Outstanding", color: "#f59e0b" },
      { min: 4, label: "Very Good", color: "#22c55e" },
      { min: 3, label: "Good", color: "#3b82f6" },
      { min: 2, label: "Acceptable", color: "#f97316" },
      { min: 0, label: "Needs Improvement", color: "#ef4444" },
    ],
  },
  sections: GCC_SECTIONS,
  features: {
    hasSupervisors: true,
    hasTrainingRegister: true,
    hasSeverityLevels: true,
    hasEvidenceChecks: true,
    hasStarRating: true,
    hasGradingSystem: false,
    hasHalalTracking: true,
  },
  supplier: {
    businessIdLabel: "Trade Licence",
    businessIdPlaceholder: "Abu Dhabi Trade Licence Number",
  },
  assessmentFrameworkFilter: "adafsa",
  wizardSteps: [
    {
      key: "licence",
      title: "ADAFSA Licence",
      subtitle: "Enter your Abu Dhabi food establishment licence",
      fields: [
        { key: "bcc_licence_number", label: "ADAFSA Licence Number", type: "text", required: true },
        { key: "licence_expiry", label: "Licence Expiry Date", type: "date" },
        { key: "licence_displayed", label: "Licence Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss",
      title: "Person in Charge (PIC)",
      subtitle: "Enter your certified PIC details",
      fields: [
        { key: "name", label: "PIC Name", type: "text", required: true },
        { key: "certificate_number", label: "E-FST Certificate Number", type: "text" },
        { key: "certificate_date", label: "Certificate Date", type: "date" },
      ],
    },
    {
      key: "sections",
      title: "Compliance Sections",
      subtitle: "Choose which compliance sections to enable",
      fields: [],
    },
  ],
});

// ══════════════════════════════════════════════════════════════════════
// SM_SHARJAH_CONFIG — Sharjah Municipality
// Focus on GHP/HACCP, pictorial training. Pass/Fail inspection model.
// ══════════════════════════════════════════════════════════════════════

export const SM_SHARJAH_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "sm_sharjah",
  regionId: "uae",
  locale: "en-AE",
  labels: {
    frameworkName: "Sharjah Municipality Compliance",
    frameworkShort: "SM",
    licenceLabel: "Trade Licence Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "GHP Manager",
    certBody: "Sharjah Municipality — Public Health Department",
    assessmentTitle: "SFSP Self-Assessment",
    assessmentSubtitle: "Sharjah Food Safety Program Checklist (G1–G55)",
    accentColor: "#059669",
  },
  assessmentSections: GCC_ASSESSMENT_SECTIONS,
  scoring: {
    model: "percentage",
    tiers: [
      { min: 80, label: "Compliant", color: "#22c55e" },
      { min: 60, label: "Conditional Pass", color: "#f59e0b" },
      { min: 0, label: "Non-Compliant", color: "#ef4444" },
    ],
  },
  sections: GCC_SECTIONS,
  features: {
    hasSupervisors: true,
    hasTrainingRegister: true,
    hasSeverityLevels: true,
    hasEvidenceChecks: true,
    hasStarRating: false,
    hasGradingSystem: false,
    hasHalalTracking: true,
  },
  supplier: {
    businessIdLabel: "Trade Licence",
    businessIdPlaceholder: "Sharjah Trade Licence Number",
  },
  assessmentFrameworkFilter: "sm_sharjah",
  wizardSteps: [
    {
      key: "licence",
      title: "Trade Licence",
      subtitle: "Enter your Sharjah Municipality food trade licence",
      fields: [
        { key: "bcc_licence_number", label: "Trade Licence Number", type: "text", required: true },
        { key: "licence_expiry", label: "Licence Expiry Date", type: "date" },
        { key: "licence_displayed", label: "Licence Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss",
      title: "GHP Manager",
      subtitle: "Enter your GHP/HACCP manager details",
      fields: [
        { key: "name", label: "GHP Manager Name", type: "text", required: true },
        { key: "certificate_number", label: "Training Certificate Number", type: "text" },
        { key: "certificate_date", label: "Certificate Date", type: "date" },
      ],
    },
    {
      key: "sections",
      title: "Compliance Sections",
      subtitle: "Choose which compliance sections to enable",
      fields: [],
    },
  ],
});
