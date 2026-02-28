import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Zap,
  Save,
  Clock,
  Mail,
  MessageSquare,
  Gift,
  CalendarCheck,
  Heart,
  Bell,
  ClipboardCheck,
  Send,
  Sparkles,
} from "lucide-react";
import type {
  VFAutomation,
  VFAutomationTrigger,
  VFAutomationQueueStatus,
} from "@/lib/shared/types/venueflow.types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TRIGGER_META: Record<
  VFAutomationTrigger,
  { label: string; description: string; icon: React.ReactNode }
> = {
  POST_EVENT_THANKYOU: {
    label: "Post-Event Thank You",
    description: "Thank you email 24h after event completion",
    icon: <Heart className="w-5 h-5 text-vf-rose" />,
  },
  FEEDBACK_REQUEST: {
    label: "Feedback Request",
    description: "Request feedback and reviews 48h after event",
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
  },
  REFERRAL_INVITE: {
    label: "Referral Invite",
    description: "Invite client to refer friends 7 days after event",
    icon: <Gift className="w-5 h-5 text-purple-500" />,
  },
  ANNIVERSARY_OUTREACH: {
    label: "Anniversary Outreach",
    description: "Reach out on the anniversary of their event",
    icon: <CalendarCheck className="w-5 h-5 text-vf-gold" />,
  },
  DEPOSIT_REMINDER: {
    label: "Deposit Reminder",
    description: "Remind client about outstanding deposit after 48h",
    icon: <Bell className="w-5 h-5 text-amber-500" />,
  },
  FOLLOW_UP_NUDGE: {
    label: "Follow-Up Nudge",
    description: "Nudge after no response to proposal for 72h",
    icon: <Send className="w-5 h-5 text-teal-500" />,
  },
  PRE_EVENT_CHECKLIST: {
    label: "Pre-Event Checklist",
    description: "Send event preparation checklist 7 days before event",
    icon: <ClipboardCheck className="w-5 h-5 text-emerald-500" />,
  },
};

const ALL_TRIGGERS: VFAutomationTrigger[] = [
  "POST_EVENT_THANKYOU",
  "FEEDBACK_REQUEST",
  "REFERRAL_INVITE",
  "ANNIVERSARY_OUTREACH",
  "DEPOSIT_REMINDER",
  "FOLLOW_UP_NUDGE",
  "PRE_EVENT_CHECKLIST",
];

const DEFAULT_AUTOMATIONS: Record<
  VFAutomationTrigger,
  { delay_hours: number; email_subject: string; email_body: string; sms_template: string }
