import { ReactNode, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import BevSidebar from "./components/BevSidebar";
import BevBottomNav from "./components/BevBottomNav";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { DEV_MODE } from "@/lib/devMode";
import TimerDock from "@/components/timers/TimerDock";

interface BevLayoutProps {
  children?: ReactNode;
}

const BevLayout = ({ children }: BevLayoutProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (DEV_MODE) return;
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (!DEV_MODE && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!DEV_MODE && !user) return null;

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <BevSidebar className="hidden lg:flex" />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 lg:pb-0 flex flex-col">
        <PullToRefresh>
          <div className="flex-1">{children || <Outlet />}</div>
        </PullToRefresh>
        <TimerDock category="bar" />
      </main>

      {/* Mobile Bottom Navigation */}
      <BevBottomNav className="lg:hidden" />
    </div>
  );
};

export default BevLayout;
