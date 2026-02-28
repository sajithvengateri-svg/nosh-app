import { ReactNode, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import MoneySidebar from "./components/MoneySidebar";
import MoneyBottomNav from "./components/MoneyBottomNav";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { DEV_MODE } from "@/lib/devMode";

const MoneyLayout = ({ children }: { children?: ReactNode }) => {
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
      <MoneySidebar className="hidden lg:flex" />
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <PullToRefresh>{children || <Outlet />}</PullToRefresh>
      </main>
      <MoneyBottomNav className="lg:hidden" />
    </div>
  );
};

export default MoneyLayout;