> = {
  POST_EVENT_THANKYOU: {
    delay_hours: 24,
    email_subject: "Thank you for celebrating with us!",
    email_body:
      "Dear {{client_name}},\n\nThank you for choosing our venue for your special event. We hope you and your guests had a wonderful experience.\n\nWe would love to host you again in the future.\n\nWarm regards,\n{{venue_name}}",
    sms_template: "Thank you for celebrating with us, {{client_name}}! We hope you had a wonderful time.",
  },
  FEEDBACK_REQUEST: {
    delay_hours: 48,
    email_subject: "How was your experience? We'd love your feedback",
    email_body:
      "Dear {{client_name}},\n\nWe hope your event was everything you hoped for. We would greatly appreciate your feedback to help us continue improving.\n\nPlease take a moment to share your experience.\n\nThank you,\n{{venue_name}}",
    sms_template: "",
  },
  REFERRAL_INVITE: {
    delay_hours: 168,
    email_subject: "Know someone planning an event? Refer a friend!",
    email_body:
      "Dear {{client_name}},\n\nWe are so glad you enjoyed your event with us. If you know anyone planning a special occasion, we would be honoured to host them.\n\nRefer a friend and receive a special thank-you from our team.\n\nBest regards,\n{{venue_name}}",
    sms_template: "",
  },
  ANNIVERSARY_OUTREACH: {
    delay_hours: 0,
    email_subject: "Happy Anniversary! Celebrate with us again",
    email_body:
      "Dear {{client_name}},\n\nIt has been a year since your wonderful event at our venue. We would love to help you celebrate again this year.\n\nContact us to book your next event with a special returning-client offer.\n\nWarm regards,\n{{venue_name}}",
    sms_template: "",
  },
  DEPOSIT_REMINDER: {
    delay_hours: 48,
    email_subject: "Friendly reminder: Your deposit is awaiting",
    email_body:
      "Dear {{client_name}},\n\nThis is a friendly reminder that your deposit for your upcoming event is still outstanding. Please complete your payment to secure your date.\n\nIf you have any questions, please do not hesitate to reach out.\n\nThank you,\n{{venue_name}}",
    sms_template:
      "Hi {{client_name}}, just a friendly reminder about your deposit for your upcoming event. Please get in touch if you need any help.",
  },
  FOLLOW_UP_NUDGE: {
    delay_hours: 72,
    email_subject: "Just checking in on your event plans",
    email_body:
      "Dear {{client_name}},\n\nWe wanted to follow up regarding the proposal we sent for your upcoming event. We are happy to answer any questions or make adjustments.\n\nWe would love to make your event special.\n\nBest regards,\n{{venue_name}}",
    sms_template: "",
  },
  PRE_EVENT_CHECKLIST: {
    delay_hours: 168,
    email_subject: "Your event is coming up! Here's your checklist",
    email_body:
      "Dear {{client_name}},\n\nYour event is just around the corner. Here is a quick checklist to ensure everything runs smoothly:\n\n- Confirm final guest count\n- Review menu selections\n- Confirm arrival time and setup requirements\n- Share any dietary requirements\n- Confirm AV/entertainment needs\n\nPlease do not hesitate to contact us with any questions.\n\nSee you soon,\n{{venue_name}}",
    sms_template: "Hi {{client_name}}, your event is coming up soon! Please confirm your final guest count and any last-minute details.",
  },
};

