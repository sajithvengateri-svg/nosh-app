import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Gift,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Send,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

type ReferralStatus = "INVITED" | "INQUIRED" | "BOOKED" | "REWARDED";
type RewardType = "DISCOUNT" | "CREDIT" | "GIFT";

function getStatusBadge(status: ReferralStatus) {
  const map: Record<ReferralStatus, { label: string; className: string }> = {
    INVITED: {
      label: "Invited",
      className: "bg-blue-500/10 text-blue-700 border-blue-200",
    },
    INQUIRED: {
      label: "Inquired",
      className: "bg-amber-500/10 text-amber-700 border-amber-200",
    },
    BOOKED: {
      label: "Booked",
      className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    },
    REWARDED: {
      label: "Rewarded",
      className: "bg-vf-gold/20 text-vf-gold border-vf-gold/30",
    },
  };
  const entry = map[status] ?? {
    label: status,
    className: "bg-slate-500/10 text-slate-600 border-slate-200",
  };
  return (
    <Badge variant="outline" className={entry.className}>
      {entry.label}
    </Badge>
  );
}

function getRewardLabel(type: RewardType): string {
  switch (type) {
    case "DISCOUNT":
      return "Discount";
    case "CREDIT":
      return "Credit";
    case "GIFT":
      return "Gift";
    default:
      return type;
  }
}

// ---------------------------------------------------------------------------
// Empty form
// ---------------------------------------------------------------------------

const EMPTY_REFERRAL_FORM = {
  referrer_client_id: "",
  referred_name: "",
  referred_email: "",
  referred_phone: "",
  reward_type: "DISCOUNT" as RewardType,
  reward_amount: "",
};

// ---------------------------------------------------------------------------
// Component: VFReferrals
// ---------------------------------------------------------------------------

