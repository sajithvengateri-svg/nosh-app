import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ShoppingCart,
  MonitorPlay,
  CreditCard,
  ClipboardList,
  Shield,
  ScrollText,
  UtensilsCrossed,
  Users,
  Settings,
  Upload,
  CalendarDays,
  BarChart3,
  Banknote,
  Trash2,
} from "lucide-react";

const NAV_ITEMS = [
  { title: "POS", url: "/pos", icon: ShoppingCart, end: true },
  { title: "KDS", url: "/pos/kds", icon: MonitorPlay },
  { title: "Tabs", url: "/pos/tabs", icon: CreditCard },
  { title: "Functions", url: "/pos/functions", icon: CalendarDays },
  { title: "Daily Close", url: "/pos/daily-close", icon: Banknote },
  { title: "Waste Log", url: "/pos/waste", icon: Trash2 },
  { title: "Compliance", url: "/pos/compliance", icon: Shield },
  { title: "Audit Log", url: "/pos/audit", icon: ScrollText },
  { title: "Analytics", url: "/pos/analytics", icon: BarChart3 },
];

const ADMIN_ITEMS = [
  { title: "Menu", url: "/pos/admin/menu", icon: UtensilsCrossed },
  { title: "Staff", url: "/pos/admin/staff", icon: Users },
  { title: "Store Settings", url: "/pos/admin/store", icon: Settings },
  { title: "Import", url: "/pos/admin/import", icon: Upload },
];

export default function RestOSSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (url: string, end?: boolean) =>
    end ? location.pathname === url : location.pathname.startsWith(url);

  return (
    <Sidebar className={`${collapsed ? "w-14" : "w-56"} border-r border-white/10 bg-[#0a0c10]`} collapsible="icon">
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">
            Service
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      activeClassName="text-rose-400 bg-rose-500/10"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-500 text-[10px] uppercase tracking-widest mb-1">
            Admin
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      activeClassName="text-rose-400 bg-rose-500/10"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
