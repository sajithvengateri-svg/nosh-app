import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  trend?: string;
  color?: "primary" | "accent" | "warning" | "success";
  href?: string;
}

const colorStyles = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

const StatCard = ({ icon: Icon, label, value, subValue, trend, color = "primary", href }: StatCardProps) => {
  const content = (
    <div className={cn(
      "stat-card min-h-[7rem] active:scale-[0.97] transition-transform",
      href && "cursor-pointer"
    )}>
      <div className="flex items-center justify-between">
        <div className={cn("p-2.5 rounded-xl", colorStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-[11px] font-semibold px-2 py-0.5 rounded-full",
            trend === "urgent" 
              ? "text-warning bg-warning/10" 
              : "text-muted-foreground bg-muted"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div className="mt-auto">
        <p className="stat-value">{value}</p>
        <p className="stat-label text-xs">{label}</p>
        {subValue && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{subValue}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link to={href} className="block">{content}</Link>;
  }

  return content;
};

export default StatCard;
