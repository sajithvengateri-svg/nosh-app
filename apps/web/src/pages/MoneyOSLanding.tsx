import { useState, useEffect, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingDown, AlertTriangle, Clock, BarChart3,
  Target, ArrowRight, Quote, Users, Activity, Shield,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { useMoneyLandingSections } from "@/hooks/useMoneyLandingSections";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";
import CrossMarketFooter from "@/components/landing/CrossMarketFooter";
import {
  FadeUp, BubbleIn, SlideFrom, AnimatedStat,
  EmptyHint, MetricCounter,
} from "@/components/landing/AnimationWrappers";

const iconMap: Record<string, React.ElementType> = {
  DollarSign, TrendingDown, AlertTriangle, Clock, BarChart3,
  Target, Users, Activity, Shield,
};

/* ─── Default hero images (overridable via admin CRM) ─── */
const DEFAULT_HERO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80&fit=crop",
    alt: "Elegant restaurant interior with warm ambient lighting",
    caption: "Built for Hospitality",
  },
  {
    url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80&fit=crop",
    alt: "Financial data and charts displayed on multiple trading screens",
    caption: "Real-Time Financial Intelligence",
  },
  {
    url: "https://images.unsplash.com/photo-1502933691298-84fc14542831?w=1920&q=80&fit=crop",
    alt: "Surfer walking towards the ocean on a wide sandy beach at golden hour",
    caption: "Run Your Numbers. Then Relax.",
  },
  {
    url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1920&q=80&fit=crop",
    alt: "Chef carefully plating a fine dining dish in a professional kitchen",
    caption: "From Kitchen to Bottom Line",
  },
];

