import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useBetaTrack } from "@/hooks/useBetaTrack";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  Settings, 
  MessageSquare, 
  Phone, 
  Mail, 
  Cake, 
  Send,
  ChefHat,
  Shield,
  Edit,
  X,
  ClipboardList,
  Activity,
  Building2,
  MoreVertical,
  Archive,
  Trash2,
  UserCheck,
  UserX,
  LogIn,
  MapPin,
  Plus,
} from "lucide-react";
import TasksTab from "@/components/team/TasksTab";
import ActivityFeed from "@/components/activity/ActivityFeed";
import ContributionStats from "@/components/activity/ContributionStats";
import OrgChartWidget from "@/components/dashboard/OrgChartWidget";
import ErrorBoundary from "@/components/ErrorBoundary";
import InviteConfirmation from "@/components/team/InviteConfirmation";
import { format } from "date-fns";

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  birthday: string | null;
  position: string;
  role: "head_chef" | "line_chef" | "owner";
  member_status: "onboarding" | "active" | "departed";
  membership_id: string;
  venue_id: string | null;
}

interface Invite {
  id: string;
  email: string;
  role: "head_chef" | "line_chef";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

interface Permission {
  module: string;
  can_view: boolean;
  can_edit: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
  sender_name?: string;
}

const MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "recipes", label: "Recipes" },
  { id: "ingredients", label: "Ingredients" },
  { id: "invoices", label: "Invoices" },
  { id: "inventory", label: "Inventory" },
  { id: "prep", label: "Prep Lists" },
  { id: "production", label: "Production" },
  { id: "allergens", label: "Allergens" },
  { id: "menu-engineering", label: "Menu Engineering" },
  { id: "roster", label: "Roster" },
  { id: "calendar", label: "Calendar" },
  { id: "equipment", label: "Equipment" },
  { id: "cheatsheets", label: "Cheatsheets" },
  { id: "food-safety", label: "Food Safety" },
  { id: "training", label: "Training" },
  { id: "team", label: "Team Management" },
];

