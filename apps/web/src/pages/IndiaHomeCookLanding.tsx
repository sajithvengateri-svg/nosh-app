import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";
import {
  ChefHat, Utensils, Package, Trash2, Shield, BookOpen,
  Store, Share2, Users2, Palette, ArrowRight, Heart, Sparkles, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIndiaHomeCookLandingSections } from "@/hooks/useIndiaHomeCookLandingSections";
import CrossMarketFooter from "@/components/landing/CrossMarketFooter";
import { Loader2 } from "lucide-react";

import heroImage from "@/assets/homecook-hero.jpg";
import heroVideo from "@/assets/homecook-hero-video.mp4";
import cupcakesImg from "@/assets/homecook-cupcakes.jpg";
import pantryImg from "@/assets/homecook-pantry.jpg";
import bakesImg from "@/assets/homecook-bakes.jpg";
import macaronsImg from "@/assets/homecook-macarons.jpg";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const ICON_MAP: Record<string, React.ElementType> = {
  ChefHat, Utensils, Package, Trash2, Shield, BookOpen,
  Store, Share2, Users2, Heart, Sparkles, Palette,
};

const lifestyleImages = [
  { src: cupcakesImg, alt: "Colourful Indian sweets", accent: "amber" },
  { src: pantryImg, alt: "Organised Indian pantry with spices", accent: "emerald" },
  { src: bakesImg, alt: "Fresh naan and roti", accent: "amber" },
  { src: macaronsImg, alt: "Indian mithai selection", accent: "emerald" },
];

const AUTH_SOURCE = "india_home_cook";
const AUTH_SIGNUP = `/auth?mode=home_cook&tab=signup&source=${AUTH_SOURCE}`;
const AUTH_LOGIN = `/auth?mode=home_cook&tab=login&source=${AUTH_SOURCE}`;