const MoneyOSLanding = () => {
  useSEO(SEO["/money-landing"]);
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { sectionMap, isVisible } = useMoneyLandingSections();

  if (!isLoading && user) {
    return <Navigate to="/money" replace />;
  }

  const arr = (key: string) => {
    const c = sectionMap[key]?.content;
    return Array.isArray(c) ? c : [];
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== HERO CAROUSEL ===== */}
      {isVisible("hero") && (
        <MoneyHeroCarousel sectionMap={sectionMap} navigate={navigate} />
      )}

      {/* ===== FEATURES ===== */}
      {isVisible("features") && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <FadeUp>
            <h2 className="text-2xl font-bold text-center mb-10">
              {sectionMap.features?.title || "Everything You Need to Control Your Numbers"}
            </h2>
          </FadeUp>
          {arr("features").length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {arr("features").map((f: any, i: number) => {
                const Icon = iconMap[f.icon] || DollarSign;
                return (
                  <BubbleIn key={i} delay={i * 0.08}>
                    <Card className="border bg-card hover:shadow-md transition-shadow h-full">
                      <CardContent className="p-6 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-emerald-600" />
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

      {/* ===== PAIN POINTS ===== */}
      {isVisible("pain_points") && (
        <section className="bg-muted/30 border-y">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <FadeUp>
              <h2 className="text-2xl font-bold text-center mb-2">
                {sectionMap.pain_points?.title || "The Restaurant Money Problem"}
              </h2>
              <p className="text-center text-muted-foreground mb-10">
                {sectionMap.pain_points?.subtitle || "Why most venues fly blind on financials"}
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
              {sectionMap.how_we_fix_it?.title || "How MoneyOS Fixes It"}
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              {sectionMap.how_we_fix_it?.subtitle || "From spreadsheet chaos to financial clarity"}
            </p>
          </FadeUp>
          {arr("how_we_fix_it").length > 0 ? (
            <div className="space-y-4">
              {arr("how_we_fix_it").map((row: any, i: number) => {
                const Icon = iconMap[row.icon] || DollarSign;
                return (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div className="flex items-center gap-4 border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-destructive" />
                      </div>
                      <p className="text-sm text-muted-foreground flex-1">{row.problem}</p>
                      <ArrowRight className="w-5 h-5 text-emerald-600 shrink-0" />
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
              {sectionMap.social_proof?.subtitle || "Built for hospitality · Trusted by restaurants, cafes & bars across Australia"}
            </p>
          </div>
        </section>
      )}

      {/* ===== METRICS ===== */}
      {isVisible("metrics") && arr("metrics").length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <FadeUp>
            <h2 className="text-2xl font-bold text-center mb-10">
              {sectionMap.metrics?.title || "MoneyOS by the Numbers"}
            </h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {arr("metrics").map((m: any, i: number) => (
              <MetricCounter key={i} value={Number(m.value) || 0} suffix={m.suffix || ""} label={m.label || ""} delay={i * 0.1} />
            ))}
          </div>
        </section>
      )}

      {/* ===== HIGHLIGHTS ===== */}
      {isVisible("highlights") && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <FadeUp>
            <h2 className="text-2xl font-bold text-center mb-2">
              {sectionMap.highlights?.title || "Platform Highlights"}
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              {sectionMap.highlights?.subtitle || "See what MoneyOS can do for your venue"}
            </p>
          </FadeUp>
          {arr("highlights").length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {arr("highlights").map((h: any, i: number) => {
                const Icon = iconMap[h.icon] || DollarSign;
                return (
                  <BubbleIn key={i} delay={i * 0.08}>
                    <Card className="border bg-card">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-emerald-600" />
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

      {/* ===== TESTIMONIALS ===== */}
      {isVisible("testimonials") && (
        <section className="border-y bg-muted/20">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <FadeUp>
              <h2 className="text-2xl font-bold text-center mb-2">
                {sectionMap.testimonials?.title || "What Operators Are Saying"}
              </h2>
              <p className="text-center text-muted-foreground mb-10">
                {sectionMap.testimonials?.subtitle || "Hear from venues already using MoneyOS"}
              </p>
            </FadeUp>
            {arr("testimonials").length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {arr("testimonials").map((t: any, i: number) => (
                  <FadeUp key={i} delay={i * 0.1}>
                    <Card className="border bg-card">
                      <CardContent className="p-6 space-y-3">
                        <Quote className="w-5 h-5 text-emerald-500/40" />
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
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 to-emerald-500" />
          <FadeUp className="relative max-w-3xl mx-auto px-6 py-20 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {sectionMap.final_cta?.title || "Take Control of Your Restaurant Finances"}
            </h2>
            <p className="text-white/80 mb-8 text-lg">
              {sectionMap.final_cta?.subtitle || "Join the venues already running smarter with MoneyOS"}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => {
                const link = sectionMap.final_cta?.content?.button_link || "/auth?tab=signup&source=moneyos";
                navigate(link);
              }}
              className="gap-2 text-base"
            >
              {sectionMap.final_cta?.content?.button_text || "Start Free Trial"}
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
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-foreground">MoneyOS</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="mailto:hello@chefos.com.au" className="hover:text-foreground transition-colors">Contact</a>
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors text-xs">
                ChefOS
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

/* ─── Hero Carousel sub-component ─── */

const MoneyHeroCarousel = ({
  sectionMap,
  navigate,
}: {
  sectionMap: Record<string, any>;
  navigate: (path: string) => void;
}) => {
  const heroContent =
    sectionMap.hero?.content && typeof sectionMap.hero.content === "object" && !Array.isArray(sectionMap.hero.content)
      ? sectionMap.hero.content
      : {};

  const images =
    heroContent.carousel_enabled && Array.isArray(heroContent.images) && heroContent.images.length > 0
      ? heroContent.images
      : DEFAULT_HERO_IMAGES;

  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((p) => (p + 1) % images.length),
    [images.length],
  );
  const prev = useCallback(
    () => setCurrent((p) => (p - 1 + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  // Alternate pan direction per slide for variety
  const panRight = current % 2 === 0;

  return (
    <header className="relative overflow-hidden h-[85vh] min-h-[600px] max-h-[900px]">
      {/* Background images with cinematic pan */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <motion.img
            src={images[current].url}
            alt={images[current].alt}
            className="w-full h-full object-cover"
            initial={{ scale: 1.15, x: panRight ? "-3%" : "3%" }}
            animate={{ scale: 1.08, x: panRight ? "3%" : "-3%" }}
            transition={{ duration: 6, ease: "linear" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <FadeUp>
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">MoneyOS</span>
          </div>
        </FadeUp>

        <FadeUp delay={0.15}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            {sectionMap.hero?.title || "The Financial Operating System for Restaurants"}
          </h1>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8 drop-shadow">
            {sectionMap.hero?.subtitle || "Real-time P&L, cost tracking, and financial intelligence — built for hospitality."}
          </p>
        </FadeUp>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.8 }}
        >
          <Button
            size="lg"
            onClick={() => {
              const link = heroContent.button_link || "/auth?tab=signup&source=moneyos";
              navigate(link);
            }}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {heroContent.button_text || "Get Started Free"}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/auth?tab=login")}
            className="border-white/30 text-white hover:bg-white/10"
          >
            Sign In
          </Button>
        </motion.div>

        {/* Image caption */}
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="mt-8 text-sm text-white/50 uppercase tracking-widest"
          >
            {images[current].caption}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Nav arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-emerald-400 w-6" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </header>
  );
};

export default MoneyOSLanding;
