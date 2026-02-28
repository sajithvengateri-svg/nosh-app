import { deriveFramework } from "../complianceConfig.ts";
import type { ComplianceFrameworkConfig } from "../complianceConfig.ts";

/**
 * NSW Food Authority compliance config.
 * Derives from BCC (FSANZ baseline is identical), overriding only NSW-specific labels.
 */
export const NSW_FA_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "nsw_fa",
  regionId: "au",
  locale: "en-AU",
  labels: {
    frameworkName: "NSW Food Authority Compliance",
    frameworkShort: "NSW FA",
    licenceLabel: "Food Business Notification Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Safety Supervisor",
    certBody: "NSW Food Authority",
    assessmentTitle: "Self-Assessment",
    assessmentSubtitle: "NSW Food Safety Standards Checklist",
    accentColor: "#3B82F6",
  },
  scoring: {
    model: "star_rating",
    tiers: [
      { min: 5, label: "Excellent Performer", color: "#10B981" },
      { min: 4, label: "Very Good Performer", color: "#22C55E" },
      { min: 3, label: "Good Performer", color: "#F59E0B" },
      { min: 2, label: "Poor Performer", color: "#EF4444" },
      { min: 0, label: "Non-Compliant", color: "#DC2626" },
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
  assessmentFrameworkFilter: "nsw_fa",
  wizardSteps: [
    {
      key: "licence",
      title: "Food Business Notification",
      subtitle: "Enter your NSW Food Authority notification details",
      fields: [
        { key: "bcc_licence_number", label: "Notification Number", type: "text", required: true, placeholder: "e.g. NFN-12345" },
        { key: "licence_expiry", label: "Notification Expiry", type: "date" },
        { key: "licence_displayed", label: "Notification Displayed", type: "boolean" },
      ],
    },
    {
      key: "category",
      title: "Business Category",
      subtitle: "Select your food business category under NSW Food Act 2003",
      fields: [
        {
          key: "business_category",
          label: "Business Category",
          type: "select",
          options: [
            { label: "Category 1 — Higher risk (restaurant, caterer, manufacturer)", value: "category_1" },
            { label: "Category 2 — Lower risk (retail, packaged food)", value: "category_2" },
          ],
        },
      ],
    },
    {
      key: "fss",
      title: "Food Safety Supervisor",
      subtitle: "Every food business must have at least one FSS under NSW Food Act",
      fields: [
        { key: "name", label: "Supervisor Name", type: "text", required: true },
        { key: "certificate_number", label: "Certificate Number", type: "text" },
        { key: "certificate_date", label: "Certificate Date", type: "date" },
        { key: "notified_council", label: "Authority Notified", type: "boolean" },
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
