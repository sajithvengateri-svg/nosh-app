import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import {
  Sun, Flame, Moon, ChevronDown, ChevronRight,
  ClipboardCheck, Thermometer, Package, BarChart3,
  CalendarClock,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useState } from "react";

const sections = [
  {
    title: "Morning",
    icon: Sun,
    color: "text-amber-500",
    items: [
      { label: "Check prep lists for today", href: "/prep" },
      { label: "Review stock counts from last night", href: "/prep" },
      { label: "Check deliveries & invoice scans", href: "/invoices" },
    ],
  },
  {
    title: "Service",
    icon: Flame,
    color: "text-orange-500",
    items: [
      { label: "Log temperatures (fridge, hot hold)", href: "/food-safety" },
      { label: "Monitor prep task progress", href: "/prep" },
    ],
  },
  {
    title: "Close",
    icon: Moon,
    color: "text-indigo-400",
    items: [
      { label: "Complete nightly stock count", href: "/prep" },
      { label: "Set tomorrow's prep list", href: "/prep" },
      { label: "Review yields & waste", href: "/production" },
    ],
  },
];

const DailyWorkflowCard = () => {
  const { settings, updateSettings } = useAppSettings();
  const [open, setOpen] = useState(true);

  if (!settings.showDailyWorkflow) return null;

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Today's Workflow
            </CardTitle>
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {sections.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-2">
                  <section.icon className={`w-4 h-4 ${section.color}`} />
                  <span className="text-sm font-semibold">{section.title}</span>
                </div>
                <div className="space-y-1 ml-6">
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors block py-0.5"
                    >
                      • {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">Show daily workflow</span>
              <Switch
                checked={settings.showDailyWorkflow}
                onCheckedChange={(v) => updateSettings({ showDailyWorkflow: v })}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DailyWorkflowCard;
