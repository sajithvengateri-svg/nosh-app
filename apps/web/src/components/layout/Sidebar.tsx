import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import chefOSIcon from "@/assets/chefos-logo-new.png";
import { Settings, LogOut, Shield, ChevronRight } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { isFeatureAvailable, isHomeCookMode } from "@/lib/shared/modeConfig";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { homeCookRoleLabel } from "@/lib/homeCookLabels";
import { useFeatureReleases } from "@/hooks/useFeatureReleases";
import { useSidebarSections } from "@/hooks/useSidebarSections";
import {
  ALL_CHEF_NAV,
  type ChefNavItem,
} from "@/lib/chefNavItems";
import {
  CHEF_NAV_SECTIONS,
  getItemsForSection,
  buildSectionPathMap,
} from "@/lib/chefNavSections";

interface SidebarProps {
  className?: string;
}

// Map English nav labels → i18n keys (nav.*)
const NAV_I18N_KEYS: Record<string, string> = {
  "Dashboard": "nav.dashboard",
  "Recipe Bank": "nav.recipeBank",
  "My Recipes": "nav.myRecipes",
  "Kitchen": "nav.kitchen",
  "My Kitchen": "nav.myKitchen",
  "Todo": "nav.todo",
  "Ingredients": "nav.ingredients",
  "My Pantry": "nav.myPantry",
  "Invoices": "nav.invoices",
  "Inventory": "nav.inventory",
  "My Stock": "nav.myStock",
  "Prep Lists": "nav.prepLists",
  "Prep": "nav.prep",
  "Production": "nav.production",
  "Marketplace": "nav.marketplace",
  "Allergens": "nav.allergens",
  "Waste Log": "nav.wasteLog",
  "Waste Tracker": "nav.wasteTracker",
  "Housekeeping": "nav.housekeeping",
  "Mastery Suite": "nav.masterySuite",
  "Games": "nav.games",
  "Menu Engineering": "nav.menuEngineering",
  "Roster": "nav.roster",
  "Calendar": "nav.calendar",
  "Kitchen Sections": "nav.kitchenSections",
  "Equipment": "nav.equipment",
  "Cheatsheets": "nav.cheatsheets",
  "Food Safety": "nav.foodSafety",
  "Safety Checks": "nav.safetyChecks",
  "Training": "nav.training",
  "Team": "nav.team",
  // Section headings
  "Home": "nav.home",
  "Recipes": "nav.recipes",
};

// Pre-compute section path map (stable across renders)
const SECTION_PATH_MAP = buildSectionPathMap();

