import { Link, useLocation } from "react-router-dom";
import { Fingerprint, LayoutDashboard, Clock, ShieldAlert, GraduationCap, UserPlus, Users, Tablet, KeyRound, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Clock In/Out", path: "/clock", icon: Fingerprint, exact: true },
  { label: "Dashboard", path: "/clock/dashboard", icon: LayoutDashboard },
  { label: "Timesheets", path: "/clock/timesheets", icon: Clock },
  { label: "Override", path: "/clock/override", icon: ShieldAlert },
  { label: "Induction", path: "/clock/induction", icon: GraduationCap },
  { label: "Onboarding", path: "/clock/onboarding", icon: UserPlus },
  { label: "Employees", path: "/clock/employees", icon: Users },
  { label: "Devices", path: "/clock/devices", icon: Tablet },
  { label: "PINs", path: "/clock/pins", icon: KeyRound },
  { label: "Settings", path: "/clock/settings", icon: Settings },
];

const ClockSidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  return (
    <div className={cn("w-60 border-r border-border bg-card flex flex-col", className)}>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">ClockOS</h2>
        <p className="text-xs text-muted-foreground">Time & Attendance</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default ClockSidebar;
