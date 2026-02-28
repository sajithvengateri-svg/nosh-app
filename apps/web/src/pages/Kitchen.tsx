import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ChefHat, ClipboardList, Package, Calculator, Wrench, Calendar, Sparkles, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode } from "@/lib/shared/modeConfig";

const Ingredients = lazy(() => import("@/pages/Ingredients"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Production = lazy(() => import("@/pages/Production"));
const WasteLog = lazy(() => import("@/pages/WasteLog"));
const CrockeryTab = lazy(() => import("@/components/kitchen/CrockeryTab"));
const SmallwaresTab = lazy(() => import("@/components/kitchen/SmallwaresTab"));
const TradieDirectory = lazy(() => import("@/components/tradies/TradieDirectory"));

const PRO_TAB_KEYS = ["ingredients", "inventory", "production", "waste-log", "crockery", "smallwares", "tradies"] as const;
const HOME_TAB_KEYS = ["ingredients", "inventory"] as const;
type TabKey = string;

const Loading = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// HomeChef hub grid items (mirrors mobile kitchen.tsx)
const HOMECHEF_HUB = [
  { label: "Prep Lists", icon: ClipboardList, path: "/prep", color: "text-orange-500", bg: "bg-orange-500/10" },
  { label: "Pantry", icon: Package, path: "/inventory", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Cost Calc", icon: Calculator, path: "/costing", color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Equipment", icon: Wrench, path: "/equipment", color: "text-purple-500", bg: "bg-purple-500/10" },
  { label: "Calendar", icon: Calendar, path: "/calendar", color: "text-pink-500", bg: "bg-pink-500/10" },
  { label: "Housekeeping", icon: Sparkles, path: "/housekeeping", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { label: "Cheatsheets", icon: BookOpen, path: "/cheatsheets", color: "text-amber-500", bg: "bg-amber-500/10" },
];

const Kitchen = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { storeMode } = useOrg();
  const isHomeCook = isHomeCookMode(storeMode);

  const tabKeys = isHomeCook ? HOME_TAB_KEYS : PRO_TAB_KEYS;
  const tabParam = searchParams.get("tab");
  const activeTab = (tabKeys as readonly string[]).includes(tabParam || "") ? tabParam! : "ingredients";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  // HomeChef: hub grid layout (matches mobile)
  if (isHomeCook) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-pink-500/10">
              <ChefHat className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="page-title font-display">My Kitchen</h1>
              <p className="page-subtitle">Your cooking hub</p>
            </div>
          </motion.div>

          {/* Hub Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {HOMECHEF_HUB.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={item.path}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card border border-border/40 hover:border-border hover:shadow-sm transition-all active:scale-95"
                >
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground text-center">{item.label}</span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Simplified tabs: just Ingredients + Pantry */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
              <TabsTrigger value="inventory">Pantry</TabsTrigger>
            </TabsList>
            <TabsContent value="ingredients" className="mt-4">
              <Suspense fallback={<Loading />}>
                <Ingredients embedded />
              </Suspense>
            </TabsContent>
            <TabsContent value="inventory" className="mt-4">
              <Suspense fallback={<Loading />}>
                <Inventory embedded />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }

  // Pro mode: full tab layout
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-lg bg-primary/10">
            <ChefHat className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="page-title font-display">Kitchen</h1>
            <p className="page-subtitle">Everything in your kitchen</p>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="waste-log">Waste Log</TabsTrigger>
            <TabsTrigger value="crockery">Crockery</TabsTrigger>
            <TabsTrigger value="smallwares">Smallwares</TabsTrigger>
            <TabsTrigger value="tradies">Tradies</TabsTrigger>
          </TabsList>

          <TabsContent value="ingredients" className="mt-4">
            <Suspense fallback={<Loading />}>
              <Ingredients embedded />
            </Suspense>
          </TabsContent>
          <TabsContent value="inventory" className="mt-4">
            <Suspense fallback={<Loading />}>
              <Inventory embedded />
            </Suspense>
          </TabsContent>
          <TabsContent value="production" className="mt-4">
            <Suspense fallback={<Loading />}>
              <Production embedded />
            </Suspense>
          </TabsContent>
          <TabsContent value="waste-log" className="mt-4">
            <Suspense fallback={<Loading />}>
              <WasteLog embedded />
            </Suspense>
          </TabsContent>
          <TabsContent value="crockery" className="mt-4">
            <Suspense fallback={<Loading />}>
              <CrockeryTab />
            </Suspense>
          </TabsContent>
          <TabsContent value="smallwares" className="mt-4">
            <Suspense fallback={<Loading />}>
              <SmallwaresTab />
            </Suspense>
          </TabsContent>
          <TabsContent value="tradies" className="mt-4">
            <Suspense fallback={<Loading />}>
              <TradieDirectory embedded />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Kitchen;
