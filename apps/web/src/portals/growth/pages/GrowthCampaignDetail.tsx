import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Mail, Send, Megaphone, Sparkles, Users, Play, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchCampaign, updateCampaign, fetchCampaignRecipients } from "@/lib/shared/queries/marketingQueries";
import type { CampaignStatus } from "@/lib/shared/types/marketing.types";

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-secondary text-secondary-foreground",
};

const nextStatus: Record<string, CampaignStatus> = {
  DRAFT: "SCHEDULED",
  SCHEDULED: "SENT",
  SENT: "COMPLETED",
};

const statusAction: Record<string, { label: string; icon: typeof Play }> = {
  DRAFT: { label: "Schedule", icon: Play },
  SCHEDULED: { label: "Mark as Sent", icon: Send },
  SENT: { label: "Complete", icon: CheckCircle },
};

const GrowthCampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["growth-campaign", id],
    queryFn: () => fetchCampaign(id!),
    enabled: !!id,
  });

  const { data: recipients = [] } = useQuery({
    queryKey: ["growth-campaign-recipients", id],
    queryFn: () => fetchCampaignRecipients(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Record<string, any>) => updateCampaign(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-campaign", id] });
      queryClient.invalidateQueries({ queryKey: ["growth-campaigns"] });
      toast({ title: "Campaign updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !campaign) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const openRate = campaign.recipients_count > 0 ? Math.round((campaign.opened_count / campaign.recipients_count) * 100) : 0;
  const clickRate = campaign.recipients_count > 0 ? Math.round((campaign.clicked_count / campaign.recipients_count) * 100) : 0;
  const action = statusAction[campaign.status];
  const next = nextStatus[campaign.status];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/growth/campaigns")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.type.replace('_', ' ')} · {campaign.channel}</p>
        </div>
        <Badge className={statusColors[campaign.status]}>{campaign.status}</Badge>
        {action && next && (
          <Button onClick={() => updateMutation.mutate({ status: next, ...(next === 'SENT' ? { sent_at: new Date().toISOString() } : {}) })} className="gap-2">
            <action.icon className="w-4 h-4" /> {action.label}
          </Button>
        )}
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Recipients", value: campaign.recipients_count },
          { label: "Open Rate", value: `${openRate}%` },
          { label: "Click Rate", value: `${clickRate}%` },
          { label: "Bookings", value: campaign.bookings_attributed },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Subject</Label>
            <Input value={campaign.subject ?? ""} readOnly className="bg-muted/30" />
          </div>
          <div>
            <Label>Body</Label>
            <Textarea value={campaign.body ?? ""} readOnly className="bg-muted/30" rows={6} />
          </div>
          {campaign.social_caption && (
            <div>
              <Label>Social Caption</Label>
              <Textarea value={campaign.social_caption} readOnly className="bg-muted/30" rows={3} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recipients */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" /> Recipients ({recipients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recipients added yet. Use Segments to target guests.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recipients.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-border text-sm">
                  <span className="text-foreground">
                    {r.res_guests?.first_name} {r.res_guests?.last_name}
                  </span>
                  <Badge variant="outline" className="text-xs">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GrowthCampaignDetail;
