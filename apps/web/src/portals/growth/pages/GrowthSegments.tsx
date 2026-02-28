import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users, UserPlus, RefreshCw, Heart, Star, Crown,
  Clock, AlertTriangle, Cake, Wine, UtensilsCrossed, Megaphone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useOrg } from "@/contexts/OrgContext";
import { fetchGuestSegmentCounts } from "@/lib/shared/queries/marketingQueries";
import { SEGMENT_DEFINITIONS } from "@/lib/shared/types/marketing.types";

const iconMap: Record<string, typeof Users> = {
  UserPlus, RefreshCw, Heart, Star, Crown, Clock, AlertTriangle, Cake, Wine, UtensilsCrossed,
};

const GrowthSegments = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();

  const { data: counts = {} } = useQuery({
    queryKey: ["growth-segment-counts", orgId],
    queryFn: () => fetchGuestSegmentCounts(orgId!),
    enabled: !!orgId,
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          Guest Segments
        </h1>
        <p className="text-sm text-muted-foreground">Auto-calculated from Res OS guest data</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SEGMENT_DEFINITIONS.map((seg) => {
          const Icon = iconMap[seg.icon] || Users;
          const count = (counts as Record<string, number>)[seg.key] ?? 0;
          return (
            <Card key={seg.key} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${seg.color} bg-opacity-15 flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className="text-3xl font-bold text-foreground">{count}</span>
                </div>
                <h3 className="font-semibold text-foreground">{seg.label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{seg.description}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-2"
                  onClick={() => navigate("/growth/campaigns")}
                  disabled={count === 0}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GrowthSegments;