const Sidebar = ({ className }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, canView, signOut, isHeadChef } = useAuth();
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);
  const { data: releases } = useFeatureReleases();
  const { openSections, setOpenSections } = useSidebarSections("chef", SECTION_PATH_MAP);

  // Check if current user has admin role (lightweight query)
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return false;
      const { data } = await (supabase as any).from("user_roles").select("role").eq("user_id", profile.id);
      return data?.some((r: any) => r.role === "admin") ?? false;
    },
    enabled: !!profile?.id,
    staleTime: 1000 * 60 * 30,
  });

  // Build a set of released module slugs
  const releasedModules = useMemo(() => {
    const set = new Set<string>();
    releases?.forEach((r) => {
      if (r.status === "released") set.add(r.module_slug);
    });
    return set;
  }, [releases]);

  // Filter helper: is this nav item visible?
  const isItemVisible = (item: ChefNavItem) =>
    releasedModules.has(item.module) &&
    canView(item.module) &&
    isFeatureAvailable(item.module, storeMode) &&
    (!item.homeCookOnly || isHomeCook);

  // Build filtered sections with their visible sub-items
  const filteredSections = useMemo(() => {
    return CHEF_NAV_SECTIONS.map((section) => {
      const items = getItemsForSection(section.sectionKey).filter(isItemVisible);
      return { ...section, subItems: items };
    }).filter((section) => {
      // Direct-link sections: show if hub module is available
      if (section.directLink) {
        const hubItem = ALL_CHEF_NAV.find((i) => i.path === section.hubPath);
        return hubItem ? isItemVisible(hubItem) : true;
      }
      // Accordion sections: show if at least one sub-item is visible
      return section.subItems.length > 0;
    });
  }, [releasedModules, canView, storeMode, isHomeCook]);

  const getLabel = (rawLabel: string) => {
    const i18nKey = NAV_I18N_KEYS[rawLabel];
    return i18nKey ? t(i18nKey) : rawLabel;
  };

  const NavLink = ({ path, icon: Icon, label, homeCookLabel }: { path: string; icon: typeof Settings; label: string; homeCookLabel?: string }) => {
    const isActive = location.pathname === path ||
      (path !== "/" && location.pathname.startsWith(path));
    const rawLabel = isHomeCook ? (homeCookLabel || label) : label;
    const displayLabel = getLabel(rawLabel);

    return (
      <Link
        to={path}
        className={cn("nav-item active:scale-[0.97] transition-transform", isActive && "active")}
        onClick={() => haptic("select")}
      >
        <Icon className="w-5 h-5" />
        <span>{displayLabel}</span>
      </Link>
    );
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col",
      className
    )}>
      {/* Logo */}
      <Link to="/dashboard" className="block p-6 border-b border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          <img src={chefOSIcon} alt="ChefOS" className="w-10 h-10 rounded-xl object-contain" />
          <div>
            <h1 className="font-display text-lg font-semibold text-sidebar-foreground">ChefOS</h1>
            <p className="text-xs text-muted-foreground">Kitchen Operating System</p>
          </div>
        </div>
      </Link>

      {/* User Profile */}
      {profile && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {profile.full_name}
              </p>
              <Badge variant={isHeadChef ? "default" : "secondary"} className="text-xs">
                {isHomeCook ? homeCookRoleLabel(isHeadChef ? "head_chef" : "line_chef") : (isHeadChef ? "Head Chef" : "Line Chef")}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Navigation — section-based accordion */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredSections.map((section) => {
          const sectionLabel = isHomeCook
            ? (section.homeCookLabel || section.label)
            : section.label;
          const displayLabel = getLabel(sectionLabel);

          // Direct-link sections (Home, Games) — render as simple nav link
          if (section.directLink) {
            return (
              <NavLink
                key={section.sectionKey}
                path={section.hubPath}
                icon={section.icon}
                label={section.label}
                homeCookLabel={section.homeCookLabel}
              />
            );
          }

          // Accordion sections (Recipes, Kitchen, Safety)
          const sectionActive = section.subItems.some(
            (item) => location.pathname === item.path || location.pathname.startsWith(item.path + "/"),
          );

          return (
            <Accordion
              key={section.sectionKey}
              type="multiple"
              value={openSections.includes(section.sectionKey) || sectionActive ? [section.sectionKey] : []}
              onValueChange={(values) => {
                if (values.includes(section.sectionKey)) {
                  // Opening — add to open sections and navigate to hub
                  if (!openSections.includes(section.sectionKey)) {
                    setOpenSections([...openSections, section.sectionKey]);
                  }
                  navigate(section.hubPath);
                  haptic("select");
                } else {
                  // Closing — remove from open sections
                  setOpenSections(openSections.filter((k) => k !== section.sectionKey));
                }
              }}
            >
              <AccordionItem value={section.sectionKey} className="border-b-0">
                <AccordionTrigger
                  className={cn(
                    "nav-item py-2.5 hover:no-underline [&>svg]:w-4 [&>svg]:h-4",
                    sectionActive && "active",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <section.icon className="w-5 h-5" />
                    <span>{displayLabel}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <div className="ml-5 pl-3 border-l border-sidebar-border/50 space-y-0.5 mt-0.5">
                    {section.subItems.map((item) => {
                      const isActive = location.pathname === item.path ||
                        location.pathname.startsWith(item.path + "/");
                      const rawLabel = isHomeCook ? (item.homeCookLabel || item.label) : item.label;
                      const itemLabel = getLabel(rawLabel);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors active:scale-[0.97]",
                            isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                          )}
                          onClick={() => haptic("select")}
                        >
                          <item.icon className="w-4 h-4 flex-shrink-0" />
                          <span>{itemLabel}</span>
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          );
        })}
      </nav>

      {/* Settings & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        {isAdmin && (
          <Link
            to="/admin"
            className={cn("nav-item text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30", location.pathname.startsWith("/admin") && "active")}
            onClick={() => haptic("select")}
          >
            <Shield className="w-5 h-5" />
            <span>Control Centre</span>
          </Link>
        )}
        <Link to="/settings" className={cn("nav-item", location.pathname === "/settings" && "active")}>
          <Settings className="w-5 h-5" />
          <span>{t("nav.settings")}</span>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 py-2 h-auto text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
          onClick={() => { haptic("medium"); signOut(); }}
        >
          <LogOut className="w-5 h-5" />
          <span>{t("nav.logOut")}</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