const Team = () => {
  const { user, isHeadChef, profile } = useAuth();
  const { currentOrg, venues, refreshOrg } = useOrg();
  const betaTrack = useBetaTrack((currentOrg as any)?.app_variant || "chefos_au");
  useEffect(() => { betaTrack.pageView("team-sync"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<Permission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messagingMember, setMessagingMember] = useState<TeamMember | null>(null);
  
  // Activity filter state
  const [activityFilter, setActivityFilter] = useState<"all" | "my" | string>("all");
  const [kitchenSections, setKitchenSections] = useState<{ id: string; name: string; color: string | null }[]>([]);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"sous_chef" | "line_chef" | "kitchen_hand" | "head_chef">("line_chef");
  const [inviteVenueId, setInviteVenueId] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Invite confirmation dialog
  const [inviteConfirmOpen, setInviteConfirmOpen] = useState(false);
  const [inviteConfirmData, setInviteConfirmData] = useState<{ email: string; link: string; emailSent: boolean; role: string } | null>(null);

  // Edit member form
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<TeamMember | null>(null);

  // Venue management
  const [addVenueOpen, setAddVenueOpen] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenueAddress, setNewVenueAddress] = useState("");
  const [newVenuePostcode, setNewVenuePostcode] = useState("");

  useEffect(() => {
    if (currentOrg?.id) {
      fetchTeamMembers();
      fetchKitchenSections();
    }
    if (isHeadChef) {
      fetchInvites();
    }
  }, [isHeadChef, currentOrg?.id]);

  const fetchKitchenSections = async () => {
    const query = supabase
      .from("kitchen_sections")
      .select("id, name, color")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (currentOrg?.id) {
      query.eq("org_id", currentOrg.id);
    }

    const { data } = await query;
    setKitchenSections(data || []);
  };

  useEffect(() => {
    if (messagingMember && user) {
      fetchMessages(messagingMember.user_id);
      // Subscribe to new messages
      const channel = supabase
        .channel("direct_messages")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            if (newMsg.sender_id === messagingMember.user_id) {
              setMessages((prev) => [...prev, newMsg]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [messagingMember, user]);

  const fetchTeamMembers = async () => {
    if (!currentOrg?.id) return;

    // Fetch ALL org members (including departed) so we can show them
    const { data: memberships, error: memError } = await supabase
      .from("org_memberships")
      .select("id, user_id, role, is_active, member_status, venue_id")
      .eq("org_id", currentOrg.id);

    if (memError || !memberships?.length) {
      console.error("Error fetching memberships:", memError);
      setTeamMembers([]);
      return;
    }

    const userIds = memberships.map((m) => m.user_id);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return;
    }

    const members: TeamMember[] = (profiles || []).map((p) => {
      const mem = memberships.find((m) => m.user_id === p.user_id);
      return {
        ...p,
        role: (mem?.role as TeamMember["role"]) || "line_chef",
        member_status: (mem?.member_status as TeamMember["member_status"]) || "active",
        membership_id: mem?.id || "",
        venue_id: mem?.venue_id || null,
      };
    });

    // Sort: active first, onboarding, then departed
    const statusOrder = { active: 0, onboarding: 1, departed: 2 };
    members.sort((a, b) => (statusOrder[a.member_status] || 0) - (statusOrder[b.member_status] || 0));

    setTeamMembers(members);
  };

  const fetchInvites = async () => {
    const query = supabase
      .from("team_invites")
      .select("*")
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    if (currentOrg?.id) {
      query.eq("org_id", currentOrg.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching invites:", error);
      return;
    }

    setInvites(data as Invite[]);
  };

  const fetchMemberPermissions = async (userId: string) => {
    const { data, error } = await supabase
      .from("module_permissions")
      .select("module, can_view, can_edit")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching permissions:", error);
      return;
    }

    setMemberPermissions(data || []);
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);

    // Mark messages as read
    await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("sender_id", otherUserId)
      .eq("recipient_id", user.id)
      .is("read_at", null);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !user) return;
    if (!currentOrg?.id) {
      toast.error("No organisation found — please refresh");
      return;
    }

    const inviteToken = crypto.randomUUID();
    const trimmedEmail = inviteEmail.toLowerCase().trim();

    const { error } = await supabase.from("team_invites").insert({
      email: trimmedEmail,
      invited_by: user.id,
      role: inviteRole as any,
      org_id: currentOrg.id,
      venue_id: inviteVenueId || null,
      token: inviteToken,
    });

    if (error) {
      if (error.message?.includes("duplicate") || error.code === "23505") {
        toast.error("An invite has already been sent to this email");
      } else {
        toast.error("Failed to send invite: " + error.message);
        console.error(error);
      }
      return;
    }

    const inviteLink = `${window.location.origin}/join/${inviteToken}`;
    let emailSent = false;

    try {
      const { data } = await supabase.functions.invoke("send-invite-email", {
        body: {
          inviteId: inviteToken,
          email: trimmedEmail,
          inviterName: profile?.full_name || "Head Chef",
          orgName: currentOrg?.name || "Your Kitchen",
          role: inviteRole,
          portal: "chef",
          orgId: currentOrg?.id,
          token: inviteToken,
        },
      });
      emailSent = !!data?.email_sent;
    } catch (emailErr) {
      console.error("Invite email failed:", emailErr);
    }

    // Show confirmation dialog with share options
    setInviteConfirmData({
      email: trimmedEmail,
      link: inviteLink,
      emailSent,
      role: inviteRole,
    });
    setInviteConfirmOpen(true);

    setInviteEmail("");
    setInviteRole("line_chef");
    setInviteVenueId(null);
    setInviteDialogOpen(false);
    fetchInvites();
  };

  const handleCancelInvite = async (inviteId: string) => {
    const { error } = await supabase.from("team_invites").delete().eq("id", inviteId);

    if (error) {
      toast.error("Failed to cancel invite");
      return;
    }

    toast.success("Invite cancelled");
    fetchInvites();
  };

  const handleUpdatePermission = async (userId: string, module: string, field: "can_view" | "can_edit", value: boolean) => {
    const { error } = await supabase
      .from("module_permissions")
      .update({ [field]: value })
      .eq("user_id", userId)
      .eq("module", module);

    if (error) {
      toast.error("Failed to update permission");
      return;
    }

    setMemberPermissions((prev) =>
      prev.map((p) => (p.module === module ? { ...p, [field]: value } : p))
    );
    toast.success("Permission updated");
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !messagingMember || !user) return;

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      recipient_id: messagingMember.user_id,
      message: newMessage.trim(),
    });

    if (error) {
      toast.error("Failed to send message");
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender_id: user.id,
        recipient_id: messagingMember.user_id,
        message: newMessage.trim(),
        read_at: null,
        created_at: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
  };

  const handleUpdateMember = async () => {
    if (!editMember) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        phone: editPhone || null,
        birthday: editBirthday || null,
        position: editPosition || "Line Chef",
      })
      .eq("user_id", editMember.user_id);

    if (error) {
      toast.error("Failed to update member");
      return;
    }

    toast.success("Member updated");
    setEditMember(null);
    fetchTeamMembers();
  };



  const handleAddVenue = async () => {
    if (!newVenueName.trim() || !currentOrg?.id) return;
    const { error } = await supabase.from("org_venues").insert({
      org_id: currentOrg.id,
      name: newVenueName.trim(),
      address: newVenueAddress.trim() || null,
      postcode: newVenuePostcode.trim() || null,
    });
    if (error) {
      toast.error("Failed to add venue: " + error.message);
      return;
    }
    toast.success("Venue added");
    setNewVenueName("");
    setNewVenueAddress("");
    setNewVenuePostcode("");
    setAddVenueOpen(false);
    refreshOrg();
  };

  const handleToggleVenue = async (venueId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("org_venues")
      .update({ is_active: !isActive })
      .eq("id", venueId);
    if (error) {
      toast.error("Failed to update venue");
      return;
    }
    toast.success(isActive ? "Venue deactivated" : "Venue reactivated");
    refreshOrg();
  };

  const handleArchiveMember = async (member: TeamMember) => {
    if (!currentOrg?.id) return;
    const { error } = await supabase
      .from("org_memberships")
      .update({ member_status: "departed", is_active: false })
      .eq("id", member.membership_id);

    if (error) {
      toast.error("Failed to archive member");
      return;
    }
    toast.success(`${member.full_name} marked as departed`);
    fetchTeamMembers();
  };

  const handleReactivateMember = async (member: TeamMember) => {
    if (!currentOrg?.id) return;
    const { error } = await supabase
      .from("org_memberships")
      .update({ member_status: "active", is_active: true })
      .eq("id", member.membership_id);

    if (error) {
      toast.error("Failed to reactivate member");
      return;
    }
    toast.success(`${member.full_name} reactivated`);
    fetchTeamMembers();
  };

  const handleSetOnboarding = async (member: TeamMember) => {
    if (!currentOrg?.id) return;
    const { error } = await supabase
      .from("org_memberships")
      .update({ member_status: "onboarding" })
      .eq("id", member.membership_id);

    if (error) {
      toast.error("Failed to update status");
      return;
    }
    toast.success(`${member.full_name} set to onboarding`);
    fetchTeamMembers();
  };

  const handleDeleteMember = async (member: TeamMember) => {
    if (!currentOrg?.id) return;
    const { error } = await supabase
      .from("org_memberships")
      .delete()
      .eq("id", member.membership_id);

    if (error) {
      toast.error("Failed to remove member");
      return;
    }
    toast.success(`${member.full_name} removed from team`);
    setDeleteConfirmMember(null);
    fetchTeamMembers();
  };

  const getStatusBadge = (status: TeamMember["member_status"]) => {
    switch (status) {
      case "onboarding":
        return <Badge variant="outline" className="border-amber-500/50 text-amber-600 bg-amber-500/10"><LogIn className="w-3 h-3 mr-1" />Onboarding</Badge>;
      case "departed":
        return <Badge variant="outline" className="border-destructive/50 text-destructive bg-destructive/10"><UserX className="w-3 h-3 mr-1" />Departed</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10"><UserCheck className="w-3 h-3 mr-1" />Active</Badge>;
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}`, "_blank");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Team</h1>
            <p className="text-muted-foreground">Manage your kitchen team</p>
          </div>
          {isHeadChef && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="top-[30%] translate-y-0 sm:top-[50%] sm:-translate-y-1/2">
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="chef@kitchen.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="head_chef">Head Chef (Venue Head)</SelectItem>
                        <SelectItem value="sous_chef">Sous Chef</SelectItem>
                        <SelectItem value="line_chef">Line Chef</SelectItem>
                        <SelectItem value="kitchen_hand">Kitchen Hand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {venues.length > 1 && (
                    <div className="space-y-2">
                      <Label>Assign to Venue (optional)</Label>
                      <Select value={inviteVenueId || "none"} onValueChange={(v) => setInviteVenueId(v === "none" ? null : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a venue" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No specific venue</SelectItem>
                          {venues.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    You can configure their module access after they join.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendInvite}>Send Invite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            {isHeadChef && (
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Tasks
              </TabsTrigger>
            )}
            {isHeadChef && (
              <TabsTrigger value="invites" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Pending Invites
              </TabsTrigger>
            )}
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="org-chart" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Org Chart
            </TabsTrigger>
            {isHeadChef && (
              <TabsTrigger value="venues" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Venues
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => {
                const isDeparted = member.member_status === "departed";
                const isCurrentUser = member.user_id === user?.id;
                const canManage = isHeadChef && !isCurrentUser;

                return (
                <Card key={member.id} className={`relative ${isDeparted ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className={`h-12 w-12 ${isDeparted ? "grayscale" : ""}`}>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{member.full_name}</CardTitle>
                          <CardDescription>{member.position}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditMember(member);
                                setEditPhone(member.phone || "");
                                setEditBirthday(member.birthday || "");
                                setEditPosition(member.position);
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Details
                              </DropdownMenuItem>
                              {member.role === "line_chef" && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedMember(member);
                                  fetchMemberPermissions(member.user_id);
                                }}>
                                  <Settings className="w-4 h-4 mr-2" />
                                  Permissions
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {member.member_status === "active" && (
                                <DropdownMenuItem onClick={() => handleSetOnboarding(member)}>
                                  <LogIn className="w-4 h-4 mr-2" />
                                  Set as Onboarding
                                </DropdownMenuItem>
                              )}
                              {member.member_status === "onboarding" && (
                                <DropdownMenuItem onClick={() => handleReactivateMember(member)}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Mark Active
                                </DropdownMenuItem>
                              )}
                              {member.member_status !== "departed" ? (
                                <DropdownMenuItem onClick={() => handleArchiveMember(member)} className="text-amber-600">
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive (Departed)
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleReactivateMember(member)}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Reactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteConfirmMember(member)} 
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    {/* Status & Role Badges */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={member.role === "head_chef" || member.role === "owner" ? "default" : "secondary"} className="text-xs">
                        {member.role === "owner" ? (
                          <><ChefHat className="w-3 h-3 mr-1" />Owner</>
                        ) : member.role === "head_chef" ? (
                          <><ChefHat className="w-3 h-3 mr-1" />Head Chef</>
                        ) : (
                          <><Shield className="w-3 h-3 mr-1" />Line Chef</>
                        )}
                      </Badge>
                      {getStatusBadge(member.member_status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${member.phone}`} className="hover:text-primary">
                            {member.phone}
                          </a>
                        </div>
                      )}
                      {member.birthday && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Cake className="w-4 h-4" />
                          <span>{format(new Date(member.birthday), "MMMM d")}</span>
                        </div>
                      )}
                    </div>

                    {!isDeparted && (
                      <div className="flex gap-2 pt-2">
                        {member.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openWhatsApp(member.phone!)}
                            className="flex-1"
                          >
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMessagingMember(member)}
                          className="flex-1"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })}
            </div>
          </TabsContent>

          {isHeadChef && (
            <TabsContent value="tasks" className="space-y-4">
              <TasksTab />
            </TabsContent>
          )}

          {isHeadChef && (
            <TabsContent value="invites" className="space-y-4">
              {invites.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending invites</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {invites.map((invite) => (
                    <Card key={invite.id}>
                      <CardContent className="py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invite.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires {format(new Date(invite.expires_at), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(`${window.location.origin}/auth`);
                                toast.success("Signup link copied to clipboard!");
                              } catch {
                                toast.error("Failed to copy link");
                              }
                            }}
                          >
                            Copy Link
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelInvite(invite.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="messages" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Conversations</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    {teamMembers
                      .filter((m) => m.user_id !== user?.id)
                      .map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setMessagingMember(member)}
                          className={`w-full p-4 flex items-center gap-3 hover:bg-accent text-left border-b ${
                            messagingMember?.id === member.id ? "bg-accent" : ""
                          }`}
                        >
                          <Avatar>
                            <AvatarFallback>
                              {member.full_name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.full_name}</p>
                            <p className="text-sm text-muted-foreground">{member.position}</p>
                          </div>
                        </button>
                      ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                {messagingMember ? (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {messagingMember.full_name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{messagingMember.full_name}</CardTitle>
                            <CardDescription>{messagingMember.position}</CardDescription>
                          </div>
                        </div>
                        {messagingMember.phone && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openWhatsApp(messagingMember.phone!)}
                          >
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[300px] p-4">
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${
                                msg.sender_id === user?.id ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  msg.sender_id === user?.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p>{msg.message}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {format(new Date(msg.created_at), "h:mm a")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t flex gap-2">
                        <Textarea
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="min-h-[40px] resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button onClick={handleSendMessage}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4" />
                      <p>Select a team member to start messaging</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            {/* Contribution Stats at the top */}
            <ContributionStats 
              showLeaderboard={true}
              showSectionCoverage={true}
              showMyStats={true}
            />

            <Card>
              <CardHeader>
                <CardTitle>Team Activity</CardTitle>
                <CardDescription>Track contributions across the kitchen team</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant={activityFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActivityFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={activityFilter === "my" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActivityFilter("my")}
                  >
                    My Activity
                  </Button>
                  {kitchenSections.map((section) => (
                    <Button
                      key={section.id}
                      variant={activityFilter === section.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActivityFilter(section.id)}
                      className="flex items-center gap-1"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: section.color || "var(--muted)" }}
                      />
                      {section.name}
                    </Button>
                  ))}
                </div>

                <ActivityFeed
                  sectionId={activityFilter !== "all" && activityFilter !== "my" ? activityFilter : undefined}
                  userId={activityFilter === "my" ? user?.id : undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Venues Tab */}
          <TabsContent value="venues" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Venues</h3>
                <p className="text-sm text-muted-foreground">Manage your locations and assign team members</p>
              </div>
              <Dialog open={addVenueOpen} onOpenChange={setAddVenueOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    Add Venue
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Venue</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Venue Name</Label>
                      <Input
                        value={newVenueName}
                        onChange={(e) => setNewVenueName(e.target.value)}
                        placeholder="e.g. Main Kitchen, Bar Downstairs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Address (optional)</Label>
                      <Input
                        value={newVenueAddress}
                        onChange={(e) => setNewVenueAddress(e.target.value)}
                        placeholder="123 High Street"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postcode (optional)</Label>
                      <Input
                        value={newVenuePostcode}
                        onChange={(e) => setNewVenuePostcode(e.target.value)}
                        placeholder="SW1A 1AA"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddVenueOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddVenue} disabled={!newVenueName.trim()}>Add Venue</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => {
                const venueMembers = teamMembers.filter(m => m.venue_id === venue.id);
                const memberCount = venueMembers.length;

                return (
                  <Card key={venue.id} className={!venue.is_active ? "opacity-60" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <div>
                            <CardTitle className="text-base">{venue.name}</CardTitle>
                            {venue.address && (
                              <CardDescription className="text-xs">{venue.address}</CardDescription>
                            )}
                          </div>
                        </div>
                        <Badge variant={venue.is_active ? "default" : "secondary"}>
                          {venue.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{memberCount} {memberCount === 1 ? "member" : "members"}</span>
                        </div>
                        {venue.postcode && (
                          <Badge variant="outline" className="text-xs">{venue.postcode}</Badge>
                        )}
                      </div>
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleToggleVenue(venue.id, venue.is_active)}
                        >
                          {venue.is_active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {venues.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No venues yet. Add your first venue to get started.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Org Chart Tab */}
          <TabsContent value="org-chart" className="space-y-4">
            <ErrorBoundary fallbackMessage="Could not load org chart">
              <OrgChartWidget expanded />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                value={editPosition}
                onChange={(e) => setEditPosition(e.target.value)}
                placeholder="Line Chef"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label>Birthday</Label>
              <Input
                type="date"
                value={editBirthday}
                onChange={(e) => setEditBirthday(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMember}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Permissions for {selectedMember?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <span>Module</span>
                <span className="text-center">Can View</span>
                <span className="text-center">Can Edit</span>
              </div>
              {MODULES.map((module) => {
                const perm = memberPermissions.find((p) => p.module === module.id);
                return (
                  <div key={module.id} className="grid grid-cols-3 gap-4 items-center">
                    <span className="text-sm">{module.label}</span>
                    <div className="flex justify-center">
                      <Switch
                        checked={perm?.can_view ?? false}
                        onCheckedChange={(checked) =>
                          selectedMember &&
                          handleUpdatePermission(selectedMember.user_id, module.id, "can_view", checked)
                        }
                      />
                    </div>
                    <div className="flex justify-center">
                      <Switch
                        checked={perm?.can_edit ?? false}
                        onCheckedChange={(checked) =>
                          selectedMember &&
                          handleUpdatePermission(selectedMember.user_id, module.id, "can_edit", checked)
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedMember(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmMember} onOpenChange={(open) => !open && setDeleteConfirmMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteConfirmMember?.full_name}</strong> from your organisation. This action cannot be undone. Consider archiving instead if they may return.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmMember && handleDeleteMember(deleteConfirmMember)}
            >
              Remove Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {inviteConfirmData && (
        <InviteConfirmation
          open={inviteConfirmOpen}
          onClose={() => setInviteConfirmOpen(false)}
          email={inviteConfirmData.email}
          inviteLink={inviteConfirmData.link}
          emailSent={inviteConfirmData.emailSent}
          orgName={currentOrg?.name || "Your Kitchen"}
          role={inviteConfirmData.role}
        />
      )}
    </AppLayout>
  );
};

export default Team;
