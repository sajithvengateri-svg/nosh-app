import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChefHat, Package, ClipboardList, Shield, Menu, Users,
  DollarSign, ArrowRight, Quote, TrendingDown, AlertTriangle,
  Clock, BarChart3, Target, Wrench, CookingPot,
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useLandingSections } from "@/hooks/useLandingSections";
import chefLogo from "@/assets/chefos-logo-new.png";
import HeroSection from "@/components/landing/HeroSection";
import CrossMarketFooter from "@/components/landing/CrossMarketFooter";
import ShareChefOSButton from "@/components/ShareChefOSButton";
import {
  FadeUp, BubbleIn, SlideFrom, AnimatedStat,
  EmptyHint, MetricCounter,
} from "@/components/landing/AnimationWrappers";

/* ─── Icon map ─── */
const iconMap: Record<string, React.ElementType> = {
  DollarSign, ClipboardList, Package, Shield, Menu, Users, ChefHat,
  TrendingDown, AlertTriangle, Clock, BarChart3, Target,
};

/* ─── Main component ─── */
const ChefOSLanding = () => {
  useSEO(SEO["/"]);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { sectionMap, isVisible } = useLandingSections();

  // Redirect authenticated users to dashboard
  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const arr = (key: string) => {
    const c = sectionMap[key]?.content;
    return Array.isArray(c) ? c : [];
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO ===== */}
      {isVisible("hero") && <HeroSection sectionMap={sectionMap} />}

      {/* ===== FEATURES — Bubble effect ===== */}
      {isVisible("features") && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <FadeUp>
            <h2 className="text-2xl font-bold text-center mb-10">
              {sectionMap.features?.title || "Everything Your Kitchen Needs"}
            </h2>
          </FadeUp>
          {arr("features").length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {arr("features").map((f: any, i: number) => {
                const Icon = iconMap[f.icon] || ChefHat;
                return (
                  <BubbleIn key={i} delay={i * 0.08}>
                    <Card className="border bg-card hover:shadow-md transition-shadow h-full">
                      <CardContent className="p-6 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{f.title}</h3>
                          <p className="text-sm text-muted-foreground">{f.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </BubbleIn>
                );
              })}
            </div>
          ) : (
            <EmptyHint label="features" />
          )}
        </section>
      )}

      {/* ===== PAIN POINTS — Animated stats ===== */}
      {isVisible("pain_points") && (
        <section className="bg-muted/30 border-y">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <FadeUp>
              <h2 className="text-2xl font-bold text-center mb-2">
                {sectionMap.pain_points?.title || "The Kitchen Problem"}
              </h2>
              <p className="text-center text-muted-foreground mb-10">
                {sectionMap.pain_points?.subtitle || "Why most kitchens struggle"}
              </p>
            </FadeUp>
            {arr("pain_points").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {arr("pain_points").map((p: any, i: number) => {
                  const Icon = iconMap[p.icon] || AlertTriangle;
                  return (
                    <FadeUp key={i} delay={i * 0.1}>
                      <Card className="border bg-card text-center">
                        <CardContent className="p-6 space-y-3">
                          <div className="w-12 h-12 mx-auto rounded-xl bg-destructive/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-destructive" />
                          </div>
                          {p.stat && <AnimatedStat stat={p.stat} />}
                          <h3 className="font-semibold">{p.title}</h3>
                          <p className="text-sm text-muted-foreground">{p.description}</p>
                        </CardContent>
                      </Card>
                    </FadeUp>
                  );
                })}
              </div>
            ) : (
              <EmptyHint label="pain points" />
            )}
          </div>
        </section>
      )}

      {/* ===== HOW WE FIX IT ===== */}
      {isVisible("how_we_fix_it") && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <FadeUp>
            <h2 className="text-2xl font-bold text-center mb-2">
              {sectionMap.how_we_fix_it?.title || "How ChefOS Fixes It"}
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              {sectionMap.how_we_fix_it?.subtitle || "From chaos to control"}
            </p>
          </FadeUp>
          {arr("how_we_fix_it").length > 0 ? (
            <div className="space-y-4">
              {arr("how_we_fix_it").map((row: any, i: number) => {
                const Icon = iconMap[row.icon] || ChefHat;
                return (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div className="flex items-center gap-4 border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-destructive" />
                      </div>
                      <p className="text-sm text-muted-foreground flex-1">{row.problem}</p>
                      <ArrowRight className="w-5 h-5 text-primary shrink-0" />
                      <p className="text-sm font-medium flex-1">{row.solution}</p>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          ) : (
            <EmptyHint label="items" />
          )}
        </section>
      )}

      {/* ===== SOCIAL PROOF ===== */}
      {isVisible("social_proof") && (
        <section className="border-y bg-muted/30">
          <div className="max-w-5xl mx-auto px-6 py-8 text-center">
            <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
              {sectionMap.social_proof?.subtitle ||
                "Built for professional kitchens · Trusted by head chefs across Australia"}
            </p>
          </div>
        </section>
      )}

      {/* ===== METRICS ===== */}
      {isVisible("metrics") && arr("metrics").length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <FadeUp>
            <h2 className="text-2xl font-bold text-center mb-10">
              {sectionMap.metrics?.title || "ChefOS by the Numbers"}
            </h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {arr("metrics").map((m: any, i: number) => (
              <MetricCounter key={i} value={Number(m.value) || 0} suffix={m.suffix || ""} label={m.label || ""} delay={i * 0.1} />
            ))}
          </div>
        </section>
      )}

      {/* ===== HIGHLIGHTS — Bubble effect ===== */}
      {isVisible("highlights") && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <FadeUp>
            <h2 className="text-2xl font-bold text-center mb-2">
              {sectionMap.highlights?.title || "Platform Highlights"}
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              {sectionMap.highlights?.subtitle || "See what ChefOS can do for your kitchen"}
            </p>
          </FadeUp>
          {arr("highlights").length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {arr("highlights").map((h: any, i: number) => {
                const Icon = iconMap[h.icon] || ChefHat;
                return (
                  <BubbleIn key={i} delay={i * 0.08}>
                    <Card className="border bg-card">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold">{h.title}</h3>
                        <p className="text-sm text-muted-foreground">{h.description}</p>
                      </CardContent>
                    </Card>
                  </BubbleIn>
                );
              })}
            </div>
          ) : (
            <EmptyHint label="highlights" />
          )}
        </section>
      )}

      {/* ===== CHARTS — Slide in from left/right ===== */}
      {isVisible("charts") && (() => {
        const chartData = sectionMap.charts?.content && typeof sectionMap.charts.content === "object" ? sectionMap.charts.content : {};
        const foodCost = Array.isArray(chartData.food_cost) ? chartData.food_cost : [];
        const waste = Array.isArray(chartData.waste) ? chartData.waste : [];
        const hasData = foodCost.length > 0 || waste.length > 0;
        if (!hasData) return null;
        return (
          <section className="bg-muted/30 border-y">
            <div className="max-w-5xl mx-auto px-6 py-16">
              <FadeUp>
                <h2 className="text-2xl font-bold text-center mb-2">
                  {sectionMap.charts?.title || "See the Impact"}
                </h2>
                <p className="text-center text-muted-foreground mb-10">
                  {sectionMap.charts?.subtitle || "Real results from real kitchens"}
                </p>
              </FadeUp>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {foodCost.length > 0 && (
                  <SlideFrom direction="left">
                    <Card className="border bg-card">
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-4 text-sm">Food Cost Trend</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <AreaChart data={foodCost}>
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} animationDuration={1500} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </SlideFrom>
                )}
                {waste.length > 0 && (
                  <SlideFrom direction="right" delay={0.1}>
                    <Card className="border bg-card">
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-4 text-sm">Waste Reduction</h3>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={waste}>
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} animationDuration={1500} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </SlideFrom>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ===== TESTIMONIALS ===== */}
      {isVisible("testimonials") && (
        <section className="border-y bg-muted/20">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <FadeUp>
              <h2 className="text-2xl font-bold text-center mb-2">
                {sectionMap.testimonials?.title || "What Chefs Are Saying"}
              </h2>
              <p className="text-center text-muted-foreground mb-10">
                {sectionMap.testimonials?.subtitle || "Hear from kitchens already using ChefOS"}
              </p>
            </FadeUp>
            {arr("testimonials").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {arr("testimonials").map((t: any, i: number) => (
                  <FadeUp key={i} delay={i * 0.1}>
                    <Card className="border bg-card">
                      <CardContent className="p-6 space-y-3">
                        <Quote className="w-5 h-5 text-primary/40" />
                        <p className="text-sm italic text-muted-foreground">"{t.quote}"</p>
                        <div>
                          <p className="font-semibold text-sm">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </FadeUp>
                ))}
              </div>
            ) : (
              <EmptyHint label="testimonials" />
            )}
          </div>
        </section>
      )}

      {/* ===== FINAL CTA ===== */}
      {isVisible("final_cta") && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary" />
          <FadeUp className="relative max-w-3xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              {sectionMap.final_cta?.title || "Start Running Your Kitchen Smarter"}
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg">
              {sectionMap.final_cta?.subtitle || "Join the kitchens already saving time and money"}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                const link = sectionMap.final_cta?.content?.button_link || "/auth?tab=signup&source=chefos";
                navigate(link);
              }}
              className="gap-2 text-base"
            >
              {sectionMap.final_cta?.content?.button_text || "Get Started Free"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </FadeUp>
        </section>
      )}

      <CrossMarketFooter region="au" current="chefos" />

      {/* ===== FOOTER ===== */}
      {isVisible("footer") && (
        <footer className="border-t">
          <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              <img src={chefLogo} alt="ChefOS" className="w-6 h-6 rounded" />
              <span className="font-semibold text-foreground">ChefOS</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="mailto:hello@chefos.com.au" className="hover:text-foreground transition-colors">Contact</a>
              <ShareChefOSButton variant="ghost" size="sm" />
              <button
                onClick={() => navigate("/admin/auth")}
                className="opacity-20 hover:opacity-70 transition-opacity"
                aria-label="Admin access"
              >
                <Wrench className="w-4 h-4" />
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default ChefOSLanding;
