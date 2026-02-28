import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Atom, BarChart3, FlaskConical, FileSearch, ShieldCheck,
  TrendingUp, Lightbulb, Settings, Menu, ArrowLeft, Layers, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";

const sections = [
  {
    title: "Command",
    items: [
      { label: "Reactor", href: "/money/reactor", icon: Atom },
      { label: "P&L", href: "/money/pnl", icon: BarChart3 },
      { label: "Trends", href: "/money/trends", icon: TrendingUp },
      { label: "Benchmarks", href: "/money/benchmarks", icon: Target },
    ],
  },
  {
    title: "Simulator",
    items: [
      { label: "Scenarios", href: "/money/simulator", icon: FlaskConical },
      { label: "Solutions", href: "/money/solutions", icon: Lightbulb },
    ],
  },
  {
    title: "Audit",
    items: [
      { label: "Quiet Audit", href: "/money/audit", icon: ShieldCheck },
      { label: "Forensic", href: "/money/forensic", icon: FileSearch },
      { label: "Full Audit Portal", href: "/quiet/dashboard", icon: FileSearch },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Portfolio", href: "/money/portfolio", icon: Layers },
      { label: "Settings", href: "/money/settings", icon: Settings },
    ],
  },
];

const MoneySidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("money_sidebar_collapsed") === "true"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem("money_sidebar_collapsed", String(collapsed)); } catch {}
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
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Atom className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-sidebar-foreground">MoneyOS</span>
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

export default MoneySidebar;
