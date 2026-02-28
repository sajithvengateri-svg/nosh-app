import { deriveFramework } from "../complianceConfig.ts";
import type { ComplianceFrameworkConfig } from "../complianceConfig.ts";

/**
 * Victorian Department of Health compliance config.
 * Uses Scores on Doors (1-5) grading system.
 */

function vicScoresOnDoors(answers: Record<string, { status: string; severity?: string }>): number {
  const values = Object.values(answers);
  const criticals = values.filter((a) => a.status === "non_compliant" && a.severity === "critical").length;
  const majors = values.filter((a) => a.status === "non_compliant" && a.severity === "major").length;
  const minors = values.filter((a) => a.status === "non_compliant" && a.severity === "minor").length;

  if (majors >= 3 || criticals >= 2) return 1;
  if (criticals >= 1 || majors >= 1 || minors >= 6) return 2;
  if (minors >= 4) return 3;
  if (minors >= 1) return 4;
  return 5;
}

export const VIC_DH_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "vic_dh",
  regionId: "au",
  locale: "en-AU",
  labels: {
    frameworkName: "VIC Food Safety Compliance",
    frameworkShort: "VIC DH",
    licenceLabel: "Food Premises Registration Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Safety Supervisor",
    certBody: "Department of Health Victoria",
    assessmentTitle: "Self-Assessment",
    assessmentSubtitle: "Victorian Food Safety Standards Checklist",
    accentColor: "#6366F1",
  },
  scoring: {
    model: "star_rating",
    computeStarRating: vicScoresOnDoors,
    tiers: [
      { min: 5, label: "Excellent", color: "#10B981" },
      { min: 4, label: "Very Good", color: "#22C55E" },
      { min: 3, label: "Satisfactory", color: "#F59E0B" },
      { min: 2, label: "Needs Improvement", color: "#F97316" },
      { min: 1, label: "Action Required", color: "#EF4444" },
    ],
  },
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
  assessmentFrameworkFilter: "vic_dh",
  wizardSteps: [
    {
      key: "licence",
      title: "Food Premises Registration",
      subtitle: "Enter your Victorian food premises registration details",
      fields: [
        { key: "bcc_licence_number", label: "Registration Number", type: "text", required: true, placeholder: "e.g. FP-12345" },
        { key: "licence_expiry", label: "Registration Expiry", type: "date" },
        { key: "licence_displayed", label: "Registration Displayed", type: "boolean" },
      ],
    },
    {
      key: "category",
      title: "Food Premises Class",
      subtitle: "Select your food premises class under VIC Food Act 1984",
      fields: [
        {
          key: "business_category",
          label: "Premises Class",
          type: "select",
          options: [
            { label: "Class 1 — High risk (hospital, aged care, childcare)", value: "class_1" },
            { label: "Class 2 — Medium risk (restaurant, caterer, manufacturer)", value: "class_2" },
            { label: "Class 3 — Low risk (packaged food, low-risk retail)", value: "class_3" },
            { label: "Class 4 — Minimal risk (pre-packaged only)", value: "class_4" },
          ],
        },
      ],
    },
    {
      key: "fss",
      title: "Food Safety Supervisor",
      subtitle: "Class 1 and 2 premises must appoint an FSS",
      fields: [
        { key: "name", label: "Supervisor Name", type: "text", required: true },
        { key: "certificate_number", label: "Certificate Number", type: "text" },
        { key: "certificate_date", label: "Certificate Date", type: "date" },
        { key: "notified_council", label: "Council Notified", type: "boolean" },
      ],
    },
    {
      key: "sections",
      title: "Compliance Sections",
      subtitle: "Choose which sections to enable for your venue",
      fields: [],
    },
  ],
});
