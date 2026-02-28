import { useParams, useSearchParams, Link } from "react-router-dom";
import { VARIANT_REGISTRY, type VariantEntry } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
import { ChefHat, Home, Shield, Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ─── Stream icon mapping ─── */
const STREAM_ICON: Record<string, typeof ChefHat> = {
  chefos: ChefHat,
  homechef: Home,
  eatsafe: Shield,
};

/* ─── Default variant if no ?app= param ─── */
const DEFAULT_VARIANT: AppVariant = "chefos";

export default function ReferLanding() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const appParam = searchParams.get("app");

  // Resolve variant — from ?app= param or default
  const variantKey = (appParam && (VARIANT_REGISTRY as Record<string, VariantEntry>)[appParam]
    ? appParam
    : DEFAULT_VARIANT) as AppVariant;
  const variant = (VARIANT_REGISTRY as Record<string, VariantEntry>)[variantKey] as VariantEntry;
  const Icon = STREAM_ICON[variant.stream] || ChefHat;

  const signupUrl = `/auth?ref=${code || ""}&app=${variantKey}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Icon className="w-7 h-7" style={{ color: variant.brand.accent }} />
            <span className="font-bold text-lg text-foreground">{variant.brand.name}</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div
              className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center"
              style={{ backgroundColor: variant.brand.accent + "15" }}
            >
              <Gift className="w-10 h-10" style={{ color: variant.brand.accent }} />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              You've been invited!
            </h1>
            <p className="text-lg text-muted-foreground">
              Someone shared <span className="font-semibold text-foreground">{variant.brand.name}</span> with you.
              {" "}{variant.brand.tagline}
            </p>
          </div>

          {/* Referral code card */}
          {code && (
            <Card style={{ borderColor: variant.brand.accent + "30" }}>
              <CardContent className="p-5 text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Referral Code</p>
                <p
                  className="text-2xl font-bold tracking-widest"
                  style={{ color: variant.brand.accent }}
                >
                  {code}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sign up with this code and you both earn rewards
                </p>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <Button
            asChild
            size="lg"
            className="w-full text-lg h-14 rounded-xl font-bold"
            style={{ backgroundColor: variant.brand.accent }}
          >
            <Link to={signupUrl}>
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>

          {/* Features teaser */}
          <div className="grid grid-cols-1 gap-3 pt-4">
            {variant.stream === "chefos" && (
              <>
                <FeatureRow icon="📋" text="Recipe & cost management" />
                <FeatureRow icon="🧑‍🍳" text="Prep lists & production" />
                <FeatureRow icon="🛡️" text="Food safety compliance" />
                <FeatureRow icon="📊" text="Real-time kitchen analytics" />
              </>
            )}
            {variant.stream === "homechef" && (
              <>
                <FeatureRow icon="📖" text="Organise all your recipes" />
                <FeatureRow icon="🛒" text="Smart prep lists" />
                <FeatureRow icon="🍳" text="Step-by-step cooking mode" />
                <FeatureRow icon="📅" text="Meal planning made easy" />
              </>
            )}
            {variant.stream === "eatsafe" && (
              <>
                <FeatureRow icon="🛡️" text="Digital food safety logs" />
                <FeatureRow icon="🌡️" text="Temperature monitoring" />
                <FeatureRow icon="📋" text="HACCP plan builder" />
                <FeatureRow icon="✅" text="Audit-ready compliance" />
              </>
            )}
          </div>

          {/* Secondary links */}
          <div className="text-center pt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/auth" className="font-medium text-foreground hover:underline">
                Sign in
              </Link>
            </p>
            <Link
              to="/download"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all apps →
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-lg mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} ChefOS</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 bg-muted/40 rounded-xl px-4 py-3">
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium text-foreground">{text}</span>
    </div>
  );
}
