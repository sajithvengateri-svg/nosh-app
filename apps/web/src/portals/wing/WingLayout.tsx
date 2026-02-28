import { ReactNode, useEffect } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { Loader2, Wine, Home, Package, Archive, MessageCircle, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DEV_MODE } from "@/lib/devMode";
import { cn } from "@/lib/utils";
import WingSommelierChat from "./components/WingSommelierChat";

interface WingLayoutProps {
  children?: ReactNode;
}

const navItems = [
  { path: '/wing/lobby', label: 'Lobby', icon: Home },
  { path: '/wing/cellar', label: 'Cellar', icon: Archive },
];

const WingLayout = ({ children }: WingLayoutProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (DEV_MODE) return;
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (!DEV_MODE && isLoading) {
    return (
      <div className="theme-wine min-h-screen flex items-center justify-center" style={{ background: '#1C1C1C' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C9A96E' }} />
      </div>
    );
  }

  if (!DEV_MODE && !user) return null;

  return (
    <div className="theme-wine min-h-screen flex flex-col" style={{
      background: '#1C1C1C',
      color: '#F5F0EB',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Top Nav */}
      <nav className="sticky top-0 z-40 border-b px-4 py-3 flex items-center justify-between backdrop-blur-xl"
        style={{ borderColor: 'rgba(201,169,110,0.15)', background: 'rgba(28,28,28,0.9)' }}>
        <div className="flex items-center gap-4">
          <Link to="/wing" className="flex items-center gap-2">
            <Wine className="w-5 h-5" style={{ color: '#C9A96E' }} />
            <span className="font-display text-lg font-semibold tracking-wide" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>
              The Private Wing
            </span>
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "font-medium"
                    : "hover:opacity-80"
                )}
                style={{
                  color: isActive ? '#C9A96E' : '#F5F0EB99',
                  background: isActive ? 'rgba(201,169,110,0.1)' : 'transparent',
                }}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: '#722F37', color: '#F5F0EB' }}>
            J
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">
        {children || <Outlet />}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden border-t flex justify-around py-2 z-40"
        style={{ borderColor: 'rgba(201,169,110,0.15)', background: 'rgba(28,28,28,0.95)', backdropFilter: 'blur(20px)' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-1 px-3 text-xs"
              style={{ color: isActive ? '#C9A96E' : '#F5F0EB66' }}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Floating Sommelier Chat */}
      <WingSommelierChat />
    </div>
  );
};

export default WingLayout;
