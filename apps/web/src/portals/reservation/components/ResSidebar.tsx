import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, CalendarCheck, Calendar, FileText, Menu, ArrowLeft,
  Building, UtensilsCrossed, Wine, BookOpen, Grid3X3, ClipboardList,
  Clock, UserPlus, Gift, RefreshCw, BarChart3, Users, Upload, Globe,
  PartyPopper, Zap, Puzzle, FileBarChart, Settings, GitBranchPlus,
  Map, Database, ExternalLink, DoorOpen, Share2, Kanban, Cog,
  Building2, Settings2, TrendingUp, GraduationCap, HelpCircle, Phone, Ticket, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useSidebarConfig } from "../hooks/useSidebarConfig";
import { useOrg } from "@/contexts/OrgContext";

// Icon lookup map: icon_name string → lucide-react component
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, CalendarCheck, Calendar, FileText, Building, UtensilsCrossed,
  Wine, BookOpen, Grid3X3, ClipboardList, Clock, UserPlus, Gift, RefreshCw,
  BarChart3, Users, Upload, Globe, PartyPopper, Zap, Puzzle, FileBarChart,
  Settings, GitBranchPlus, Map, Database, ExternalLink, DoorOpen, Share2,
  Kanban, Cog, Building2, Settings2, TrendingUp, GraduationCap, HelpCircle, Phone, Ticket,
};

function getIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? LayoutDashboard;
}

const ResSidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { membership } = useOrg();
  const userRole = membership?.role ?? null;
  const { sections, isLoading } = useSidebarConfig(userRole);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('res_sidebar_collapsed');
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.innerWidth < 1024;
    } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('res_sidebar_collapsed', String(collapsed)); } catch {}
  }, [collapsed]);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "h-screen bg-vf-navy flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-vf-gold/20 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-vf-gold" />
            </div>
            <span className="font-semibold text-white tracking-wide">VenueFlow</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {sections.map((section, si) => {
          const SectionIcon = getIcon(section.icon_name);
          const visibleItems = section.items.filter(item => item.is_visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.section_key} className={si > 0 ? "mt-4" : ""}>
              {!collapsed && (
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-vf-gold/60">
                  {section.label}
                </p>
              )}
              {collapsed && si > 0 && (
                <div className="mx-2 my-2 border-t border-white/10" />
              )}
              {visibleItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/");
                const Icon = getIcon(item.icon);
                return (
                  <Button
                    key={item.key}
                    variant="ghost"
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "w-full justify-start gap-3 h-9 rounded-md transition-colors",
                      "text-white/70 hover:text-white hover:bg-white/10",
                      isActive && "bg-vf-gold/10 text-vf-gold hover:bg-vf-gold/15 hover:text-vf-gold",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </Button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className={cn(
            "w-full justify-start gap-3 text-white/70 hover:text-white hover:bg-white/10",
            collapsed && "justify-center px-2"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
          {!collapsed && <span>Back to Launcher</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export default ResSidebar;
