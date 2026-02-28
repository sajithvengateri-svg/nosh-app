import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  CreditCard,
  RefreshCw,
  Loader2,
  ChevronDown,
  Pencil,
  Plus,
  X,
  Search,
  Building2,
  Package,
  ShieldCheck,
  FileText,
  BarChart3,
  TrendingUp,
  Zap,
  ArrowUpRight,
  Clock,
  AlertTriangle,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubscriptionPlan {
  id: string;
  product_key: string;
  product_label: string;
  tier: string;
  price_monthly: number | null;
  price_yearly: number | null;
  max_members: number | null;
  max_venues: number | null;
  features: string[];
  freemium_nudge_days: number;
  is_active: boolean;
  sort_order: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  ai_addon_price_monthly: number | null;
  ai_addon_price_yearly: number | null;
  trial_days: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionEvent {
  id: string;
  org_id: string;
  event_type: string;
  from_tier: string | null;
  to_tier: string | null;
  stripe_event_id: string | null;
  metadata: Record<string, any>;
  actor_id: string | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string | null;
  max_members: number | null;
  max_venues: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  ai_addon_active: boolean;
  upgrade_nudge_shown_at: string | null;
  upgraded_at: string | null;
  created_at: string;
  store_mode: string;
}

interface OrgOverride {
  id: string;
  org_id: string;
  product_key: string;
  forced_tier: string;
  forced_by: string | null;
  notes: string | null;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
}

type TierKey = "free" | "basic" | "pro" | "enterprise";

interface LocalTierState {
  id: string | null;
  tier: TierKey;
  price_monthly: string;
  price_yearly: string;
  max_members: string;
  max_venues: string;
  freemium_nudge_days: string;
  features: string[];
  is_active: boolean;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  ai_addon_price_monthly: string;
  ai_addon_price_yearly: string;
  trial_days: string;
  currency: string;
}

interface LocalProductState {
  product_key: string;
  product_label: string;
  tiers: Record<TierKey, LocalTierState>;
}

interface OverrideFormState {
  product_key: string;
  forced_tier: string;
  notes: string;
  valid_from: string;
  valid_until: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PRODUCT_KEYS = [
  "chefos",
  "homeos",
  "chefos_india",
  "food_safety",
] as const;

const PRODUCT_LABELS: Record<string, string> = {
  chefos: "ChefOS",
  homeos: "HomeOS",
  chefos_india: "ChefOS India",
  food_safety: "Food Safety OS",
};

const TIER_ORDER: TierKey[] = ["free", "basic", "pro", "enterprise"];

const TIER_BADGE_VARIANT: Record<TierKey, string> = {
  free: "bg-gray-100 text-gray-700 border-gray-200",
  basic: "bg-blue-100 text-blue-700 border-blue-200",
  pro: "bg-violet-100 text-violet-700 border-violet-200",
  enterprise: "bg-amber-100 text-amber-700 border-amber-200",
};

const CURRENCY_SYMBOL: Record<string, string> = {
  chefos_india: "₹",
  chefos_in: "₹",
  homechef_in: "₹",
  chefos_uae: "د.إ",
  gcc_uae: "د.إ",
  homechef_uae: "د.إ",
  chefos_uk: "£",
  eatsafe_london: "£",
  homechef_uk: "£",
  chefos_sg: "S$",
  eatsafe_sg: "S$",
  homechef_sg: "S$",
  chefos_us: "$",
  eatsafe_ny: "$",
  homechef_us: "$",
};

const DEFAULT_CURRENCY = "$";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function currencyFor(productKey: string): string {
  return CURRENCY_SYMBOL[productKey] ?? DEFAULT_CURRENCY;
}

function emptyTierState(tier: TierKey): LocalTierState {
  return {
    id: null,
    tier,
    price_monthly: "",
    price_yearly: "",
    max_members: "",
    max_venues: "",
    freemium_nudge_days: tier === "free" ? "14" : "",
    features: [],
    is_active: false,
    stripe_price_id_monthly: "",
    stripe_price_id_yearly: "",
    ai_addon_price_monthly: "",
    ai_addon_price_yearly: "",
    trial_days: "0",
    currency: "gbp",
  };
}

function planToLocalTier(plan: SubscriptionPlan): LocalTierState {
  return {
    id: plan.id,
    tier: plan.tier as TierKey,
    price_monthly:
      plan.price_monthly != null ? String(plan.price_monthly) : "",
    price_yearly: plan.price_yearly != null ? String(plan.price_yearly) : "",
    max_members: plan.max_members != null ? String(plan.max_members) : "",
    max_venues: plan.max_venues != null ? String(plan.max_venues) : "",
    freemium_nudge_days: String(plan.freemium_nudge_days ?? 14),
    features: Array.isArray(plan.features) ? [...plan.features] : [],
    is_active: plan.is_active,
    stripe_price_id_monthly: plan.stripe_price_id_monthly ?? "",
    stripe_price_id_yearly: plan.stripe_price_id_yearly ?? "",
    ai_addon_price_monthly: plan.ai_addon_price_monthly != null ? String(plan.ai_addon_price_monthly) : "",
    ai_addon_price_yearly: plan.ai_addon_price_yearly != null ? String(plan.ai_addon_price_yearly) : "",
    trial_days: String(plan.trial_days ?? 0),
    currency: plan.currency ?? "gbp",
  };
}

function buildProductStates(
  plans: SubscriptionPlan[]
): Record<string, LocalProductState> {
  const grouped: Record<string, LocalProductState> = {};

  for (const key of PRODUCT_KEYS) {
    const tiers = {} as Record<TierKey, LocalTierState>;
    for (const t of TIER_ORDER) {
      tiers[t] = emptyTierState(t);
    }
    grouped[key] = {
      product_key: key,
      product_label: PRODUCT_LABELS[key],
      tiers,
    };
  }

  for (const plan of plans) {
    const key = plan.product_key;
    const tier = plan.tier as TierKey;
    if (grouped[key] && TIER_ORDER.includes(tier)) {
      grouped[key].tiers[tier] = planToLocalTier(plan);
      grouped[key].product_label = plan.product_label;
    }
  }

  return grouped;
}

function tiersAreEqual(a: LocalTierState, b: LocalTierState): boolean {
  return (
    a.price_monthly === b.price_monthly &&
    a.price_yearly === b.price_yearly &&
    a.max_members === b.max_members &&
    a.max_venues === b.max_venues &&
    a.freemium_nudge_days === b.freemium_nudge_days &&
    a.is_active === b.is_active &&
    a.stripe_price_id_monthly === b.stripe_price_id_monthly &&
    a.stripe_price_id_yearly === b.stripe_price_id_yearly &&
    a.ai_addon_price_monthly === b.ai_addon_price_monthly &&
    a.ai_addon_price_yearly === b.ai_addon_price_yearly &&
    a.trial_days === b.trial_days &&
    a.currency === b.currency &&
    JSON.stringify(a.features) === JSON.stringify(b.features)
  );
}

function productIsDirty(
  local: LocalProductState,
  original: LocalProductState
): boolean {
  for (const t of TIER_ORDER) {
    if (!tiersAreEqual(local.tiers[t], original.tiers[t])) {
      return true;
    }
  }
  return false;
}

function isActiveOverride(ov: OrgOverride): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const started = !ov.valid_from || ov.valid_from <= today;
  const notExpired = !ov.valid_until || ov.valid_until >= today;
  return started && notExpired;
}

// ---------------------------------------------------------------------------
// Data hooks
// ---------------------------------------------------------------------------

function usePlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ["admin", "subscription_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as SubscriptionPlan[];
    },
  });
}

