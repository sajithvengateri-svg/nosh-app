import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Megaphone, CalendarDays, Users, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", path: "/growth/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", path: "/growth/campaigns", icon: Megaphone },
  { label: "Calendar", path: "/growth/calendar", icon: CalendarDays },
  { label: "Segments", path: "/growth/segments", icon: Users },
  { label: "Analytics", path: "/growth/analytics", icon: Menu },
];

const GrowthBottomNav = ({ className }: { className?: string }) => {
  const location = useLocation();

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50", className)}>
      <nav className="bg-background/95 backdrop-blur-lg border-t border-border safe-bottom">
        <div className="flex">
          {items.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/growth/dashboard" && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                <span className={cn(
                  "text-[10px] font-medium mt-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>{item.label}</span>
                {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default GrowthBottomNav;
