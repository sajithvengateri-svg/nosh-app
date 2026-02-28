import React, { useState, useMemo, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Target,
  Flame,
  Thermometer,
  Snowflake,
  Users,
  TrendingUp,
  BarChart3,
  Mail,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Save,
  UserPlus,
  Ban,
  Sparkles,
  X,
  Plus,
  Crown,
  ArrowUpRight,
  Phone,
} from "lucide-react";
import type {
  VFLead,
  VFLeadTemperature,
  VFLeadStatus,
  VFLeadPlanTier,
  VFLeadSubscription,
  VFTargetingPrefs,
} from "@/lib/shared/types/venueflow.types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEMPERATURE_CONFIG: Record<
  VFLeadTemperature,
  { icon: React.ReactNode; className: string; label: string }
> = {
  COLD: {
    icon: <Snowflake className="w-3.5 h-3.5" />,
    className: "bg-blue-500/10 text-blue-700 border-blue-200",
    label: "Cold",
  },
  WARM: {
    icon: <Thermometer className="w-3.5 h-3.5" />,
    className: "bg-amber-500/10 text-amber-700 border-amber-200",
    label: "Warm",
  },
  HOT: {
    icon: <Flame className="w-3.5 h-3.5" />,
    className: "bg-red-500/10 text-red-700 border-red-200",
    label: "Hot",
  },
};

const STATUS_CONFIG: Record<VFLeadStatus, { className: string; label: string }> = {
  DELIVERED: { className: "bg-slate-500/10 text-slate-600 border-slate-200", label: "Delivered" },
  OPENED: { className: "bg-blue-500/10 text-blue-700 border-blue-200", label: "Opened" },
  CLICKED: { className: "bg-indigo-500/10 text-indigo-700 border-indigo-200", label: "Clicked" },
  INQUIRED: { className: "bg-amber-500/10 text-amber-700 border-amber-200", label: "Inquired" },
  CONVERTED: { className: "bg-emerald-500/10 text-emerald-700 border-emerald-200", label: "Converted" },
  UNSUBSCRIBED: { className: "bg-red-500/10 text-red-700 border-red-200", label: "Do Not Contact" },
};

const NICHE_OPTIONS = [
  "Corporate",
  "Wedding Planners",
  "Law Firms",
  "Real Estate",
  "Tech Companies",
  "Birthday",
] as const;

// ---------------------------------------------------------------------------
// Component: VFLeads
// ---------------------------------------------------------------------------

