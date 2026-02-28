import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Truck, BarChart3, Tag, MessageSquare, TrendingUp, Users, ShoppingCart,
  Shield, ChevronLeft, ChevronRight, Quote, Check, ArrowRight, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import CrossMarketFooter from "@/components/landing/CrossMarketFooter";

const iconMap: Record<string, any> = {
  Truck, BarChart3, Tag, MessageSquare, TrendingUp, Users, ShoppingCart, Shield,
};

const CATEGORY_COLORS: Record<string, string> = {
  Seafood: "bg-cyan-500/20 text-cyan-300",
  Produce: "bg-emerald-500/20 text-emerald-300",
  Meat: "bg-red-500/20 text-red-300",
  Dairy: "bg-amber-500/20 text-amber-300",
  "Dry Goods": "bg-violet-500/20 text-violet-300",
  Beverages: "bg-pink-500/20 text-pink-300",
};

// ─── Hook ───
const useVendorLandingSections = () => {
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["vendor-landing-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_landing_sections")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as any[];
    },
    staleTime: 1000 * 60 * 5,
  });
  const sectionMap = sections.reduce<Record<string, any>>((acc, s) => { acc[s.section_key] = s; return acc; }, {});
  const isVisible = (key: string) => sectionMap[key]?.is_visible !== false;
  return { sectionMap, isVisible, isLoading };
};

// ─── Animation helpers ───
const FadeUp = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

const useCountUp = (end: number, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);
  return { count, ref };
};

const AnimatedStat = ({ value, suffix, label }: { value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-white">{count}{suffix}</p>
      <p className="text-sm text-emerald-300/70">{label}</p>
    </div>
  );
};

