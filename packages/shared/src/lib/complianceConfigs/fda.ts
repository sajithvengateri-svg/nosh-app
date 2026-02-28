import { deriveFramework } from "../complianceConfig.ts";
import type { AssessmentSection, ComplianceFrameworkConfig } from "../complianceConfig.ts";

// ── FDA Food Code Assessment Sections (D1-D40) ───────────────────────

const FDA_ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    key: "person_in_charge_personnel",
    label: "Person In Charge & Personnel",
    items: [
      {
        code: "D1",
        category: "Person In Charge & Personnel",
        text: "Certified Food Protection Manager (CFPM) is on-site during all hours of operation with a valid ANSI-accredited certificate",
        severities: ["major"],
      },
      {
        code: "D2",
        category: "Person In Charge & Personnel",
        text: "Person In Charge (PIC) is present and demonstrates knowledge of foodborne disease prevention, HACCP principles, and applicable food laws",
        severities: ["major"],
      },
      {
        code: "D3",
        category: "Person In Charge & Personnel",
        text: "Employee health policy addresses the Big 5 illnesses (Norovirus, Hepatitis A, Shigella, Salmonella Typhi, E. coli O157:H7) — symptomatic employees are excluded or restricted per FDA Food Code",
        severities: ["critical"],
      },
      {
        code: "D4",
        category: "Person In Charge & Personnel",
        text: "Proper handwashing practiced — hands washed for at least 20 seconds with warm water, soap, and single-use towels at designated handwash sinks",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D5",
        category: "Person In Charge & Personnel",
        text: "No bare-hand contact with ready-to-eat (RTE) food — suitable utensils, single-use gloves, deli tissue, or dispensing equipment used",
        severities: ["critical"],
      },
      {
        code: "D6",
        category: "Person In Charge & Personnel",
        text: "Food employees wear clean outer clothing to prevent contamination of food and food-contact surfaces",
        severities: ["minor"],
      },
      {
        code: "D7",
        category: "Person In Charge & Personnel",
        text: "Effective hair restraints worn by food employees to prevent hair from contacting exposed food, clean equipment, and utensils",
        severities: ["minor"],
      },
      {
        code: "D8",
        category: "Person In Charge & Personnel",
        text: "Single-use gloves used properly — changed between tasks, after contamination, and when damaged or soiled",
        severities: ["major"],
      },
    ],
  },
  {
    key: "temperature_control",
    label: "Temperature Control",
    items: [
      {
        code: "D9",
        category: "Temperature Control",
        text: "Cold holding: TCS (Time/Temperature Control for Safety) food held at 41°F (5°C) or below",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D10",
        category: "Temperature Control",
        text: "Hot holding: TCS food held at 135°F (57°C) or above",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D11",
        category: "Temperature Control",
        text: "Cooking — Poultry (including stuffed meats and stuffing containing meat): internal temperature reaches 165°F (74°C) for 15 seconds",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D12",
        category: "Temperature Control",
        text: "Cooking — Ground meat and ground fish: internal temperature reaches 155°F (68°C) for 15 seconds",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D13",
        category: "Temperature Control",
        text: "Cooking — Whole intact meat, fish, and eggs for immediate service: internal temperature reaches 145°F (63°C) for 15 seconds",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D14",
        category: "Temperature Control",
        text: "Cooking — Eggs for immediate service: cooked to 145°F (63°C) for 15 seconds (or consumer requested preparation)",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D15",
        category: "Temperature Control",
        text: "Cooling: TCS food cooled from 135°F to 70°F (57°C to 21°C) within 2 hours, then from 70°F to 41°F (21°C to 5°C) within the next 4 hours (total 6 hours)",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D16",
        category: "Temperature Control",
        text: "Reheating: previously cooked TCS food reheated to 165°F (74°C) within 2 hours before being placed in hot holding",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D17",
        category: "Temperature Control",
        text: "Date marking: refrigerated RTE TCS food held at 41°F (5°C) or below is marked with a use-by date not exceeding 7 days from preparation (day of preparation = Day 1)",
        severities: ["major"],
        hasEvidence: true,
      },
      {
        code: "D18",
        category: "Temperature Control",
        text: "Thawing conducted by approved methods: under refrigeration at 41°F (5°C) or below, under running water at 70°F (21°C) or below, in a microwave followed by immediate cooking, or as part of the cooking process",
        severities: ["major"],
        hasEvidence: true,
      },
    ],
  },
  {
    key: "time_temperature_management",
    label: "Time as a Public Health Control",
    items: [
      {
        code: "D19",
        category: "Time as a Public Health Control",
        text: "Time as a public health control (TPHC): when used, food is discarded after 4 hours if not served or sold; written procedures are maintained and food is marked with discard time",
        severities: ["critical"],
        hasEvidence: true,
      },
    ],
  },
  {
    key: "food_source_protection",
    label: "Food Source & Protection",
    items: [
      {
        code: "D20",
        category: "Food Source & Protection",
        text: "Food obtained from approved, inspected sources — all food and ingredients meet FDA, USDA, or state regulatory requirements",
        severities: ["critical"],
      },
      {
        code: "D21",
        category: "Food Source & Protection",
        text: "Shellfish tags and labels retained for 90 days from the date the last shellfish from the container was sold or served",
        severities: ["major"],
      },
      {
        code: "D22",
        category: "Food Source & Protection",
        text: "Parasite destruction for raw or undercooked fish: frozen at -4°F (-20°C) or below for 7 days, or -31°F (-35°C) for 15 hours (except tuna species)",
        severities: ["critical"],
      },
      {
        code: "D23",
        category: "Food Source & Protection",
        text: "Food protected from cross-contamination during storage, preparation, holding, and display — raw animal foods stored below RTE foods",
        severities: ["critical"],
      },
      {
        code: "D24",
        category: "Food Source & Protection",
        text: "Proper food labelling: all packaged food bears labels with common name, ingredients, allergens, net quantity, and manufacturer information per 21 CFR 101",
        severities: ["major"],
      },
      {
        code: "D25",
        category: "Food Source & Protection",
        text: "Consumer advisory provided for raw or undercooked animal foods — written disclosure and reminder on menu or signage (e.g., asterisk with footnote)",
        severities: ["major"],
      },
      {
        code: "D26",
        category: "Food Source & Protection",
        text: "FIFO (First In, First Out) stock rotation practiced — oldest products used first, expired items removed from inventory",
        severities: ["minor"],
      },
      {
        code: "D27",
        category: "Food Source & Protection",
        text: "Food stored in food-grade containers that are durable, non-toxic, and clearly labelled — no corroded or compromised containers in use",
        severities: ["minor"],
      },
    ],
  },
  {
    key: "facilities_equipment",
    label: "Facilities & Equipment",
    items: [
      {
        code: "D28",
        category: "Facilities & Equipment",
        text: "Handwashing sinks accessible, unobstructed, and supplied with warm water at 100°F (38°C) or above, soap, and single-use towels or air dryers",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D29",
        category: "Facilities & Equipment",
        text: "Warewashing: manual operation uses wash-rinse-sanitize three-compartment sink; mechanical warewashing machines reach proper temperatures (wash 150°F / rinse 180°F for hot-water sanitizing, or chemical sanitizer at correct concentration)",
        severities: ["major"],
      },
      {
        code: "D30",
        category: "Facilities & Equipment",
        text: "Food-contact surfaces clean and sanitized before use, after each use, and at least every 4 hours during continuous use — sanitizer concentration tested and documented",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "D31",
        category: "Facilities & Equipment",
        text: "Non-food-contact surfaces (floors, walls, ceilings, equipment exteriors) maintained in clean condition and good repair",
        severities: ["major"],
      },
      {
        code: "D32",
        category: "Facilities & Equipment",
        text: "Proper ventilation: mechanical exhaust hoods and fans adequate to remove grease, steam, smoke, and odors; filters clean and maintained",
        severities: ["major"],
      },
      {
        code: "D33",
        category: "Facilities & Equipment",
        text: "Adequate lighting provided: at least 50 foot-candles on food preparation surfaces, 20 foot-candles in handwashing and warewashing areas, and 10 foot-candles in walk-in coolers and dry storage",
        severities: ["major"],
      },
      {
        code: "D34",
        category: "Facilities & Equipment",
        text: "Plumbing in good repair with no cross-connections; sewage and waste water properly disposed; backflow prevention devices installed where required",
        severities: ["major"],
      },
      {
        code: "D35",
        category: "Facilities & Equipment",
        text: "Toilet facilities adequate in number, clean, in good repair, and equipped with self-closing doors that do not open directly into food preparation areas",
        severities: ["major"],
      },
    ],
  },
  {
    key: "compliance_records",
    label: "Compliance & Records",
    items: [
      {
        code: "D36",
        category: "Compliance & Records",
        text: "HACCP plan developed and implemented where required (juice, seafood, reduced oxygen packaging, or other processes requiring a variance)",
        severities: ["minor"],
      },
      {
        code: "D37",
        category: "Compliance & Records",
        text: "Variance documentation on file from the regulatory authority for any specialized processing methods (e.g., smoking for preservation, curing, ROP)",
        severities: ["minor"],
      },
      {
        code: "D38",
        category: "Compliance & Records",
        text: "Employee health agreements signed — all food employees have acknowledged reporting requirements for Big 5 illnesses and symptoms",
        severities: ["minor"],
      },
      {
        code: "D39",
        category: "Compliance & Records",
        text: "Temperature monitoring logs maintained: cold holding, hot holding, cooking, cooling, and reheating temperatures recorded and reviewed daily",
        detail: "Logs should include date, time, item, temperature, initials, and corrective actions taken",
        severities: ["minor"],
        hasEvidence: true,
      },
      {
        code: "D40",
        category: "Compliance & Records",
        text: "Cleaning and sanitizing schedules maintained and documented — includes frequency, method, responsible person, and sanitizer concentration records",
        severities: ["minor"],
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════
// FDA_CONFIG — US Food and Drug Administration Food Code Compliance
// ══════════════════════════════════════════════════════════════════════

export const FDA_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "fda",
  regionId: "us",
  locale: "en-US",
  labels: {
    frameworkName: "FDA Food Safety Compliance",
    frameworkShort: "FDA",
    licenceLabel: "Health Permit Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Certified Food Protection Manager",
    certBody: "Food and Drug Administration",
    assessmentTitle: "Food Safety Self-Assessment",
    assessmentSubtitle: "FDA Food Code Compliance Checklist",
    accentColor: "#7C3AED",
  },
  assessmentSections: FDA_ASSESSMENT_SECTIONS,
  scoring: {
    model: "percentage",
    tiers: [
      { min: 90, label: "Pass – Excellent", color: "#10B981" },
      { min: 70, label: "Pass – Satisfactory", color: "#F59E0B" },
      { min: 0, label: "Fail – Unsatisfactory", color: "#EF4444" },
    ],
  },
  assessmentFrameworkFilter: "fda",
  supplier: {
    businessIdLabel: "EIN",
    businessIdPlaceholder: "Employer Identification Number",
  },
  wizardSteps: [
    {
      key: "licence",
      title: "Health Permit",
      subtitle: "Enter your food establishment health permit",
      fields: [
        { key: "bcc_licence_number", label: "Health Permit Number", type: "text", required: true },
        { key: "licence_expiry", label: "Permit Expiry", type: "date" },
        { key: "licence_displayed", label: "Permit Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss",
      title: "Certified Food Protection Manager",
      subtitle: "Enter your CFPM certification details",
      fields: [
        { key: "name", label: "Manager Name", type: "text", required: true },
        { key: "certificate_number", label: "ANSI Certificate Number", type: "text" },
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
