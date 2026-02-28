import { deriveFramework } from "../complianceConfig.ts";
import type { ComplianceFrameworkConfig } from "../complianceConfig.ts";

/** TAS Department of Health compliance config — Food Act 2003 (TAS) */
export const TAS_DOH_CONFIG: ComplianceFrameworkConfig = deriveFramework({
  id: "tas_doh",
  regionId: "au",
  locale: "en-AU",
  labels: {
    frameworkName: "TAS Food Safety Compliance",
    frameworkShort: "TAS DOH",
    licenceLabel: "Food Business Registration Number",
    licenceFieldKey: "bcc_licence_number",
    supervisorRole: "Food Safety Supervisor",
    certBody: "Department of Health Tasmania",
    assessmentTitle: "Self-Assessment",
    assessmentSubtitle: "Tasmanian Food Safety Standards Checklist",
    accentColor: "#059669",
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
  assessmentFrameworkFilter: "tas_doh",
  wizardSteps: [
    {
      key: "licence", title: "Food Business Registration",
      subtitle: "Enter your Tasmanian food business registration details",
      fields: [
        { key: "bcc_licence_number", label: "Registration Number", type: "text", required: true, placeholder: "e.g. TAS-12345" },
        { key: "licence_expiry", label: "Registration Expiry", type: "date" },
        { key: "licence_displayed", label: "Registration Displayed", type: "boolean" },
      ],
    },
    {
      key: "fss", title: "Food Safety Supervisor",
      subtitle: "Appoint a Food Safety Supervisor under TAS Food Act 2003",
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
