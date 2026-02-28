import { ReactNode, useEffect } from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { Loader2, Gamepad2, Trophy, User, Home } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PullToRefresh from "@/components/layout/PullToRefresh";
import { DEV_MODE } from "@/lib/devMode";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/games", icon: Home, label: "Hub", end: true },
  { to: "/games/leaderboard", icon: Trophy, label: "Leaderboard", end: false },
  { to: "/games/profile", icon: User, label: "Profile", end: false },
] as const;

const GamesLayout = ({ children }: { children?: ReactNode }) => {
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
    <div className="min-h-screen flex flex-col w-full bg-zinc-950 text-white">
      {/* Header */}
      <header className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
        <Gamepad2 className="w-5 h-5 text-emerald-400" />
        <span className="font-bold text-lg tracking-tight">Mastery Suite</span>
        <button
          onClick={() => navigate("/dashboard")}
          className="ml-auto text-xs text-zinc-400 hover:text-white transition"
        >
          Back to ChefOS
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">
        <PullToRefresh>{children || <Outlet />}</PullToRefresh>
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 flex justify-around py-2 z-50">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-4 py-1 text-xs transition-colors",
                isActive ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default GamesLayout;
