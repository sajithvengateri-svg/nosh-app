import { deriveFramework } from "../complianceConfig.ts";
import type { ComplianceFrameworkConfig } from "../complianceConfig.ts";

/** NT Department of Health compliance config — Food Act 2004 (NT) */
export const NT_DOH_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "nt_doh",
  regionId: "au",
  locale: "en-AU",
  labels: {
    frameworkName: "NT Food Safety Compliance",
    frameworkShort: "NT DOH",
    licenceLabel: "Food Business Registration Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Safety Supervisor",
    certBody: "NT Department of Health",
    assessmentTitle: "Self-Assessment",
    assessmentSubtitle: "NT Food Safety Standards Checklist",
    accentColor: "#F59E0B",
  },
  features: {
    hasSupervisors: true,
    hasTrainingRegister: true,
    hasSeverityLevels: true,
    hasEvidenceChecks: true,
    hasStarRating: false,
    hasGradingSystem: false,
    hasHalalTracking: false,
  },
  supplier: { businessIdLabel: "ABN", businessIdPlaceholder: "Australian Business Number" },
  assessmentFrameworkFilter: "nt_doh",
  wizardSteps: [
    {
      key: "licence", title: "Food Business Registration",
      subtitle: "Enter your NT food business registration details",
      fields: [
        { key: "bcc_licence_number", label: "Registration Number", type: "text", required: true, placeholder: "e.g. NT-12345" },
        { key: "licence_expiry", label: "Registration Expiry", type: "date" },
        { key: "licence_displayed", label: "Registration Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss", title: "Food Safety Supervisor",
      subtitle: "Appoint a Food Safety Supervisor under NT Food Act 2004",
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
