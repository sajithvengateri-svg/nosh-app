import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMobileNavSections, type MobileNavSection } from "@/hooks/useMobileNavSections";
import { ALL_CHEF_NAV } from "@/lib/chefNavItems";
import { Settings, Loader2, ChevronRight, LayoutList, LayoutGrid } from "lucide-react";
import AppLayout from "./AppLayout";

const allNavWithSettings = [...ALL_CHEF_NAV, { path: "/settings", icon: Settings, label: "Settings", module: "settings" }];

const SECTION_THEME: Record<string, string> = {
  recipes: "bg-primary/10 text-primary",
  kitchen: "bg-blue-500/10 text-blue-600",
  safety: "bg-green-500/10 text-green-600",
};

const SectionHub = () => {
  const { sectionKey } = useParams<{ sectionKey: string }>();
  const { sections, isLoading } = useMobileNavSections();
  const [viewMode, setViewMode] = useState<"list" | "grid">(() =>
    (localStorage.getItem("sectionhub-view") as "list" | "grid") || "list"
  );

  const toggleView = () => {
    const next = viewMode === "list" ? "grid" : "list";
    setViewMode(next);
    localStorage.setItem("sectionhub-view", next);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const section = sections.find((s) => s.section_key === sectionKey);
  if (!section) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Section not found</p>
        </div>
      </AppLayout>
    );
  }

  const modules = (section.module_paths || [])
    .map((path) => allNavWithSettings.find((n) => n.path === path))
    .filter(Boolean);

  const theme = SECTION_THEME[sectionKey || ""] || "bg-primary/10 text-primary";

  return (
    <AppLayout>
      <div className="flex flex-col min-h-[60vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold">{section.label}</h1>
          <button
            onClick={toggleView}
            className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            aria-label="Toggle view"
          >
            {viewMode === "list" ? (
              <LayoutGrid className="w-5 h-5 text-muted-foreground" />
            ) : (
              <LayoutList className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col"
            >
              {modules.map((mod, i) => {
                if (!mod) return null;
                const Icon = mod.icon;
                return (
                  <motion.div
                    key={mod.path}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      to={mod.path}
                      className="flex items-center gap-4 px-5 py-4 border-b border-border/50 bg-card hover:bg-accent/30 active:scale-[0.98] transition-all"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-base font-semibold flex-1">{mod.label}</span>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-4"
            >
              {modules.map((mod, i) => {
                if (!mod) return null;
                const Icon = mod.icon;
                return (
                  <motion.div
                    key={mod.path}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link
                      to={mod.path}
                      className="flex flex-col items-center gap-2 p-5 rounded-2xl border bg-card hover:bg-accent/50 transition-colors shadow-sm active:scale-95"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${theme}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold text-center">{mod.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {modules.length === 0 && (
          <p className="text-muted-foreground text-center py-8">No modules assigned to this section yet.</p>
        )}
      </div>
    </AppLayout>
  );
};

export default SectionHub;
