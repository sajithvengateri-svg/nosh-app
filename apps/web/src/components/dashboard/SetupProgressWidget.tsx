import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import {
  CheckCircle2, Circle, MapPin, Users, ChefHat,
  Package, ClipboardCheck, ListChecks,
} from "lucide-react";

interface SetupStep {
  key: string;
  label: string;
  icon: React.ElementType;
  done: boolean;
  href: string;
}

const SetupProgressWidget = () => {
  const { currentOrg, venues, memberships } = useOrg();

  const { data: counts } = useQuery({
    queryKey: ["setup-progress", currentOrg?.id],
    enabled: !!currentOrg?.id,
    queryFn: async () => {
      const orgId = currentOrg!.id;
      const [
        { count: recipeCount },
        { count: ingredientCount },
        { count: prepCount },
        { count: sectionCount },
      ] = await Promise.all([
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("ingredients").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("prep_lists").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("kitchen_sections").select("*", { count: "exact", head: true }).eq("org_id", orgId),
      ]);
      return {
        recipes: recipeCount || 0,
        ingredients: ingredientCount || 0,
        preps: prepCount || 0,
        sections: sectionCount || 0,
      };
    },
  });

  const memberCount = memberships.filter(m => m.org_id === currentOrg?.id && m.is_active).length;

  const steps: SetupStep[] = [
    { key: "venue", label: "Add a venue", icon: MapPin, done: venues.length > 0, href: "/settings" },
    { key: "recipe", label: "Create your first recipe", icon: ChefHat, done: (counts?.recipes || 0) > 0, href: "/recipes" },
    { key: "ingredient", label: "Add ingredients", icon: Package, done: (counts?.ingredients || 0) > 0, href: "/ingredients" },
    { key: "team", label: "Invite a team member", icon: Users, done: memberCount > 1, href: "/team" },
    { key: "section", label: "Set up kitchen sections", icon: ListChecks, done: (counts?.sections || 0) > 0, href: "/kitchen-sections" },
    { key: "prep", label: "Create a prep list", icon: ClipboardCheck, done: (counts?.preps || 0) > 0, href: "/prep" },
  ];

  const completed = steps.filter(s => s.done).length;
  const percent = Math.round((completed / steps.length) * 100);

  // Hide once all done
  if (percent === 100) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Setup Progress</CardTitle>
          <span className="text-sm font-bold text-primary">{percent}%</span>
        </div>
        <Progress value={percent} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.key}
                to={step.href}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  step.done
                    ? "text-muted-foreground"
                    : "hover:bg-muted/50"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className={`text-sm ${step.done ? "line-through" : "font-medium"}`}>
                  {step.label}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SetupProgressWidget;
