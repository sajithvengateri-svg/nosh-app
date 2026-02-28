import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  Loader2,
  Shield,
  Mail,
  Lock,
  BarChart3,
  Users,
  Rocket,
  Brain,
  Tag,
  CreditCard,
  Globe,
  Activity,
  ChefHat,
  ArrowRight,
} from "lucide-react";

const GREETINGS = [
  "Ready to build something great",
  "Let's make today count",
  "The kitchen never sleeps",
  "Time to ship",
  "Command and conquer",
];

const QUICK_NAV = [
  { label: "CRM & Leads", href: "/admin/sales/crm", icon: Users, color: "text-blue-400" },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, color: "text-emerald-400" },
  { label: "ChefOS Brain", href: "/admin/brain", icon: Brain, color: "text-purple-400" },
  { label: "Release Manager", href: "/admin/releases", icon: Rocket, color: "text-orange-400" },
  { label: "Vendor Deals", href: "/admin/vendor-deals", icon: Tag, color: "text-cyan-400" },
  { label: "AI Usage", href: "/admin/ai-usage", icon: Activity, color: "text-rose-400" },
  { label: "Prep Mi Admin", href: "/admin/nosh", icon: ChefHat, color: "text-amber-400" },
  { label: "Domain Links", href: "/admin/domain-links", icon: Globe, color: "text-teal-400" },
];

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const AdminAuth = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signIn, loading } = useAdminAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const greeting = useMemo(
    () => GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
    [],
  );
  const timeOfDay = useMemo(() => getTimeOfDay(), []);
  const dateStr = useMemo(
    () =>
      new Date().toLocaleDateString("en-AU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await signIn(email, password);
      if (result?.isAdmin) {
        navigate("/admin", { replace: true });
      }
    } catch {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left: Greeting + Quick Nav ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden"
      >
        {/* Background accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-lg">Control</span>
              <span className="text-primary font-bold text-lg"> Center</span>
            </div>
          </div>
        </div>

        {/* Middle: Greeting */}
        <div className="relative z-10 flex-1 flex flex-col justify-center -mt-8">
          <p className="text-sm font-medium text-white/50 uppercase tracking-widest mb-2">
            Good {timeOfDay}
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-2">
            {greeting}.
          </h1>
          <p className="text-white/40 text-sm">{dateStr}</p>

          {/* Quick Nav Grid */}
          <div className="mt-10">
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
              Jump to
            </p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_NAV.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    if (user && isAdmin) {
                      navigate(item.href);
                    }
                  }}
                  disabled={!user || !isAdmin}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-left group disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                  <span className="text-sm text-white/70 group-hover:text-white transition-colors truncate">
                    {item.label}
                  </span>
                  <ArrowRight className="w-3 h-3 text-white/20 group-hover:text-white/50 ml-auto flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Branding */}
        <div className="relative z-10 flex items-center gap-2 text-white/20">
          <ChefHat className="w-4 h-4" />
          <span className="text-xs">ChefOS Platform</span>
        </div>
      </motion.div>

      {/* ── Right: Login Form ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full lg:w-[440px] flex items-center justify-center p-8 lg:p-12 bg-background"
      >
        <Card className="w-full max-w-sm border-border/50 shadow-none bg-transparent">
          <CardContent className="pt-6">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4 lg:hidden">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-xl font-bold">Sign in</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Admin credentials required
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@chefos.app"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Access Control Center"
                )}
              </Button>

              <button
                type="button"
                onClick={() => navigate("/reset-password?portal=admin")}
                className="text-xs text-primary hover:underline w-full text-center mt-2"
              >
                Forgot password?
              </button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminAuth;
