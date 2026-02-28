import { ReactNode, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "./components/AdminSidebar";
import { DEV_MODE } from "@/lib/devMode";

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, loading, roleLoading, isAdmin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Skip auth redirects in dev mode
    if (DEV_MODE) return;
    
    // Wait for both session + role check to settle before redirecting.
    if (!loading && !roleLoading && !user) {
      navigate("/admin/auth");
    }
    if (!loading && !roleLoading && user && !isAdmin) {
      navigate("/admin/auth");
    }
  }, [user, loading, roleLoading, isAdmin, navigate]);

  // Skip loading state in dev mode
  if (!DEV_MODE && (loading || roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!DEV_MODE && (!user || !isAdmin)) return null;
 
   return (
     <div className="min-h-screen bg-background">
       {/* Background gradient */}
       <div className="fixed inset-0 -z-10">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
         <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />
       </div>
 
       <AdminSidebar />
 
       <main className="ml-[72px] lg:ml-[240px] min-h-screen transition-all duration-200">
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.3 }}
           className="p-6"
         >
           {children || <Outlet />}
         </motion.div>
       </main>
     </div>
   );
 };
 
 export default AdminLayout;