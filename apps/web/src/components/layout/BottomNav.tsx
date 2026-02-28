import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat, ClipboardList, DollarSign, Menu, Wrench, Users2, Home, Utensils,
  Plus, Settings, LayoutDashboard, Package, Shield, GraduationCap, Receipt,
  Factory, AlertTriangle, BookOpen, Calendar, Store, LayoutGrid, Trash2, Users,
  ListChecks, Gamepad2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import chefOSIcon from "@/assets/chefos-logo-new.png";
import { useBottomNavPrefs } from "@/hooks/useBottomNavPrefs";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useOrg } from "@/contexts/OrgContext";
import { isFeatureAvailable, isHomeCookMode } from "@/lib/shared/modeConfig";
import { useState, useRef, useEffect } from "react";
import { useTodoItems } from "@/hooks/useTodoItems";
import { useMobileNavSections, type MobileNavSection } from "@/hooks/useMobileNavSections";

interface BottomNavProps {
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Home, LayoutDashboard, ClipboardList, ChefHat, DollarSign, Menu, Wrench,
  Users2, Utensils, Settings, Package, Shield, GraduationCap, Receipt,
  Factory, AlertTriangle, BookOpen, Calendar, Store, LayoutGrid, Trash2, Users,
  ListChecks, Gamepad2,
};

// Fixed 5-tab layout for home cook mode (mirrors mobile)
const HOME_COOK_TABS = [
  { path: "/dashboard", icon: null, label: "Home", isHome: true },
  { path: "/recipes", icon: BookOpen, label: "My Recipes" },
  { path: "/kitchen", icon: Utensils, label: "My Kitchen" },
  { path: "/food-safety", icon: Shield, label: "Safety" },
  { path: "/games", icon: Gamepad2, label: "Games" },
];

const BottomNav = ({ className }: BottomNavProps) => {
  const location = useLocation();
  const { pinnedItems, overflowItems } = useBottomNavPrefs();
  const { settings } = useAppSettings();
  const { storeMode } = useOrg();
  const [fabOpen, setFabOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHomeCook = isHomeCookMode(storeMode);
  const { pendingCount } = useTodoItems();
  const { sections } = useMobileNavSections();

  // Auto-scroll active item into view when navigating to an overflow item
  useEffect(() => {
    if (!scrollRef.current || isHomeCook) return;
    const activeEl = scrollRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [location.pathname, isHomeCook]);

  // Shared tab renderer (Instagram-style)
  const renderTab = (
    path: string,
    label: string,
    icon: React.ElementType | null,
    isHome: boolean,
    hasBadge?: boolean,
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

          {hasBadge && pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </motion.div>

        <span
          className={cn(
            "text-[10px] leading-none mt-0.5 transition-colors",
            isActive ? "text-foreground font-semibold" : "text-muted-foreground font-medium"
          )}
        >
          {label}
        </span>
      </Link>
    );
  };

  // Home Cook: Fixed 5-tab bar
  if (isHomeCook) {
    return (
      <div className={cn("fixed bottom-0 left-0 right-0 z-50", className)}>
        <nav className="bg-background border-t border-border/40 safe-bottom">
          <div className="flex">
            {HOME_COOK_TABS.map((tab) =>
              renderTab(tab.path, tab.label, tab.icon ?? null, !!tab.isHome, tab.hasBadge)
            )}
          </div>
        </nav>
      </div>
    );
  }

  // Professional mode: 5-tab DB-driven nav

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50", className)}>
      {/* FAB Backdrop */}
      {settings.fabEnabled && (
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
      {settings.fabEnabled && (
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
      {settings.fabEnabled && (
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
          {sections.map((section) => {
            const isHome = section.section_key === "home";
            const navPath = section.direct_path || `/section/${section.section_key}`;
            const isActive = section.direct_path
              ? location.pathname === section.direct_path
              : location.pathname === `/section/${section.section_key}` ||
                (section.module_paths || []).some((p) => location.pathname.startsWith(p));
            const Icon = iconMap[section.icon_name] || Menu;
            // Keep labels short — single-line only
            const label = section.section_key === "safety" ? "Safety" : section.label;

            return (
              <Link
                key={section.section_key}
                to={navPath}
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
                  ) : (
                    <Icon
                      className={cn(
                        "w-6 h-6 transition-all",
                        isActive ? "text-foreground" : "text-muted-foreground group-active:text-foreground"
                      )}
                      strokeWidth={isActive ? 2.25 : 1.5}
                    />
                  )}
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
          })}
        </div>
      </nav>
    </div>
  );
};

export default BottomNav;
