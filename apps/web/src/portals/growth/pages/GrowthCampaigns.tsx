import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Megaphone, Plus, Mail, Send, Sparkles, Filter,
  Trash2, MoreHorizontal, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "@/lib/shared/queries/marketingQueries";
import type { CampaignType, CampaignChannel, CampaignStatus, Campaign } from "@/lib/shared/types/marketing.types";

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  SENT: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  COMPLETED: "bg-secondary text-secondary-foreground",
};

const channelIcons: Record<string, typeof Mail> = {
  EMAIL: Mail, SMS: Send, SOCIAL: Megaphone, MULTI: Sparkles,
};

const GrowthCampaigns = () => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "", type: "CUSTOM" as CampaignType, channel: "EMAIL" as CampaignChannel,
    subject: "", body: "", social_caption: "", cta_text: "Book Now", cta_url: "",
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["growth-campaigns", orgId],
    queryFn: () => fetchCampaigns(orgId!),
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: () => createCampaign({ ...newCampaign, org_id: orgId!, created_by: user?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-campaigns"] });
      setShowCreate(false);
      setNewCampaign({ name: "", type: "CUSTOM", channel: "EMAIL", subject: "", body: "", social_caption: "", cta_text: "Book Now", cta_url: "" });
      toast({ title: "Campaign created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-campaigns"] });
      toast({ title: "Campaign deleted" });
    },
  });

  const filtered = campaigns.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
          <p className="text-sm text-muted-foreground">{campaigns.length} total campaigns</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input placeholder="Search campaigns..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No campaigns yet. Create your first campaign to get started.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((c) => {
            const Icon = channelIcons[c.channel] || Mail;
            const openRate = c.recipients_count > 0 ? Math.round((c.opened_count / c.recipients_count) * 100) : 0;
            return (
              <Card key={c.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/growth/campaigns/${c.id}`)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.type.replace('_', ' ')} · {c.recipients_count} recipients · {openRate}% open rate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[c.status]}>{c.status}</Badge>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(c.id); }}>
                      <Trash2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input value={newCampaign.name} onChange={(e) => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Win Back Lapsed Regulars" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={newCampaign.type} onValueChange={(v) => setNewCampaign(p => ({ ...p, type: v as CampaignType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["DEMAND_FILL", "WIN_BACK", "BIRTHDAY", "PROMOTION", "EVENT", "CUSTOM"].map(t => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Channel</Label>
                <Select value={newCampaign.channel} onValueChange={(v) => setNewCampaign(p => ({ ...p, channel: v as CampaignChannel }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["EMAIL", "SMS", "SOCIAL", "MULTI"].map(ch => (
                      <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={newCampaign.subject} onChange={(e) => setNewCampaign(p => ({ ...p, subject: e.target.value }))} placeholder="Email subject line" />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea value={newCampaign.body} onChange={(e) => setNewCampaign(p => ({ ...p, body: e.target.value }))} placeholder="Message body..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!newCampaign.name || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrowthCampaigns;
