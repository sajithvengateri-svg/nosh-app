import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  UtensilsCrossed, Users, BarChart3, Store, Megaphone, ShoppingCart,
  Settings, Sparkles, CreditCard, Shield, LogOut, Loader2, ChefHat,
  TrendingUp, Eye, Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import noshLogo from "@/assets/nosh-logo.png";

const NOSH = {
  primary: "#D94878",
  secondary: "#2A1F2D",
  bg: "#FBF6F8",
  card: "#FDFBFC",
  border: "rgba(232,221,226,0.5)",
  muted: "#7A6B75",
  textMuted: "#A89DA3",
  success: "#5BA37A",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}

const StatCard = ({ label, value, icon: Icon, color, loading }: StatCardProps) => (
  <div className="rounded-[16px] p-5" style={{ background: NOSH.card, border: `1px solid ${NOSH.border}` }}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: NOSH.secondary }}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: NOSH.textMuted }} /> : value}
        </p>
        <p className="text-xs" style={{ color: NOSH.muted }}>{label}</p>
      </div>
    </div>
  </div>
);

const ADMIN_SECTIONS = [
  { label: "Users & Signups", icon: Users, description: "Consumer signups, profiles, activity", path: "/admin/crm", color: NOSH.primary },
  { label: "Vendor Deals", icon: Store, description: "Active deals, redemptions, vendors", path: "/admin/vendor-deals", color: "#5BA37A" },
  { label: "Analytics", icon: BarChart3, description: "Usage, retention, funnels", path: "/admin/analytics", color: "#6366F1" },
  { label: "Organizations", icon: ChefHat, description: "Kitchens, venues, memberships", path: "/admin/organizations", color: "#E8A93E" },
  { label: "Marketing", icon: Megaphone, description: "Campaigns, push notifications", path: "/admin/marketing", color: "#EC4899" },
  { label: "Referrals", icon: TrendingUp, description: "Referral codes, tracking, rewards", path: "/admin/sales/referrals", color: "#14B8A6" },
  { label: "AI Usage", icon: Sparkles, description: "Token usage, costs, quotas", path: "/admin/ai-usage", color: "#8B5CF6" },
  { label: "Billing", icon: CreditCard, description: "Subscriptions, revenue", path: "/admin/accounting", color: "#F59E0B" },
  { label: "Landing Pages", icon: Eye, description: "Consumer & vendor landing editors", path: "/admin/landing-page", color: "#3B82F6" },
  { label: "System", icon: Settings, description: "Feature flags, seed data, tools", path: "/admin/system", color: "#6B7280" },
];

const NoshAdmin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, roleLoading, signOut } = useAdminAuth();
  const [stats, setStats] = useState({ users: 0, orgs: 0, deals: 0, vendors: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Redirect to nosh auth if not logged in or not admin
  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user) {
        navigate("/nosh/auth", { replace: true });
      } else if (!isAdmin) {
        navigate("/nosh/auth", { replace: true });
      }
    }
  }, [user, isAdmin, loading, roleLoading, navigate]);

  // Fetch stats
  useEffect(() => {
    if (!user || !isAdmin) return;
    const fetchStats = async () => {
      setStatsLoading(true);
      const [profiles, orgs, deals, vendors] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("vendor_deals" as any).select("id", { count: "exact", head: true }),
        supabase.from("vendor_profiles" as any).select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: profiles.count || 0,
        orgs: orgs.count || 0,
        deals: deals.count || 0,
        vendors: vendors.count || 0,
      });
      setStatsLoading(false);
    };
    fetchStats();
  }, [user, isAdmin]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: NOSH.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: NOSH.primary }} />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen" style={{ background: NOSH.bg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4 backdrop-blur-[30px] flex items-center justify-between"
        style={{ background: "rgba(251,246,248,0.85)", borderBottom: `1px solid ${NOSH.border}` }}
      >
        <div className="flex items-center gap-3">
          <img src={noshLogo} alt="Prep Mi" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="text-lg font-bold" style={{ color: NOSH.secondary }}>
              Prep Mi <span className="font-normal" style={{ color: NOSH.muted }}>Admin</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
            style={{ background: `${NOSH.muted}15`, color: NOSH.muted }}
          >
            <Shield className="w-3 h-3" />
            Control Center
          </Link>
          <button
            onClick={() => { signOut(); navigate("/nosh/auth"); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80"
            style={{ background: `${NOSH.primary}10`, color: NOSH.primary }}
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <StatCard label="Users" value={stats.users} icon={Users} color={NOSH.primary} loading={statsLoading} />
          <StatCard label="Organizations" value={stats.orgs} icon={ChefHat} color="#E8A93E" loading={statsLoading} />
          <StatCard label="Active Deals" value={stats.deals} icon={ShoppingCart} color={NOSH.success} loading={statsLoading} />
          <StatCard label="Vendors" value={stats.vendors} icon={Store} color="#6366F1" loading={statsLoading} />
        </motion.div>

        {/* Sections Grid */}
        <div>
          <h2 className="text-sm font-semibold mb-4" style={{ color: NOSH.muted, letterSpacing: "1px", textTransform: "uppercase" }}>
            Manage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ADMIN_SECTIONS.map((section, i) => (
              <motion.div
                key={section.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={section.path}
                  className="block rounded-[16px] p-5 transition-all hover:scale-[1.02]"
                  style={{ background: NOSH.card, border: `1px solid ${NOSH.border}` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${section.color}15` }}>
                      <section.icon className="w-5 h-5" style={{ color: section.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: NOSH.secondary }}>{section.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: NOSH.muted }}>{section.description}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center justify-center gap-4 pt-4 pb-8">
          <Link
            to="/nosh/auth"
            className="text-xs hover:underline"
            style={{ color: NOSH.textMuted }}
          >
            Prep Mi Login
          </Link>
          <span style={{ color: NOSH.border }}>|</span>
          <Link
            to="/admin"
            className="flex items-center gap-1 text-xs hover:underline"
            style={{ color: NOSH.textMuted }}
          >
            <Wrench className="w-3 h-3" />
            ChefOS Control Center
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NoshAdmin;
