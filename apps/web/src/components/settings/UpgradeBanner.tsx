import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOrg } from "@/contexts/OrgContext";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import { isCompliance } from "@queitos/shared";

const UpgradeBanner = () => {
  const { variant, isUpgraded } = useFeatureGate();
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  const isEatSafe = isCompliance(variant);

  // Don't show if already on highest tier
  if (isUpgraded) return null;
  // Only show for EatSafe and HomeChef users
  if (!isEatSafe && !isHomeCook) return null;

  const config = isEatSafe
    ? {
        title: "Upgrade to Home Chef",
        description: "Unlock recipes, kitchen management, inventory, and more.",
        href: "/upgrade?from=eatsafe",
        gradient: "from-emerald-500/10 to-teal-500/10",
        borderColor: "border-emerald-200 dark:border-emerald-800",
      }
    : {
        title: "Upgrade to Chef Pro",
        description: "Advanced analytics, team management, roster, and AI tools.",
        href: "/upgrade?from=homechef",
        gradient: "from-primary/10 to-amber-500/10",
        borderColor: "border-primary/20",
      };

  return (
    <Card className={cn("border", config.borderColor, `bg-gradient-to-r ${config.gradient}`)}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{config.title}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link to={config.href}>
            Learn More <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default UpgradeBanner;
