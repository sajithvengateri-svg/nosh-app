import { ReactNode, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import QuietSidebar from "./components/QuietSidebar";
import QuietBottomNav from "./components/QuietBottomNav";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { DEV_MODE } from "@/lib/devMode";

const QuietLayout = ({ children }: { children?: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (DEV_MODE) return;
    if (!isLoading && !user) navigate("/auth");
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
      <QuietSidebar className="hidden lg:flex" />
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <PullToRefresh>{children || <Outlet />}</PullToRefresh>
      </main>
      <QuietBottomNav className="lg:hidden" />
    </div>
  );
};

export default QuietLayout;
