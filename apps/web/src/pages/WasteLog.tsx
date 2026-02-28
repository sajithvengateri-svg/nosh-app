import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import WasteLogForm from "@/components/waste/WasteLogForm";
import WasteReview from "@/components/waste/WasteReview";
import WasteReport from "@/components/waste/WasteReport";

const WasteLog = ({ embedded = false }: { embedded?: boolean }) => {
  const { isHeadChef } = useAuth();

  const content = (
    <div className={embedded ? "" : "flex min-h-screen bg-background"}>
      {!embedded && <Sidebar />}
      <main className={embedded ? "" : "flex-1 ml-64 p-6 overflow-auto"}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-destructive/10">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Waste Log</h1>
            <p className="text-sm text-muted-foreground">Track, review, and report on food waste</p>
          </div>
        </div>

        <Tabs defaultValue="log" className="space-y-4">
          <TabsList>
            <TabsTrigger value="log">Log Waste</TabsTrigger>
            {isHeadChef && <TabsTrigger value="review">Review</TabsTrigger>}
            <TabsTrigger value="report">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="log">
            <WasteLogForm module="food" />
          </TabsContent>

          {isHeadChef && (
            <TabsContent value="review">
              <WasteReview module="food" />
            </TabsContent>
          )}

          <TabsContent value="report">
            <WasteReport module="food" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );

  return content;
};

export default WasteLog;
