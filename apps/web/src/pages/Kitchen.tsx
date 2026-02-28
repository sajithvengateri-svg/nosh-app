import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const Ingredients = lazy(() => import("@/pages/Ingredients"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Production = lazy(() => import("@/pages/Production"));
const WasteLog = lazy(() => import("@/pages/WasteLog"));
const CrockeryTab = lazy(() => import("@/components/kitchen/CrockeryTab"));
const SmallwaresTab = lazy(() => import("@/components/kitchen/SmallwaresTab"));
const TradieDirectory = lazy(() => import("@/components/tradies/TradieDirectory"));

const TAB_KEYS = ["ingredients", "inventory", "production", "waste-log", "crockery", "smallwares", "tradies"] as const;
type TabKey = typeof TAB_KEYS[number];

const Loading = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const Kitchen = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabKey | null;
  const activeTab = TAB_KEYS.includes(tabParam as TabKey) ? tabParam! : "ingredients";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

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
