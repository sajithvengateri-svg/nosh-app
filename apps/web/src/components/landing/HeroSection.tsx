import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { FadeUp } from "./AnimationWrappers";
import chefLogo from "@/assets/chefos-logo-new.png";

const titleWords = ["The", "Operating", "System", "for"];

interface HeroImage {
  url: string;
  alt: string;
  caption?: string;
}

interface HeroContent {
  carousel_enabled?: boolean;
  images?: HeroImage[];
}

const HeroSection = ({ sectionMap }: { sectionMap: Record<string, any> }) => {
  const navigate = useNavigate();
  const customTitle = sectionMap.hero?.title;
  const heroContent: HeroContent = sectionMap.hero?.content && typeof sectionMap.hero.content === "object" && !Array.isArray(sectionMap.hero.content)
    ? sectionMap.hero.content
    : {};

  const carouselEnabled = heroContent.carousel_enabled === true;
  const images = heroContent.images || [];
  const hasImages = carouselEnabled && images.length > 0;

  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    if (images.length > 0) setCurrent((p) => (p + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    if (images.length > 0) setCurrent((p) => (p - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-advance every 6s
  useEffect(() => {
    if (!hasImages) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [hasImages, next]);

  // Default hero (no carousel)
  if (!hasImages) {
    return (
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-20 text-center">
          <LogoFloat />
          <TitleBlock customTitle={customTitle} />
          <Subtitle text={sectionMap.hero?.subtitle} />
          <CTAButtons navigate={navigate} />
        </div>
      </header>
    );
  }

  // Carousel hero
  return (
    <header className="relative overflow-hidden h-[85vh] min-h-[600px] max-h-[900px]">
      {/* Background images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          <img
            src={images[current].url}
            alt={images[current].alt}
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <LogoFloat />

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
          {customTitle ? (
            <FadeUp delay={0.15}>
              <span>{customTitle}</span>
            </FadeUp>
          ) : (
            <div className="flex flex-wrap justify-center gap-x-3">
              {titleWords.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 + i * 0.1 }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          )}
          <motion.span
            className="block text-primary"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.7 }}
          >
            Professional Kitchens
          </motion.span>
        </h1>

        {/* Subtitle */}
        <FadeUp delay={0.5}>
          <p className="text-lg text-white/80 max-w-xl mx-auto mb-8 drop-shadow">
            {sectionMap.hero?.subtitle ||
              "Recipe costing, prep lists, inventory, food safety — all in one place. Built by chefs, for chefs."}
          </p>
        </FadeUp>

        {/* CTA */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.8 }}
        >
          <Button size="lg" onClick={() => navigate("/auth?tab=signup&source=chefos")} className="gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/auth")} className="border-white/30 text-white hover:bg-white/10">
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
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i === current ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </header>
  );
};

/* ─── Shared sub-components ─── */

const LogoFloat = () => (
  <>
    <motion.img
      src={chefLogo}
      alt="ChefOS logo"
      className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg cursor-pointer"
      initial={{ rotate: -180, scale: 0, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, duration: 0.8 }}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    />
    <motion.div
      className="w-24 h-24 mx-auto -mt-[6.5rem] mb-6"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{ pointerEvents: "none" }}
    />
  </>
);

const TitleBlock = ({ customTitle }: { customTitle?: string }) => (
  <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
    {customTitle ? (
      <FadeUp delay={0.15}>
        <span>{customTitle}</span>
      </FadeUp>
    ) : (
      <div className="flex flex-wrap justify-center gap-x-3">
        {titleWords.map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 + i * 0.1 }}
          >
            {word}
          </motion.span>
        ))}
      </div>
    )}
    <motion.span
      className="block text-primary"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.7 }}
    >
      Professional Kitchens
    </motion.span>
  </h1>
);

const Subtitle = ({ text }: { text?: string }) => (
  <FadeUp delay={0.5}>
    <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
      {text || "Recipe costing, prep lists, inventory, food safety — all in one place. Built by chefs, for chefs."}
    </p>
  </FadeUp>
);

const CTAButtons = ({ navigate }: { navigate: (path: string) => void }) => (
  <motion.div
    className="flex flex-col sm:flex-row gap-3 justify-center"
    initial={{ opacity: 0, scale: 0.7 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.8 }}
  >
    <Button size="lg" onClick={() => navigate("/auth?tab=signup&source=chefos")} className="gap-2">
      Get Started <ArrowRight className="w-4 h-4" />
    </Button>
    <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
      Sign In
    </Button>
  </motion.div>
);

export default HeroSection;
