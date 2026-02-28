import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain, BarChart3, ShieldCheck, Lightbulb, Clock,
  FileText, Upload, ClipboardList, Settings, Menu, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useSidebarSections } from "@/hooks/useSidebarSections";
import { useState, useEffect } from "react";

interface NavItem { label: string; href: string; icon: React.ElementType }

interface SidebarSection {
  title: string;
  items: NavItem[];
  /** If true, render as a direct link instead of collapsible */
  directLink?: boolean;
}

const sections: SidebarSection[] = [
  {
    title: "Command",
    items: [
      { label: "Dashboard", href: "/quiet/dashboard", icon: Brain },
      { label: "Modules", href: "/quiet/modules/food", icon: BarChart3 },
      { label: "Findings", href: "/quiet/findings", icon: ShieldCheck },
    ],
  },
  {
    title: "Simulation",
    directLink: true,
    items: [
      { label: "P&L Simulation", href: "/quiet/simulation", icon: BarChart3 },
    ],
  },
  {
    title: "External",
    items: [
      { label: "New Audit", href: "/quiet/external/new", icon: ClipboardList },
      { label: "Upload Docs", href: "/quiet/external/upload", icon: Upload },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Recommendations", href: "/quiet/recommendations", icon: Lightbulb },
      { label: "History", href: "/quiet/history", icon: Clock },
      { label: "Score Report", href: "/quiet/report", icon: FileText },
    ],
  },
  {
    title: "System",
    directLink: true,
    items: [
      { label: "Settings", href: "/quiet/settings", icon: Settings },
    ],
  },
];

// Build section path map for auto-open
const sectionPathMap: Record<string, string[]> = {};
for (const section of sections) {
  sectionPathMap[section.title] = section.items.map((i) => i.href);
}

const QuietSidebar = ({ className }: { className?: string }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("quiet_sidebar_collapsed") === "true"; } catch { return false; }
  });
  const { openSections, setOpenSections } = useSidebarSections("quiet", sectionPathMap);

  useEffect(() => {
    try { localStorage.setItem("quiet_sidebar_collapsed", String(collapsed)); } catch {}
  }, [collapsed]);

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
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="Quiet OS" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-semibold text-sidebar-foreground">Quiet OS</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {collapsed ? (
          /* Icon-only mode: show all items flat */
          sections.map((section) => (
            <div key={section.title} className="space-y-0.5 mb-1">
              {section.items.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant="ghost"
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "w-full justify-center px-2 text-sidebar-foreground hover:bg-sidebar-accent h-9",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                  </Button>
                );
              })}
            </div>
          ))
        ) : (
          /* Expanded mode: accordion sections */
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="space-y-0.5"
          >
            {sections.map((section) => {
              // Single-item direct-link sections render as a simple button
              if (section.directLink) {
                const item = section.items[0];
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Button
                    key={section.title}
                    variant="ghost"
                    onClick={() => navigate(item.href)}
                    className={cn(
                      "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent h-9",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </Button>
                );
              }

              // Multi-item sections get accordion treatment
              return (
                <AccordionItem key={section.title} value={section.title} className="border-b-0">
                  <AccordionTrigger className="py-1.5 px-3 hover:no-underline hover:bg-sidebar-accent/50 rounded-md text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/50 [&>svg]:w-3 [&>svg]:h-3">
                    {section.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + "/");
                        const Icon = item.icon;
                        return (
                          <Button
                            key={item.href}
                            variant="ghost"
                            onClick={() => navigate(item.href)}
                            className={cn(
                              "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent h-9",
                              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm">{item.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-1">
        <Button variant="ghost" onClick={() => navigate("/money/audit")}
          className={cn("w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "justify-center px-2")}>
          <ShieldCheck className="w-5 h-5" />
          {!collapsed && <span>MoneyOS Audit</span>}
        </Button>
        <Button variant="ghost" onClick={() => navigate("/")}
          className={cn("w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "justify-center px-2")}>
          <ArrowLeft className="w-5 h-5" />
          {!collapsed && <span>Back to Launcher</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export default QuietSidebar;