const VFLeads: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  // Local state
  const [targetingOpen, setTargetingOpen] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [convertingIds, setConvertingIds] = useState<Set<string>>(new Set());
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [filterTemperature, setFilterTemperature] = useState<"ALL" | VFLeadTemperature>("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | VFLeadStatus>("ALL");
  const [bulkConverting, setBulkConverting] = useState(false);

  // Targeting preferences local state
  const [localNiches, setLocalNiches] = useState<string[]>([]);
  const [localRadius, setLocalRadius] = useState<number>(25);
  const [localKeywords, setLocalKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [prefsInitialized, setPrefsInitialized] = useState(false);

  // -------------------------------------------------------------------------
  // Query: Plan Tiers
  // -------------------------------------------------------------------------

  const {
    data: planTiers = [],
    isLoading: loadingTiers,
  } = useQuery({
    queryKey: ["vf_lead_plan_tiers", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vf_lead_plan_tiers" as any)
        .select("*")
        .eq("org_id", orgId!)
        .eq("is_active", true)
        .order("sort_order") as any);
      if (error) throw error;
      return (data ?? []) as VFLeadPlanTier[];
    },
    enabled: !!orgId,
  });

  // -------------------------------------------------------------------------
  // Query: Current Subscription
  // -------------------------------------------------------------------------

  const {
    data: subscription,
    isLoading: loadingSub,
  } = useQuery({
    queryKey: ["vf_lead_subscriptions", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vf_lead_subscriptions" as any)
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false })
        .limit(1) as any);
      if (error) throw error;
      const sub = (data?.[0] ?? null) as VFLeadSubscription | null;

      // Initialize targeting preferences from subscription
      if (sub && !prefsInitialized) {
        const prefs = (sub.targeting_preferences ?? {}) as VFTargetingPrefs;
        setLocalNiches(prefs.niches ?? []);
        setLocalRadius(prefs.radius_km ?? 25);
        setLocalKeywords(prefs.keywords ?? []);
        setPrefsInitialized(true);
      }

      return sub;
    },
    enabled: !!orgId,
  });

  // -------------------------------------------------------------------------
  // Query: Leads
  // -------------------------------------------------------------------------

  const {
    data: leads = [],
    isLoading: loadingLeads,
  } = useQuery({
    queryKey: ["vf_leads", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vf_leads" as any)
        .select("*")
        .eq("org_id", orgId!)
        .order("delivered_at", { ascending: false }) as any);
      if (error) throw error;
      return (data ?? []) as VFLead[];
    },
    enabled: !!orgId,
  });

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const currentTier = useMemo(() => {
    if (!subscription?.plan_tier_id) return null;
    return planTiers.find((t) => t.id === subscription.plan_tier_id) ?? null;
  }, [subscription, planTiers]);

  const leadsThisMonth = useMemo(() => {
    return subscription?.leads_delivered_this_month ?? 0;
  }, [subscription]);

  const quotaMonthly = useMemo(() => {
    return currentTier?.leads_quota_monthly ?? 0;
  }, [currentTier]);

  const quotaPercent = useMemo(() => {
    if (quotaMonthly === 0) return 0;
    return Math.min(Math.round((leadsThisMonth / quotaMonthly) * 100), 100);
  }, [leadsThisMonth, quotaMonthly]);

  // Metrics
  const metrics = useMemo(() => {
    const thisMonth = leads; // all leads returned are for this org
    const delivered = thisMonth.length;
    const inquired = thisMonth.filter((l) => l.status === "INQUIRED").length;
    const converted = thisMonth.filter((l) => l.status === "CONVERTED").length;
    const conversionRate = delivered > 0 ? Math.round((converted / delivered) * 100) : 0;
    return { delivered, inquired, converted, conversionRate };
  }, [leads]);

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filterTemperature !== "ALL" && lead.temperature !== filterTemperature) return false;
      if (filterStatus !== "ALL" && lead.status !== filterStatus) return false;
      return true;
    });
  }, [leads, filterTemperature, filterStatus]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const toggleNiche = useCallback((niche: string) => {
    setLocalNiches((prev) =>
      prev.includes(niche) ? prev.filter((n) => n !== niche) : [...prev, niche]
    );
  }, []);

  const addKeyword = useCallback(() => {
    const trimmed = keywordInput.trim();
    if (trimmed && !localKeywords.includes(trimmed)) {
      setLocalKeywords((prev) => [...prev, trimmed]);
    }
    setKeywordInput("");
  }, [keywordInput, localKeywords]);

  const removeKeyword = useCallback((kw: string) => {
    setLocalKeywords((prev) => prev.filter((k) => k !== kw));
  }, []);

  const handleSavePrefs = async () => {
    if (!orgId || !subscription) return;
    setSavingPrefs(true);

    try {
      const prefs: VFTargetingPrefs = {
        niches: localNiches,
        radius_km: localRadius,
        keywords: localKeywords,
      };

      const { error } = await (supabase
        .from("vf_lead_subscriptions" as any)
        .update({
          targeting_preferences: prefs,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", subscription.id) as any);

      if (error) throw error;
      toast.success("Targeting preferences saved");
      qc.invalidateQueries({ queryKey: ["vf_lead_subscriptions", orgId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleConvertToCRM = async (lead: VFLead) => {
    if (!orgId) return;
    setConvertingIds((prev) => new Set(prev).add(lead.id));

    try {
      // Create CRM client entry
      const { data: newClient, error: insertError } = await (supabase
        .from("res_function_clients")
        .insert({
          org_id: orgId,
          contact_name: [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email,
          company_name: lead.company_name || null,
          email: lead.email,
          phone: lead.phone || null,
          pipeline_stage: "INQUIRY",
          temperature: lead.temperature,
          lead_source: "ENGINE",
          notes: `Converted from lead gen. Source: ${lead.source || "N/A"}`,
        } as any)
        .select("id")
        .single() as any);

      if (insertError) throw insertError;

      // Update lead status
      const { error: updateError } = await (supabase
        .from("vf_leads" as any)
        .update({
          status: "CONVERTED",
          converted_to_client_id: newClient?.id || null,
        } as any)
        .eq("id", lead.id) as any);

      if (updateError) throw updateError;

      toast.success(`${lead.first_name || "Lead"} converted to CRM`);
      qc.invalidateQueries({ queryKey: ["vf_leads", orgId] });
      qc.invalidateQueries({ queryKey: ["vf_pipeline_clients", orgId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to convert lead");
    } finally {
      setConvertingIds((prev) => {
        const next = new Set(prev);
        next.delete(lead.id);
        return next;
      });
    }
  };

  const handleMarkDoNotContact = async (lead: VFLead) => {
    if (!orgId) return;

    try {
      const { error } = await (supabase
        .from("vf_leads" as any)
        .update({ status: "UNSUBSCRIBED" } as any)
        .eq("id", lead.id) as any);
      if (error) throw error;

      toast.success("Lead marked as Do Not Contact");
      qc.invalidateQueries({ queryKey: ["vf_leads", orgId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update lead");
    }
  };

  const handleBulkConvert = async () => {
    if (!orgId || selectedLeads.size === 0) return;
    setBulkConverting(true);

    const leadsToConvert = leads.filter(
      (l) => selectedLeads.has(l.id) && l.status !== "CONVERTED" && l.status !== "UNSUBSCRIBED"
    );

    let successCount = 0;

    for (const lead of leadsToConvert) {
      try {
        const { data: newClient, error: insertError } = await (supabase
          .from("res_function_clients")
          .insert({
            org_id: orgId,
            contact_name: [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email,
            company_name: lead.company_name || null,
            email: lead.email,
            phone: lead.phone || null,
            pipeline_stage: "INQUIRY",
            temperature: lead.temperature,
            lead_source: "ENGINE",
            notes: `Converted from lead gen (bulk). Source: ${lead.source || "N/A"}`,
          } as any)
          .select("id")
          .single() as any);

        if (insertError) continue;

        await (supabase
          .from("vf_leads" as any)
          .update({
            status: "CONVERTED",
            converted_to_client_id: newClient?.id || null,
          } as any)
          .eq("id", lead.id) as any);

        successCount++;
      } catch {
        // Continue with other leads
      }
    }

    toast.success(`${successCount} lead${successCount !== 1 ? "s" : ""} converted to CRM`);
    setSelectedLeads(new Set());
    qc.invalidateQueries({ queryKey: ["vf_leads", orgId] });
    qc.invalidateQueries({ queryKey: ["vf_pipeline_clients", orgId] });
    setBulkConverting(false);
  };

  const toggleSelectLead = useCallback((id: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
    }
  }, [filteredLeads, selectedLeads]);

  const handleSubscribe = async (tierId: string) => {
    if (!orgId) return;

    try {
      // If there is an existing subscription, update the plan_tier_id
      if (subscription) {
        const { error } = await (supabase
          .from("vf_lead_subscriptions" as any)
          .update({
            plan_tier_id: tierId,
            status: "ACTIVE",
            updated_at: new Date().toISOString(),
          } as any)
          .eq("id", subscription.id) as any);
        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await (supabase
          .from("vf_lead_subscriptions" as any)
          .insert({
            org_id: orgId,
            plan_tier_id: tierId,
            status: "ACTIVE",
            targeting_preferences: { niches: [], radius_km: 25, keywords: [] },
            leads_delivered_this_month: 0,
          } as any) as any);
        if (error) throw error;
      }

      toast.success("Subscription updated");
      qc.invalidateQueries({ queryKey: ["vf_lead_subscriptions", orgId] });
    } catch (err: any) {
      toast.error(err.message || "Failed to update subscription");
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!orgId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select an organization to view leads.
      </div>
    );
  }

  const isLoading = loadingTiers || loadingSub;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-sm text-vf-navy/60">Loading lead generation...</p>
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
            <Target className="w-5 h-5 text-vf-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-vf-navy font-display">Lead Generation</h1>
            <p className="text-sm text-vf-navy/60">
              Subscribe to targeted leads and grow your event pipeline
            </p>
          </div>
        </div>

        {/* ================================================================
            SECTION 1: Subscription / Plan Tiers
            ================================================================ */}
        {planTiers.length === 0 ? (
          <Card className="border-vf-gold/30 bg-vf-gold/5">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-vf-gold/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-vf-gold" />
              </div>
              <h3 className="text-lg font-semibold text-vf-navy font-display">
                Coming Soon for Your Market
              </h3>
              <p className="text-sm text-vf-navy/60 max-w-md mx-auto">
                Lead generation plans are being configured for your market. Contact support to
                express interest and get notified when plans become available.
              </p>
              <Button variant="outline" className="border-vf-gold text-vf-gold hover:bg-vf-gold/5">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Current plan info */}
            {subscription && currentTier && (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-vf-gold" />
                      <span className="text-sm font-semibold text-vf-navy">
                        Current Plan: {currentTier.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-xs"
                      >
                        {subscription.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-vf-navy/50">
                      ${currentTier.price_monthly}/month
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-vf-navy/60">
                      <span>
                        Leads delivered: {leadsThisMonth} / {quotaMonthly}
                      </span>
                      <span>{quotaPercent}%</span>
                    </div>
                    <Progress value={quotaPercent} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tier cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {planTiers.map((tier) => {
                const isCurrent = currentTier?.id === tier.id;
                const isUpgrade =
                  currentTier && tier.price_monthly > currentTier.price_monthly;
                const features = tier.features ?? [];

                return (
                  <Card
                    key={tier.id}
                    className={`border shadow-sm bg-white relative overflow-hidden ${
                      isCurrent ? "border-vf-gold ring-1 ring-vf-gold/30" : "border-vf-navy/10"
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute top-0 right-0 bg-vf-gold text-white text-[10px] px-3 py-0.5 rounded-bl-lg font-medium uppercase tracking-wide">
                        Current
                      </div>
                    )}
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-vf-navy font-display">
                          {tier.name}
                        </h3>
                        {tier.description && (
                          <p className="text-xs text-vf-navy/50 mt-1">{tier.description}</p>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-vf-navy">
                          ${tier.price_monthly}
                        </span>
                        <span className="text-sm text-vf-navy/50">/month</span>
                      </div>
                      <div className="text-sm text-vf-navy/70">
                        <span className="font-semibold text-vf-gold">
                          {tier.leads_quota_monthly}
                        </span>{" "}
                        leads per month
                      </div>
                      {features.length > 0 && (
                        <ul className="space-y-1.5">
                          {features.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-vf-navy/70">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button
                        className={`w-full ${
                          isCurrent
                            ? "bg-vf-navy/10 text-vf-navy hover:bg-vf-navy/15"
                            : "bg-vf-gold hover:bg-vf-gold/90 text-white"
                        }`}
                        disabled={isCurrent}
                        onClick={() => handleSubscribe(tier.id)}
                      >
                        {isCurrent ? (
                          "Current Plan"
                        ) : isUpgrade ? (
                          <>
                            <ArrowUpRight className="w-4 h-4 mr-1" />
                            Upgrade
                          </>
                        ) : (
                          "Subscribe"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================
            SECTION 2: Targeting Preferences (Collapsible)
            ================================================================ */}
        {subscription && (
          <Collapsible open={targetingOpen} onOpenChange={setTargetingOpen}>
            <Card className="border-0 shadow-sm bg-white">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="pb-0 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-vf-navy flex items-center gap-2">
                      <Target className="w-4 h-4 text-vf-gold" />
                      Targeting Preferences
                    </CardTitle>
                    {targetingOpen ? (
                      <ChevronUp className="w-4 h-4 text-vf-navy/40" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-vf-navy/40" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-4 space-y-5">
                  {/* Niche multi-select chips */}
                  <div className="space-y-2">
                    <Label className="text-sm text-vf-navy/70">Niche Focus</Label>
                    <div className="flex flex-wrap gap-2">
                      {NICHE_OPTIONS.map((niche) => {
                        const isSelected = localNiches.includes(niche);
                        return (
                          <button
                            key={niche}
                            onClick={() => toggleNiche(niche)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              isSelected
                                ? "bg-vf-gold/10 text-vf-gold border-vf-gold/30"
                                : "bg-vf-cream text-vf-navy/60 border-vf-navy/10 hover:border-vf-navy/20"
                            }`}
                          >
                            {niche}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Radius slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-vf-navy/70">Radius</Label>
                      <span className="text-sm font-medium text-vf-navy">{localRadius} km</span>
                    </div>
                    <Slider
                      value={[localRadius]}
                      onValueChange={([v]) => setLocalRadius(v)}
                      min={1}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-vf-navy/40">
                      <span>1 km</span>
                      <span>50 km</span>
                    </div>
                  </div>

                  {/* Keywords tag input */}
                  <div className="space-y-2">
                    <Label className="text-sm text-vf-navy/70">Keywords</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a keyword..."
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addKeyword();
                          }
                        }}
                        className="bg-vf-cream/50 border-vf-navy/10"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addKeyword}
                        disabled={!keywordInput.trim()}
                        className="shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {localKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {localKeywords.map((kw) => (
                          <Badge
                            key={kw}
                            variant="secondary"
                            className="bg-vf-navy/5 text-vf-navy/70 text-xs pl-2 pr-1 py-1 gap-1"
                          >
                            {kw}
                            <button
                              onClick={() => removeKeyword(kw)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save button */}
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSavePrefs}
                      disabled={savingPrefs}
                      size="sm"
                      className="bg-vf-navy hover:bg-vf-navy/90 text-white"
                    >
                      {savingPrefs ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* ================================================================
            SECTION 3: Metrics Dashboard
            ================================================================ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Leads Delivered
                  </p>
                  <p className="text-3xl font-bold text-vf-navy mt-1">{metrics.delivered}</p>
                  <p className="text-[10px] text-vf-navy/40 mt-0.5">This month</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-vf-gold/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-vf-gold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Inquired
                  </p>
                  <p className="text-3xl font-bold text-vf-navy mt-1">{metrics.inquired}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Converted
                  </p>
                  <p className="text-3xl font-bold text-vf-navy mt-1">{metrics.converted}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                    Conversion Rate
                  </p>
                  <p className="text-3xl font-bold text-vf-navy mt-1">{metrics.conversionRate}%</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================
            SECTION 4: Lead List Table
            ================================================================ */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-base font-semibold text-vf-navy flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-vf-gold" />
                Lead List
                <Badge variant="secondary" className="ml-1 text-xs">
                  {filteredLeads.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Temperature filter */}
                <Select
                  value={filterTemperature}
                  onValueChange={(v) => setFilterTemperature(v as any)}
                >
                  <SelectTrigger className="h-8 text-xs w-[120px]">
                    <SelectValue placeholder="Temperature" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Temps</SelectItem>
                    <SelectItem value="HOT">Hot</SelectItem>
                    <SelectItem value="WARM">Warm</SelectItem>
                    <SelectItem value="COLD">Cold</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status filter */}
                <Select
                  value={filterStatus}
                  onValueChange={(v) => setFilterStatus(v as any)}
                >
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="OPENED">Opened</SelectItem>
                    <SelectItem value="CLICKED">Clicked</SelectItem>
                    <SelectItem value="INQUIRED">Inquired</SelectItem>
                    <SelectItem value="CONVERTED">Converted</SelectItem>
                    <SelectItem value="UNSUBSCRIBED">Do Not Contact</SelectItem>
                  </SelectContent>
                </Select>

                {/* Bulk convert */}
                {selectedLeads.size > 0 && (
                  <Button
                    size="sm"
                    className="bg-vf-gold hover:bg-vf-gold/90 text-white h-8 text-xs"
                    onClick={handleBulkConvert}
                    disabled={bulkConverting}
                  >
                    {bulkConverting ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Convert Selected ({selectedLeads.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingLeads ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-vf-navy/30" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="w-8 h-8 text-vf-navy/20 mx-auto mb-2" />
                <p className="text-sm text-vf-navy/40">No leads found</p>
                <p className="text-xs text-vf-navy/30 mt-1">
                  {leads.length === 0
                    ? "Leads will appear here as they are delivered to your subscription"
                    : "Try adjusting your filters to see more leads"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-vf-navy/5">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            selectedLeads.size > 0 &&
                            selectedLeads.size === filteredLeads.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-xs text-vf-navy/50">Name</TableHead>
                      <TableHead className="text-xs text-vf-navy/50">Company</TableHead>
                      <TableHead className="text-xs text-vf-navy/50">Email</TableHead>
                      <TableHead className="text-xs text-vf-navy/50">Temperature</TableHead>
                      <TableHead className="text-xs text-vf-navy/50">Status</TableHead>
                      <TableHead className="text-xs text-vf-navy/50">Delivered</TableHead>
                      <TableHead className="text-xs text-vf-navy/50 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => {
                      const tempConfig = TEMPERATURE_CONFIG[lead.temperature];
                      const statusConfig = STATUS_CONFIG[lead.status];
                      const isConverting = convertingIds.has(lead.id);
                      const isSelected = selectedLeads.has(lead.id);
                      const isConvertedOrDNC =
                        lead.status === "CONVERTED" || lead.status === "UNSUBSCRIBED";
                      const fullName = [lead.first_name, lead.last_name]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <TableRow
                          key={lead.id}
                          className={`border-vf-navy/5 ${isSelected ? "bg-vf-gold/5" : ""}`}
                        >
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectLead(lead.id)}
                              disabled={isConvertedOrDNC}
                            />
                          </TableCell>
                          <TableCell className="text-sm font-medium text-vf-navy">
                            {fullName || "--"}
                          </TableCell>
                          <TableCell className="text-sm text-vf-navy/70">
                            {lead.company_name || "--"}
                          </TableCell>
                          <TableCell className="text-sm text-vf-navy/70">
                            <span className="truncate max-w-[180px] block">{lead.email}</span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${tempConfig.className} gap-1`}
                            >
                              {tempConfig.icon}
                              {tempConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusConfig.className}`}
                            >
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-vf-navy/50">
                            {format(parseISO(lead.delivered_at), "d MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isConvertedOrDNC && (
                              <div className="flex items-center gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-vf-gold hover:text-vf-gold hover:bg-vf-gold/5"
                                  onClick={() => handleConvertToCRM(lead)}
                                  disabled={isConverting}
                                >
                                  {isConverting ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <UserPlus className="w-3 h-3 mr-1" />
                                      Convert
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-vf-navy/40 hover:text-red-500 hover:bg-red-500/5"
                                  onClick={() => handleMarkDoNotContact(lead)}
                                >
                                  <Ban className="w-3 h-3 mr-1" />
                                  DNC
                                </Button>
                              </div>
                            )}
                            {lead.status === "CONVERTED" && (
                              <span className="text-xs text-emerald-600 flex items-center gap-1 justify-end">
                                <CheckCircle2 className="w-3 h-3" />
                                Converted
                              </span>
                            )}
                            {lead.status === "UNSUBSCRIBED" && (
                              <span className="text-xs text-red-500 flex items-center gap-1 justify-end">
                                <Ban className="w-3 h-3" />
                                DNC
                              </span>
                            )}
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
      </div>
    </div>
  );
};

export default VFLeads;
