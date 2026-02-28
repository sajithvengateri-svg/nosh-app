import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";

interface AuditIssue {
  title: string;
  description: string;
  category?: string;
}

export interface AuditReport {
  readiness_score: number;
  critical_issues: AuditIssue[];
  warnings: AuditIssue[];
  all_clear: string[];
  recommended_actions: AuditIssue[];
}

export function useChefAudit() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [isAuditing, setIsAuditing] = useState(false);
  const [latestReport, setLatestReport] = useState<AuditReport | null>(null);

  const runAudit = async (servicePeriod: string = "dinner"): Promise<AuditReport | null> => {
    if (!orgId) return null;
    setIsAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("chef-pre-service-audit", {
        body: { orgId, date: new Date().toISOString().split("T")[0], servicePeriod, triggerType: "manual" },
      });
      if (error) throw error;
      const report = data as AuditReport;
      setLatestReport(report);
      return report;
    } finally {
      setIsAuditing(false);
    }
  };

  const clearReport = () => setLatestReport(null);

  return { runAudit, latestReport, isAuditing, clearReport };
}
