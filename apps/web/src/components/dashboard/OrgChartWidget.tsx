import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Crown,
  ChefHat,
  Shield,
  Building2,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  Users,
  UserCog,
} from "lucide-react";
import { Link } from "react-router-dom";

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: string;
  venue_id: string | null;
  is_active: boolean;
  profile?: {
    user_id: string;
    full_name: string;
    position: string;
    avatar_url: string | null;
    email?: string;
    phone?: string | null;
  };
}

const ROLE_CONFIG: Record<string, { icon: typeof Crown; label: string; priority: number; color: string }> = {
  owner: { icon: Crown, label: "Owner", priority: 0, color: "text-amber-500" },
  head_chef: { icon: ChefHat, label: "Head Chef", priority: 1, color: "text-primary" },
  foh_admin: { icon: UserCog, label: "FOH Admin", priority: 2, color: "text-blue-500" },
  shift_manager: { icon: UserCog, label: "Shift Manager", priority: 3, color: "text-indigo-500" },
  sous_chef: { icon: ChefHat, label: "Sous Chef", priority: 4, color: "text-emerald-600" },
  line_chef: { icon: Shield, label: "Chef", priority: 5, color: "text-muted-foreground" },
  kitchen_hand: { icon: Shield, label: "Kitchen Hand", priority: 6, color: "text-muted-foreground" },
  server: { icon: Users, label: "Server", priority: 7, color: "text-muted-foreground" },
  host: { icon: Users, label: "Host", priority: 8, color: "text-muted-foreground" },
};

const getRoleConfig = (role: string) =>
  ROLE_CONFIG[role] || { icon: Shield, label: role, priority: 9, color: "text-muted-foreground" };

const getInitials = (name: string) =>
  name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

