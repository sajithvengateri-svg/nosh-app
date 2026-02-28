import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Megaphone, CalendarDays, Users, MessageSquare,
  Menu, ArrowLeft, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

const sections = [
  {
    title: "Marketing",
    items: [
      { label: "Dashboard", href: "/growth/dashboard", icon: LayoutDashboard },
      { label: "Campaigns", href: "/growth/campaigns", icon: Megaphone },
      { label: "Calendar", href: "/growth/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Audience",
    items: [
      { label: "Segments", href: "/growth/segments", icon: Users },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Analytics", href: "/growth/analytics", icon: TrendingUp },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/growth/settings", icon: MessageSquare },
    ],
  },
];

const GrowthSidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('growth_sidebar_collapsed') === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('growth_sidebar_collapsed', String(collapsed)); } catch {}
  }, [collapsed]);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-sidebar-foreground">GrowthOS</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={section.title}>
            {si > 0 && <Separator className="my-2 bg-sidebar-border" />}
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent h-9",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" onClick={() => navigate("/")}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-2"
          )}>
          <ArrowLeft className="w-5 h-5" />
          {!collapsed && <span>Back to Launcher</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export default GrowthSidebar;