function useOrganizations() {
  return useQuery<Organization[]>({
    queryKey: ["admin", "organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, subscription_tier, max_members, max_venues, stripe_customer_id, stripe_subscription_id, ai_addon_active, upgrade_nudge_shown_at, upgraded_at, created_at, store_mode")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Organization[];
    },
  });
}

function useSubscriptionEvents() {
  return useQuery<SubscriptionEvent[]>({
    queryKey: ["admin", "subscription_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_subscription_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as SubscriptionEvent[];
    },
  });
}

function useOverrides() {
  return useQuery<OrgOverride[]>({
    queryKey: ["admin", "org_subscription_overrides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_subscription_overrides")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrgOverride[];
    },
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <Card className="flex-1 min-w-[160px]">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Tier Badge
// ---------------------------------------------------------------------------

function TierBadge({ tier }: { tier: string }) {
  const classes =
    TIER_BADGE_VARIANT[tier as TierKey] ??
    "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <Badge
      variant="outline"
      className={cn("capitalize font-medium text-xs", classes)}
    >
      {tier}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Event Type Badge
// ---------------------------------------------------------------------------

const EVENT_TYPE_STYLES: Record<string, string> = {
  checkout_started: "bg-blue-100 text-blue-700 border-blue-200",
  subscription_created: "bg-green-100 text-green-700 border-green-200",
  subscription_upgraded: "bg-violet-100 text-violet-700 border-violet-200",
  subscription_cancelled: "bg-red-100 text-red-700 border-red-200",
  payment_failed: "bg-red-100 text-red-700 border-red-200",
  nudge_sent: "bg-amber-100 text-amber-700 border-amber-200",
  admin_override: "bg-orange-100 text-orange-700 border-orange-200",
  subscription_status_changed: "bg-gray-100 text-gray-700 border-gray-200",
};

function EventTypeBadge({ type }: { type: string }) {
  const classes = EVENT_TYPE_STYLES[type] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", classes)}>
      {type.replace(/_/g, " ")}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Feature Editor
// ---------------------------------------------------------------------------

function FeatureEditor({
  features,
  onChange,
}: {
  features: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addFeature = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (features.includes(trimmed)) {
      toast.error("Feature already exists");
      return;
    }
    onChange([...features, trimmed]);
    setDraft("");
  };

  const removeFeature = (index: number) => {
    onChange(features.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Features</p>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {features.map((f, i) => (
            <motion.div
              key={f}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <Badge
                variant="secondary"
                className="gap-1 pr-1 text-xs font-normal"
              >
                {f}
                <button
                  type="button"
                  onClick={() => removeFeature(i)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                  aria-label={`Remove feature: ${f}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addFeature();
            }
          }}
          placeholder="Add a feature..."
          className="h-8 text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0"
          onClick={addFeature}
          disabled={!draft.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tier Row
// ---------------------------------------------------------------------------

function TierRow({
  productKey,
  state,
  onChange,
}: {
  productKey: string;
  state: LocalTierState;
  onChange: (next: LocalTierState) => void;
}) {
  const currency = currencyFor(productKey);
  const isEnterprise = state.tier === "enterprise";
  const isFree = state.tier === "free";

  const update = (patch: Partial<LocalTierState>) =>
    onChange({ ...state, ...patch });

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <TierBadge tier={state.tier} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active</span>
          <Switch
            checked={state.is_active}
            onCheckedChange={(checked) => update({ is_active: checked })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* price_monthly */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Monthly ({currency})
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            disabled={isEnterprise}
            placeholder={isEnterprise ? "Contact Sales" : "0.00"}
            value={state.price_monthly}
            onChange={(e) => update({ price_monthly: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* price_yearly */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Yearly ({currency})
          </label>
          <Input
            type="number"
            min={0}
            step="0.01"
            disabled={isEnterprise}
            placeholder={isEnterprise ? "Contact Sales" : "0.00"}
            value={state.price_yearly}
            onChange={(e) => update({ price_yearly: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* max_members */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Max Members
          </label>
          <Input
            type="number"
            min={0}
            value={state.max_members}
            onChange={(e) => update({ max_members: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* max_venues */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Max Venues
          </label>
          <Input
            type="number"
            min={0}
            value={state.max_venues}
            onChange={(e) => update({ max_venues: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* freemium_nudge_days (only for free tier) */}
      {isFree && (
        <div className="max-w-[200px] space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Freemium Nudge Days
          </label>
          <Input
            type="number"
            min={0}
            value={state.freemium_nudge_days}
            onChange={(e) => update({ freemium_nudge_days: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* Stripe + Billing config (paid tiers only) */}
      {!isFree && (
        <div className="space-y-3 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">Stripe & Billing</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Stripe Price ID (Monthly)
              </label>
              <Input
                placeholder="price_..."
                value={state.stripe_price_id_monthly}
                onChange={(e) => update({ stripe_price_id_monthly: e.target.value })}
                className="h-8 text-sm font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Stripe Price ID (Yearly)
              </label>
              <Input
                placeholder="price_..."
                value={state.stripe_price_id_yearly}
                onChange={(e) => update({ stripe_price_id_yearly: e.target.value })}
                className="h-8 text-sm font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                AI Add-on Monthly ({currency})
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={state.ai_addon_price_monthly}
                onChange={(e) => update({ ai_addon_price_monthly: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                AI Add-on Yearly ({currency})
              </label>
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={state.ai_addon_price_yearly}
                onChange={(e) => update({ ai_addon_price_yearly: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Trial Days
              </label>
              <Input
                type="number"
                min={0}
                value={state.trial_days}
                onChange={(e) => update({ trial_days: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Currency
              </label>
              <Select
                value={state.currency}
                onValueChange={(v) => update({ currency: v })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gbp">GBP</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="aud">AUD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="inr">INR</SelectItem>
                  <SelectItem value="aed">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <FeatureEditor
        features={state.features}
        onChange={(next) => update({ features: next })}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Card
// ---------------------------------------------------------------------------

function ProductCard({
  product,
  original,
  onChange,
  onSave,
  isSaving,
}: {
  product: LocalProductState;
  original: LocalProductState;
  onChange: (next: LocalProductState) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dirty = productIsDirty(product, original);

  const updateTier = (tier: TierKey, next: LocalTierState) => {
    onChange({
      ...product,
      tiers: { ...product.tiers, [tier]: next },
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {product.product_label}
                    {dirty && (
                      <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                      {product.product_key}
                    </code>
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {TIER_ORDER.map((tier) => (
              <TierRow
                key={tier}
                productKey={product.product_key}
                state={product.tiers[tier]}
                onChange={(next) => updateTier(tier, next)}
              />
            ))}

            <AnimatePresence>
              {dirty && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-end"
                >
                  <Button onClick={onSave} disabled={isSaving}>
                    {isSaving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save {product.product_label}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Org Agreement Dialog
// ---------------------------------------------------------------------------

const INITIAL_OVERRIDE_FORM: OverrideFormState = {
  product_key: "chefos",
  forced_tier: "pro",
  notes: "",
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: "",
};

function OrgAgreementDialog({
  org,
  overrides,
  adminTierOverride,
  open,
  onOpenChange,
}: {
  org: Organization | null;
  overrides: OrgOverride[];
  adminTierOverride: ReturnType<typeof useMutation<void, Error, { orgId: string; tier: string; aiAddon?: boolean }>>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<OverrideFormState>(INITIAL_OVERRIDE_FORM);

  useEffect(() => {
    if (open) {
      setForm({
        ...INITIAL_OVERRIDE_FORM,
        valid_from: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open]);

  const orgOverrides = useMemo(
    () => overrides.filter((o) => o.org_id === org?.id),
    [overrides, org?.id]
  );

  const activeOverride = useMemo(
    () => orgOverrides.find(isActiveOverride) ?? null,
    [orgOverrides]
  );

  const applyOverride = useMutation({
    mutationFn: async () => {
      if (!org) throw new Error("No organization selected");
      const { error } = await supabase
        .from("org_subscription_overrides")
        .insert({
          org_id: org.id,
          product_key: form.product_key,
          forced_tier: form.forced_tier,
          forced_by: user?.id || null,
          notes: form.notes || null,
          valid_from: form.valid_from || null,
          valid_until: form.valid_until || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "org_subscription_overrides"],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin", "organizations"],
      });
      toast.success("Override applied successfully");
      setForm({
        ...INITIAL_OVERRIDE_FORM,
        valid_from: new Date().toISOString().slice(0, 10),
      });
    },
    onError: (err: Error) => {
      toast.error(`Failed to apply override: ${err.message}`);
    },
  });

  if (!org) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {org.name}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">
              {org.slug}
            </code>
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current tier */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Subscription</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <TierBadge tier={org.subscription_tier ?? "free"} />
              {org.ai_addon_active && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                  <Zap className="h-3 w-3 mr-1" /> AI Active
                </Badge>
              )}
              {org.stripe_customer_id && (
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                  Stripe Linked
                </Badge>
              )}
              {org.max_members != null && (
                <span className="text-xs text-muted-foreground">
                  {org.max_members} members
                </span>
              )}
              {org.max_venues != null && (
                <span className="text-xs text-muted-foreground">
                  {org.max_venues} venues
                </span>
              )}
            </div>
            {org.upgraded_at && (
              <p className="text-xs text-muted-foreground">
                Upgraded: {format(new Date(org.upgraded_at), "MMM d, yyyy HH:mm")}
              </p>
            )}
            {org.store_mode && (
              <p className="text-xs text-muted-foreground">
                Product: <code className="bg-muted px-1 rounded font-mono">{org.store_mode}</code>
              </p>
            )}
          </div>

          {/* Admin quick tier override */}
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Admin Tier Override
            </h4>
            <p className="text-xs text-muted-foreground">
              Instantly change this org's subscription tier and AI add-on status.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {TIER_ORDER.map((t) => (
                <Button
                  key={t}
                  variant={(org.subscription_tier ?? "free") === t ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  disabled={adminTierOverride.isPending}
                  onClick={() => adminTierOverride.mutate({ orgId: org.id, tier: t })}
                >
                  {t}
                </Button>
              ))}
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-muted-foreground">AI Add-on:</span>
                <Switch
                  checked={org.ai_addon_active}
                  onCheckedChange={(checked) =>
                    adminTierOverride.mutate({
                      orgId: org.id,
                      tier: org.subscription_tier ?? "free",
                      aiAddon: checked,
                    })
                  }
                  disabled={adminTierOverride.isPending}
                />
              </div>
            </div>
          </div>

          {/* Active override */}
          {activeOverride && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Active Override
                </span>
              </div>
              <div className="text-sm text-amber-700 space-y-0.5">
                <p>
                  Product:{" "}
                  <span className="font-medium">
                    {PRODUCT_LABELS[activeOverride.product_key] ??
                      activeOverride.product_key}
                  </span>{" "}
                  <TierBadge tier={activeOverride.forced_tier} />
                </p>
                {activeOverride.notes && <p>Notes: {activeOverride.notes}</p>}
                <p>
                  {activeOverride.valid_from
                    ? format(new Date(activeOverride.valid_from), "MMM d, yyyy")
                    : "No start date"}{" "}
                  &mdash;{" "}
                  {activeOverride.valid_until
                    ? format(
                        new Date(activeOverride.valid_until),
                        "MMM d, yyyy"
                      )
                    : "Indefinite"}
                </p>
              </div>
            </div>
          )}

          {/* Override form */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Apply New Override</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Product
                </label>
                <Select
                  value={form.product_key}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, product_key: v }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_KEYS.map((pk) => (
                      <SelectItem key={pk} value={pk}>
                        {PRODUCT_LABELS[pk]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Tier
                </label>
                <Select
                  value={form.forced_tier}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, forced_tier: v }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        <span className="capitalize">{t}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Notes
              </label>
              <Textarea
                rows={2}
                placeholder="Reason for override, deal details, etc."
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Valid From
                </label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, valid_from: e.target.value }))
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Valid Until{" "}
                  <span className="text-muted-foreground font-normal">
                    (blank = indefinite)
                  </span>
                </label>
                <Input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      valid_until: e.target.value,
                    }))
                  }
                  className="h-9"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => applyOverride.mutate()}
                disabled={applyOverride.isPending}
              >
                {applyOverride.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Apply Override
              </Button>
            </div>
          </div>

          {/* Override history */}
          {orgOverrides.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Override History</h4>
              <div className="space-y-2">
                {orgOverrides.map((ov) => (
                  <div
                    key={ov.id}
                    className={cn(
                      "rounded-lg border p-3 text-sm space-y-1",
                      isActiveOverride(ov)
                        ? "border-amber-200 bg-amber-50/50"
                        : "bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {PRODUCT_LABELS[ov.product_key] ?? ov.product_key}
                        </span>
                        <TierBadge tier={ov.forced_tier} />
                        {isActiveOverride(ov) && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-700 border-green-200 text-xs"
                          >
                            Active
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ov.created_at), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    {ov.notes && (
                      <p className="text-muted-foreground">{ov.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {ov.valid_from
                        ? format(new Date(ov.valid_from), "MMM d, yyyy")
                        : "No start"}{" "}
                      &mdash;{" "}
                      {ov.valid_until
                        ? format(new Date(ov.valid_until), "MMM d, yyyy")
                        : "Indefinite"}
                      {ov.forced_by && (
                        <span className="ml-2">
                          by{" "}
                          <code className="bg-muted px-1 rounded font-mono">
                            {ov.forced_by.slice(0, 8)}
                          </code>
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminPlans() {
  usePageTitle("Subscription Plans");
  const { user } = useAuth();

  const queryClient = useQueryClient();

  const {
    data: plans = [],
    isLoading: plansLoading,
    isRefetching: plansRefetching,
  } = usePlans();
  const {
    data: organizations = [],
    isLoading: orgsLoading,
    isRefetching: orgsRefetching,
  } = useOrganizations();
  const {
    data: overrides = [],
    isLoading: overridesLoading,
    isRefetching: overridesRefetching,
  } = useOverrides();
  const {
    data: subscriptionEvents = [],
    isLoading: eventsLoading,
  } = useSubscriptionEvents();

  const isLoading = plansLoading || orgsLoading || overridesLoading;
  const isRefetching = plansRefetching || orgsRefetching || overridesRefetching;

  // ---- Product local state ------------------------------------------------

  const originalProducts = useMemo(() => buildProductStates(plans), [plans]);

  const [localProducts, setLocalProducts] =
    useState<Record<string, LocalProductState>>(originalProducts);

  useEffect(() => {
    setLocalProducts(buildProductStates(plans));
  }, [plans]);

  const updateProduct = useCallback(
    (key: string, next: LocalProductState) => {
      setLocalProducts((prev) => ({ ...prev, [key]: next }));
    },
    []
  );

  // ---- Save product mutation ----------------------------------------------

  const [savingProduct, setSavingProduct] = useState<string | null>(null);

  const saveProduct = useMutation({
    mutationFn: async (productKey: string) => {
      setSavingProduct(productKey);
      const product = localProducts[productKey];
      if (!product) throw new Error("Product not found");

      const upserts = TIER_ORDER.map((tier) => {
        const t = product.tiers[tier];
        return {
          ...(t.id ? { id: t.id } : {}),
          product_key: product.product_key,
          product_label: product.product_label,
          tier,
          price_monthly: t.price_monthly ? Number(t.price_monthly) : null,
          price_yearly: t.price_yearly ? Number(t.price_yearly) : null,
          max_members: t.max_members ? Number(t.max_members) : null,
          max_venues: t.max_venues ? Number(t.max_venues) : null,
          features: t.features,
          freemium_nudge_days: t.freemium_nudge_days
            ? Number(t.freemium_nudge_days)
            : 14,
          is_active: t.is_active,
          stripe_price_id_monthly: t.stripe_price_id_monthly || null,
          stripe_price_id_yearly: t.stripe_price_id_yearly || null,
          ai_addon_price_monthly: t.ai_addon_price_monthly ? Number(t.ai_addon_price_monthly) : null,
          ai_addon_price_yearly: t.ai_addon_price_yearly ? Number(t.ai_addon_price_yearly) : null,
          trial_days: t.trial_days ? Number(t.trial_days) : 0,
          currency: t.currency || "gbp",
        };
      });

      const { error } = await supabase
        .from("subscription_plans")
        .upsert(upserts, { onConflict: "product_key,tier" });
      if (error) throw error;
    },
    onSuccess: (_, productKey) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "subscription_plans"],
      });
      toast.success(
        `${PRODUCT_LABELS[productKey] ?? productKey} plans saved successfully`
      );
      setSavingProduct(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to save plans: ${err.message}`);
      setSavingProduct(null);
    },
  });

  // ---- Org agreements state -----------------------------------------------

  const [orgSearch, setOrgSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredOrgs = useMemo(() => {
    if (!orgSearch.trim()) return organizations;
    const q = orgSearch.toLowerCase();
    return organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    );
  }, [organizations, orgSearch]);

  const overridesByOrg = useMemo(() => {
    const map: Record<string, OrgOverride[]> = {};
    for (const ov of overrides) {
      if (!map[ov.org_id]) map[ov.org_id] = [];
      map[ov.org_id].push(ov);
    }
    return map;
  }, [overrides]);

  const activeOverrideCount = useMemo(
    () => overrides.filter(isActiveOverride).length,
    [overrides]
  );

  const activePlanCount = useMemo(
    () => plans.filter((p) => p.is_active).length,
    [plans]
  );

  // ---- Analytics ----------------------------------------------------------

  const analytics = useMemo(() => {
    const freeOrgs = organizations.filter((o) => !o.subscription_tier || o.subscription_tier === "free");
    const paidOrgs = organizations.filter((o) => o.subscription_tier && o.subscription_tier !== "free");
    const aiAddonOrgs = organizations.filter((o) => o.ai_addon_active);
    const nudgedOrgs = organizations.filter((o) => o.upgrade_nudge_shown_at);
    const convertedOrgs = organizations.filter((o) => o.upgraded_at);

    const conversionRate = nudgedOrgs.length > 0
      ? Math.round((convertedOrgs.length / nudgedOrgs.length) * 100)
      : 0;

    const avgDaysToConvert = convertedOrgs.length > 0
      ? Math.round(
          convertedOrgs.reduce((sum, o) => {
            const created = new Date(o.created_at).getTime();
            const upgraded = new Date(o.upgraded_at!).getTime();
            return sum + (upgraded - created) / (1000 * 60 * 60 * 24);
          }, 0) / convertedOrgs.length
        )
      : 0;

    return {
      freeCount: freeOrgs.length,
      paidCount: paidOrgs.length,
      aiAddonCount: aiAddonOrgs.length,
      nudgedCount: nudgedOrgs.length,
      convertedCount: convertedOrgs.length,
      conversionRate,
      avgDaysToConvert,
    };
  }, [organizations]);

  // ---- Admin tier override (direct) ---------------------------------------

  const adminTierOverride = useMutation({
    mutationFn: async ({ orgId, tier, aiAddon }: { orgId: string; tier: string; aiAddon?: boolean }) => {
      const updates: Record<string, any> = { subscription_tier: tier };
      if (tier !== "free" && !organizations.find((o) => o.id === orgId)?.upgraded_at) {
        updates.upgraded_at = new Date().toISOString();
      }
      if (tier === "free") {
        updates.upgraded_at = null;
        updates.ai_addon_active = false;
      }
      if (aiAddon !== undefined) {
        updates.ai_addon_active = aiAddon;
      }
      const { error } = await supabase
        .from("organizations")
        .update(updates as any)
        .eq("id", orgId);
      if (error) throw error;

      // Log admin override event
      await supabase.from("org_subscription_events").insert({
        org_id: orgId,
        event_type: "admin_override",
        from_tier: organizations.find((o) => o.id === orgId)?.subscription_tier ?? "free",
        to_tier: tier,
        actor_id: user?.id || null,
        metadata: { ai_addon: aiAddon },
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "subscription_events"] });
      toast.success("Tier updated successfully");
    },
    onError: (err: Error) => {
      toast.error(`Failed to update tier: ${err.message}`);
    },
  });

  // ---- Refresh ------------------------------------------------------------

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.info("Refreshing data...");
  };

  const openOrgDialog = (org: Organization) => {
    setSelectedOrg(org);
    setDialogOpen(true);
  };

  // ---- Render -------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Subscription Plans
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage product pricing, tiers, and org agreements
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <StatCard label="Total Products" value={PRODUCT_KEYS.length} icon={Package} />
        <StatCard label="Active Plans" value={activePlanCount} icon={ShieldCheck} />
        <StatCard
          label="Organizations"
          value={organizations.length}
          icon={Building2}
        />
        <StatCard
          label="Paid Orgs"
          value={analytics.paidCount}
          icon={TrendingUp}
        />
        <StatCard
          label="AI Add-on"
          value={analytics.aiAddonCount}
          icon={Zap}
        />
        <StatCard
          label="Active Overrides"
          value={activeOverrideCount}
          icon={FileText}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products & Pricing</TabsTrigger>
          <TabsTrigger value="agreements">Org Agreements</TabsTrigger>
          <TabsTrigger value="analytics">Events & Analytics</TabsTrigger>
        </TabsList>

        {/* Tab 1: Products & Pricing */}
        <TabsContent value="products" className="space-y-4 mt-4">
          {PRODUCT_KEYS.map((key) => {
            const product = localProducts[key];
            const original = originalProducts[key];
            if (!product || !original) return null;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard
                  product={product}
                  original={original}
                  onChange={(next) => updateProduct(key, next)}
                  onSave={() => saveProduct.mutate(key)}
                  isSaving={savingProduct === key}
                />
              </motion.div>
            );
          })}
        </TabsContent>

        {/* Tab 2: Org Agreements */}
        <TabsContent value="agreements" className="space-y-4 mt-4">
          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={orgSearch}
              onChange={(e) => setOrgSearch(e.target.value)}
              placeholder="Search organizations..."
              className="pl-9"
            />
          </div>

          {/* Org table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium px-4 py-3">
                        Org Name
                      </th>
                      <th className="text-left font-medium px-4 py-3">Product</th>
                      <th className="text-left font-medium px-4 py-3">
                        Current Tier
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        AI
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        Stripe
                      </th>
                      <th className="text-left font-medium px-4 py-3">
                        Override
                      </th>
                      <th className="text-right font-medium px-4 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrgs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          {orgSearch
                            ? "No organizations match your search."
                            : "No organizations found."}
                        </td>
                      </tr>
                    ) : (
                      filteredOrgs.map((org) => {
                        const orgOvs = overridesByOrg[org.id] ?? [];
                        const hasActive = orgOvs.some(isActiveOverride);

                        return (
                          <tr
                            key={org.id}
                            className="border-b last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors"
                            onClick={() => openOrgDialog(org)}
                          >
                            <td className="px-4 py-3 font-medium">
                              {org.name}
                            </td>
                            <td className="px-4 py-3">
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                {org.store_mode ?? "—"}
                              </code>
                            </td>
                            <td className="px-4 py-3">
                              <TierBadge
                                tier={org.subscription_tier ?? "free"}
                              />
                            </td>
                            <td className="px-4 py-3">
                              {org.ai_addon_active ? (
                                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                                  <Zap className="h-3 w-3 mr-1" />
                                  On
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Off</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {org.stripe_customer_id ? (
                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                  Linked
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {hasActive ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-700 border-green-200 text-xs"
                                >
                                  Active
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  None
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openOrgDialog(org);
                                }}
                              >
                                Manage
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Dialog */}
          <OrgAgreementDialog
            org={selectedOrg}
            overrides={overrides}
            adminTierOverride={adminTierOverride}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
          />
        </TabsContent>

        {/* Tab 3: Events & Analytics */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          {/* Analytics cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Free Orgs</p>
                <p className="text-2xl font-semibold">{analytics.freeCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Paid Orgs</p>
                <p className="text-2xl font-semibold text-green-600">{analytics.paidCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-semibold">{analytics.conversionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.convertedCount} of {analytics.nudgedCount} nudged
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Avg Days to Convert</p>
                <p className="text-2xl font-semibold">{analytics.avgDaysToConvert || "—"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent subscription events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Subscription Events
              </CardTitle>
              <CardDescription>
                Recent subscription lifecycle events across all organizations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium px-4 py-3">Time</th>
                      <th className="text-left font-medium px-4 py-3">Org</th>
                      <th className="text-left font-medium px-4 py-3">Event</th>
                      <th className="text-left font-medium px-4 py-3">From</th>
                      <th className="text-left font-medium px-4 py-3">To</th>
                      <th className="text-left font-medium px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventsLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                        </td>
                      </tr>
                    ) : subscriptionEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          No subscription events yet.
                        </td>
                      </tr>
                    ) : (
                      subscriptionEvents.slice(0, 50).map((evt) => {
                        const org = organizations.find((o) => o.id === evt.org_id);
                        return (
                          <tr key={evt.id} className="border-b last:border-b-0 hover:bg-muted/30">
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(evt.created_at), "MMM d, HH:mm")}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {org?.name ?? evt.org_id.slice(0, 8)}
                            </td>
                            <td className="px-4 py-3">
                              <EventTypeBadge type={evt.event_type} />
                            </td>
                            <td className="px-4 py-3">
                              {evt.from_tier ? <TierBadge tier={evt.from_tier} /> : "—"}
                            </td>
                            <td className="px-4 py-3">
                              {evt.to_tier ? <TierBadge tier={evt.to_tier} /> : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                              {evt.stripe_event_id
                                ? evt.stripe_event_id.slice(0, 20)
                                : evt.metadata
                                  ? JSON.stringify(evt.metadata).slice(0, 60)
                                  : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
