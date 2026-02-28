import {
  Droplets, Wind, Container, Trash2, Cylinder, Cross, Plus, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceConfig } from "@/types/housekeeping";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplets, Wind, Container, Trash2, Cylinder, Cross, Wrench,
};

interface ServicePillNavProps {
  services: ServiceConfig[];
  active: string;
  onSelect: (key: string) => void;
  onAddCustom: () => void;
}

export default function ServicePillNav({ services, active, onSelect, onAddCustom }: ServicePillNavProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {services.map((svc) => {
        const Icon = ICON_MAP[svc.icon] ?? Wrench;
        return (
          <button
            key={svc.key}
            onClick={() => onSelect(svc.key)}
            className={cn(
              "inline-flex items-center gap-1.5 h-7 px-3 text-xs rounded-full font-medium whitespace-nowrap transition-all shrink-0",
              active === svc.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-secondary"
            )}
          >
            <Icon className="w-3 h-3" />
            {svc.label}
          </button>
        );
      })}
      <button
        onClick={onAddCustom}
        className="inline-flex items-center gap-1 h-7 px-3 text-xs rounded-full font-medium whitespace-nowrap border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary transition-all shrink-0"
      >
        <Plus className="w-3 h-3" />
        Add
      </button>
    </div>
  );
}
