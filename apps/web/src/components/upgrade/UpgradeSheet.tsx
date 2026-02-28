import { useState, useEffect } from "react";
import { ArrowUpRight, Sparkles, Zap, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nudgeType?: "upgrade_prompt" | "sneak_peek";
  onDismiss?: () => void;
  onConverted?: () => void;
}

const CHEF_OS_FEATURES = [
  "Full kitchen management suite",
  "Inventory & stock control",
  "Menu engineering & costing",
  "Staff scheduling & rosters",
  "Supplier management",
  "Advanced analytics & reports",
  "Multi-venue support",
  "Food safety compliance",
];

const AI_ADDON_FEATURES = [
  "AI Recipe Assistant",
  "Smart menu suggestions",
  "Predictive ordering",
  "Voice-enabled companion",
];

export default function UpgradeSheet({
  open,
  onOpenChange,
  nudgeType = "upgrade_prompt",
  onDismiss,
  onConverted,
}: UpgradeSheetProps) {
  const orgId = useOrgId();
  const { storeMode } = useOrg();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [includeAiAddon, setIncludeAiAddon] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [planPrices, setPlanPrices] = useState<{
    monthly: number | null;
    yearly: number | null;
    aiMonthly: number | null;
    aiYearly: number | null;
    currency: string;
  }>({ monthly: null, yearly: null, aiMonthly: null, aiYearly: null, currency: "gbp" });

  // Fetch plan pricing on mount
  useEffect(() => {
    const fetchPricing = async () => {
      const storeKey = storeMode === "homecook" ? "homeos" : storeMode === "india" ? "chefos_india" : "chefos";
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("price_monthly, price_yearly, ai_addon_price_monthly, ai_addon_price_yearly, currency")
        .eq("tier", "pro")
        .eq("is_active", true)
        .eq("product_key", storeKey)
        .maybeSingle();
      if (plans) {
        setPlanPrices({
          monthly: (plans as any).price_monthly,
          yearly: (plans as any).price_yearly,
          aiMonthly: (plans as any).ai_addon_price_monthly,
          aiYearly: (plans as any).ai_addon_price_yearly,
          currency: (plans as any).currency || "gbp",
        });
      }
    };
    if (open) fetchPricing();
  }, [open, storeMode]);

  const formatPrice = (amount: number | null, currency: string) => {
    if (amount == null) return "";
    const sym =
      currency === "gbp" ? "£" :
      currency === "usd" ? "$" :
      currency === "aud" ? "A$" :
      currency === "inr" ? "₹" :
      currency === "aed" ? "د.إ" :
      currency === "sgd" ? "S$" :
      currency.toUpperCase() + " ";
    return `${sym}${amount.toFixed(2)}`;
  };

  const handleUpgrade = async (planId?: string) => {
    if (!orgId) {
      toast.error("Organization not found");
      return;
    }

    setIsCheckingOut(true);
    try {
      // Fetch the pro plan for the org's product, filtered by store mode
      const storeKey = storeMode === "homecook" ? "homeos" : storeMode === "india" ? "chefos_india" : "chefos";
      const { data: plans } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("tier", "pro")
        .eq("is_active", true)
        .eq("product_key", storeKey);

      const plan = plans?.[0];
      if (!plan) {
        toast.error("No active upgrade plan found");
        return;
      }

      const { data, error } = await supabase.functions.invoke("subscription-checkout", {
        body: {
          orgId,
          planId: (plan as any).id,
          billingPeriod,
          includeAiAddon,
          returnUrl: window.location.href,
        },
      });

      if (error) throw error;
      if (data?.url) {
        onConverted?.();
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(`Upgrade failed: ${err.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-violet-600" />
            {nudgeType === "sneak_peek"
              ? "Sneak Peek: ChefOS Pro"
              : "Upgrade to ChefOS Pro"}
          </SheetTitle>
          <SheetDescription>
            {nudgeType === "sneak_peek"
              ? "Here's a taste of what ChefOS Pro can do for your kitchen."
              : "Unlock the full power of ChefOS for your team."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* ChefOS Pro features */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">ChefOS Pro includes:</h3>
            <ul className="space-y-2">
              {CHEF_OS_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* AI Add-on */}
          <div
            className={`rounded-lg border p-4 space-y-2 cursor-pointer transition-colors ${
              includeAiAddon
                ? "border-purple-300 bg-purple-50"
                : "border-muted hover:border-purple-200"
            }`}
            onClick={() => setIncludeAiAddon(!includeAiAddon)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">AI Add-on</span>
              </div>
              <Badge
                variant="outline"
                className={
                  includeAiAddon
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : ""
                }
              >
                {includeAiAddon ? "Included" : "Add"}
              </Badge>
            </div>
            <ul className="space-y-1">
              {AI_ADDON_FEATURES.map((f) => (
                <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-purple-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          {planPrices.monthly != null && (
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold">
                {formatPrice(
                  billingPeriod === "yearly" ? planPrices.yearly : planPrices.monthly,
                  planPrices.currency,
                )}
                <span className="text-sm font-normal text-muted-foreground">
                  /{billingPeriod === "yearly" ? "yr" : "mo"}
                </span>
              </p>
              {includeAiAddon && planPrices.aiMonthly != null && (
                <p className="text-sm text-purple-600">
                  + {formatPrice(
                    billingPeriod === "yearly" ? planPrices.aiYearly : planPrices.aiMonthly,
                    planPrices.currency,
                  )}/{billingPeriod === "yearly" ? "yr" : "mo"} AI add-on
                </p>
              )}
            </div>
          )}

          {/* Billing toggle */}
          <div className="flex items-center gap-2 justify-center">
            <Button
              variant={billingPeriod === "monthly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingPeriod("monthly")}
            >
              Monthly
            </Button>
            <Button
              variant={billingPeriod === "yearly" ? "default" : "outline"}
              size="sm"
              onClick={() => setBillingPeriod("yearly")}
            >
              Yearly (Save 20%)
            </Button>
          </div>

          {/* CTA */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => handleUpgrade()}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? (
              "Redirecting to checkout..."
            ) : (
              <>
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Upgrade Now
              </>
            )}
          </Button>

          {nudgeType === "sneak_peek" && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                onDismiss?.();
                onOpenChange(false);
              }}
            >
              Maybe later
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
