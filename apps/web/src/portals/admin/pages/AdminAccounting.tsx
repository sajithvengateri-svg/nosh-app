import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Cpu,
  Activity,
  Percent,
  Building2,
  ShieldCheck,
  CreditCard,
  Loader2,
  Copy,
  ExternalLink,
  BarChart3,
  Layers,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SystemPnlRow {
  month: string;
  total_revenue: number;
  total_ai_cost: number;
  total_variable_cost: number;
  fixed_cost: number;
  net_pnl: number;
  margin_pct: number;
}

interface OrgPnlRow {
  org_id: string;
  org_name: string;
  revenue: number;
  ai_cost: number;
  variable_cost: number;
  fixed_cost: number;
  net_pnl: number;
}

interface PricingIntelRow {
  tier: string;
  org_count: number;
  avg_tokens_per_org: number;
  avg_cost_per_org: number;
  median_cost: number;
  p95_cost: number;
}

interface OverrideCapForm {
  overrideTokens: string;
  reason: string;
  validUntil: string;
}

interface SendCreditForm {
  tokenBundle: string;
  recipientEmail: string;
}

const TOKEN_BUNDLES = [
  { value: "100000", label: "100K tokens", price: "$5" },
  { value: "500000", label: "500K tokens", price: "$20" },
  { value: "1000000", label: "1M tokens", price: "$35" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtCurrency = (n: number | null | undefined) => {
  if (n == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

const fmtPct = (n: number | null | undefined) => {
  if (n == null) return "0.0%";
  return `${n.toFixed(1)}%`;
};

const fmtNumber = (n: number | null | undefined) => {
  if (n == null) return "0";
  return new Intl.NumberFormat("en-US").format(Math.round(n));
};

const pnlColor = (value: number | null | undefined) => {
  if (value == null || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-emerald-600" : "text-red-500";
};

const pnlBadge = (value: number | null | undefined) => {
  if (value == null || value === 0) return "secondary";
  return value > 0 ? "default" : "destructive";
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminAccounting = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Dialog state
  const [overrideOrg, setOverrideOrg] = useState<OrgPnlRow | null>(null);
  const [creditOrg, setCreditOrg] = useState<OrgPnlRow | null>(null);
  const [overrideForm, setOverrideForm] = useState<OverrideCapForm>({
    overrideTokens: "",
    reason: "",
    validUntil: "",
  });
  const [creditForm, setCreditForm] = useState<SendCreditForm>({
    tokenBundle: "100000",
    recipientEmail: "",
  });
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Tab 1 — System P&L
  // -------------------------------------------------------------------------

  const { data: systemPnl, isLoading: pnlLoading } = useQuery({
    queryKey: ["admin-system-pnl"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_system_pnl_monthly")
        .select("*")
        .order("month", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data as unknown as SystemPnlRow[]) || [];
    },
  });

  const latestMonth = systemPnl?.[0] ?? null;

  // -------------------------------------------------------------------------
  // Tab 2 — Org Breakdown
  // -------------------------------------------------------------------------

  const currentMonth = format(new Date(), "yyyy-MM-01");

  const { data: orgPnl, isLoading: orgPnlLoading } = useQuery({
    queryKey: ["admin-org-pnl", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_org_pnl_monthly")
        .select("*")
        .eq("month", currentMonth);
      if (error) throw error;
      return (data as unknown as OrgPnlRow[]) || [];
    },
  });

  // Fetch org owner emails for credit dialog pre-fill
  const { data: orgOwners } = useQuery({
    queryKey: ["admin-org-owners"],
    queryFn: async () => {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, owner_id");
      if (!orgs || orgs.length === 0) return {};

      const ownerIds = [...new Set(orgs.map((o) => o.owner_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", ownerIds);

      const emailMap: Record<string, string> = {};
      for (const org of orgs) {
        const profile = profiles?.find((p) => p.user_id === org.owner_id);
        if (profile?.email) {
          emailMap[org.id] = profile.email;
        }
      }
      return emailMap;
    },
  });

  // -------------------------------------------------------------------------
  // Tab 3 — Pricing Intel
  // -------------------------------------------------------------------------

  const { data: pricingIntel, isLoading: pricingLoading } = useQuery({
    queryKey: ["admin-pricing-intel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_pricing_intelligence")
        .select("*");
      if (error) throw error;
      return (data as unknown as PricingIntelRow[]) || [];
    },
  });

  // -------------------------------------------------------------------------
  // Override Cap Mutation
  // -------------------------------------------------------------------------

  const overrideMutation = useMutation({
    mutationFn: async ({
      orgId,
      overrideTokens,
      reason,
      validUntil,
    }: {
      orgId: string;
      overrideTokens: number;
      reason: string;
      validUntil: string | null;
    }) => {
      const { error } = await supabase.from("ai_quota_overrides").upsert(
        {
          org_id: orgId,
          override_tokens: overrideTokens,
          reason,
          set_by: user?.id ?? "",
          valid_from: format(new Date(), "yyyy-MM-dd"),
          valid_until: validUntil || null,
        },
        { onConflict: "org_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Token cap override saved successfully");
      setOverrideOrg(null);
      setOverrideForm({ overrideTokens: "", reason: "", validUntil: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-org-pnl"] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to save override: ${err.message}`);
    },
  });

  // -------------------------------------------------------------------------
  // Send Credit Mutation
  // -------------------------------------------------------------------------

  const creditMutation = useMutation({
    mutationFn: async ({
      orgId,
      tokenBundle,
      recipientEmail,
    }: {
      orgId: string;
      tokenBundle: number;
      recipientEmail: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "admin-send-credit-link",
        {
          body: { orgId, tokenBundle, recipientEmail },
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Credit link generated successfully");
      setPaymentUrl(data?.paymentUrl || data?.payment_url || null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to generate credit link: ${err.message}`);
    },
  });

  // -------------------------------------------------------------------------
  // Dialog Handlers
  // -------------------------------------------------------------------------

  const openOverrideDialog = (org: OrgPnlRow) => {
    setOverrideOrg(org);
    setOverrideForm({ overrideTokens: "", reason: "", validUntil: "" });
  };

  const openCreditDialog = (org: OrgPnlRow) => {
    setCreditOrg(org);
    setCreditForm({
      tokenBundle: "100000",
      recipientEmail: orgOwners?.[org.org_id] || "",
    });
    setPaymentUrl(null);
  };

  const handleOverrideSubmit = () => {
    if (!overrideOrg) return;
    const tokens = parseInt(overrideForm.overrideTokens, 10);
    if (isNaN(tokens) || tokens <= 0) {
      toast.error("Please enter a valid token amount");
      return;
    }
    if (!overrideForm.reason.trim()) {
      toast.error("Please provide a reason for the override");
      return;
    }
    overrideMutation.mutate({
      orgId: overrideOrg.org_id,
      overrideTokens: tokens,
      reason: overrideForm.reason.trim(),
      validUntil: overrideForm.validUntil || null,
    });
  };

  const handleCreditSubmit = () => {
    if (!creditOrg) return;
    if (!creditForm.recipientEmail.trim()) {
      toast.error("Please enter a recipient email");
      return;
    }
    creditMutation.mutate({
      orgId: creditOrg.org_id,
      tokenBundle: parseInt(creditForm.tokenBundle, 10),
      recipientEmail: creditForm.recipientEmail.trim(),
    });
  };

  const copyPaymentUrl = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl);
      toast.success("Payment URL copied to clipboard");
    }
  };

  // -------------------------------------------------------------------------
  // KPI Card helper
  // -------------------------------------------------------------------------

  const KpiCard = ({
    title,
    value,
    icon: Icon,
    color,
    delay = 0,
    isCurrency = true,
    suffix = "",
  }: {
    title: string;
    value: number | null | undefined;
    icon: React.ElementType;
    color: string;
    delay?: number;
    isCurrency?: boolean;
    suffix?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className={cn("text-2xl font-bold mt-1", color)}>
                {isCurrency ? fmtCurrency(value) : `${fmtPct(value)}${suffix}`}
              </p>
            </div>
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                color.includes("emerald")
                  ? "bg-emerald-500/10"
                  : color.includes("red")
                    ? "bg-red-500/10"
                    : color.includes("blue")
                      ? "bg-blue-500/10"
                      : color.includes("amber")
                        ? "bg-amber-500/10"
                        : color.includes("purple")
                          ? "bg-purple-500/10"
                          : "bg-primary/10"
              )}
            >
              <Icon className={cn("w-5 h-5", color)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-primary" />
          Accounting &amp; P&amp;L
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform profit &amp; loss, org-level breakdown, and pricing
          intelligence
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="system-pnl">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="system-pnl" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            System P&amp;L
          </TabsTrigger>
          <TabsTrigger value="org-breakdown" className="gap-1.5">
            <Building2 className="w-4 h-4" />
            Org Breakdown
          </TabsTrigger>
          <TabsTrigger value="pricing-intel" className="gap-1.5">
            <Layers className="w-4 h-4" />
            Pricing Intel
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB 1: System P&L                                                */}
        {/* ================================================================ */}
        <TabsContent value="system-pnl" className="mt-6 space-y-6">
          {pnlLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KpiCard
                  title="Total Revenue"
                  value={latestMonth?.total_revenue}
                  icon={DollarSign}
                  color="text-emerald-600"
                  delay={0}
                />
                <KpiCard
                  title="Total AI Cost"
                  value={latestMonth?.total_ai_cost}
                  icon={Cpu}
                  color="text-blue-500"
                  delay={0.05}
                />
                <KpiCard
                  title="Total Variable Cost"
                  value={latestMonth?.total_variable_cost}
                  icon={Activity}
                  color="text-amber-500"
                  delay={0.1}
                />
                <KpiCard
                  title="Fixed Cost"
                  value={latestMonth?.fixed_cost}
                  icon={ShieldCheck}
                  color="text-purple-500"
                  delay={0.15}
                />
                <KpiCard
                  title="Net P&L"
                  value={latestMonth?.net_pnl}
                  icon={
                    (latestMonth?.net_pnl ?? 0) >= 0
                      ? TrendingUp
                      : TrendingDown
                  }
                  color={pnlColor(latestMonth?.net_pnl)}
                  delay={0.2}
                />
                <KpiCard
                  title="Margin %"
                  value={latestMonth?.margin_pct}
                  icon={Percent}
                  color={pnlColor(latestMonth?.margin_pct)}
                  delay={0.25}
                  isCurrency={false}
                />
              </div>

              {/* Monthly Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly P&amp;L (Last 12 Months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">
                            AI Cost
                          </TableHead>
                          <TableHead className="text-right">
                            Variable Cost
                          </TableHead>
                          <TableHead className="text-right">
                            Fixed Cost
                          </TableHead>
                          <TableHead className="text-right">
                            Net P&amp;L
                          </TableHead>
                          <TableHead className="text-right">Margin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {systemPnl?.map((row, idx) => (
                          <motion.tr
                            key={row.month}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell className="font-medium">
                              {format(new Date(row.month + "T00:00:00"), "MMM yyyy")}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtCurrency(row.total_revenue)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtCurrency(row.total_ai_cost)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtCurrency(row.total_variable_cost)}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmtCurrency(row.fixed_cost)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={pnlColor(row.net_pnl)}>
                                {fmtCurrency(row.net_pnl)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={pnlBadge(row.margin_pct)}>
                                {fmtPct(row.margin_pct)}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))}
                        {(!systemPnl || systemPnl.length === 0) && (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center text-muted-foreground py-8"
                            >
                              No P&amp;L data available yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 2: Org Breakdown                                             */}
        {/* ================================================================ */}
        <TabsContent value="org-breakdown" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  Organisation P&amp;L &mdash;{" "}
                  {format(new Date(), "MMMM yyyy")}
                </span>
                <Badge variant="outline">
                  {orgPnl?.length ?? 0} organisations
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orgPnlLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Org Name</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">AI Cost</TableHead>
                        <TableHead className="text-right">
                          Variable Cost
                        </TableHead>
                        <TableHead className="text-right">
                          Fixed Cost
                        </TableHead>
                        <TableHead className="text-right">
                          Net P&amp;L
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgPnl?.map((row, idx) => (
                        <motion.tr
                          key={row.org_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">
                                {row.org_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtCurrency(row.revenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtCurrency(row.ai_cost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtCurrency(row.variable_cost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtCurrency(row.fixed_cost)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={pnlColor(row.net_pnl)}>
                              {fmtCurrency(row.net_pnl)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openOverrideDialog(row)}
                              >
                                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                                Override Cap
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCreditDialog(row)}
                              >
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                                Send Credit
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                      {(!orgPnl || orgPnl.length === 0) && (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center text-muted-foreground py-8"
                          >
                            No org-level P&amp;L data for this month
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB 3: Pricing Intel                                             */}
        {/* ================================================================ */}
        <TabsContent value="pricing-intel" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              {pricingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tier</TableHead>
                        <TableHead className="text-right">Org Count</TableHead>
                        <TableHead className="text-right">
                          Avg Tokens/Org
                        </TableHead>
                        <TableHead className="text-right">
                          Avg Cost/Org
                        </TableHead>
                        <TableHead className="text-right">
                          Median Cost
                        </TableHead>
                        <TableHead className="text-right">P95 Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingIntel?.map((row, idx) => (
                        <motion.tr
                          key={row.tier}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {row.tier}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {fmtNumber(row.org_count)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtNumber(row.avg_tokens_per_org)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtCurrency(row.avg_cost_per_org)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtCurrency(row.median_cost)}
                          </TableCell>
                          <TableCell className="text-right">
                            {fmtCurrency(row.p95_cost)}
                          </TableCell>
                        </motion.tr>
                      ))}
                      {(!pricingIntel || pricingIntel.length === 0) && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center text-muted-foreground py-8"
                          >
                            No pricing intelligence data available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================================================================== */}
      {/* Override Cap Dialog                                                 */}
      {/* ================================================================== */}
      <Dialog
        open={!!overrideOrg}
        onOpenChange={(open) => {
          if (!open) setOverrideOrg(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Override Token Cap
            </DialogTitle>
          </DialogHeader>

          {overrideOrg && (
            <div className="space-y-4 mt-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Organisation</p>
                <p className="font-medium">{overrideOrg.org_name}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="override-tokens">Override Tokens</Label>
                <Input
                  id="override-tokens"
                  type="number"
                  placeholder="e.g. 500000"
                  value={overrideForm.overrideTokens}
                  onChange={(e) =>
                    setOverrideForm((f) => ({
                      ...f,
                      overrideTokens: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="override-reason">Reason</Label>
                <Input
                  id="override-reason"
                  type="text"
                  placeholder="Why is this override needed?"
                  value={overrideForm.reason}
                  onChange={(e) =>
                    setOverrideForm((f) => ({ ...f, reason: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="override-valid-until">
                  Valid Until{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="override-valid-until"
                  type="date"
                  value={overrideForm.validUntil}
                  onChange={(e) =>
                    setOverrideForm((f) => ({
                      ...f,
                      validUntil: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setOverrideOrg(null)}
                  disabled={overrideMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleOverrideSubmit}
                  disabled={overrideMutation.isPending}
                >
                  {overrideMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Override"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================================== */}
      {/* Send Credit Dialog                                                 */}
      {/* ================================================================== */}
      <Dialog
        open={!!creditOrg}
        onOpenChange={(open) => {
          if (!open) {
            setCreditOrg(null);
            setPaymentUrl(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Send Credit Link
            </DialogTitle>
          </DialogHeader>

          {creditOrg && (
            <div className="space-y-4 mt-2">
              {/* Org info */}
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Organisation</p>
                <p className="font-medium">{creditOrg.org_name}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">
                    Revenue:{" "}
                    <span className="text-foreground">
                      {fmtCurrency(creditOrg.revenue)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    AI Cost:{" "}
                    <span className="text-foreground">
                      {fmtCurrency(creditOrg.ai_cost)}
                    </span>
                  </span>
                </div>
              </div>

              {/* Token bundle selector */}
              <div className="space-y-3">
                <Label>Token Bundle</Label>
                <RadioGroup
                  value={creditForm.tokenBundle}
                  onValueChange={(val) =>
                    setCreditForm((f) => ({ ...f, tokenBundle: val }))
                  }
                  className="space-y-2"
                >
                  {TOKEN_BUNDLES.map((bundle) => (
                    <div
                      key={bundle.value}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        creditForm.tokenBundle === bundle.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                      onClick={() =>
                        setCreditForm((f) => ({
                          ...f,
                          tokenBundle: bundle.value,
                        }))
                      }
                    >
                      <RadioGroupItem
                        value={bundle.value}
                        id={`bundle-${bundle.value}`}
                      />
                      <Label
                        htmlFor={`bundle-${bundle.value}`}
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <span>{bundle.label}</span>
                        <Badge variant="secondary">{bundle.price}</Badge>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Recipient email */}
              <div className="space-y-2">
                <Label htmlFor="credit-email">Recipient Email</Label>
                <Input
                  id="credit-email"
                  type="email"
                  placeholder="owner@example.com"
                  value={creditForm.recipientEmail}
                  onChange={(e) =>
                    setCreditForm((f) => ({
                      ...f,
                      recipientEmail: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Payment URL result */}
              {paymentUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5"
                >
                  <p className="text-sm font-medium text-emerald-700 mb-2">
                    Payment link generated!
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={paymentUrl}
                      className="text-xs bg-background"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyPaymentUrl}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(paymentUrl, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreditOrg(null);
                    setPaymentUrl(null);
                  }}
                  disabled={creditMutation.isPending}
                >
                  {paymentUrl ? "Close" : "Cancel"}
                </Button>
                {!paymentUrl && (
                  <Button
                    onClick={handleCreditSubmit}
                    disabled={creditMutation.isPending}
                  >
                    {creditMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Payment Link"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAccounting;
