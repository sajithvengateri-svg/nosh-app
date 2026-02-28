import { deriveFramework } from "../complianceConfig.ts";
import type { ComplianceFrameworkConfig } from "../complianceConfig.ts";

/** SA Health compliance config — Food Act 2001 (SA) */
export const SA_HEALTH_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "sa_health",
  regionId: "au",
  locale: "en-AU",
  labels: {
    frameworkName: "SA Health Food Safety Compliance",
    frameworkShort: "SA Health",
    licenceLabel: "Food Business Notification Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Safety Supervisor",
    certBody: "SA Health",
    assessmentTitle: "Self-Assessment",
    assessmentSubtitle: "SA Food Safety Standards Checklist",
    accentColor: "#DC2626",
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
  assessmentFrameworkFilter: "sa_health",
  wizardSteps: [
    {
      key: "licence", title: "Food Business Notification",
      subtitle: "Enter your SA Health food business notification details",
      fields: [
        { key: "bcc_licence_number", label: "Notification Number", type: "text", required: true, placeholder: "e.g. SA-12345" },
        { key: "licence_expiry", label: "Notification Expiry", type: "date" },
        { key: "licence_displayed", label: "Notification Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss", title: "Food Safety Supervisor",
      subtitle: "Appoint a Food Safety Supervisor under SA Food Act 2001",
      fields: [
        { key: "name", label: "Supervisor Name", type: "text", required: true },
        { key: "certificate_number", label: "Certificate Number", type: "text" },
        { key: "certificate_date", label: "Certificate Date", type: "date" },
        { key: "notified_council", label: "Council Notified", type: "boolean" },
      ],
    },
    { key: "sections", title: "Compliance Sections", subtitle: "Choose which sections to enable", fields: [] },
  ],
});
