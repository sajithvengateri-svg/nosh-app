import { Link, useLocation } from "react-router-dom";
import {
  Home, Wine, Martini, BarChart3, ClipboardCheck, Package,
  Beer, Droplets, TrendingUp, Receipt, Shield, Users2,
  Coffee, GraduationCap, Store, Settings, Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBevBottomNavPrefs } from "@/hooks/useBevBottomNavPrefs";

interface BevBottomNavProps {
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  Home, Wine, Martini, BarChart3, ClipboardCheck, Package,
  Beer, Droplets, TrendingUp, Receipt, Shield, Users2,
  Coffee, GraduationCap, Store, Settings, Menu,
};

const BevBottomNav = ({ className }: BevBottomNavProps) => {
  const location = useLocation();
  const { primaryItems } = useBevBottomNavPrefs();

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50", className)}>
      <nav className="bg-background/95 backdrop-blur-lg border-t border-border safe-bottom">
        <div className="flex overflow-x-auto scrollbar-hide">
          {primaryItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/bev" && location.pathname.startsWith(item.path));
            const Icon = iconMap[item.icon] || Menu;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 min-w-[3.5rem] transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-[10px] font-medium mt-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default BevBottomNav;
