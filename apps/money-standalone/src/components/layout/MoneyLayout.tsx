import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import MoneySidebar from "./MoneySidebar";
import MoneyBottomNav from "./MoneyBottomNav";

const MoneyLayout = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <MoneySidebar className="hidden lg:flex" />
      <main className="flex-1 overflow-auto pb-20 lg:pb-0">
        <Outlet />
      </main>
      <MoneyBottomNav className="lg:hidden" />
    </div>
  );
};

export default MoneyLayout;
