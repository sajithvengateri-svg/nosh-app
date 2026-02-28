import { createContext, useContext } from "react";
import { useCompliance } from "../hooks/useCompliance";
import type { ComplianceFrameworkConfig } from "@queitos/shared";

type ComplianceContextValue = ReturnType<typeof useCompliance>;

const ComplianceContext = createContext<ComplianceContextValue | null>(null);

interface ComplianceProviderProps {
  children: React.ReactNode;
  /** Override the auto-detected framework config (useful for testing) */
  overrideConfig?: ComplianceFrameworkConfig;
}

/**
 * Provides compliance config + data + mutations to the component tree.
 * Wrap any route that needs compliance data in this provider.
 *
 * The framework is auto-detected from APP_VARIANT unless overrideConfig is passed.
 */
export function ComplianceProvider({ children, overrideConfig }: ComplianceProviderProps) {
  const compliance = useCompliance(overrideConfig);
  return (
    <ComplianceContext.Provider value={compliance}>
      {children}
    </ComplianceContext.Provider>
  );
}

/**
 * Access compliance config, profile, mutations, etc. from any child component.
 * Must be inside a <ComplianceProvider>.
 */
export function useComplianceContext(): ComplianceContextValue {
  const ctx = useContext(ComplianceContext);
  if (!ctx) {
    throw new Error("useComplianceContext must be used within a <ComplianceProvider>");
  }
  return ctx;
}
