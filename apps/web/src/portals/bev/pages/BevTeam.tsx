import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Mail, Shield, ClipboardList, Activity, GitBranch, MoreHorizontal, Trash2, Check, X, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const BAR_ROLES = [
  { value: "bar_manager", label: "Bar Manager" },
  { value: "asst_bar_manager", label: "Asst Bar Manager" },
  { value: "senior_bartender", label: "Senior Bartender" },
  { value: "bartender", label: "Bartender" },
  { value: "bar_back", label: "Bar-back" },
  { value: "barista", label: "Barista" },
];

const BEV_MODULES = [
  "Dashboard", "Cellar", "Cocktails", "Pours", "Bar Prep", "Stocktake",
  "Draught", "Coffee", "Coravin", "Flash Cards", "Wine", "Compliance", "Engineering",
];

const BevTeam = () => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "bartender", full_name: "" });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const [membersRes, invitesRes, activityRes] = await Promise.all([
      supabase.from("org_memberships").select("*, profiles(full_name, email, avatar_url)").eq("org_id", orgId).eq("is_active", true),
      supabase.from("team_invites").select("*").eq("org_id", orgId).is("accepted_at", null).order("created_at", { ascending: false }),
      supabase.from("activity_log").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(30),
    ]);
    setMembers(membersRes.data || []);
    setInvites(invitesRes.data || []);
    setActivityLog(activityRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const sendInvite = async () => {
    if (!orgId || !inviteForm.email) return;
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const { error } = await supabase.from("team_invites").insert({
      org_id: orgId,
      email: inviteForm.email.toLowerCase().trim(),
      role: inviteForm.role as any,
      token,
      invited_by: user?.id,
      expires_at: expiresAt.toISOString(),
    });
    if (error) { toast.error(error.message); return; }

    const signupLink = `${window.location.origin}/auth`;

    // Await email response instead of fire-and-forget
    try {
      const { data } = await supabase.functions.invoke("send-invite-email", {
        body: {
          email: inviteForm.email.toLowerCase().trim(),
          inviterName: user?.user_metadata?.full_name || "Bar Manager",
          orgName: currentOrg?.name || "Your Bar",
          role: inviteForm.role,
          portal: "bev",
          orgId,
        },
      });

      if (data?.email_sent) {
        toast.success(`Invite emailed to ${inviteForm.email}!`, {
          action: {
            label: "Copy Link",
            onClick: () => {
              navigator.clipboard.writeText(signupLink);
              toast.info("Signup link copied!");
            },
          },
        });
      } else {
        toast.info("Invite saved! Share the signup link manually.", {
          action: {
            label: "Copy Link",
            onClick: () => {
              navigator.clipboard.writeText(signupLink);
              toast.info("Signup link copied!");
            },
          },
        });
      }
    } catch (emailErr) {
      console.error("Invite email failed:", emailErr);
      toast.info("Invite saved! Share the signup link manually.", {
        action: {
          label: "Copy Link",
          onClick: () => {
            navigator.clipboard.writeText(signupLink);
            toast.info("Signup link copied!");
          },
        },
      });
    }

    setShowInviteDialog(false);
    setInviteForm({ email: "", role: "bartender", full_name: "" });
    load();
  };

  const cancelInvite = async (id: string) => {
    await supabase.from("team_invites").delete().eq("id", id);
    toast.success("Invite cancelled");
    load();
  };

  const getRoleLabel = (role: string) => BAR_ROLES.find(r => r.value === role)?.label || role;
  const getInitials = (name: string) => name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">Bar Team</h1>
        <p className="text-sm text-muted-foreground">Manage bartenders, bar-backs, and baristas</p>
      </motion.div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members"><Users className="w-4 h-4 mr-1" /> Members ({members.length})</TabsTrigger>
          <TabsTrigger value="invites"><Mail className="w-4 h-4 mr-1" /> Invites ({invites.length})</TabsTrigger>
          <TabsTrigger value="activity"><Activity className="w-4 h-4 mr-1" /> Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild><Button size="sm"><UserPlus className="w-4 h-4 mr-2" /> Invite</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Email</Label><Input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="bartender@email.com" /></div>
                      <div>
                        <Label>Role</Label>
                        <Select value={inviteForm.role} onValueChange={v => setInviteForm({ ...inviteForm, role: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{BAR_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button onClick={sendInvite} className="w-full"><Send className="w-4 h-4 mr-2" /> Send Invite</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading team...</p>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No team members yet. Invite your first bartender!</p>
              ) : (
                <div className="space-y-3">
                  {members.map(m => {
                    const profile = m.profiles;
                    const name = profile?.full_name || profile?.email || "Unknown";
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">{getInitials(name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <p className="text-xs text-muted-foreground">{profile?.email}</p>
                        </div>
                        <Badge variant="secondary">{getRoleLabel(m.role)}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-3">
          {invites.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No pending invites.</CardContent></Card>
          ) : (
            invites.map(inv => (
              <Card key={inv.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{inv.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {getRoleLabel(inv.role)} · Expires {format(new Date(inv.expires_at), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${window.location.origin}/auth`);
                        toast.success("Signup link copied to clipboard!");
                      } catch {
                        toast.error("Failed to copy link");
                      }
                    }}>
                      Copy Link
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cancelInvite(inv.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-3">
          {activityLog.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No activity yet.</CardContent></Card>
          ) : (
            activityLog.map(a => (
              <Card key={a.id}>
                <CardContent className="pt-4">
                  <p className="text-sm">
                    <span className="font-medium">{a.user_name || "Someone"}</span>{" "}
                    <span className="text-muted-foreground">{a.action_type}</span>{" "}
                    <span className="font-medium">{a.entity_name || a.entity_type}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(a.created_at), "dd MMM HH:mm")}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BevTeam;
