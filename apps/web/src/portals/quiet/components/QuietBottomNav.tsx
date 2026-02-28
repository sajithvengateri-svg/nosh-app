import { useLocation, useNavigate } from "react-router-dom";
import { Brain, Lightbulb, ClipboardList, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/quiet/dashboard", icon: Brain },
  { label: "Recs", href: "/quiet/recommendations", icon: Lightbulb },
  { label: "New Audit", href: "/quiet/external/new", icon: ClipboardList },
  { label: "Report", href: "/quiet/report", icon: FileText },
];

const QuietBottomNav = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-lg border-t border-border flex items-center justify-around z-50",
      className
    )}>
      {items.map((item) => {
        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <button
            key={item.href}
            onClick={() => navigate(item.href)}
            className={cn(
              "flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default QuietBottomNav;
