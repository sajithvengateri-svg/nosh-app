import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat, ClipboardList, DollarSign, Menu, Wrench, Users2, Home, Utensils,
  Plus, Settings, LayoutDashboard, Package, Shield, GraduationCap, Receipt,
  Factory, AlertTriangle, BookOpen, Calendar, Store, LayoutGrid, Trash2, Users,
  ListChecks, Gamepad2, BarChart3, Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import chefOSIcon from "@/assets/chefos-logo-new.png";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode, isEatSafeMode } from "@/lib/shared/modeConfig";
import { useState } from "react";

interface BottomNavProps {
  className?: string;
}

// Fixed 5-tab layout for home cook mode (mirrors mobile)
const HOME_COOK_TABS = [
  { path: "/dashboard", icon: null, label: "Home", isHome: true },
  { path: "/recipes", icon: BookOpen, label: "My Recipes" },
  { path: "/kitchen", icon: Utensils, label: "My Kitchen" },
  { path: "/food-safety", icon: Shield, label: "Safety" },
  { path: "/games", icon: Gamepad2, label: "Games" },
];

// Fixed 5-tab layout for EatSafe / compliance mode (mirrors mobile)
const EATSAFE_TABS = [
  { path: "/dashboard", icon: null, label: "Home", isHome: true },
  { path: "/food-safety", icon: Shield, label: "Food Safety" },
  { path: "/invoices", icon: Camera, label: "Scanner" },
  { path: "/more", icon: BarChart3, label: "Reports" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

// Fixed 5-tab layout for ChefOS Pro (mirrors mobile default)
const CHEFOS_PRO_TABS = [
  { path: "/dashboard", icon: null, label: "Home", isHome: true },
  { path: "/recipes", icon: BookOpen, label: "Recipes" },
  { path: "/kitchen", icon: Utensils, label: "Kitchen" },
  { path: "/food-safety", icon: Shield, label: "Safety" },
  { path: "/games", icon: Gamepad2, label: "Games" },
];

const BottomNav = ({ className }: BottomNavProps) => {
  const location = useLocation();
  const { settings } = useAppSettings();
  const { storeMode } = useOrg();
  const [fabOpen, setFabOpen] = useState(false);
  const isHomeCook = isHomeCookMode(storeMode);
  const isEatSafe = isEatSafeMode(storeMode);

  // Pick the right tab set based on variant
  const tabs = isHomeCook
    ? HOME_COOK_TABS
    : isEatSafe
    ? EATSAFE_TABS
    : CHEFOS_PRO_TABS;

  // Show FAB only for ChefOS Pro
  const showFab = !isHomeCook && !isEatSafe && settings.fabEnabled;

  // Shared tab renderer
  const renderTab = (
    path: string,
    label: string,
    icon: React.ElementType | null,
    isHome: boolean,
  ) => {
    const isActive =
      path === "/dashboard"
        ? location.pathname === path
        : location.pathname === path || location.pathname.startsWith(path);

    return (
      <Link
        key={path}
        to={path}
        className="flex-1 flex flex-col items-center justify-center py-2 relative group"
      >
        <motion.div
          className="flex items-center justify-center w-10 h-10 rounded-full relative"
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", damping: 20, stiffness: 400 }}
        >
          {isHome ? (
            <img
              src={chefOSIcon}
              alt="Home"
              className={cn(
                "w-6 h-6 rounded-md object-contain transition-all",
                isActive && "ring-2 ring-primary/30 ring-offset-1 ring-offset-background"
              )}
            />
          ) : icon ? (
            (() => {
              const Icon = icon;
              return (
                <Icon
                  className={cn(
                    "w-6 h-6 transition-all",
                    isActive ? "text-foreground" : "text-muted-foreground group-active:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.25 : 1.5}
                />
              );
            })()
          ) : null}
        </motion.div>

        <span
          className={cn(
            "text-[10px] leading-none mt-0.5 transition-colors whitespace-nowrap",
            isActive ? "text-foreground font-semibold" : "text-muted-foreground font-medium"
          )}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50", className)}>
      {/* FAB Backdrop */}
      {showFab && (
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
              onClick={() => setFabOpen(false)}
            />
          )}
        </AnimatePresence>
      )}

      {/* FAB Actions */}
      {showFab && (
        <AnimatePresence>
          {fabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-24 right-4 z-50 flex flex-col gap-3"
            >
              {[
                { label: "New Recipe", path: "/recipes/new", icon: ChefHat },
                { label: "Create Prep List", path: "/prep", icon: ClipboardList },
                { label: "Scan Invoice", path: "/invoices", icon: DollarSign },
              ].map((action, i) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={action.path}
                    onClick={() => setFabOpen(false)}
                    className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-lg active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <action.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{action.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* FAB Button */}
      {showFab && (
        <motion.button
          className="absolute -top-7 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          style={{ boxShadow: "var(--shadow-copper)" }}
          onClick={() => setFabOpen(!fabOpen)}
          animate={{ rotate: fabOpen ? 45 : 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          whileTap={{ scale: 0.9 }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* 5-Tab Bottom Bar */}
      <nav className="bg-background border-t border-border/40 safe-bottom">
        <div className="flex">
          {tabs.map((tab) =>
            renderTab(tab.path, tab.label, tab.icon ?? null, !!tab.isHome)
          )}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
