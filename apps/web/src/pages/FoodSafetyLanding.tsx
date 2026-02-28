import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Thermometer, FileCheck, ClipboardList, AlertTriangle, BarChart3,
  Check, Star, ArrowRight, ChevronRight, ChevronLeft, Settings,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import CrossMarketFooter from "@/components/landing/CrossMarketFooter";

const iconMap: Record<string, any> = {
  Shield, Thermometer, FileCheck, ClipboardList, AlertTriangle, BarChart3,
};

const useFoodSafetyLandingSections = () => {
  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["food-safety-landing-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_safety_landing_sections")
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

const FoodSafetyLanding = () => {
  useSEO(SEO["/food-safety-landing"]);
  const navigate = useNavigate();
  const { sectionMap, isVisible, isLoading } = useFoodSafetyLandingSections();
  const { isAdmin } = useAdminAuth();
  const [scrolled, setScrolled] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const heroContent = (() => {
    const c = sectionMap.hero?.content;
    if (typeof c === "string") try { return JSON.parse(c); } catch { return {}; }
    return c && typeof c === "object" && !Array.isArray(c) ? c : {};
  })();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ═══ Sticky Header ═══ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm" : "bg-white/80 backdrop-blur-sm"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/food-safety-landing")}>
            <Shield className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Food Safety <span className="text-blue-600">OS</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#compliance" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Compliance</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
            <Button size="sm" onClick={() => navigate("/auth?tab=signup&source=food_safety")} className="bg-blue-600 hover:bg-blue-700 text-white">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ Hero with Carousel ═══ */}
      {isVisible("hero") && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
          {carouselEnabled ? (
            <>
              <AnimatePresence mode="wait">
                <motion.div key={slide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0">
                  <img src={images[slide]?.url} alt={images[slide]?.alt || ""} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-white/30" />
                </motion.div>
              </AnimatePresence>
              <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:bg-white text-gray-700"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/80 shadow-md flex items-center justify-center hover:bg-white text-gray-700"><ChevronRight className="w-5 h-5" /></button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {images.map((_: any, i: number) => (
                  <button key={i} onClick={() => setSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === slide ? "w-6 bg-blue-600" : "bg-gray-400/60"}`} />
                ))}
              </div>
              {images[slide]?.caption && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 text-sm text-gray-600 bg-white/70 px-3 py-1 rounded-full backdrop-blur-sm">{images[slide].caption}</div>
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-blue-50 via-white to-white" />
          )}
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <FadeUp>
              {heroContent.badge && (
                <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 px-4 py-1.5 text-sm">
                  {heroContent.badge}
                </Badge>
              )}
            </FadeUp>
            <FadeUp delay={0.1}>
              <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 text-gray-900">
                {sectionMap.hero?.title || "Food Safety Compliance, Simplified"}
              </h1>
            </FadeUp>
            <FadeUp delay={0.2}>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                {sectionMap.hero?.subtitle}
              </p>
            </FadeUp>
            <FadeUp delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate("/auth?tab=signup&source=food_safety")} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg shadow-blue-600/20">
                  {heroContent.cta_text || "Start Free Trial"} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              {heroContent.cta_subtext && (
                <p className="text-sm text-gray-500 mt-4">{heroContent.cta_subtext}</p>
              )}
            </FadeUp>
          </div>
        </section>
      )}

      {/* ═══ Compliance Features Grid ═══ */}
      {isVisible("compliance_features") && (
        <section id="features" className="py-24 px-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4 text-gray-900">{sectionMap.compliance_features?.title}</h2>
                <p className="text-lg text-gray-600">{sectionMap.compliance_features?.subtitle}</p>
              </div>
            </FadeUp>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arr("compliance_features").map((feat: any, i: number) => {
                const Icon = iconMap[feat.icon] || Shield;
                return (
                  <FadeUp key={i} delay={i * 0.1}>
                    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">{feat.title}</h3>
                      <p className="text-sm text-gray-600">{feat.desc}</p>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BCC Eat Safe Section ═══ */}
      {isVisible("bcc_eat_safe") && (
        <section id="compliance" className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <FadeUp>
              <h2 className="text-4xl font-bold mb-4 text-gray-900">{sectionMap.bcc_eat_safe?.title}</h2>
              <p className="text-lg text-gray-600 mb-12">{sectionMap.bcc_eat_safe?.subtitle}</p>
            </FadeUp>
            <FadeUp delay={0.2}>
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {(obj("bcc_eat_safe").rating_levels || []).map((level: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-5 py-3">
                    <div className="flex">
                      {Array.from({ length: 5 - i }).map((_, si) => (
                        <Star key={si} className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ))}
                      {Array.from({ length: i }).map((_, si) => (
                        <Star key={si} className="w-4 h-4 text-gray-300" />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{level}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
            <FadeUp delay={0.3}>
              <p className="text-gray-600 max-w-2xl mx-auto">{obj("bcc_eat_safe").description}</p>
            </FadeUp>
          </div>
        </section>
      )}

      {/* ═══ Audit Readiness ═══ */}
      {isVisible("audit_readiness") && (
        <section className="py-24 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <FadeUp>
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4 text-gray-900">{sectionMap.audit_readiness?.title}</h2>
                <p className="text-lg text-gray-600">{sectionMap.audit_readiness?.subtitle}</p>
              </div>
            </FadeUp>
            <div className="space-y-6">
              {arr("audit_readiness").map((item: any, i: number) => (
                <FadeUp key={i} delay={i * 0.15}>
                  <div className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-1 text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.desc}</p>
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
                <h2 className="text-4xl font-bold mb-4 text-gray-900">{sectionMap.pricing?.title}</h2>
                {sectionMap.pricing?.subtitle && <p className="text-lg text-gray-600">{sectionMap.pricing.subtitle}</p>}
              </div>
            </FadeUp>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {arr("pricing").map((tier: any, i: number) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className={`relative bg-white rounded-xl p-8 border ${tier.popular ? "border-blue-500 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500" : "border-gray-200"}`}>
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-blue-600 text-white px-3">Most Popular</Badge>
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{tier.name}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                      {tier.period && <span className="text-gray-500">{tier.period}</span>}
                    </div>
                    <ul className="space-y-3 mb-8">
                      {(tier.features || []).map((feat: string, fi: number) => (
                        <li key={fi} className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${tier.popular ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-900"}`}
                      onClick={() => navigate("/auth?tab=signup&source=food_safety")}
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
        <section className="py-24 px-6 bg-gray-50">
          <FadeUp>
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-12 shadow-xl">
              <h2 className="text-3xl font-bold mb-4 text-white">{sectionMap.final_cta?.title}</h2>
              <p className="text-blue-100 mb-8">{sectionMap.final_cta?.subtitle}</p>
              <Button
                size="lg"
                onClick={() => navigate(obj("final_cta").button_link || "/auth?tab=signup")}
                className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 text-lg font-semibold shadow-lg"
              >
                {obj("final_cta").button_text || "Start Free Trial"} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </FadeUp>
        </section>
      )}

      <CrossMarketFooter region="au" current="foodsafety" />

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-gray-200 py-8 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-500">Food Safety OS</span>
          </div>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} ChefOS. All rights reserved.</p>
          {isAdmin && (
            <button onClick={() => navigate("/admin/food-safety-landing")} className="opacity-20 hover:opacity-60 transition-opacity">
              <Settings className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default FoodSafetyLanding;
