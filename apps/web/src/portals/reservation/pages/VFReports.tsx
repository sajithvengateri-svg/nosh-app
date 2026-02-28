import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  FileBarChart, Mail, Clock, BarChart3, CalendarDays,
  Calendar, Loader2, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const REPORT_TYPES = [
  {
    type: "DAILY_SUMMARY",
    label: "Daily Summary",
    description: "Today's events, new inquiries, overdue follow-ups, deposits due",
    icon: <Clock className="w-5 h-5" />,
    frequency: "Every morning at 7:00 AM",
  },
  {
    type: "WEEKLY_DIGEST",
    label: "Weekly Digest",
    description: "Pipeline summary, conversion rates, revenue this week vs last, room utilisation",
    icon: <CalendarDays className="w-5 h-5" />,
    frequency: "Every Monday at 8:00 AM",
  },
  {
    type: "MONTHLY_ANALYTICS",
    label: "Monthly Analytics",
    description: "Full analytics digest, top referrers, lead source ROI, anniversary reactivations due",
    icon: <Calendar className="w-5 h-5" />,
    frequency: "1st of each month at 9:00 AM",
  },
];

const VFReports = () => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const userId = user?.id;
  const qc = useQueryClient();

  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ["vf_report_preferences", orgId, userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("vf_report_preferences")
        .select("*")
        .eq("org_id", orgId!)
        .eq("user_id", userId!);
      return data ?? [];
    },
    enabled: !!orgId && !!userId,
  });

  const getPref = (reportType: string) => {
    return preferences.find((p: any) => p.report_type === reportType);
  };

  const toggleReport = async (reportType: string, enabled: boolean) => {
    if (!orgId || !userId) return;
    const existing = getPref(reportType);
    if (existing) {
      const { error } = await supabase
        .from("vf_report_preferences")
        .update({ is_enabled: enabled } as any)
        .eq("id", (existing as any).id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase
        .from("vf_report_preferences")
        .insert({
          org_id: orgId,
          user_id: userId,
          report_type: reportType,
          is_enabled: enabled,
        } as any);
      if (error) { toast.error(error.message); return; }
    }
    toast.success(enabled ? "Report enabled" : "Report disabled");
    qc.invalidateQueries({ queryKey: ["vf_report_preferences"] });
  };

  const updateEmail = async (reportType: string, email: string) => {
    if (!orgId || !userId) return;
    const existing = getPref(reportType);
    if (existing) {
      const { error } = await supabase
        .from("vf_report_preferences")
        .update({ delivery_email: email || null } as any)
        .eq("id", (existing as any).id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase
        .from("vf_report_preferences")
        .insert({
          org_id: orgId,
          user_id: userId,
          report_type: reportType,
          is_enabled: true,
          delivery_email: email || null,
        } as any);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Email updated");
    qc.invalidateQueries({ queryKey: ["vf_report_preferences"] });
  };

  const enabledCount = preferences.filter((p: any) => p.is_enabled).length;

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-vf-charcoal">
          <FileBarChart className="w-6 h-6 text-vf-gold" /> Reports
        </h1>
        <Badge variant="secondary" className="bg-vf-gold/10 text-vf-gold">
          {enabledCount} active
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        Configure automated email reports to stay on top of your venue's performance.
        Reports are sent to your account email unless you specify an override.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-vf-gold" /></div>
      ) : (
        <div className="space-y-4">
          {REPORT_TYPES.map(report => {
            const pref = getPref(report.type);
            const isEnabled = (pref as any)?.is_enabled ?? false;
            const deliveryEmail = (pref as any)?.delivery_email || "";
            return (
              <Card key={report.type} className={`border-vf-gold/10 transition-colors ${isEnabled ? "border-l-4 border-l-vf-gold" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${isEnabled ? "bg-vf-gold/10 text-vf-gold" : "bg-muted text-muted-foreground"}`}>
                      {report.icon}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-vf-charcoal">{report.label}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(v) => toggleReport(report.type, v)}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{report.frequency}</span>
                      </div>
                      {isEnabled && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs shrink-0">Override email:</Label>
                          <Input
                            type="email"
                            placeholder="Uses account email by default"
                            value={deliveryEmail}
                            onChange={e => {/* local only */}}
                            onBlur={e => {
                              if (e.target.value !== deliveryEmail) {
                                updateEmail(report.type, e.target.value);
                              }
                            }}
                            className="h-8 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-vf-gold/10 bg-vf-gold/5">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-vf-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-sm text-vf-charcoal">How Reports Work</h3>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                <li>Reports are generated and sent automatically based on the schedule above</li>
                <li>They include real-time data from your pipeline, events, and analytics</li>
                <li>HTML emails with inline charts are delivered to your inbox</li>
                <li>Toggle reports on/off at any time — changes take effect immediately</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VFReports;
