import { ReactNode } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ResSidebar from "./components/ResSidebar";
import ResBottomNav from "./components/ResBottomNav";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { DEV_MODE } from "@/lib/devMode";
import { useEffect } from "react";

interface ResLayoutProps {
  children?: ReactNode;
}

const ResLayout = ({ children }: ResLayoutProps) => {
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
      <ResSidebar className="hidden md:flex" />
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <PullToRefresh>
          {children || <Outlet />}
        </PullToRefresh>
      </main>
      <ResBottomNav className="md:hidden" />
    </div>
  );
};

export default ResLayout;
