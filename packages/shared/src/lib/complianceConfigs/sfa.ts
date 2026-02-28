import { deriveFramework } from "../complianceConfig.ts";
import type { AssessmentSection, ComplianceFrameworkConfig } from "../complianceConfig.ts";

// ── SFA Assessment Sections (S1-S40) ─────────────────────────────────
// Based on SFA Environmental Public Health (Food Hygiene) Regulations
// and the SFA licensing / demerit-point grading framework.

const SFA_ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    key: "licence_personnel",
    label: "Licence & Personnel",
    items: [
      {
        code: "S1",
        category: "Licence & Personnel",
        text: "Valid SFA food shop licence is current and displayed prominently at the premises",
        severities: ["major"],
      },
      {
        code: "S2",
        category: "Licence & Personnel",
        text: "Certified Food Hygiene Officer (FHO) appointed and present on-site during operating hours",
        severities: ["major"],
      },
      {
        code: "S3",
        category: "Licence & Personnel",
        text: "All food handlers have completed the Basic Food Hygiene Course (BFHC) certified by SkillsFuture Singapore",
        severities: ["major"],
      },
      {
        code: "S4",
        category: "Licence & Personnel",
        text: "Food Hygiene Refresher Training completed within the past 5 years for all handlers",
        severities: ["minor"],
      },
      {
        code: "S5",
        category: "Licence & Personnel",
        text: "All food handlers wear clean uniforms, aprons, and effective hair restraints during food preparation",
        severities: ["minor"],
        hasEvidence: true,
      },
      {
        code: "S6",
        category: "Licence & Personnel",
        text: "Food handlers with symptoms of foodborne illness are reported, excluded from food handling, and a record is maintained",
        severities: ["critical"],
      },
      {
        code: "S7",
        category: "Licence & Personnel",
        text: "Proper hand hygiene practised — hands washed with soap and water before handling food, after using toilet, and after handling raw food",
        severities: ["critical"],
        hasEvidence: true,
      },
    ],
  },
  {
    key: "temperature_control",
    label: "Temperature Control",
    items: [
      {
        code: "S8",
        category: "Temperature Control",
        text: "Cold storage units maintained at or below 4°C (SFA requirement)",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "S9",
        category: "Temperature Control",
        text: "Hot holding of cooked food maintained at or above 60°C at all times",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "S10",
        category: "Temperature Control",
        text: "Cooking achieves a minimum core temperature of 75°C or above",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "S11",
        category: "Temperature Control",
        text: "Cooling performed from 60°C to 20°C within 2 hours, then from 20°C to 4°C within a further 4 hours",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "S12",
        category: "Temperature Control",
        text: "Chilled food deliveries received at or below 4°C; rejected and documented if above",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "S13",
        category: "Temperature Control",
        text: "Thawing conducted under refrigeration at or below 4°C, or under clean running water at 21°C or below",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "S14",
        category: "Temperature Control",
        text: "Reheating of previously cooked food reaches a core temperature of 75°C or above rapidly (within 2 hours)",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "S15",
        category: "Temperature Control",
        text: "Hawker stall and food court hot display units monitored and food temperature checked at least every 2 hours",
        severities: ["major"],
        hasEvidence: true,
      },
    ],
  },
  {
    key: "food_handling_contamination",
    label: "Food Handling & Contamination",
    items: [
      {
        code: "S16",
        category: "Food Handling & Contamination",
        text: "Raw and cooked/ready-to-eat foods stored and handled separately with dedicated utensils and cutting boards",
        severities: ["critical"],
      },
      {
        code: "S17",
        category: "Food Handling & Contamination",
        text: "Allergen awareness procedures in place; staff trained to identify and communicate allergen information to customers",
        severities: ["major"],
      },
      {
        code: "S18",
        category: "Food Handling & Contamination",
        text: "No bare-hand contact with ready-to-eat food — disposable gloves, tongs, or other utensils used at all times",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "S19",
        category: "Food Handling & Contamination",
        text: "All food covered, wrapped, or stored in sealed containers when not being prepared or served",
        severities: ["major"],
      },
      {
        code: "S20",
        category: "Food Handling & Contamination",
        text: "Proper food labelling with date of preparation, use-by date, and ingredient list where required",
        severities: ["minor"],
      },
      {
        code: "S21",
        category: "Food Handling & Contamination",
        text: "First-In-First-Out (FIFO) stock rotation practised for all perishable and non-perishable inventory",
        severities: ["minor"],
      },
      {
        code: "S22",
        category: "Food Handling & Contamination",
        text: "All food sourced only from SFA-approved or licensed suppliers with valid import permits where applicable",
        severities: ["major"],
      },
      {
        code: "S23",
        category: "Food Handling & Contamination",
        text: "Food grade packaging and containers used for storage, transport, and service of food",
        severities: ["minor"],
      },
      {
        code: "S24",
        category: "Food Handling & Contamination",
        text: "Premises free from evidence of pests (rodents, cockroaches, flies) and preventive measures in place",
        severities: ["critical"],
      },
    ],
  },
  {
    key: "premises_equipment",
    label: "Premises & Equipment",
    items: [
      {
        code: "S25",
        category: "Premises & Equipment",
        text: "Premises (floors, walls, ceilings) clean, in good repair, and constructed of smooth impervious materials",
        severities: ["major"],
      },
      {
        code: "S26",
        category: "Premises & Equipment",
        text: "Adequate mechanical ventilation and lighting provided in food preparation, cooking, and storage areas",
        severities: ["minor"],
      },
      {
        code: "S27",
        category: "Premises & Equipment",
        text: "Proper drainage installed, maintained, and free from blockages; floor drains fitted with grilles",
        severities: ["major"],
      },
      {
        code: "S28",
        category: "Premises & Equipment",
        text: "Adequate toilet facilities provided for staff, maintained in clean condition, and not opening directly into food areas",
        severities: ["minor"],
      },
      {
        code: "S29",
        category: "Premises & Equipment",
        text: "Refuse stored in covered bins, removed at least daily, and disposal area kept clean and pest-free",
        severities: ["major"],
      },
      {
        code: "S30",
        category: "Premises & Equipment",
        text: "All equipment and utensils in good working order, clean, and maintained to prevent food contamination",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "S31",
        category: "Premises & Equipment",
        text: "Dishwashing achieves sanitisation at 77°C or above for heat method, or approved chemical sanitiser used at correct concentration",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "S32",
        category: "Premises & Equipment",
        text: "Grease trap installed where required, cleaned regularly, and maintenance records kept up to date",
        severities: ["minor"],
      },
    ],
  },
  {
    key: "documentation_compliance",
    label: "Documentation & Compliance",
    items: [
      {
        code: "S33",
        category: "Documentation & Compliance",
        text: "Food safety management system (based on HACCP principles) documented and implemented",
        severities: ["minor"],
      },
      {
        code: "S34",
        category: "Documentation & Compliance",
        text: "Temperature monitoring logs for cold storage, hot holding, cooking, and cooling maintained daily",
        severities: ["minor"],
        hasEvidence: true,
      },
      {
        code: "S35",
        category: "Documentation & Compliance",
        text: "Cleaning schedule documented and cleaning completion records maintained for all areas and equipment",
        severities: ["minor"],
      },
      {
        code: "S36",
        category: "Documentation & Compliance",
        text: "Pest control records maintained — including contract with licensed pest control operator, service reports, and bait station maps",
        severities: ["minor"],
      },
      {
        code: "S37",
        category: "Documentation & Compliance",
        text: "Staff training records maintained with copies of BFHC certificates, refresher course dates, and FHO appointment letter",
        severities: ["minor"],
      },
      {
        code: "S38",
        category: "Documentation & Compliance",
        text: "Supplier records maintained — including approved supplier list, SFA import permits, and delivery receipts",
        severities: ["minor"],
      },
      {
        code: "S39",
        category: "Documentation & Compliance",
        text: "Traceability records maintained — food can be traced one step back (supplier) and one step forward (customer) within 4 hours",
        severities: ["minor"],
      },
      {
        code: "S40",
        category: "Documentation & Compliance",
        text: "SFA inspection readiness maintained — previous inspection reports addressed, demerit points tracked, and corrective actions completed",
        severities: ["minor"],
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════
// SFA_CONFIG — Singapore Food Agency. Uses SFA-specific assessment
// items (S1-S40) and letter-grade scoring (A/B/C/D).
// ══════════════════════════════════════════════════════════════════════

export const SFA_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "sfa",
  regionId: "sg",
  locale: "en-SG",
  labels: {
    frameworkName: "SFA Compliance",
    frameworkShort: "SFA",
    licenceLabel: "SFA Licence Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Hygiene Officer",
    certBody: "Singapore Food Agency",
    assessmentTitle: "Food Safety Self-Assessment",
    assessmentSubtitle: "SFA Food Safety Audit Checklist",
    accentColor: "#DC2626",
  },
  assessmentSections: SFA_ASSESSMENT_SECTIONS,
  scoring: {
    model: "letter_grade",
    tiers: [
      { min: 85, label: "A – Excellent", color: "#10B981" },
      { min: 70, label: "B – Good", color: "#22C55E" },
      { min: 50, label: "C – Adequate", color: "#F59E0B" },
      { min: 0,  label: "D – Needs Improvement", color: "#EF4444" },
    ],
  },
  assessmentFrameworkFilter: "sfa",
  supplier: {
    businessIdLabel: "UEN",
    businessIdPlaceholder: "Unique Entity Number",
  },
  wizardSteps: [
    {
      key: "licence",
      title: "SFA Licence",
      subtitle: "Enter your SFA food establishment licence",
      fields: [
        { key: "bcc_licence_number", label: "SFA Licence Number", type: "text", required: true },
        { key: "licence_expiry", label: "Licence Expiry", type: "date" },
        { key: "licence_displayed", label: "Licence Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss",
      title: "Food Hygiene Officer",
      subtitle: "Enter your food hygiene officer details",
      fields: [
        { key: "name", label: "Officer Name", type: "text", required: true },
        { key: "certificate_number", label: "WSQ Certificate Number", type: "text" },
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
