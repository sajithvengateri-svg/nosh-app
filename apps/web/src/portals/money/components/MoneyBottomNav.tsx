import { useLocation, useNavigate } from "react-router-dom";
import { Atom, BarChart3, FlaskConical, ShieldCheck, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Reactor", href: "/money/reactor", icon: Atom },
  { label: "P&L", href: "/money/pnl", icon: BarChart3 },
  { label: "Simulator", href: "/money/simulator", icon: FlaskConical },
  { label: "Audit", href: "/money/audit", icon: ShieldCheck },
  { label: "More", href: "/money/settings", icon: MoreHorizontal },
];

const MoneyBottomNav = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border",
      className
    )}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.href || location.pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <button
              key={tab.href}
              onClick={() => navigate(tab.href)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[52px]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MoneyBottomNav;