const QUEUE_STATUS_BADGE: Record<VFAutomationQueueStatus, { className: string; label: string }> = {
  PENDING: { className: "bg-blue-500/10 text-blue-700 border-blue-200", label: "Pending" },
  SENT: { className: "bg-emerald-500/10 text-emerald-700 border-emerald-200", label: "Sent" },
  FAILED: { className: "bg-red-500/10 text-red-700 border-red-200", label: "Failed" },
  CANCELLED: { className: "bg-slate-500/10 text-slate-600 border-slate-200", label: "Cancelled" },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AutomationFormState {
  delay_hours: number;
  email_subject: string;
  email_body: string;
  sms_template: string;
  is_active: boolean;
}

interface QueueItemJoined {
  id: string;
  automation_id: string;
  client_id: string;
  function_id: string | null;
  scheduled_for: string;
  status: VFAutomationQueueStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  automation_trigger_type?: VFAutomationTrigger;
  client_name?: string;
}

// ---------------------------------------------------------------------------
// Component: VFAutomations
// ---------------------------------------------------------------------------

const VFAutomations: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  const [savingTrigger, setSavingTrigger] = useState<VFAutomationTrigger | null>(null);
  const [creatingDefaults, setCreatingDefaults] = useState(false);
  const [queueFilter, setQueueFilter] = useState<"ALL" | VFAutomationQueueStatus>("ALL");
  const [formOverrides, setFormOverrides] = useState<
    Partial<Record<VFAutomationTrigger, Partial<AutomationFormState>>>
  >({});

  // -------------------------------------------------------------------------
  // Query: Automations
  // -------------------------------------------------------------------------

  const {
    data: automations = [],
    isLoading: loadingAutomations,
  } = useQuery({
    queryKey: ["vf_automations", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vf_automations" as any)
        .select("*")
        .eq("org_id", orgId!) as any);
      if (error) throw error;
      return (data ?? []) as VFAutomation[];
    },
    enabled: !!orgId,
  });

  // -------------------------------------------------------------------------
  // Query: Queue items (last 50)
  // -------------------------------------------------------------------------

  const {
    data: queueItems = [],
    isLoading: loadingQueue,
  } = useQuery({
    queryKey: ["vf_automation_queue", orgId],
    queryFn: async () => {
      // Fetch queue items
      const { data: queueData, error: queueError } = await (supabase
        .from("vf_automation_queue" as any)
        .select("*")
        .eq("org_id", orgId!)
        .order("scheduled_for", { ascending: false })
        .limit(50) as any);
      if (queueError) throw queueError;

      const items = (queueData ?? []) as any[];

      // Fetch client names for the queue items
      const clientIds = [...new Set(items.map((i: any) => i.client_id).filter(Boolean))];
      let clientMap: Record<string, string> = {};

      if (clientIds.length > 0) {
        const { data: clients } = await (supabase
          .from("res_function_clients")
          .select("id, contact_name")
          .in("id", clientIds) as any);
        if (clients) {
          for (const c of clients) {
            clientMap[c.id] = c.contact_name;
          }
        }
      }

      // Build automation lookup for trigger_type
      const automationMap: Record<string, VFAutomationTrigger> = {};
      for (const a of automations) {
        automationMap[a.id] = a.trigger_type;
      }

      return items.map((item: any) => ({
        ...item,
        automation_trigger_type: automationMap[item.automation_id] ?? null,
        client_name: clientMap[item.client_id] ?? "Unknown Client",
      })) as QueueItemJoined[];
    },
    enabled: !!orgId && !loadingAutomations,
  });

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const automationByTrigger = useMemo(() => {
    const map: Partial<Record<VFAutomationTrigger, VFAutomation>> = {};
    for (const a of automations) {
      map[a.trigger_type] = a;
    }
    return map;
  }, [automations]);

  const hasAutomations = automations.length > 0;

  const filteredQueue = useMemo(() => {
    if (queueFilter === "ALL") return queueItems;
    return queueItems.filter((item) => item.status === queueFilter);
  }, [queueItems, queueFilter]);

  // -------------------------------------------------------------------------
  // Get form value (override or database value or default)
  // -------------------------------------------------------------------------

  function getFormValue(trigger: VFAutomationTrigger): AutomationFormState {
    const existing = automationByTrigger[trigger];
    const override = formOverrides[trigger];

    return {
      delay_hours: override?.delay_hours ?? existing?.delay_hours ?? DEFAULT_AUTOMATIONS[trigger].delay_hours,
      email_subject: override?.email_subject ?? existing?.email_subject ?? DEFAULT_AUTOMATIONS[trigger].email_subject,
      email_body: override?.email_body ?? existing?.email_body ?? DEFAULT_AUTOMATIONS[trigger].email_body,
      sms_template: override?.sms_template ?? existing?.sms_template ?? DEFAULT_AUTOMATIONS[trigger].sms_template,
      is_active: override?.is_active ?? existing?.is_active ?? true,
    };
  }

  function updateFormField(trigger: VFAutomationTrigger, field: keyof AutomationFormState, value: any) {
    setFormOverrides((prev) => ({
      ...prev,
      [trigger]: {
        ...prev[trigger],
        [field]: value,
      },
    }));
  }

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleSave = async (trigger: VFAutomationTrigger) => {
    if (!orgId) return;
    setSavingTrigger(trigger);

    const formValues = getFormValue(trigger);
    const existing = automationByTrigger[trigger];

    try {
      if (existing) {
        const { error } = await (supabase
          .from("vf_automations" as any)
          .update({
            delay_hours: formValues.delay_hours,
            email_subject: formValues.email_subject,
            email_body: formValues.email_body,
            sms_template: formValues.sms_template || null,
            is_active: formValues.is_active,
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", existing.id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase
          .from("vf_automations" as any)
          .insert({
            org_id: orgId,
            trigger_type: trigger,
            delay_hours: formValues.delay_hours,
            email_subject: formValues.email_subject,
            email_body: formValues.email_body,
            sms_template: formValues.sms_template || null,
            is_active: formValues.is_active,
          } as any) as any);
        if (error) throw error;
      }

      // Clear override for this trigger
      setFormOverrides((prev) => {
        const next = { ...prev };
        delete next[trigger];
        return next;
      });

      toast.success(`${TRIGGER_META[trigger].label} saved`);
      qc.invalidateQueries({ queryKey: ["vf_automations", orgId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save automation");
    } finally {
      setSavingTrigger(null);
    }
  };

  const handleCreateDefaults = async () => {
    if (!orgId) return;
    setCreatingDefaults(true);

    try {
      const rows = ALL_TRIGGERS.map((trigger) => ({
        org_id: orgId,
        trigger_type: trigger,
        delay_hours: DEFAULT_AUTOMATIONS[trigger].delay_hours,
        email_subject: DEFAULT_AUTOMATIONS[trigger].email_subject,
        email_body: DEFAULT_AUTOMATIONS[trigger].email_body,
        sms_template: DEFAULT_AUTOMATIONS[trigger].sms_template || null,
        is_active: true,
      }));

      const { error } = await (supabase
        .from("vf_automations" as any)
        .insert(rows as any) as any);
      if (error) throw error;

      toast.success("Default automations created successfully");
      qc.invalidateQueries({ queryKey: ["vf_automations", orgId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to create default automations");
    } finally {
      setCreatingDefaults(false);
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!orgId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select an organization to view automations.
      </div>
    );
  }

  if (loadingAutomations) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-sm text-vf-navy/60">Loading automations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vf-cream">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-9 h-9 rounded-lg bg-vf-navy flex items-center justify-center">
            <Zap className="w-5 h-5 text-vf-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-vf-navy font-display">Automations</h1>
            <p className="text-sm text-vf-navy/60">
              Configure automated emails and SMS for your event lifecycle
            </p>
          </div>
        </div>

        {/* Default automations prompt */}
        {!hasAutomations && (
          <Card className="border-vf-gold/30 bg-vf-gold/5">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-vf-gold/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-vf-gold" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-vf-navy font-display">
                  No automations configured yet
                </h3>
                <p className="text-sm text-vf-navy/60 mt-1 max-w-md mx-auto">
                  Set up default automations to automatically send thank-you emails, feedback
                  requests, deposit reminders, and more throughout the event lifecycle.
                </p>
              </div>
              <Button
                onClick={handleCreateDefaults}
                disabled={creatingDefaults}
                className="bg-vf-gold hover:bg-vf-gold/90 text-white"
              >
                {creatingDefaults ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Set up default automations
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Automation Cards */}
        <div className="space-y-4">
          {ALL_TRIGGERS.map((trigger) => {
            const meta = TRIGGER_META[trigger];
            const form = getFormValue(trigger);
            const isSaving = savingTrigger === trigger;

            return (
              <Card key={trigger} className="border-0 shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-vf-cream flex items-center justify-center">
                        {meta.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-vf-navy">
                          {meta.label}
                        </CardTitle>
                        <p className="text-xs text-vf-navy/50 mt-0.5">{meta.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label htmlFor={`toggle-${trigger}`} className="text-xs text-vf-navy/50">
                        {form.is_active ? "Active" : "Inactive"}
                      </Label>
                      <Switch
                        id={`toggle-${trigger}`}
                        checked={form.is_active}
                        onCheckedChange={(checked) =>
                          updateFormField(trigger, "is_active", checked)
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Delay hours */}
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-vf-navy/40 shrink-0" />
                    <Label className="text-sm text-vf-navy/70 shrink-0 w-24">Delay (hours)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={8760}
                      className="w-24 bg-vf-cream/50 border-vf-navy/10"
                      value={form.delay_hours}
                      onChange={(e) =>
                        updateFormField(trigger, "delay_hours", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>

                  {/* Email subject */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-vf-navy/40" />
                      <Label className="text-sm text-vf-navy/70">Email Subject</Label>
                    </div>
                    <Input
                      className="bg-vf-cream/50 border-vf-navy/10"
                      value={form.email_subject}
                      onChange={(e) => updateFormField(trigger, "email_subject", e.target.value)}
                      placeholder="Email subject line..."
                    />
                  </div>

                  {/* Email body */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-vf-navy/70">Email Body</Label>
                    <Textarea
                      className="bg-vf-cream/50 border-vf-navy/10 min-h-[120px] resize-y"
                      value={form.email_body}
                      onChange={(e) => updateFormField(trigger, "email_body", e.target.value)}
                      placeholder="Email body content. Use {{client_name}}, {{venue_name}} as placeholders..."
                    />
                  </div>

                  {/* SMS template (optional) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-vf-navy/40" />
                      <Label className="text-sm text-vf-navy/70">SMS Template (optional)</Label>
                    </div>
                    <Textarea
                      className="bg-vf-cream/50 border-vf-navy/10 min-h-[60px] resize-y"
                      value={form.sms_template}
                      onChange={(e) => updateFormField(trigger, "sms_template", e.target.value)}
                      placeholder="Leave blank to skip SMS for this automation..."
                    />
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={() => handleSave(trigger)}
                      disabled={isSaving}
                      size="sm"
                      className="bg-vf-navy hover:bg-vf-navy/90 text-white"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ================================================================
            Queue Monitor Section
            ================================================================ */}
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-vf-navy flex items-center justify-center">
              <Clock className="w-5 h-5 text-vf-gold" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-vf-navy font-display">Queue Monitor</h2>
              <p className="text-sm text-vf-navy/60">Track scheduled and sent automations</p>
            </div>
          </div>

          <Tabs value={queueFilter} onValueChange={(v) => setQueueFilter(v as any)}>
            <TabsList className="bg-white border border-vf-navy/10">
              <TabsTrigger value="ALL" className="text-xs">
                All
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5">
                  {queueItems.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="PENDING" className="text-xs">
                Pending
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5 bg-blue-500/10 text-blue-700">
                  {queueItems.filter((i) => i.status === "PENDING").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="SENT" className="text-xs">
                Sent
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5 bg-emerald-500/10 text-emerald-700">
                  {queueItems.filter((i) => i.status === "SENT").length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="FAILED" className="text-xs">
                Failed
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5 bg-red-500/10 text-red-700">
                  {queueItems.filter((i) => i.status === "FAILED").length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={queueFilter} className="mt-4">
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-0">
                  {loadingQueue ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-vf-navy/30" />
                    </div>
                  ) : filteredQueue.length === 0 ? (
                    <div className="py-12 text-center">
                      <Clock className="w-8 h-8 text-vf-navy/20 mx-auto mb-2" />
                      <p className="text-sm text-vf-navy/40">No automation queue items</p>
                      <p className="text-xs text-vf-navy/30 mt-1">
                        Scheduled automations will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-vf-navy/5">
                            <TableHead className="text-xs text-vf-navy/50">Type</TableHead>
                            <TableHead className="text-xs text-vf-navy/50">Client</TableHead>
                            <TableHead className="text-xs text-vf-navy/50">Scheduled For</TableHead>
                            <TableHead className="text-xs text-vf-navy/50">Status</TableHead>
                            <TableHead className="text-xs text-vf-navy/50">Sent At</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredQueue.map((item) => {
                            const triggerType = item.automation_trigger_type;
                            const triggerLabel = triggerType
                              ? TRIGGER_META[triggerType]?.label ?? triggerType
                              : "Unknown";
                            const statusBadge = QUEUE_STATUS_BADGE[item.status];

                            return (
                              <TableRow key={item.id} className="border-vf-navy/5">
                                <TableCell className="text-sm text-vf-navy font-medium">
                                  <div className="flex items-center gap-2">
                                    {triggerType && TRIGGER_META[triggerType] && (
                                      <span className="shrink-0">
                                        {TRIGGER_META[triggerType].icon}
                                      </span>
                                    )}
                                    <span className="truncate max-w-[150px]">{triggerLabel}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-vf-navy/70">
                                  {item.client_name}
                                </TableCell>
                                <TableCell className="text-sm text-vf-navy/70">
                                  {format(parseISO(item.scheduled_for), "d MMM yyyy, h:mm a")}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${statusBadge.className}`}
                                  >
                                    {statusBadge.label}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-vf-navy/50">
                                  {item.sent_at
                                    ? format(parseISO(item.sent_at), "d MMM yyyy, h:mm a")
                                    : "--"}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VFAutomations;
