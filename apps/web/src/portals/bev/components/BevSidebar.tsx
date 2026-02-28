import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Wine, Beer, GlassWater, Coffee, BarChart3,
  ClipboardList, Package, Droplets, Layers, Bot, Menu, LogOut,
  ArrowLeft, Martini, Users, Receipt, Wrench, FlaskConical,
  Calendar, GraduationCap, ShieldCheck, Store, TrendingUp,
  LayoutGrid, Settings, Calculator, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useBevNavOrder } from "@/hooks/useBevNavOrder";

// Map icon name strings → components
const iconMap: Record<string, any> = {
  LayoutDashboard, Wine, Beer, GlassWater, Coffee, BarChart3,
  ClipboardList, Package, Droplets, Layers, Bot, Menu,
  Martini, Users, Receipt, Wrench, FlaskConical,
  Calendar, GraduationCap, ShieldCheck, Store, TrendingUp,
  LayoutGrid, Settings, Calculator, Trash2,
};

const BevSidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { sections } = useBevNavOrder();

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
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wine className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">BevOS</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {sections.map((section, si) => (
          <div key={section.id}>
            {si > 0 && <Separator className="my-2 bg-sidebar-border" />}
            {!collapsed && (
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = iconMap[item.iconName] || LayoutDashboard;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent h-9",
                    isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="text-sm">{item.title}</span>}
                </Button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
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

export default BevSidebar;
