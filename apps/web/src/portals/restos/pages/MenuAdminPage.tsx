import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoriesPanel from "../components/menu/CategoriesPanel";
import MenuItemsPanel from "../components/menu/MenuItemsPanel";
import ModifierGroupsPanel from "../components/menu/ModifierGroupsPanel";

export default function MenuAdminPage() {
  const [activeTab, setActiveTab] = useState("items");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Menu Admin</h1>
        <p className="text-sm text-slate-400 mt-1">Manage categories, items, and modifiers</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="items" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
            Categories
          </TabsTrigger>
          <TabsTrigger value="modifiers" className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400">
            Modifier Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
          <MenuItemsPanel />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategoriesPanel />
        </TabsContent>
        <TabsContent value="modifiers" className="mt-4">
          <ModifierGroupsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
