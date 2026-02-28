import { deriveFramework } from "../complianceConfig.ts";
import type { ComplianceFrameworkConfig } from "../complianceConfig.ts";

/** ACT Health compliance config — Food Act 2001 (ACT) */
export const ACT_HEALTH_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "act_health",
  regionId: "au",
  locale: "en-AU",
  labels: {
    frameworkName: "ACT Food Safety Compliance",
    frameworkShort: "ACT Health",
    licenceLabel: "Food Business Registration Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Safety Supervisor",
    certBody: "ACT Health",
    assessmentTitle: "Self-Assessment",
    assessmentSubtitle: "ACT Food Safety Standards Checklist",
    accentColor: "#3B82F6",
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
  supplier: { businessIdLabel: "ABN", businessIdPlaceholder: "Australian Business Number" },
  assessmentFrameworkFilter: "act_health",
  wizardSteps: [
    {
      key: "licence", title: "Food Business Registration",
      subtitle: "Enter your ACT food business registration details",
      fields: [
        { key: "bcc_licence_number", label: "Registration Number", type: "text", required: true, placeholder: "e.g. ACT-12345" },
        { key: "licence_expiry", label: "Registration Expiry", type: "date" },
        { key: "licence_displayed", label: "Registration Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss", title: "Food Safety Supervisor",
      subtitle: "Appoint a Food Safety Supervisor under ACT Food Act 2001",
      fields: [
        { key: "name", label: "Supervisor Name", type: "text", required: true },
        { key: "certificate_number", label: "Certificate Number", type: "text" },
        { key: "certificate_date", label: "Certificate Date", type: "date" },
        { key: "notified_council", label: "Authority Notified", type: "boolean" },
      ],
    },
    { key: "sections", title: "Compliance Sections", subtitle: "Choose which sections to enable", fields: [] },
  ],
});