// ─── Heatmap suburb card ───
const SuburbCard = ({ name, categories, demand }: { name: string; categories: string[]; demand: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 hover:border-emerald-500/40 transition-colors"
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-semibold">{name}</h4>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs text-emerald-400 font-medium">{demand}%</span>
      </div>
    </div>
    <div className="w-full bg-gray-800 rounded-full h-1.5 mb-3">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full transition-all" style={{ width: `${demand}%` }} />
    </div>
    <div className="flex flex-wrap gap-1.5">
      {(categories || []).map((cat: string) => (
        <span key={cat} className={`text-[10px] px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat] || "bg-gray-700 text-gray-300"}`}>
          {cat}
        </span>
      ))}
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════
const VendorLanding = () => {
  useSEO(SEO["/vendor-landing"]);
  const navigate = useNavigate();
  const { sectionMap, isVisible, isLoading } = useVendorLandingSections();
  const { isAdmin } = useAdminAuth();
  const [scrolled, setScrolled] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const arr = (key: string) => {
    const c = sectionMap[key]?.content;
    if (typeof c === "string") try { return JSON.parse(c); } catch { return []; }
    return Array.isArray(c) ? c : [];
  };

  const obj = (key: string) => {
    const c = sectionMap[key]?.content;
    if (typeof c === "string") try { return JSON.parse(c); } catch { return {}; }
    return c && typeof c === "object" && !Array.isArray(c) ? c : {};
  };

  // Carousel auto-advance
  const heroContent = obj("hero");
  const images = Array.isArray(heroContent.images) ? heroContent.images : [];
  const carouselEnabled = heroContent.carousel_enabled && images.length > 0;

  const nextSlide = useCallback(() => {
    if (images.length > 0) setSlide((s) => (s + 1) % images.length);
  }, [images.length]);

  const prevSlide = useCallback(() => {
    if (images.length > 0) setSlide((s) => (s - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!carouselEnabled) return;
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [carouselEnabled, nextSlide]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ═══ Sticky Header ═══ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-gray-950/95 backdrop-blur-md border-b border-gray-800 shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/vendor-landing")}>
            <Truck className="w-7 h-7 text-emerald-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">VendorOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#heatmap" className="text-sm text-gray-400 hover:text-white transition-colors">Heatmap</a>
            <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a>
            <Button size="sm" onClick={() => navigate("/vendor/auth")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ Hero ═══ */}
      {isVisible("hero") && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          {carouselEnabled ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0"
                >
                  <img src={images[slide]?.url} alt={images[slide]?.alt || ""} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-950/30" />
                </motion.div>
              </AnimatePresence>
              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60">
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {images.map((_: any, i: number) => (
                  <button key={i} onClick={() => setSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === slide ? "w-6 bg-emerald-500" : "bg-white/40"}`} />
                ))}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-gray-950 to-gray-950" />
          )}
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <FadeUp>
              {heroContent.badge && (
                <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-1.5">
                  {heroContent.badge}
                </Badge>
              )}
            </FadeUp>
            <FadeUp delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">{sectionMap.hero?.title}</h1>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">{sectionMap.hero?.subtitle}</p>
            </FadeUp>
            <FadeUp delay={0.3}>
              <Button size="lg" onClick={() => navigate("/vendor/auth")} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg">
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ═══ Stats Bar ═══ */}
      {isVisible("stats") && (
        <section className="py-12 px-6 bg-gradient-to-r from-emerald-950/50 via-gray-900/50 to-emerald-950/50 border-y border-gray-800">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {arr("stats").map((s: any, i: number) => (
              <AnimatedStat key={i} value={s.value} suffix={s.suffix} label={s.label} />
            ))}
          </div>
        </section>
      )}

      {/* ═══ How It Works ═══ */}
      {isVisible("how_it_works") && (
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{sectionMap.how_it_works?.title}</h2>
              </div>
            </FadeUp>
            <div className="grid gap-8 md:grid-cols-3">
              {arr("how_it_works").map((step: any, i: number) => {
                const Icon = iconMap[step.icon] || BarChart3;
                return (
                  <FadeUp key={i} delay={i * 0.15}>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="text-xs font-bold text-emerald-500 mb-2">STEP {step.step || i + 1}</div>
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Heatmap ═══ */}
      {isVisible("heatmap") && (
        <section id="heatmap" className="py-24 px-6 bg-gradient-to-b from-gray-950 via-emerald-950/10 to-gray-950">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{sectionMap.heatmap?.title}</h2>
                <p className="text-lg text-gray-400">{sectionMap.heatmap?.subtitle}</p>
              </div>
            </FadeUp>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {arr("heatmap").map((suburb: any, i: number) => (
                <SuburbCard key={i} name={suburb.name} categories={suburb.categories} demand={suburb.demand} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Features ═══ */}
      {isVisible("features") && (
        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{sectionMap.features?.title}</h2>
              </div>
            </FadeUp>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arr("features").map((feat: any, i: number) => {
                const Icon = iconMap[feat.icon] || TrendingUp;
                return (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 hover:border-emerald-500/40 transition-colors group">
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                        <Icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                      <p className="text-sm text-gray-400">{feat.description}</p>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Testimonials ═══ */}
      {isVisible("testimonials") && arr("testimonials").length > 0 && (
        <section className="py-24 px-6 bg-gradient-to-b from-gray-950 via-emerald-950/10 to-gray-950">
          <div className="max-w-3xl mx-auto">
            <FadeUp>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold">{sectionMap.testimonials?.title}</h2>
              </div>
            </FadeUp>
            <div className="space-y-6">
              {arr("testimonials").map((t: any, i: number) => (
                <FadeUp key={i} delay={i * 0.15}>
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
                    <Quote className="w-8 h-8 text-emerald-500/40 mb-4" />
                    <p className="text-lg text-gray-200 mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Pricing ═══ */}
      {isVisible("pricing") && (
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{sectionMap.pricing?.title}</h2>
              </div>
            </FadeUp>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arr("pricing").map((tier: any, i: number) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className={`relative bg-gray-900/50 rounded-xl p-8 border ${tier.popular ? "border-emerald-500 shadow-lg shadow-emerald-500/10" : "border-gray-800"}`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-emerald-600 text-white px-3">Most Popular</Badge>
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{tier.price}</span>
                      {tier.period && <span className="text-gray-400">{tier.period}</span>}
                    </div>
                    <ul className="space-y-3 mb-8">
                      {(tier.features || []).map((feat: string, fi: number) => (
                        <li key={fi} className="flex items-center gap-2 text-sm text-gray-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${tier.popular ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-800 hover:bg-gray-700"}`}
                      onClick={() => navigate("/vendor/auth")}
                    >
                      {tier.cta} <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ Final CTA ═══ */}
      {isVisible("final_cta") && (
        <section className="py-24 px-6">
          <FadeUp>
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-12">
              <h2 className="text-3xl font-bold mb-4">{sectionMap.final_cta?.title}</h2>
              <p className="text-emerald-100 mb-8">{sectionMap.final_cta?.subtitle}</p>
              <Button
                size="lg"
                onClick={() => navigate(obj("final_cta").button_link || "/vendor/auth")}
                className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg font-semibold"
              >
                {obj("final_cta").button_text || "Get Started"} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </FadeUp>
        </section>
      )}

      <CrossMarketFooter region="au" current="chefos" />

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-400">VendorOS</span>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} ChefOS. All rights reserved.</p>
          {isAdmin && (
            <button onClick={() => navigate("/admin/vendor-landing")} className="opacity-20 hover:opacity-60 transition-opacity">
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default VendorLanding;
