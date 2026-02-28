import { Send, CheckCircle2, Coins, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useReferrals } from "@/hooks/useReferrals";
import { useLoyaltyCredits } from "@/hooks/useLoyaltyCredits";

const ReferralKPICards = () => {
  const { data: referrals = [], isLoading: loadingRefs } = useReferrals();
  const { balance, isLoading: loadingCredits } = useLoyaltyCredits();

  const sent = referrals.length;
  const conversions = referrals.filter((r: any) => r.reward_status === "credited" || r.status === "completed").length;
  // Next milestone — simple: 5 referrals = bonus
  const nextMilestone = sent < 5 ? `${5 - sent} more to earn bonus` : sent < 10 ? `${10 - sent} more for next bonus` : "Champion! 🏆";

  const loading = loadingRefs || loadingCredits;

  const cards = [
    { icon: Send, label: "Referrals Sent", value: loading ? "..." : sent, color: "text-blue-500" },
    { icon: CheckCircle2, label: "Conversions", value: loading ? "..." : conversions, color: "text-emerald-500" },
    { icon: Coins, label: "Credits Earned", value: loading ? "..." : `$${balance.toFixed(2)}`, color: "text-amber-500" },
    { icon: Target, label: "Next Milestone", value: loading ? "..." : nextMilestone, color: "text-violet-500", small: true },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4 text-center">
            <c.icon className={`w-5 h-5 mx-auto mb-1 ${c.color}`} />
            <p className={`font-bold text-foreground ${c.small ? "text-sm" : "text-xl"}`}>{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReferralKPICards;