const MemberNode = ({ member, isLast }: { member: MemberWithProfile; isLast: boolean }) => {
  const config = getRoleConfig(member.role);
  const Icon = config.icon;
  const name = member.profile?.full_name || config.label;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="group flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors w-full text-left relative">
          {/* Tree connector */}
          <div className="absolute left-3 -top-1.5 w-px h-3 bg-border" />
          {!isLast && <div className="absolute left-3 top-[calc(50%+2px)] w-px h-[calc(50%+6px)] bg-border" />}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-px bg-border" />

          <div className="ml-5">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block">{name}</span>
            {member.profile?.position && (
              <span className="text-[10px] text-muted-foreground truncate block">{member.profile.position}</span>
            )}
          </div>
          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${config.color}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="right" align="start">
        <div className="space-y-2">
          <div className="font-medium text-sm">{name}</div>
          <Badge variant="outline" className="text-[10px]">
            <Icon className={`w-3 h-3 mr-1 ${config.color}`} />
            {config.label}
          </Badge>
          {member.profile?.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="w-3 h-3" />
              <span className="truncate">{member.profile.email}</span>
            </div>
          )}
          {member.profile?.phone && (
            <a href={`tel:${member.profile.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
              <Phone className="w-3 h-3" />
              {member.profile.phone}
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const VenueBranch = ({
  venueName,
  members,
  isLast,
}: {
  venueName: string;
  members: MemberWithProfile[];
  isLast: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const leaders = members.filter(m => ["head_chef", "foh_admin", "shift_manager"].includes(m.role));
  const staff = members.filter(m => !["head_chef", "foh_admin", "shift_manager"].includes(m.role));

  // Sort within each group by priority
  const sorted = [
    ...leaders.sort((a, b) => getRoleConfig(a.role).priority - getRoleConfig(b.role).priority),
    ...staff.sort((a, b) => getRoleConfig(a.role).priority - getRoleConfig(b.role).priority),
  ];

  return (
    <div className="relative">
      {/* Connector from parent */}
      <div className="absolute left-3 -top-1.5 w-px h-3 bg-border" />
      {!isLast && <div className="absolute left-3 top-[calc(50%)] w-px h-[calc(50%+6px)] bg-border" />}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-px bg-border" />

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 py-1.5 px-2 -mx-2 ml-3 rounded-lg hover:bg-muted/50 transition-colors w-[calc(100%-12px)]">
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          <Building2 className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-semibold">{venueName}</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">{members.length}</Badge>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-10 mt-1 space-y-0.5 relative">
            {sorted.map((m, i) => (
              <MemberNode key={m.id} member={m} isLast={i === sorted.length - 1} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

interface OrgChartWidgetProps {
  expanded?: boolean;
}

const OrgChartWidget = ({ expanded = false }: OrgChartWidgetProps) => {
  const { currentOrg, venues, isOwner, isOrgHeadChef } = useOrg();

  const { data: members } = useQuery({
    queryKey: ["org-chart-members", currentOrg?.id],
    enabled: !!currentOrg?.id,
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("org_memberships")
        .select("*")
        .eq("org_id", currentOrg!.id)
        .eq("is_active", true);

      if (!memberships?.length) return [];

      const userIds = memberships.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, position, avatar_url, email, phone")
        .in("user_id", userIds);

      return memberships.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id),
      })) as MemberWithProfile[];
    },
  });

  if (!members?.length) return null;

  const owners = members.filter(m => m.role === "owner");
  const nonOwners = members.filter(m => m.role !== "owner");
  const isSingleVenue = venues.length <= 1;

  // Group non-owners by venue
  const venueGroups: { venueId: string | null; venueName: string; members: MemberWithProfile[] }[] = [];

  if (isSingleVenue) {
    // For single-venue orgs, show a flat list (no venue grouping)
    venueGroups.push({
      venueId: null,
      venueName: "",
      members: nonOwners.sort((a, b) => getRoleConfig(a.role).priority - getRoleConfig(b.role).priority),
    });
  } else {
    // Multi-venue: group by venue
    for (const venue of venues) {
      const venueMembers = nonOwners.filter(m => m.venue_id === venue.id);
      if (venueMembers.length > 0) {
        venueGroups.push({ venueId: venue.id, venueName: venue.name, members: venueMembers });
      }
    }
    // Unassigned members
    const unassigned = nonOwners.filter(m => !m.venue_id || !venues.some(v => v.id === m.venue_id));
    if (unassigned.length > 0) {
      venueGroups.push({ venueId: null, venueName: "Unassigned", members: unassigned });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Organisation Tree
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {members.length} {members.length === 1 ? "member" : "members"}
            </Badge>
            {(isOwner || isOrgHeadChef) && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/team">Manage</Link>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Owner node(s) at root */}
          {owners.map(owner => (
            <div key={owner.id} className="mb-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors w-full text-left">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-amber-500/20 text-amber-700 text-xs font-semibold">
                        {getInitials(owner.profile?.full_name || "Owner")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm block truncate">{owner.profile?.full_name || "Owner"}</span>
                      <span className="text-[10px] text-muted-foreground">Org Head</span>
                    </div>
                    <Crown className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-3" side="right" align="start">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">{owner.profile?.full_name || "Owner"}</div>
                    <Badge variant="outline" className="text-[10px]">
                      <Crown className="w-3 h-3 mr-1 text-amber-500" />
                      Owner
                    </Badge>
                    {owner.profile?.email && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{owner.profile.email}</span>
                      </div>
                    )}
                    {owner.profile?.phone && (
                      <a href={`tel:${owner.profile.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary">
                        <Phone className="w-3 h-3" />
                        {owner.profile.phone}
                      </a>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          ))}

          {/* Tree body */}
          {nonOwners.length > 0 && (
            <div className="relative ml-4 pl-2 border-l border-border">
              {isSingleVenue ? (
                /* Single venue: flat member list */
                <div className="space-y-0.5">
                  {venueGroups[0]?.members.map((m, i) => (
                    <MemberNode key={m.id} member={m} isLast={i === (venueGroups[0]?.members.length ?? 0) - 1} />
                  ))}
                </div>
              ) : (
                /* Multi-venue: venue branches */
                <div className="space-y-2">
                  {venueGroups.map((group, gi) => (
                    <VenueBranch
                      key={group.venueId || "unassigned"}
                      venueName={group.venueName}
                      members={group.members}
                      isLast={gi === venueGroups.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrgChartWidget;
