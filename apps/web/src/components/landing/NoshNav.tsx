import { Link } from "react-router-dom";
import { motion } from "framer-motion";

interface NoshNavProps {
  activeTab: "foodies" | "vendors";
}

export function NoshNav({ activeTab }: NoshNavProps) {
  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 backdrop-blur-[30px] border-b"
      style={{
        background: "rgba(251,246,248,0.85)",
        borderColor: "rgba(232,221,226,0.5)",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/nosh" className="text-xl font-bold tracking-[4px]" style={{ color: "#D94878" }}>
          NOSH
        </Link>

        {/* Toggle */}
        <div
          className="flex rounded-full p-0.5"
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

        {/* CTA */}
        <Link
          to={activeTab === "vendors" ? "/vendor/auth" : "/auth"}
          className="px-4 py-2 rounded-full text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: "#D94878", color: "#fff" }}
        >
          Get Started
        </Link>
      </div>
    </motion.header>
  );
}