const VFReferrals: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [form, setForm] = useState(EMPTY_REFERRAL_FORM);
  const [saving, setSaving] = useState(false);
  const [markingRewarded, setMarkingRewarded] = useState<string | null>(null);

  // -----------------------------------------------------------------------
  // Query: Referrals
  // -----------------------------------------------------------------------

  const {
    data: referrals = [],
    isLoading: loadingReferrals,
  } = useQuery({
    queryKey: ["vf_referrals", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vf_referrals" as any)
        .select("*")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false }) as any);
      if (error) {
        console.error("Error fetching referrals:", error);
        toast.error("Failed to load referrals");
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -----------------------------------------------------------------------
  // Query: Clients (for referrer lookup + select)
  // -----------------------------------------------------------------------

  const {
    data: clients = [],
    isLoading: loadingClients,
  } = useQuery({
    queryKey: ["vf_referrals_clients", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_function_clients")
        .select("id, contact_name, company_name, pipeline_stage")
        .eq("org_id", orgId!)
        .order("contact_name", { ascending: true });
      if (error) {
        console.error("Error fetching clients:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Completed-event clients for the invite dialog
  const completedClients = useMemo(() => {
    return clients.filter(
      (c: any) =>
        c.pipeline_stage === "COMPLETED" ||
        c.pipeline_stage === "POST_EVENT",
    );
  }, [clients]);

  // Client lookup by ID
  const clientMap = useMemo(() => {
    const map = new Map<string, any>();
    clients.forEach((c: any) => map.set(c.id, c));
    return map;
  }, [clients]);

  // -----------------------------------------------------------------------
  // Computed stats
  // -----------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = referrals.length;
    const active = referrals.filter(
      (r: any) => r.status === "INVITED" || r.status === "INQUIRED",
    ).length;
    const converted = referrals.filter(
      (r: any) => r.status === "BOOKED" || r.status === "REWARDED",
    ).length;
    const revenue = referrals
      .filter((r: any) => r.status === "BOOKED" || r.status === "REWARDED")
      .reduce((sum: number, r: any) => sum + (Number(r.reward_amount) || 0), 0);
    return { total, active, converted, revenue };
  }, [referrals]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleSendInvite = async () => {
    if (!orgId) return;
    if (!form.referrer_client_id) {
      toast.error("Please select a referring client");
      return;
    }
    if (!form.referred_name.trim()) {
      toast.error("Referred name is required");
      return;
    }

    setSaving(true);
    const { error } = await (supabase
      .from("vf_referrals" as any)
      .insert({
        org_id: orgId,
        referrer_client_id: form.referrer_client_id,
        referred_name: form.referred_name.trim(),
        referred_email: form.referred_email.trim() || null,
        referred_phone: form.referred_phone.trim() || null,
        reward_type: form.reward_type,
        reward_amount: form.reward_amount ? Number(form.reward_amount) : 0,
        status: "INVITED",
        reward_delivered: false,
      } as any) as any);

    if (error) {
      toast.error("Failed to create referral: " + error.message);
      setSaving(false);
      return;
    }

    toast.success("Referral invite sent successfully");
    setSaving(false);
    setShowInviteDialog(false);
    setForm(EMPTY_REFERRAL_FORM);
    qc.invalidateQueries({ queryKey: ["vf_referrals"] });
  };

  const handleMarkRewarded = async (referralId: string) => {
    setMarkingRewarded(referralId);
    const { error } = await (supabase
      .from("vf_referrals" as any)
      .update({
        status: "REWARDED",
        reward_delivered: true,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", referralId) as any);

    if (error) {
      toast.error("Failed to mark as rewarded: " + error.message);
      setMarkingRewarded(null);
      return;
    }

    toast.success("Referral marked as rewarded");
    setMarkingRewarded(null);
    qc.invalidateQueries({ queryKey: ["vf_referrals"] });
  };

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  const isLoading = loadingReferrals || loadingClients;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-sm text-vf-navy/60">Loading referrals...</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-vf-navy">
          <Gift className="w-6 h-6 text-vf-gold" /> Referral Dashboard
        </h1>
        <Button
          onClick={() => setShowInviteDialog(true)}
          className="bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium"
        >
          <Send className="w-4 h-4 mr-2" /> Send Referral Invite
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Total Referrals */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                  Total Referrals
                </p>
                <p className="text-3xl font-bold text-vf-navy mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-vf-gold/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-vf-gold" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                  Active
                </p>
                <p className="text-3xl font-bold text-vf-navy mt-1">
                  {stats.active}
                </p>
                <p className="text-[10px] text-vf-navy/40 mt-0.5">
                  Invited + Inquired
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Converted */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                  Converted
                </p>
                <p className="text-3xl font-bold text-vf-navy mt-1">
                  {stats.converted}
                </p>
                <p className="text-[10px] text-vf-navy/40 mt-0.5">
                  Booked + Rewarded
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Revenue */}
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-vf-navy/50 uppercase tracking-wide">
                  Referral Revenue
                </p>
                <p className="text-3xl font-bold text-vf-navy mt-1">
                  {formatCurrency(stats.revenue)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral List Table */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-vf-navy flex items-center gap-2">
            <Gift className="w-4 h-4 text-vf-gold" />
            All Referrals
            {referrals.length > 0 && (
              <Badge
                variant="secondary"
                className="bg-vf-gold/10 text-vf-gold text-xs ml-auto"
              >
                {referrals.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="py-12 text-center">
              <Gift className="w-12 h-12 mx-auto mb-3 text-vf-navy/20" />
              <p className="text-sm font-medium text-vf-navy/50">
                No referrals yet
              </p>
              <p className="text-xs text-vf-navy/40 mt-1">
                Send your first referral invite to a past client.
              </p>
              <Button
                onClick={() => setShowInviteDialog(true)}
                className="mt-4 bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium"
                size="sm"
              >
                <Send className="w-4 h-4 mr-2" /> Send Referral Invite
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-vf-navy/70">Referrer</TableHead>
                    <TableHead className="text-vf-navy/70">Referred Name</TableHead>
                    <TableHead className="text-vf-navy/70">Status</TableHead>
                    <TableHead className="text-vf-navy/70">Reward</TableHead>
                    <TableHead className="text-vf-navy/70">Date</TableHead>
                    <TableHead className="text-vf-navy/70 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((referral: any) => {
                    const referrer = clientMap.get(referral.referrer_client_id);
                    return (
                      <TableRow
                        key={referral.id}
                        className="hover:bg-vf-cream/40"
                      >
                        <TableCell className="font-medium text-vf-navy">
                          {referrer?.contact_name ?? "Unknown Client"}
                          {referrer?.company_name && (
                            <span className="block text-xs text-vf-navy/50">
                              {referrer.company_name}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="text-vf-navy">
                              {referral.referred_name}
                            </span>
                            {referral.referred_email && (
                              <span className="block text-xs text-vf-navy/50">
                                {referral.referred_email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(referral.status as ReferralStatus)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-vf-navy">
                            {getRewardLabel(referral.reward_type as RewardType)}
                          </span>
                          {referral.reward_amount > 0 && (
                            <span className="ml-1 text-sm font-semibold text-vf-navy">
                              {formatCurrency(Number(referral.reward_amount))}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-vf-navy/60">
                          {referral.created_at
                            ? format(new Date(referral.created_at), "d MMM yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {referral.status === "BOOKED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs border-vf-gold/30 text-vf-gold hover:bg-vf-gold/10"
                              disabled={markingRewarded === referral.id}
                              onClick={() => handleMarkRewarded(referral.id)}
                            >
                              {markingRewarded === referral.id ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              )}
                              Mark Rewarded
                            </Button>
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

      {/* Send Referral Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-vf-navy font-display">
              Send Referral Invite
            </DialogTitle>
            <DialogDescription>
              Invite a past client to refer someone new to your venue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Select referring client */}
            <div>
              <Label>Referring Client *</Label>
              <Select
                value={form.referrer_client_id}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, referrer_client_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a past client..." />
                </SelectTrigger>
                <SelectContent>
                  {completedClients.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No completed-event clients found
                    </SelectItem>
                  ) : (
                    completedClients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.contact_name}
                        {c.company_name ? ` (${c.company_name})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Referred person details */}
            <div>
              <Label>Referred Name *</Label>
              <Input
                value={form.referred_name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, referred_name: e.target.value }))
                }
                placeholder="e.g. James Wilson"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.referred_email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, referred_email: e.target.value }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.referred_phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, referred_phone: e.target.value }))
                  }
                  placeholder="+61 4..."
                />
              </div>
            </div>

            {/* Reward details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Reward Type</Label>
                <Select
                  value={form.reward_type}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, reward_type: v as RewardType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT">Discount</SelectItem>
                    <SelectItem value="CREDIT">Credit</SelectItem>
                    <SelectItem value="GIFT">Gift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reward Amount ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={10}
                  value={form.reward_amount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reward_amount: e.target.value }))
                  }
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            <Button
              className="w-full bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium"
              onClick={handleSendInvite}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Send Invite
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VFReferrals;
