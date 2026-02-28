import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Clock, Palmtree, DollarSign, Users, ShieldCheck, Settings, ExternalLink, Fingerprint, ChevronDown, ChevronRight, Briefcase, ClipboardList, Award, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { label: "Dashboard", path: "/labour/dashboard", icon: LayoutDashboard },
  { label: "Roster", path: "/labour/roster", icon: CalendarDays },
  { label: "Timesheets", path: "/labour/timesheets", icon: Clock },
  { label: "Leave", path: "/labour/leave", icon: Palmtree },
  { label: "Payroll", path: "/labour/payroll", icon: DollarSign },
  { label: "Compliance", path: "/labour/compliance", icon: ShieldCheck },
  { label: "RSA & Certs", path: "/labour/compliance/certs", icon: ShieldCheck },
  { label: "Settings", path: "/labour/settings", icon: Settings },
];

const peopleNav = [
  { label: "Dashboard", path: "/labour/people", icon: Users },
  { label: "Recruitment", path: "/labour/people/recruitment", icon: Briefcase },
  { label: "Directory", path: "/labour/people/directory", icon: Users },
  { label: "Onboarding", path: "/labour/people/onboarding", icon: ClipboardList },
  { label: "Reviews", path: "/labour/people/reviews", icon: Award },
  { label: "Warnings", path: "/labour/people/warnings", icon: AlertTriangle },
  { label: "Settings", path: "/labour/people/settings", icon: Settings },
];

const LabourSidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const isPeopleActive = location.pathname.startsWith("/labour/people");
  const [peopleOpen, setPeopleOpen] = useState(isPeopleActive);

  return (
    <div className={cn("w-60 border-r border-border bg-card flex flex-col", className)}>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">LabourOS</h2>
        <p className="text-xs text-muted-foreground">Workforce & Payroll</p>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {mainNav.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/labour/dashboard" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors", isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="w-4 h-4" /><span>{item.label}</span>
            </Link>
          );
        })}

        {/* People OS section */}
        <div className="pt-2">
          <button onClick={() => setPeopleOpen(!peopleOpen)} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors", isPeopleActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Users className="w-4 h-4" />
            <span className="flex-1 text-left">People</span>
            {peopleOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {peopleOpen && (
            <div className="ml-4 mt-1 space-y-0.5">
              {peopleNav.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs transition-colors", isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                    <Icon className="w-3.5 h-3.5" /><span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
      <div className="p-2 border-t border-border">
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Linked Apps</p>
        <Link to="/clock" className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors border border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground", location.pathname.startsWith("/clock") && "bg-primary/10 text-primary font-medium border-primary/30")}>
          <Fingerprint className="w-4 h-4" /><span className="flex-1">ClockOS</span><ExternalLink className="w-3 h-3 opacity-50" />
        </Link>
      </div>
    </div>
  );
};

export default LabourSidebar;
