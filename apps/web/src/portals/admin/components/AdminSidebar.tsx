import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
  Shield,
  TestTube,
  Rocket,
  Database,
  ExternalLink,
  Tag,
  Building2,
  Mail,
  BookOpen,
  Send,
  Layout,
  Lightbulb,
  Wrench,
  Gift,
  TrendingUp,
  Kanban,
  Home,
  CreditCard,
  Truck,
  Globe,
  FileText,
  DollarSign,
  Activity,
  Gauge,
  Receipt,
  Cpu,
  ChefHat,
  Wine,
  Monitor,
  CalendarCheck,
  PieChart,
  Brain,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useSidebarSections } from "@/hooks/useSidebarSections";
import { useState, useMemo } from "react";
import { APP_REGISTRY } from "@/lib/shared/appRegistry";

// Icon map for app registry icons
const APP_ICON_MAP: Record<string, React.ElementType> = {
  ChefHat, Wine, Monitor, CalendarCheck, Users, Truck,
  TrendingUp, DollarSign, PieChart, Brain, Store, Shield,
};

// App portal links (exclude admin — we're already in admin)
const appLinks = APP_REGISTRY
  .filter((a) => a.key !== "admin")
  .map((a) => ({
    title: a.name,
    href: a.entryRoute,
    icon: APP_ICON_MAP[a.iconName] || Rocket,
    gradient: a.gradient,
  }));

interface NavItem { title: string; href: string; icon: any }
interface NavSection { label: string; items: NavItem[] }

const navSections: NavSection[] = [
  {
    label: "Platform",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { title: "Domain Links", href: "/admin/domain-links", icon: Globe },
      { title: "Organizations", href: "/admin/organizations", icon: Building2 },
      { title: "Release Manager", href: "/admin/releases", icon: Rocket },
    ],
  },
  {
    label: "Landing Pages",
    items: [
      { title: "ChefOS", href: "/admin/landing-page", icon: Layout },
      { title: "Home Chef", href: "/admin/home-chef-landing", icon: Home },
      { title: "Vendor", href: "/admin/vendor-landing", icon: Truck },
      { title: "Food Safety", href: "/admin/food-safety-landing", icon: Shield },
      { title: "India ChefOS", href: "/admin/india-chefos-landing", icon: Globe },
      { title: "GCC ChefOS", href: "/admin/gcc-chefos-landing", icon: Globe },
      { title: "India Home Cook", href: "/admin/india-home-cook-landing", icon: Home },
      { title: "India Food Safety", href: "/admin/india-food-safety-landing", icon: Shield },
      { title: "GCC Home Cook", href: "/admin/gcc-home-cook-landing", icon: Home },
      { title: "GCC Food Safety", href: "/admin/gcc-food-safety-landing", icon: Shield },
      { title: "MoneyOS", href: "/admin/money-landing", icon: DollarSign },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Email Templates", href: "/admin/email-templates", icon: Mail },
      { title: "Site Pages", href: "/admin/site-pages", icon: FileText },
      { title: "Help Center", href: "/admin/help", icon: BookOpen },
      { title: "Help Links", href: "/admin/help-links", icon: Send },
    ],
  },
  {
    label: "Development",
    items: [
      { title: "Vendor Deals", href: "/admin/vendor-deals", icon: Tag },
      { title: "Chef Ideas", href: "/admin/ideas", icon: Lightbulb },
      { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { title: "Marketing", href: "/admin/marketing", icon: Megaphone },
      { title: "Testing", href: "/admin/testing", icon: TestTube },
      { title: "QA: Food Safety", href: "/admin/qa/mobile", icon: Shield },
      { title: "QA: Home Chef", href: "/admin/qa/web", icon: Home },
      { title: "QA: ChefOS", href: "/admin/qa/cross-cutting", icon: ChefHat },
      { title: "Seed Data", href: "/admin/seed", icon: Database },
      { title: "Beta Tracker", href: "/admin/beta", icon: Rocket },
      { title: "ChefOS Brain", href: "/admin/brain", icon: Brain },
      { title: "NOSH Admin", href: "/admin/nosh", icon: UtensilsCrossed },
      { title: "App Launch", href: "/admin/app-launch", icon: ExternalLink },
      { title: "System Tools", href: "/admin/system", icon: Wrench },
      { title: "Dev Launcher", href: "/launch", icon: Rocket },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Accounting", href: "/admin/accounting", icon: DollarSign },
      { title: "AI Usage", href: "/admin/ai-usage", icon: Activity },
      { title: "Token Quotas", href: "/admin/quotas", icon: Gauge },
      { title: "Fixed Costs", href: "/admin/fixed-costs", icon: Receipt },
      { title: "Rate Mgmt", href: "/admin/rates", icon: Cpu },
    ],
  },
  {
    label: "Sales Engine",
    items: [
      { title: "Sales Dashboard", href: "/admin/sales", icon: TrendingUp },
      { title: "CRM", href: "/admin/sales/crm", icon: Users },
      { title: "Plans", href: "/admin/sales/plans", icon: CreditCard },
      { title: "Lead Pipeline", href: "/admin/sales/leads", icon: Kanban },
      { title: "Referral Settings", href: "/admin/sales/settings", icon: Settings },
      { title: "Referral Analytics", href: "/admin/sales/analytics", icon: BarChart3 },
      { title: "Referral Mgmt", href: "/admin/sales/referrals", icon: Gift },
    ],
  },
];

