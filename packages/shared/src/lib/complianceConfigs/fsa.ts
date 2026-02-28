import { deriveFramework } from "../complianceConfig.ts";
import type { AssessmentSection, ComplianceFrameworkConfig } from "../complianceConfig.ts";

// ── FSA FHRS Assessment Sections (U1-U40) ────────────────────────────
// Based on the UK Food Hygiene Rating Scheme (FHRS), EC Regulation 852/2004,
// Food Safety Act 1990, Food Hygiene (England) Regulations 2006,
// and Natasha's Law (Food Information (Amendment) (England) Regulations 2019).

const FSA_ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    key: "food_hygiene",
    label: "Food Hygiene",
    items: [
      {
        code: "U1",
        category: "Food Hygiene",
        text: "Food business registration — Is the business registered with the local authority at least 28 days before trading?",
        detail: "Required under Food Safety Act 1990 and EC Regulation 852/2004",
        severities: ["major"],
      },
      {
        code: "U2",
        category: "Food Hygiene",
        text: "FHRS rating display — Is the current Food Hygiene Rating Scheme sticker displayed in a prominent location visible to customers?",
        detail: "Mandatory display in Wales and Northern Ireland; voluntary but expected in England",
        severities: ["minor"],
      },
      {
        code: "U3",
        category: "Food Hygiene",
        text: "Safer Food Better Business (SFBB) — Is an up-to-date SFBB pack (or equivalent documented food safety management system) in place and actively used?",
        detail: "FSA-recommended food safety management system for small businesses",
        severities: ["major"],
      },
      {
        code: "U4",
        category: "Food Hygiene",
        text: "Food hygiene training — Do all food handlers hold a minimum Level 2 Award in Food Safety in Catering (or equivalent)?",
        detail: "Chartered Institute of Environmental Health (CIEH) or Highfield-accredited qualifications accepted",
        severities: ["major"],
      },
      {
        code: "U5",
        category: "Food Hygiene",
        text: "Personal hygiene — Do food handlers maintain appropriate personal hygiene standards including clean protective clothing and hair covering?",
        severities: ["major", "critical"],
      },
      {
        code: "U6",
        category: "Food Hygiene",
        text: "Illness reporting — Are food handlers required to report symptoms of vomiting, diarrhoea, infected wounds, or skin infections, and excluded from food handling for 48 hours after symptoms cease?",
        detail: "EC Regulation 852/2004 Annex II Chapter VIII",
        severities: ["major", "critical"],
      },
      {
        code: "U7",
        category: "Food Hygiene",
        text: "Handwashing — Do food handlers wash hands thoroughly before handling food, after using the toilet, handling raw food, and after breaks?",
        severities: ["major", "critical"],
      },
      {
        code: "U8",
        category: "Food Hygiene",
        text: "Fitness to work policy — Is there a documented fitness to work policy covering food handlers with gastrointestinal illness, skin infections, and return-to-work criteria?",
        severities: ["minor", "major"],
      },
    ],
  },
  {
    key: "temperature_control",
    label: "Temperature Control",
    items: [
      {
        code: "U9",
        category: "Temperature Control",
        text: "Cold holding — Is chilled food stored at or below 8°C (legal maximum), with 5°C or below as best practice?",
        detail: "Food Safety (Temperature Control) Regulations 1995 — legal limit 8°C; industry best practice 5°C",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "U10",
        category: "Temperature Control",
        text: "Hot holding — Is hot food held at 63°C or above?",
        detail: "Food Safety (Temperature Control) Regulations 1995",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "U11",
        category: "Temperature Control",
        text: "Cooking temperature — Is food cooked to a core temperature of 75°C (or equivalent time/temperature combination, e.g. 70°C for 2 minutes)?",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "U12",
        category: "Temperature Control",
        text: "Cooling — Is cooked food cooled as quickly as possible and within 90 minutes before refrigeration?",
        detail: "SFBB guidance: cool to below 8°C within 90 minutes",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "U13",
        category: "Temperature Control",
        text: "Chilled delivery — Is food received at or below 8°C, with delivery temperatures checked and recorded on arrival?",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "U14",
        category: "Temperature Control",
        text: "Date labelling and use-by compliance — Are use-by dates checked at delivery, during storage, and before service, with expired items removed and disposed of?",
        detail: "It is an offence to sell food past its use-by date under the Food Safety Act 1990",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "U15",
        category: "Temperature Control",
        text: "Ambient display — Is food displayed outside temperature control limited to a single period of up to 2 hours (for cold food) or used/discarded appropriately?",
        detail: "Tolerated under the 2-hour rule; food must be discarded if not used within this period",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "U16",
        category: "Temperature Control",
        text: "Freezer storage — Are freezers maintained at -18°C or below, with no evidence of thaw/refreeze damage?",
        severities: ["major"],
        hasEvidence: true,
      },
    ],
  },
  {
    key: "cross_contamination",
    label: "Cross-Contamination & Allergens",
    items: [
      {
        code: "U17",
        category: "Cross-Contamination & Allergens",
        text: "Allergen management (Natasha's Law) — Are all prepacked for direct sale (PPDS) products labelled with a full ingredients list highlighting any of the 14 specified allergens?",
        detail: "Food Information (Amendment) (England) Regulations 2019 — applies to PPDS foods; the 14 allergens: celery, cereals containing gluten, crustaceans, eggs, fish, lupin, milk, molluscs, mustard, nuts, peanuts, sesame, soya, sulphur dioxide/sulphites",
        severities: ["critical"],
        hasEvidence: true,
      },
      {
        code: "U18",
        category: "Cross-Contamination & Allergens",
        text: "Allergen communication — Can staff accurately communicate allergen information to customers for non-prepacked food, and are allergen matrices or charts available and up to date?",
        detail: "EU Food Information for Consumers Regulation (EU FIC) No. 1169/2011 retained in UK law",
        severities: ["major", "critical"],
        hasEvidence: true,
      },
      {
        code: "U19",
        category: "Cross-Contamination & Allergens",
        text: "Raw and cooked separation — Are raw and ready-to-eat foods stored, prepared, and handled separately to prevent cross-contamination?",
        detail: "Separate storage (raw below cooked), separate preparation areas or temporal separation with sanitisation between uses",
        severities: ["major", "critical"],
      },
      {
        code: "U20",
        category: "Cross-Contamination & Allergens",
        text: "Colour-coded chopping boards and utensils — Are colour-coded boards/utensils used and correctly assigned (e.g. red for raw meat, blue for raw fish, green for salad/fruit, white for dairy, yellow for cooked meat, brown for vegetables)?",
        severities: ["minor", "major"],
      },
      {
        code: "U21",
        category: "Cross-Contamination & Allergens",
        text: "Handwashing facilities — Are designated handwash basins available with hot and cold running water, antibacterial soap, and disposable paper towels, separate from food preparation sinks?",
        severities: ["major", "critical"],
      },
      {
        code: "U22",
        category: "Cross-Contamination & Allergens",
        text: "Single-use items — Are single-use items (gloves, cloths, containers) stored hygienically, used once only, and not reused?",
        severities: ["minor"],
      },
    ],
  },
  {
    key: "structural_facilities",
    label: "Structural & Facilities",
    items: [
      {
        code: "U23",
        category: "Structural & Facilities",
        text: "Premises registration — Is the food business premises registered with the local authority and does it meet the structural requirements of EC Regulation 852/2004 Annex II?",
        severities: ["major"],
      },
      {
        code: "U24",
        category: "Structural & Facilities",
        text: "Pest control — Is an effective pest control programme in place, including proofing of the premises and regular inspections by a qualified pest controller?",
        detail: "Records of pest control visits, bait station maps, and any sightings/treatments required",
        severities: ["major", "critical"],
      },
      {
        code: "U25",
        category: "Structural & Facilities",
        text: "Waste management — Is food waste and refuse stored in lidded, foot-operated bins, removed regularly, and the external waste area kept clean and secure?",
        severities: ["minor", "major"],
      },
      {
        code: "U26",
        category: "Structural & Facilities",
        text: "Ventilation — Is adequate mechanical or natural ventilation provided to prevent excessive condensation, grease build-up, and stale air in food preparation areas?",
        detail: "EC Regulation 852/2004 Annex II Chapter I",
        severities: ["minor", "major"],
      },
      {
        code: "U27",
        category: "Structural & Facilities",
        text: "Lighting — Is adequate lighting provided in all food handling, storage, and cleaning areas?",
        severities: ["minor"],
      },
      {
        code: "U28",
        category: "Structural & Facilities",
        text: "Water supply — Is there an adequate supply of potable water, and is any non-potable water (e.g. for fire control) clearly identified and not connected to potable supply?",
        detail: "EC Regulation 852/2004 Annex II Chapter VII",
        severities: ["major", "critical"],
      },
      {
        code: "U29",
        category: "Structural & Facilities",
        text: "Staff changing facilities — Are adequate changing facilities provided for staff to change into and store protective clothing?",
        severities: ["minor"],
      },
      {
        code: "U30",
        category: "Structural & Facilities",
        text: "First aid provisions — Is a suitably stocked first aid kit available, including blue detectable plasters for food handlers?",
        severities: ["minor"],
      },
    ],
  },
  {
    key: "documentation_haccp",
    label: "Documentation & HACCP",
    items: [
      {
        code: "U31",
        category: "Documentation & HACCP",
        text: "HACCP-based food safety management system — Is a documented HACCP-based system (e.g. SFBB, Cooksafe, or bespoke HACCP plan) in place, implemented, and maintained?",
        detail: "Mandatory under EC Regulation 852/2004 Article 5; must be based on HACCP principles",
        severities: ["major", "critical"],
      },
      {
        code: "U32",
        category: "Documentation & HACCP",
        text: "Temperature monitoring records — Are fridge, freezer, cooking, cooling, and hot holding temperatures recorded at least daily with dates, times, and corrective actions noted?",
        severities: ["minor", "major"],
        hasEvidence: true,
      },
      {
        code: "U33",
        category: "Documentation & HACCP",
        text: "Cleaning records — Are cleaning schedules documented and cleaning activities recorded with dates, responsible persons, and chemicals used?",
        severities: ["minor"],
      },
      {
        code: "U34",
        category: "Documentation & HACCP",
        text: "Staff training records — Are records maintained for all food safety training including Level 2 certificates, induction training, allergen awareness, and refresher training?",
        severities: ["minor"],
      },
      {
        code: "U35",
        category: "Documentation & HACCP",
        text: "Supplier due diligence — Are records kept demonstrating that food is sourced from reputable, approved suppliers, including evidence of food safety certifications or audit reports?",
        severities: ["minor", "major"],
      },
      {
        code: "U36",
        category: "Documentation & HACCP",
        text: "Traceability — Can the business demonstrate traceability one step back (supplier) and one step forward (customer) for all food products?",
        detail: "EC Regulation 178/2002 Article 18 — 'one up, one down' traceability requirement",
        severities: ["major", "critical"],
      },
      {
        code: "U37",
        category: "Documentation & HACCP",
        text: "Complaint records — Is there a documented procedure for handling food safety complaints, with records of complaints received and actions taken?",
        severities: ["minor"],
      },
      {
        code: "U38",
        category: "Documentation & HACCP",
        text: "Corrective actions — Are corrective actions documented when food safety issues are identified, including root cause analysis and measures taken to prevent recurrence?",
        severities: ["minor", "major"],
      },
      {
        code: "U39",
        category: "Documentation & HACCP",
        text: "Annual review — Is the food safety management system reviewed at least annually (or when significant changes occur) and updated accordingly?",
        severities: ["minor", "major"],
      },
      {
        code: "U40",
        category: "Documentation & HACCP",
        text: "EHO inspection readiness — Is the business prepared for Environmental Health Officer inspections with all required documentation readily accessible and up to date?",
        detail: "Includes SFBB diary, temperature logs, cleaning records, training certificates, allergen information, and HACCP documentation",
        severities: ["minor"],
      },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════
// FSA_CONFIG — UK Food Standards Agency. Uses FSA-specific assessment
// items (U1-U40) based on the FHRS and UK food safety legislation.
// ══════════════════════════════════════════════════════════════════════

export const FSA_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "fsa",
  regionId: "uk",
  locale: "en-GB",
  labels: {
    frameworkName: "FSA Food Hygiene Compliance",
    frameworkShort: "FSA",
    licenceLabel: "Food Business Registration Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Safety Officer",
    certBody: "Food Standards Agency",
    assessmentTitle: "Food Hygiene Self-Assessment",
    assessmentSubtitle: "FSA Food Hygiene Rating Checklist",
    accentColor: "#1E40AF",
  },
  assessmentSections: FSA_ASSESSMENT_SECTIONS,
  scoring: {
    model: "letter_grade",
    tiers: [
      { min: 5, label: "5 – Very Good", color: "#10B981" },
      { min: 4, label: "4 – Good", color: "#22C55E" },
      { min: 3, label: "3 – Generally Satisfactory", color: "#F59E0B" },
      { min: 2, label: "2 – Improvement Necessary", color: "#F97316" },
      { min: 1, label: "1 – Major Improvement Necessary", color: "#EF4444" },
      { min: 0, label: "0 – Urgent Improvement Necessary", color: "#991B1B" },
    ],
  },
  assessmentFrameworkFilter: "fsa",
  features: {
    hasSupervisors: true,
    hasTrainingRegister: true,
    hasSeverityLevels: true,
    hasEvidenceChecks: true,
    hasStarRating: false,
    hasGradingSystem: true,
    hasHalalTracking: false,
  },
  supplier: {
    businessIdLabel: "Company Number",
    businessIdPlaceholder: "Companies House Number",
  },
  wizardSteps: [
    {
      key: "licence",
      title: "Food Business Registration",
      subtitle: "Enter your FSA food business registration details",
      fields: [
        { key: "bcc_licence_number", label: "Registration Number", type: "text", required: true },
        { key: "licence_expiry", label: "Registration Expiry", type: "date" },
        { key: "licence_displayed", label: "Registration Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss",
      title: "Food Safety Officer",
      subtitle: "Enter your Level 3 food safety officer details",
      fields: [
        { key: "name", label: "Officer Name", type: "text", required: true },
        { key: "certificate_number", label: "Certificate Number", type: "text" },
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
