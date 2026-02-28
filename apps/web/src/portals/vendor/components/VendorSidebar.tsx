 import { useLocation, useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import {
   LayoutDashboard,
   DollarSign,
   Inbox,
   MessageSquare,
   Settings,
   LogOut,
   Building2,
   Menu,
   TrendingUp,
   Tag,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import { useVendorAuth } from "@/hooks/useVendorAuth";
 import { Button } from "@/components/ui/button";
 import { useState } from "react";
 
 const navItems = [
   { title: "Dashboard", href: "/vendor/dashboard", icon: LayoutDashboard },
   { title: "Demand Insights", href: "/vendor/insights", icon: TrendingUp },
   { title: "Pricing", href: "/vendor/pricing", icon: DollarSign },
   { title: "Deals", href: "/vendor/deals", icon: Tag },
   { title: "Orders", href: "/vendor/orders", icon: Inbox },
   { title: "Messages", href: "/vendor/messages", icon: MessageSquare },
 ];
 
 const VendorSidebar = () => {
   const location = useLocation();
   const navigate = useNavigate();
   const { signOut, vendorProfile } = useVendorAuth();
   const [collapsed, setCollapsed] = useState(false);
 
   const handleSignOut = async () => {
     await signOut();
     navigate("/vendor/auth");
   };
 
   return (
     <motion.aside
       initial={{ x: -20, opacity: 0 }}
       animate={{ x: 0, opacity: 1 }}
       className={cn(
         "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 sticky top-0",
         collapsed ? "w-16" : "w-64"
       )}
     >
       {/* Header */}
       <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
         {!collapsed && (
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
               <Building2 className="w-5 h-5 text-primary-foreground" />
             </div>
             <span className="font-semibold text-sidebar-foreground">VendorOS</span>
           </div>
         )}
         <Button
           variant="ghost"
           size="icon"
           onClick={() => setCollapsed(!collapsed)}
           className="text-sidebar-foreground hover:bg-sidebar-accent"
         >
           <Menu className="w-5 h-5" />
         </Button>
       </div>
 
       {/* Profile */}
       {!collapsed && vendorProfile && (
         <div className="p-4 border-b border-sidebar-border">
           <p className="text-sm font-medium text-sidebar-foreground truncate">
             {vendorProfile.business_name}
           </p>
           <p className="text-xs text-muted-foreground truncate">
             {vendorProfile.contact_email}
           </p>
         </div>
       )}
 
       {/* Navigation */}
       <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
         {navItems.map((item) => {
           const isActive = location.pathname === item.href;
           return (
             <Button
               key={item.href}
               variant="ghost"
               onClick={() => navigate(item.href)}
               className={cn(
                 "w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent",
                 isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                 collapsed && "justify-center px-2"
               )}
             >
               <item.icon className="w-5 h-5 flex-shrink-0" />
               {!collapsed && <span>{item.title}</span>}
             </Button>
           );
         })}
       </nav>
 
       {/* Footer */}
       <div className="p-2 border-t border-sidebar-border space-y-1">
         <Button
           variant="ghost"
           onClick={() => navigate("/vendor/settings")}
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
             "w-full justify-start gap-3 text-destructive hover:bg-destructive/10",
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
 
 export default VendorSidebar;