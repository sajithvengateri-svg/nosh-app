import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, LogOut, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "./BottomNav";
import Sidebar from "./Sidebar";
import PullToRefresh from "./PullToRefresh";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { haptic } from "@/lib/haptics";
import PageGuideCard from "@/components/onboarding/PageGuideCard";
import FoodSafetyReminder from "@/components/food-safety/FoodSafetyReminder";
import WhatsNewBanner from "@/components/updates/WhatsNewBanner";
import { Button } from "@/components/ui/button";
import { useUpgradeSuccess } from "@/hooks/useUpgradeSuccess";

interface AppLayoutProps {
  children: ReactNode;
}

const OrgBanner = () => {
  const { currentOrg, venues } = useOrg();
  const { signOut } = useAuth();
  const activeVenue = venues?.[0];

  return (
    <div className="sticky top-0 z-40 bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between shadow-md lg:py-2">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-sm font-bold tracking-wide uppercase truncate">
          {currentOrg?.name || "My Kitchen"}
        </span>
        {activeVenue && (
          <>
            <span className="text-primary-foreground/40">|</span>
            <span className="flex items-center gap-1 text-xs text-primary-foreground/80 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              {activeVenue.name}
            </span>
          </>
        )}
      </div>
      <button
        onClick={() => { haptic("medium"); signOut(); }}
        className="flex items-center gap-1.5 text-xs font-medium text-primary-foreground/90 hover:text-primary-foreground active:scale-95 transition-all shrink-0"
        aria-label="Sign out"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Logout</span>
      </button>
    </div>
  );
};

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  useUpgradeSuccess();

  // Hide back button on root-level pages
  const isRootPage = location.pathname === "/" || location.pathname === "/dashboard";
  const showBack = !isRootPage && window.history.length > 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />
      
      {/* Main Content */}
      <main className="lg:pl-64 pb-24 lg:pb-0 min-h-screen">
        {/* Sticky Org Banner */}
        <OrgBanner />

        {/* What's New Banner */}
        <WhatsNewBanner />

        {/* Back Button */}
        {showBack && (
          <div className="sticky top-[44px] z-30 px-3 pt-2 lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { haptic("light"); navigate(-1); }}
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        )}

        {/* Mobile with Pull to Refresh */}
        <div className="lg:hidden min-h-screen">
          <PullToRefresh>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="safe-top px-3 py-4 pb-28"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </PullToRefresh>
        </div>
        {/* Desktop */}
        <div className="hidden lg:block safe-top px-8 py-6">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { haptic("light"); navigate(-1); }}
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav className="lg:hidden" />

      {/* Contextual Page Guide */}
      <PageGuideCard />

      {/* Food Safety Shift Reminders */}
      <FoodSafetyReminder />
    </div>
  );
};

export default AppLayout;
