import { Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import WasteLogForm from "@/components/waste/WasteLogForm";
import WasteReview from "@/components/waste/WasteReview";
import WasteReport from "@/components/waste/WasteReport";

const BevWasteLog = () => {
  const { isHeadChef } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-destructive/10">
          <Trash2 className="w-6 h-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bev Waste Log</h1>
          <p className="text-sm text-muted-foreground">Track, review, and report on beverage waste</p>
        </div>
      </div>

      <Tabs defaultValue="log" className="space-y-4">
        <TabsList>
          <TabsTrigger value="log">Log Waste</TabsTrigger>
          {isHeadChef && <TabsTrigger value="review">Review</TabsTrigger>}
          <TabsTrigger value="report">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="log">
          <WasteLogForm module="beverage" />
        </TabsContent>

        {isHeadChef && (
          <TabsContent value="review">
            <WasteReview module="beverage" />
          </TabsContent>
        )}

        <TabsContent value="report">
          <WasteReport module="beverage" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BevWasteLog;
