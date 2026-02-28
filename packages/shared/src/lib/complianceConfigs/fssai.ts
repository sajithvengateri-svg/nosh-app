import { deriveFramework } from "../complianceConfig.ts";
import type { AssessmentSection, ComplianceFrameworkConfig } from "../complianceConfig.ts";

// ── FSSAI Schedule 4 Assessment Sections (F1-F40) ────────────────────

const FSSAI_ASSESSMENT_SECTIONS: AssessmentSection[] = [
  {
    key: "personal_hygiene",
    label: "Personal Hygiene",
    items: [
      { code: "F1", category: "Personal Hygiene", text: "All food handlers wear clean protective clothing, head covering, and footwear", severities: [] },
      { code: "F2", category: "Personal Hygiene", text: "Hands washed before handling food and after using toilet", severities: [] },
      { code: "F3", category: "Personal Hygiene", text: "No smoking, spitting, or chewing in food handling areas", severities: [] },
      { code: "F4", category: "Personal Hygiene", text: "Cuts and wounds covered with waterproof dressings", severities: [] },
      { code: "F5", category: "Personal Hygiene", text: "Food handlers free from communicable diseases (medical fitness certificates current)", severities: [] },
      { code: "F6", category: "Personal Hygiene", text: "Jewellery and watches removed before food handling", severities: [] },
    ],
  },
  {
    key: "premises",
    label: "Design & Facilities",
    items: [
      { code: "F7", category: "Design & Facilities", text: "Floors, walls and ceilings in good repair, clean, and impervious", severities: [] },
      { code: "F8", category: "Design & Facilities", text: "Adequate lighting and ventilation in all food areas", severities: [] },
      { code: "F9", category: "Design & Facilities", text: "Separate handwash basins with soap and drying facilities", severities: [] },
      { code: "F10", category: "Design & Facilities", text: "Adequate drainage and waste disposal systems", severities: [] },
      { code: "F11", category: "Design & Facilities", text: "Clean water supply adequate for all operations", severities: [] },
      { code: "F12", category: "Design & Facilities", text: "Toilet facilities clean and not opening directly into food areas", severities: [] },
      { code: "F13", category: "Design & Facilities", text: "Pest-proofing measures in place (screens, door strips, etc.)", severities: [] },
    ],
  },
  {
    key: "equipment",
    label: "Equipment & Utensils",
    items: [
      { code: "F14", category: "Equipment & Utensils", text: "Equipment and utensils made of food-grade materials, clean, and in good repair", severities: [] },
      { code: "F15", category: "Equipment & Utensils", text: "Thermometers available and calibrated for temperature monitoring", severities: [] },
      { code: "F16", category: "Equipment & Utensils", text: "Adequate refrigeration and cold storage available", severities: [] },
      { code: "F17", category: "Equipment & Utensils", text: "Separate cutting boards for raw and cooked foods", severities: [] },
      { code: "F18", category: "Equipment & Utensils", text: "Cleaning and sanitising schedule for all equipment maintained", severities: [] },
    ],
  },
  {
    key: "food_operations",
    label: "Food Operations",
    items: [
      { code: "F19", category: "Food Operations", text: "Raw materials sourced from approved/licensed suppliers", severities: [] },
      { code: "F20", category: "Food Operations", text: "Receiving inspection: temperature, condition, and expiry date checks", severities: [] },
      { code: "F21", category: "Food Operations", text: "Proper storage: FIFO, off floor, labelled, temperature controlled", severities: [] },
      { code: "F22", category: "Food Operations", text: "Cross-contamination prevention: separate storage for raw and cooked", severities: [] },
      { code: "F23", category: "Food Operations", text: "Cooking temperatures monitored (core temp \u226575\u00B0C)", severities: [] },
      { code: "F24", category: "Food Operations", text: "Cooling done within 2 hours (from 60\u00B0C to 21\u00B0C) and 4 hours (to 5\u00B0C)", severities: [] },
      { code: "F25", category: "Food Operations", text: "Hot holding maintained above 60\u00B0C", severities: [] },
      { code: "F26", category: "Food Operations", text: "Cold holding maintained below 5\u00B0C", severities: [] },
      { code: "F27", category: "Food Operations", text: "Reheating to \u226575\u00B0C before serving", severities: [] },
      { code: "F28", category: "Food Operations", text: "Oil/fat quality monitored; TPC levels within limits", severities: [] },
      { code: "F29", category: "Food Operations", text: "Packaging materials are food grade and labelled per FSSAI norms", severities: [] },
    ],
  },
  {
    key: "documentation",
    label: "Documentation & Records",
    items: [
      { code: "F30", category: "Documentation & Records", text: "FSSAI licence displayed at prominent location", severities: [] },
      { code: "F31", category: "Documentation & Records", text: "Temperature monitoring records maintained daily", severities: [] },
      { code: "F32", category: "Documentation & Records", text: "Cleaning and sanitisation records maintained", severities: [] },
      { code: "F33", category: "Documentation & Records", text: "Pest control records maintained", severities: [] },
      { code: "F34", category: "Documentation & Records", text: "Staff training records maintained (FOSTAC or equivalent)", severities: [] },
      { code: "F35", category: "Documentation & Records", text: "Supplier records with FSSAI licence numbers maintained", severities: [] },
      { code: "F36", category: "Documentation & Records", text: "Complaint register maintained and reviewed", severities: [] },
      { code: "F37", category: "Documentation & Records", text: "Recall/withdrawal procedure documented", severities: [] },
      { code: "F38", category: "Documentation & Records", text: "Water testing reports available (latest)", severities: [] },
      { code: "F39", category: "Documentation & Records", text: "Medical fitness certificates of food handlers available", severities: [] },
      { code: "F40", category: "Documentation & Records", text: "Food Safety Management Plan or HACCP plan documented", severities: [] },
    ],
  },
];

