import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ChefHat, DollarSign, ClipboardList, Package, Shield, Users, BarChart3,
  AlertTriangle, Clock, TrendingDown, Check, ArrowRight, ChevronRight, ChevronLeft, Quote, Settings,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";
import CrossMarketFooter from "@/components/landing/CrossMarketFooter";

const iconMap: Record<string, any> = {
  DollarSign, ClipboardList, Package, Shield, Users, BarChart3,
  AlertTriangle, Clock, TrendingDown, ChefHat,
};

const useIndianChefOSLandingSections = () => {
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["indian-chefos-landing-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("indian_chefos_landing_sections")
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

/* ─── Animation helpers ─── */
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

const StatCard = ({ stat, icon, title, description }: { stat: string; icon: string; title: string; description: string }) => {
  const numMatch = stat.match(/(\d+)/);
  const num = numMatch ? parseInt(numMatch[1]) : 0;
  const suffix = stat.replace(/\d+/, "");
  const { count, ref } = useCountUp(num);
  const Icon = iconMap[icon] || AlertTriangle;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-orange-900/40 border border-orange-800/50 rounded-xl p-6 text-center"
    >
      <Icon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
      <p className="text-4xl font-bold text-amber-400 mb-1">{count}{suffix}</p>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-orange-300/70">{description}</p>
    </motion.div>
  );
};

const IndianChefOSLanding = () => {
  useSEO(SEO["/chefos-india"]);
  const navigate = useNavigate();
  const { sectionMap, isVisible, isLoading } = useIndianChefOSLandingSections();
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
      <div className="min-h-screen bg-orange-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-950 text-orange-50">
      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-orange-950/95 backdrop-blur-md border-b border-orange-800 shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/chefos-india")}>
            <ChefHat className="w-7 h-7 text-amber-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">ChefOS India</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-orange-300/70 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-orange-300/70 hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-orange-300/70 hover:text-white transition-colors">Testimonials</a>
            <Button size="sm" onClick={() => navigate("/auth?tab=signup&source=india_chefos")} className="bg-amber-600 hover:bg-amber-700 text-white">
              Start Free <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      {isVisible("hero") && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          {carouselEnabled ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div key={slide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
                  <img src={images[slide]?.url} alt={images[slide]?.alt || ""} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-950 via-orange-950/70 to-orange-950/40" />
                </motion.div>
              </AnimatePresence>
              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60"><ChevronRight className="w-5 h-5" /></button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {images.map((_: any, i: number) => (
                  <button key={i} onClick={() => setSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === slide ? "w-6 bg-amber-500" : "bg-white/40"}`} />
                ))}
              </div>
              {images[slide]?.caption && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 text-sm text-amber-200/70">{images[slide].caption}</div>
              )}
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-amber-950/40 via-orange-950 to-orange-950" />
            </>
          )}
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <FadeUp>
              {heroContent.badge && (
                <Badge className="mb-6 bg-amber-500/20 text-amber-300 border-amber-500/30 px-4 py-1.5">
                  {heroContent.badge}
                </Badge>
              )}
            </FadeUp>
            <FadeUp delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
                {sectionMap.hero?.title}
              </h1>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-xl text-orange-200/70 max-w-2xl mx-auto mb-10">
                {sectionMap.hero?.subtitle}
              </p>
            </FadeUp>
            <FadeUp delay={0.3}>
              <Button size="lg" onClick={() => navigate("/auth?tab=signup&source=india_chefos")} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-6 text-lg">
                {heroContent.cta_text || "Start Free"} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              {heroContent.cta_subtext && (
                <p className="text-sm text-orange-400/60 mt-4">{heroContent.cta_subtext}</p>
              )}
            </FadeUp>
          </div>
        </section>
      )}

      {/* Features Grid */}
      {isVisible("features") && (
        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{sectionMap.features?.title}</h2>
                <p className="text-lg text-orange-200/60">{sectionMap.features?.subtitle}</p>
              </div>
            </FadeUp>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arr("features").map((feat: any, i: number) => {
                const Icon = iconMap[feat.icon] || ChefHat;
                return (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div className="bg-orange-900/40 border border-orange-800/50 rounded-xl p-6 hover:border-amber-500/40 transition-colors group">
                      <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                        <Icon className="w-6 h-6 text-amber-400" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                      <p className="text-sm text-orange-200/60">{feat.desc}</p>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Pain Points */}
      {isVisible("pain_points") && (
        <section className="py-24 px-6 bg-gradient-to-b from-orange-950 via-amber-950/20 to-orange-950">
          <div className="max-w-5xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{sectionMap.pain_points?.title}</h2>
                <p className="text-lg text-orange-200/60">{sectionMap.pain_points?.subtitle}</p>
              </div>
            </FadeUp>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {arr("pain_points").map((item: any, i: number) => (
                <StatCard key={i} stat={item.stat} icon={item.icon} title={item.title} description={item.description} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      {isVisible("pricing") && (
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{sectionMap.pricing?.title}</h2>
                {sectionMap.pricing?.subtitle && <p className="text-lg text-orange-200/60">{sectionMap.pricing.subtitle}</p>}
              </div>
            </FadeUp>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {arr("pricing").map((tier: any, i: number) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className={`relative bg-orange-900/40 rounded-xl p-6 border ${tier.popular ? "border-amber-500 shadow-lg shadow-amber-500/10" : "border-orange-800/50"}`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-amber-600 text-white px-3">Most Popular</Badge>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-2">{tier.name}</h3>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{tier.price}</span>
                      {tier.period && <span className="text-orange-300/60">{tier.period}</span>}
                    </div>
                    <ul className="space-y-2.5 mb-8">
                      {(tier.features || []).map((feat: string, fi: number) => (
                        <li key={fi} className="flex items-center gap-2 text-sm text-orange-200/80">
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${tier.popular ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-orange-800 hover:bg-orange-700"}`}
                      onClick={() => navigate("/auth?tab=signup&source=india_chefos")}
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

      {/* Testimonials */}
      {isVisible("testimonials") && (
        <section id="testimonials" className="py-24 px-6 bg-gradient-to-b from-orange-950 via-amber-950/10 to-orange-950">
          <div className="max-w-5xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4">{sectionMap.testimonials?.title}</h2>
              </div>
            </FadeUp>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arr("testimonials").map((t: any, i: number) => (
                <FadeUp key={i} delay={i * 0.15}>
                  <div className="bg-orange-900/40 border border-orange-800/50 rounded-xl p-6">
                    <Quote className="w-8 h-8 text-amber-500/40 mb-4" />
                    <p className="text-orange-100 mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-orange-300/60">{t.role}</p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      {isVisible("final_cta") && (
        <section className="py-24 px-6">
          <FadeUp>
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-amber-600 to-orange-700 rounded-2xl p-12">
              <h2 className="text-3xl font-bold mb-4">{sectionMap.final_cta?.title}</h2>
              <p className="text-amber-100 mb-8">{sectionMap.final_cta?.subtitle}</p>
              <Button
                size="lg"
                onClick={() => navigate(obj("final_cta").button_link || "/auth?tab=signup")}
                className="bg-white text-orange-700 hover:bg-orange-50 px-8 py-6 text-lg font-semibold"
              >
                {obj("final_cta").button_text || "Start Free"} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </FadeUp>
        </section>
      )}

      <CrossMarketFooter region="india" current="chefos" />

      {/* Footer */}
      <footer className="border-t border-orange-800/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-orange-300/60">ChefOS India</span>
          </div>
          <p className="text-xs text-orange-800">&copy; {new Date().getFullYear()} ChefOS. All rights reserved.</p>
          {isAdmin && (
            <button onClick={() => navigate("/admin/india-chefos-landing")} className="opacity-20 hover:opacity-60 transition-opacity">
              <Settings className="w-4 h-4 text-orange-400" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default IndianChefOSLanding;
