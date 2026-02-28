import { useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Store, Shield, Loader2, Zap, Wine, Monitor, Users, Truck, TrendingUp, DollarSign, Brain, Smartphone, CalendarCheck, PieChart, Trash2, MoreHorizontal, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import quietOSLogo from "@/assets/quietos-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { APP_REGISTRY, CATEGORY_LABELS, type AppCategory, type AppEntry } from "@/lib/shared/appRegistry";
import { useFeatureReleases } from "@/hooks/useFeatureReleases";
import { isAppAvailable } from "@/lib/shared/modeConfig";
import type { StoreMode } from "@/lib/shared/types/store.types";

const ICON_MAP: Record<string, React.ElementType> = {
  ChefHat, Wine, Monitor, Users, Truck, TrendingUp, DollarSign, Brain, Store, Shield, CalendarCheck, PieChart, Trash2,
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  live: { label: "Live", color: "bg-emerald-500" },
  development: { label: "Dev", color: "bg-amber-500" },
};

const CATEGORY_ORDER: AppCategory[] = ['ops', 'backoffice', 'intelligence', 'platform'];

const PortalSelect = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const { data: releases } = useFeatureReleases();

  const quickLogin = async (app: AppEntry) => {
    setLoading(app.key);
    try {
      await supabase.auth.signOut();
      const { data, error } = await supabase.functions.invoke("dev-login", {
        body: { persona: app.persona },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Login failed");
        setLoading(null);
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        toast.error(sessionError.message);
        setLoading(null);
        return;
      }

      toast.success(`Signed in → ${app.name}`);
      // Full page reload so AuthContext hydrates from the fresh session in storage
      window.location.href = app.entryRoute;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(null);
    }
  };

  const getAppStatus = (app: AppEntry): string => {
    if (!releases) return 'live';
    const appRelease = releases.find(r => r.module_slug === `app-${app.key}` || r.module_slug === app.key);
    if (!appRelease) return 'live';
    return appRelease.status === 'released' ? 'live' : 'development';
  };

  const getAppDisplayName = (app: AppEntry): string => {
    if (!releases) return app.name;
    const release = releases.find(r => r.module_slug === `app-${app.key}` || r.module_slug === app.key);
    return release?.module_name || app.name;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-950 via-slate-900 to-indigo-950 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-400/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.img
            src={quietOSLogo}
            alt="Quiet OS"
            className="w-20 h-20 mx-auto mb-5 rounded-2xl shadow-2xl shadow-teal-500/20 object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          />
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Quiet OS <span className="text-teal-400">Dev Launcher</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-3 h-3 text-teal-400" />
            <span className="text-xs text-slate-400">One-click sign in to any module</span>
          </div>
        </motion.div>

        {/* Category Sections */}
        {CATEGORY_ORDER.map((category, catIdx) => {
          // TODO: get orgMode from context when logged in; for dev launcher show all
          const orgMode: StoreMode = "restaurant";
          const apps = APP_REGISTRY.filter(a => a.category === category && isAppAvailable(a.key, orgMode));
          if (apps.length === 0) return null;

          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + catIdx * 0.08 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-4 px-1">
                <h2 className="text-xs font-semibold text-teal-400/80 uppercase tracking-widest">
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-teal-500/20 to-transparent" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {apps.map((app, i) => {
                  const Icon = ICON_MAP[app.iconName] || ChefHat;
                  const status = getAppStatus(app);
                  const statusCfg = STATUS_CONFIG[status];

                  return (
                    <motion.button
                      key={app.key}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + catIdx * 0.08 + i * 0.04 }}
                      onClick={() => quickLogin(app)}
                      disabled={loading !== null}
                      className="group relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl transition-all duration-200
                        hover:border-teal-400/30 hover:bg-white/[0.08] hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 disabled:opacity-50"
                    >
                      {/* RN Ready badge */}
                      {app.rnReady && (
                        <div className="absolute -top-1.5 -right-1.5">
                          <Smartphone className="w-3 h-3 text-emerald-400" />
                        </div>
                      )}

                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                        {loading === app.key ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <span className="font-medium text-sm text-white/90 leading-tight">{getAppDisplayName(app)}</span>
                      <span className="text-[10px] text-slate-400 leading-tight text-center">{app.subtitle}</span>
                      
                      {/* Dot status indicator */}
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.color}`} />
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider">{statusCfg.label}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}

        {/* Manual Login */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-col items-center gap-3"
        >
          <p className="text-xs text-slate-500">Or sign in manually:</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">Chef Login</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/vendor/auth")} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">Vendor Login</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/auth")} className="border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">Admin Login</Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="mt-4 gap-2 text-slate-400 hover:text-white hover:bg-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Control Centre
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default PortalSelect;