const IndiaHomeCookLanding = () => {
  useSEO(SEO["/home-cook-india"]);
  const { sectionMap, isVisible, isLoading } = useIndiaHomeCookLandingSections();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-neutral-950 dark:to-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const hero = sectionMap["hero"];
  const features = sectionMap["features"];
  const comingSoon = sectionMap["coming_soon"];
  const moneyTracker = sectionMap["money_tracker"];
  const soloTeam = sectionMap["solo_team"];
  const themes = sectionMap["themes"];
  const finalCta = sectionMap["final_cta"];

  const heroContent = hero?.content && typeof hero.content === "object" ? hero.content : {};
  const featuresContent = Array.isArray(features?.content) ? features.content : [];
  const comingSoonContent = Array.isArray(comingSoon?.content) ? comingSoon.content : [];
  const moneyContent = moneyTracker?.content && typeof moneyTracker.content === "object" ? moneyTracker.content : {};
  const themesContent = Array.isArray(themes?.content) ? themes.content : [];
  const ctaContent = finalCta?.content && typeof finalCta.content === "object" ? finalCta.content : {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-emerald-50/30 to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-amber-100 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/home-cook-india" className="flex items-center gap-2 cursor-pointer">
            <Heart className="w-6 h-6 text-amber-500" />
            <span className="font-bold text-lg text-foreground">ChefOS <span className="text-amber-500">Home</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to={AUTH_LOGIN}>
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to={AUTH_SIGNUP}>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Video Hero */}
      {isVisible("hero") && hero && (
        <section className="relative overflow-hidden min-h-[70vh] flex items-center justify-center">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={heroImage}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-white/70 to-white dark:from-amber-950/30 dark:via-neutral-950/80 dark:to-neutral-950" />

          <motion.div
            className="relative z-10 max-w-3xl mx-auto text-center px-6 py-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-xl border border-amber-100/50 dark:border-neutral-700/50">
              {heroContent.badge && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className="mb-6 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                    <Sparkles className="w-3 h-3 mr-1" /> {heroContent.badge}
                  </Badge>
                </motion.div>
              )}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                {hero.title.includes(",") ? (
                  <>
                    {hero.title.split(",")[0]},<br />
                    <span className="text-amber-500">{hero.title.split(",").slice(1).join(",").trim()}</span>
                  </>
                ) : (
                  hero.title
                )}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">{hero.subtitle}</p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={AUTH_SIGNUP}>
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.6 }}
                  >
                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white px-8 text-lg shadow-lg shadow-amber-500/20">
                      {heroContent.cta_text || "Start Cooking Smarter"} <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                {heroContent.cta_subtext && (
                  <p className="text-sm text-muted-foreground">{heroContent.cta_subtext}</p>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Lifestyle Image Grid */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <motion.div {...fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Pro tools. Home vibes.</h2>
          <p className="mt-2 text-muted-foreground">The tech the pros use — made easy for your Indian kitchen.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {lifestyleImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl aspect-square"
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${
                img.accent === "amber"
                  ? "from-amber-500/20 to-transparent"
                  : "from-emerald-500/20 to-transparent"
              } opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      {isVisible("features") && features && featuresContent.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">{features.title}</h2>
            <p className="mt-3 text-muted-foreground">{features.subtitle}</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresContent.map((f: any, i: number) => {
              const Icon = ICON_MAP[f.icon] || ChefHat;
              const isAmber = i % 2 === 0;
              return (
                <motion.div
                  key={i}
                  {...fadeUp}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className={`h-full rounded-2xl border-${isAmber ? "amber" : "emerald"}-100 dark:border-neutral-800 hover:shadow-lg transition-shadow`}>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl ${
                        isAmber
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-emerald-100 dark:bg-emerald-900/30"
                      } flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${
                          isAmber
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`} />
                      </div>
                      <h3 className="font-semibold text-foreground text-lg">{f.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {isVisible("coming_soon") && comingSoon && comingSoonContent.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">{comingSoon.title}</h2>
            <p className="mt-3 text-muted-foreground">{comingSoon.subtitle}</p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {comingSoonContent.map((item: any, i: number) => {
              const Icon = ICON_MAP[item.icon] || ChefHat;
              return (
                <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }}>
                  <Card className="h-full border-dashed border-amber-200 dark:border-neutral-700 opacity-80 rounded-2xl">
                    <CardContent className="p-6 text-center">
                      <Icon className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                      <Badge variant="secondary" className="mt-3 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Coming Soon</Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Simple P&L */}
      {isVisible("money_tracker") && moneyTracker && (
        <section className="max-w-5xl mx-auto px-6 py-16">
          <motion.div {...fadeUp} className="bg-gradient-to-br from-amber-50 to-emerald-50 dark:from-neutral-900 dark:to-neutral-800 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground">{moneyTracker.title}</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">{moneyTracker.subtitle}</p>
            {Array.isArray(moneyContent.metrics) && moneyContent.metrics.length > 0 && (
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-md mx-auto">
                {moneyContent.metrics.map((label: string) => (
                  <div key={label} className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm border border-amber-100/50 dark:border-neutral-700">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold text-foreground mt-1">—</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* Solo or Team */}
      {isVisible("solo_team") && soloTeam && (
        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <motion.div {...fadeUp}>
            <Users2 className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground">{soloTeam.title}</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">{soloTeam.subtitle}</p>
          </motion.div>
        </section>
      )}

      {/* Theme Preview */}
      {isVisible("themes") && themes && themesContent.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <motion.div {...fadeUp}>
            <Palette className="w-10 h-10 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground">{themes.title}</h2>
            <p className="mt-3 text-muted-foreground mb-8">{themes.subtitle}</p>
            <div className="flex flex-wrap justify-center gap-4">
              {themesContent.map((t: any) => (
                <div key={t.name} className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {(t.colors || []).map((c: string, i: number) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{t.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* CTA Footer */}
      {isVisible("final_cta") && finalCta && (
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{finalCta.title}</h2>
            <p className="mt-4 text-muted-foreground">{finalCta.subtitle}</p>
            <Link to={AUTH_SIGNUP}>
              <Button size="lg" className="mt-8 bg-amber-500 hover:bg-amber-600 text-white px-8 text-lg shadow-lg shadow-amber-500/20">
                {ctaContent.button_text || "Get Started Free"} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </section>
      )}

      <CrossMarketFooter region="india" current="homecook" />

      {/* Footer */}
      <footer className="border-t border-amber-100 dark:border-neutral-800 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">ChefOS Home — India</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">Your kitchen, your rules.</p>
            <Link to="/admin/auth" className="opacity-20 hover:opacity-60 transition-opacity" aria-label="Admin login">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IndiaHomeCookLanding;
