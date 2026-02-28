import { ReactNode, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ClockSidebar from "./components/ClockSidebar";
import ClockBottomNav from "./components/ClockBottomNav";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { DEV_MODE } from "@/lib/devMode";

interface ClockLayoutProps { children?: ReactNode; }

const ClockLayout = ({ children }: ClockLayoutProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (DEV_MODE) return;
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  if (!DEV_MODE && isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (!DEV_MODE && !user) return null;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <ClockSidebar className="hidden lg:flex" />
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <PullToRefresh>{children || <Outlet />}</PullToRefresh>
      </main>
      <ClockBottomNav className="lg:hidden" />
    </div>
  );
};

export default ClockLayout;
