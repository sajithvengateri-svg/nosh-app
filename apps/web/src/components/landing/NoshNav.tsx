import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import noshLogo from "@/assets/nosh-logo.png";

interface NoshNavProps {
  activeTab: "foodies" | "vendors";
}

export function NoshNav({ activeTab }: NoshNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 backdrop-blur-[30px] border-b transition-all"
      style={{
        background: scrolled ? "rgba(251,246,248,0.95)" : "rgba(251,246,248,0.85)",
        borderColor: "rgba(232,221,226,0.5)",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/nosh" className="flex items-center gap-2">
          <img src={noshLogo} alt="Prep Mi" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold tracking-[4px]" style={{ color: "#D94878" }}>
            Prep Mi
          </span>
        </Link>

        {/* Toggle — desktop */}
        <div
          className="hidden md:flex rounded-full p-0.5"
          style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.6)" }}
        >
          <Link
            to="/nosh"
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeTab === "foodies" ? "#D94878" : "transparent",
              color: activeTab === "foodies" ? "#fff" : "#7A6B75",
            }}
          >
            For Foodies
          </Link>
          <Link
            to="/nosh/vendors"
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeTab === "vendors" ? "#D94878" : "transparent",
              color: activeTab === "vendors" ? "#fff" : "#7A6B75",
            }}
          >
            For Vendors
          </Link>
        </div>

        {/* Right side — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to={activeTab === "vendors" ? "/vendor/auth" : "/nosh/auth"}
            className="px-4 py-2 rounded-full text-xs font-medium transition-all hover:bg-white/50"
            style={{ color: "#7A6B75" }}
          >
            Login / Sign Up
          </Link>
          <a
            href="#download"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("download")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-90 text-white"
            style={{ background: "#D94878" }}
          >
            Download App
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className="w-5 h-5" style={{ color: "#2A1F2D" }} />
          ) : (
            <Menu className="w-5 h-5" style={{ color: "#2A1F2D" }} />
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden mt-3 pb-3 space-y-2"
        >
          <Link
            to="/nosh"
            className="block px-4 py-2 rounded-xl text-sm font-medium"
            style={{ color: activeTab === "foodies" ? "#D94878" : "#7A6B75" }}
            onClick={() => setMobileOpen(false)}
          >
            For Foodies
          </Link>
          <Link
            to="/nosh/vendors"
            className="block px-4 py-2 rounded-xl text-sm font-medium"
            style={{ color: activeTab === "vendors" ? "#D94878" : "#7A6B75" }}
            onClick={() => setMobileOpen(false)}
          >
            For Vendors
          </Link>
          <Link
            to="/nosh/auth"
            className="block px-4 py-2 rounded-xl text-sm font-medium"
            style={{ color: "#7A6B75" }}
            onClick={() => setMobileOpen(false)}
          >
            Login / Sign Up
          </Link>
          <a
            href="#download"
            className="block mx-4 py-2.5 rounded-full text-sm font-semibold text-center text-white"
            style={{ background: "#D94878" }}
            onClick={(e) => {
              e.preventDefault();
              setMobileOpen(false);
              document.getElementById("download")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Download App
          </a>
        </motion.div>
      )}
    </motion.header>
  );
}