// Build section path map for the sidebar hook
const sectionPathMap: Record<string, string[]> = {};
for (const section of navSections) {
  sectionPathMap[section.label] = section.items.map((i) => i.href);
}
sectionPathMap["Apps"] = appLinks.map((a) => a.href);

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAdminAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { openSections, setOpenSections } = useSidebarSections("admin", sectionPathMap);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/auth");
  };

  // All sections including Apps, for the accordion
  const allSections = useMemo(() => [
    ...navSections,
    { label: "Apps", items: appLinks.map((a) => ({ title: a.title, href: a.href, icon: a.icon })) },
  ], []);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed top-0 left-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-40",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-sidebar-foreground">Control</span>
              <span className="text-primary font-bold"> Center</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {collapsed ? (
          /* Icon-only mode: show all items flat */
          <>
            {allSections.map((section) => (
              <div key={section.label} className="space-y-0.5 mb-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href ||
                    (item.href !== "/admin" && location.pathname.startsWith(item.href));
                  const isApp = section.label === "Apps";
                  return (
                    <Button
                      key={item.href}
                      variant="ghost"
                      onClick={() => isApp ? (window.location.href = item.href) : navigate(item.href)}
                      className={cn(
                        "w-full justify-center px-2 text-sidebar-foreground hover:bg-sidebar-accent",
                        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                    </Button>
                  );
                })}
              </div>
            ))}
          </>
        ) : (
          /* Expanded mode: accordion sections */
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="space-y-0.5"
          >
            {allSections.map((section) => {
              const isApp = section.label === "Apps";
              return (
                <AccordionItem key={section.label} value={section.label} className="border-b-0">
                  <AccordionTrigger className="py-2 px-2 hover:no-underline hover:bg-sidebar-accent/50 rounded-md text-[10px] font-semibold text-muted-foreground uppercase tracking-widest [&>svg]:w-3 [&>svg]:h-3">
                    {section.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.href ||
                          (item.href !== "/admin" && location.pathname.startsWith(item.href));
                        return (
                          <Button
                            key={item.href}
                            variant="ghost"
                            onClick={() => isApp ? (window.location.href = item.href) : navigate(item.href)}
                            className={cn(
                              "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent h-8 text-sm",
                              isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                            )}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span>{item.title}</span>
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

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1 shrink-0">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/settings")}
          className={cn(
            "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </Button>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
