import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, DollarSign, ShieldCheck, MapPin, Calendar } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useLabourSettings } from "@/lib/shared/queries/labourQueries";
import { Skeleton } from "@/components/ui/skeleton";
import LabourOrgSettings from "../components/settings/LabourOrgSettings";
import AwardRatesSettings from "../components/settings/AwardRatesSettings";
import PenaltiesAllowancesSettings from "../components/settings/PenaltiesAllowancesSettings";
import GeofenceCommSettings from "../components/settings/GeofenceCommSettings";

const LabourSettings = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: settings, isLoading, refetch: refetchSettings } = useLabourSettings(orgId);

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Labour Settings</h1>
        <p className="text-muted-foreground text-sm">
          Award configuration, pay schedule, rates, geofences, and communication rules — all editable.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general" className="gap-1.5">
            <Settings className="w-3.5 h-3.5" /> General
          </TabsTrigger>
          <TabsTrigger value="rates" className="gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> Award Rates
          </TabsTrigger>
          <TabsTrigger value="penalties" className="gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Penalties & Allowances
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Holidays, Geofences & Comms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <LabourOrgSettings settings={settings} refetchSettings={refetchSettings} />
        </TabsContent>

        <TabsContent value="rates">
          <AwardRatesSettings />
        </TabsContent>

        <TabsContent value="penalties">
          <PenaltiesAllowancesSettings />
        </TabsContent>

        <TabsContent value="operations">
          <GeofenceCommSettings orgId={orgId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LabourSettings;
