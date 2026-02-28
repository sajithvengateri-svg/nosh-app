import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Smartphone, Globe, ChefHat } from "lucide-react";
import { FadeUp } from "@/components/landing/AnimationWrappers";
import noshLogo from "@/assets/nosh-logo.png";

const NOSH = {
  primary: "#D94878",
  secondary: "#2A1F2D",
  bg: "#FBF6F8",
  card: "#FDFBFC",
  border: "rgba(232,221,226,0.5)",
  muted: "#7A6B75",
  textMuted: "#A89DA3",
};

export default function NoshWelcome() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: NOSH.bg }}>
      {/* Background glow */}
      <div
        className="fixed top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${NOSH.primary}08 0%, transparent 70%)` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="w-full max-w-md text-center"
      >
        {/* Success icon */}
        <FadeUp>
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `${NOSH.primary}12` }}
            >
              <CheckCircle2 className="w-10 h-10" style={{ color: NOSH.primary }} />
            </div>
          </div>
        </FadeUp>

        {/* Logo + message */}
        <FadeUp delay={0.1}>
          <img src={noshLogo} alt="Prep Mi" className="w-16 h-16 rounded-2xl shadow-md mx-auto mb-4" />
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: NOSH.secondary, fontFamily: "'Playfair Display', serif" }}
          >
            You're all set!
          </h1>
          <p className="text-base mb-8" style={{ color: NOSH.muted }}>
            Welcome to Prep Mi. Your cooking journey starts now.
          </p>
        </FadeUp>

        {/* Action cards */}
        <FadeUp delay={0.2}>
          <div className="space-y-3">
            {/* Get the app */}
            <div
              className="rounded-[16px] p-5 text-left"
              style={{ background: NOSH.card, border: `1px solid ${NOSH.border}` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${NOSH.primary}12` }}
                >
                  <Smartphone className="w-5 h-5" style={{ color: NOSH.primary }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: NOSH.secondary }}>Get the mobile app</p>
                  <p className="text-xs" style={{ color: NOSH.muted }}>Best experience with cook mode & voice</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href="#"
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold text-center text-white transition-all hover:opacity-90"
                  style={{ background: NOSH.primary }}
                >
                  iOS App Store
                </a>
                <a
                  href="#"
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold text-center text-white transition-all hover:opacity-90"
                  style={{ background: NOSH.primary }}
                >
                  Google Play
                </a>
              </div>
            </div>

            {/* Continue on web */}
            <Link
              to="/prepmi"
              className="block rounded-[16px] p-5 text-left transition-all hover:scale-[1.01]"
              style={{ background: NOSH.card, border: `1px solid ${NOSH.border}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${NOSH.primary}08` }}
                >
                  <Globe className="w-5 h-5" style={{ color: NOSH.muted }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: NOSH.secondary }}>Continue on web</p>
                  <p className="text-xs" style={{ color: NOSH.muted }}>Browse recipes and manage your account</p>
                </div>
              </div>
            </Link>
          </div>
        </FadeUp>

        {/* Back to landing */}
        <FadeUp delay={0.3}>
          <Link
            to="/prepmi"
            className="inline-flex items-center gap-1.5 mt-6 text-xs hover:underline"
            style={{ color: NOSH.textMuted }}
          >
            <ChefHat className="w-3 h-3" />
            Back to Prep Mi home
          </Link>
        </FadeUp>
      </motion.div>
    </div>
  );
}