// ══════════════════════════════════════════════════════════════════════
// FSSAI_CONFIG — Inherits from BCC, overrides India-specific fields
// ══════════════════════════════════════════════════════════════════════

export const FSSAI_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "fssai",
  regionId: "in",
  locale: "en-IN",
  labels: {
    frameworkName: "FSSAI Compliance",
    frameworkShort: "FSSAI",
    licenceLabel: "FSSAI Licence Number",
    licenceFieldKey: "fssai_licence_number",
    supervisorRole: "FOSTAC Trainer",
    certBody: "Food Safety and Standards Authority of India",
    assessmentTitle: "FSSAI Self-Assessment",
    assessmentSubtitle: "Schedule 4 \u2014 Food Safety Audit Checklist",
    accentColor: "#FF9933",
  },
  assessmentSections: FSSAI_ASSESSMENT_SECTIONS,
  scoring: {
    model: "percentage",
    tiers: [
      { min: 80, label: "Compliant", color: "#10B981" },
      { min: 50, label: "Needs Improvement", color: "#F59E0B" },
      { min: 0, label: "Non-Compliant", color: "#EF4444" },
    ],
  },
  assessmentFrameworkFilter: "fssai",
  features: {
    hasSupervisors: false,
    hasTrainingRegister: false,
    hasSeverityLevels: false,
    hasEvidenceChecks: false,
    hasStarRating: false,
    hasGradingSystem: false,
    hasHalalTracking: false,
  },
  wizardSteps: [
    {
      key: "licence",
      title: "FSSAI Licence",
      subtitle: "Enter your FSSAI food business licence information",
      fields: [
        { key: "fssai_licence_number", label: "FSSAI Licence Number", type: "text", required: true, placeholder: "14-digit FSSAI number" },
        {
          key: "licence_type",
          label: "Licence Type",
          type: "select",
          options: [
            { label: "Registration (< 12 lakh turnover)", value: "registration" },
            { label: "State Licence (12 lakh \u2013 20 crore)", value: "state" },
            { label: "Central Licence (> 20 crore)", value: "central" },
          ],
        },
        { key: "licence_expiry", label: "Expiry Date", type: "date" },
        { key: "fostac_certified", label: "FOSTAC Certified", type: "boolean" },
      ],
    },
    {
      key: "sections",
      title: "Compliance Sections",
      subtitle: "Choose which compliance sections to enable",
      fields: [],
    },
  ],
  availableTabs: [
    "temp_grid", "burst", "overview", "actions", "a1a40",
    "receiving", "cleaning_bcc", "suppliers_bcc", "audit",
  ],
  supplier: {
    businessIdLabel: "GSTIN",
    businessIdPlaceholder: "GST Identification Number",
  },
});
