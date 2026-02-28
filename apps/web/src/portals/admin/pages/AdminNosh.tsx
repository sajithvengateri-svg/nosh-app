import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UtensilsCrossed,
  ExternalLink,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  CreditCard,
} from "lucide-react";

const NOSH_SECTIONS = [
  { label: "Meal Plans", icon: UtensilsCrossed, description: "Weekly autopilot, recipe scheduling" },
  { label: "Subscribers", icon: Users, description: "Prep Mi+ premium members, churn tracking" },
  { label: "Smart Defaults", icon: Sparkles, description: "One-tap cook, ingredient intelligence" },
  { label: "Leftovers", icon: ShoppingCart, description: "Leftover portions, savings tracking" },
  { label: "Analytics", icon: BarChart3, description: "Usage, retention, conversion funnels" },
  { label: "Billing", icon: CreditCard, description: "Stripe subscriptions, revenue" },
  { label: "Settings", icon: Settings, description: "Feature flags, tier config" },
];

const AdminNosh = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            NOSH
          </h1>
          <p className="text-muted-foreground mt-1">
            Independent meal planning app — admin hub
          </p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <a href="https://nosh.chefos.ai/admin" target="_blank" rel="noopener noreferrer">
            Open Prep Mi Admin
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NOSH_SECTIONS.map((section) => (
          <Card key={section.label} className="border-border/50 hover:border-orange-500/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <section.icon className="w-4 h-4 text-orange-500" />
                {section.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-orange-500/30 bg-orange-500/5">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Prep Mi runs as an independent app with its own admin panel.
          <br />
          This page is a quick-access hub from ChefOS Control Center.
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNosh;
