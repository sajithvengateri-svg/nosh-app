import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2, Search, Users, MapPin, ChefHat, Crown,
  Shield, Eye, MoreHorizontal, TrendingUp, Store,
} from "lucide-react";
import { format } from "date-fns";

const AdminOrganizations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<any>(null);

  // Fetch all organizations
  const { data: orgs, isLoading } = useQuery({
    queryKey: ["admin-orgs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch all memberships
  const { data: allMemberships } = useQuery({
    queryKey: ["admin-all-memberships"],
    queryFn: async () => {
      const { data } = await supabase
        .from("org_memberships")
        .select("*");
      return data || [];
    },
  });

  // Fetch all venues
  const { data: allVenues } = useQuery({
    queryKey: ["admin-all-venues"],
    queryFn: async () => {
      const { data } = await supabase
        .from("org_venues")
        .select("*");
      return data || [];
    },
  });

  // Fetch profiles for name resolution
  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, position");
      return data || [];
    },
  });

  // Org detail data
  const { data: orgDetail } = useQuery({
    queryKey: ["admin-org-detail", selectedOrg?.id],
    enabled: !!selectedOrg,
    queryFn: async () => {
      const orgId = selectedOrg!.id;
      const [
        { data: members },
        { data: venues },
        { count: recipeCount },
        { count: ingredientCount },
        { count: prepCount },
      ] = await Promise.all([
        supabase.from("org_memberships").select("*").eq("org_id", orgId),
        supabase.from("org_venues").select("*").eq("org_id", orgId),
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("ingredients").select("*", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("prep_lists").select("*", { count: "exact", head: true }).eq("org_id", orgId),
      ]);
      return {
        members: members || [],
        venues: venues || [],
        recipeCount: recipeCount || 0,
        ingredientCount: ingredientCount || 0,
        prepCount: prepCount || 0,
      };
    },
  });

  const getProfileName = (userId: string) => {
    const profile = profiles?.find((p) => p.user_id === userId);
    return profile?.full_name || profile?.email || userId.slice(0, 8);
  };

  const getMemberCount = (orgId: string) =>
    allMemberships?.filter((m) => m.org_id === orgId && m.is_active).length || 0;

  const getVenueCount = (orgId: string) =>
    allVenues?.filter((v) => v.org_id === orgId && v.is_active).length || 0;

  const filteredOrgs = orgs?.filter(
    (org) =>
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "head_chef": return "bg-primary/10 text-primary border-primary/20";
      case "line_chef": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "owner": return "Owner";
      case "head_chef": return "Head Chef";
      case "line_chef": return "Chef";
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          Organizations
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage all organisations, venues, and memberships across the platform
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orgs?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Orgs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allVenues?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Total Venues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{allMemberships?.filter(m => m.is_active).length || 0}</p>
              <p className="text-xs text-muted-foreground">Active Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {allMemberships ? (allMemberships.filter(m => m.is_active).length / Math.max(orgs?.length || 1, 1)).toFixed(1) : "0"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Members/Org</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search organisations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orgs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organisations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Venues</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrgs?.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{org.name}</p>
                            <p className="text-xs text-muted-foreground">{org.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getProfileName(org.owner_id)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{org.subscription_tier}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">{getMemberCount(org.id)}/{org.max_members}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm">{getVenueCount(org.id)}/{org.max_venues}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(org.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrg(org)}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredOrgs || filteredOrgs.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No organisations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Org Detail Dialog */}
      <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              {selectedOrg?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedOrg && (
            <Tabs defaultValue="members" className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="members" className="flex-1 gap-1">
                  <Users className="w-4 h-4" /> Members
                </TabsTrigger>
                <TabsTrigger value="venues" className="flex-1 gap-1">
                  <MapPin className="w-4 h-4" /> Venues
                </TabsTrigger>
                <TabsTrigger value="usage" className="flex-1 gap-1">
                  <TrendingUp className="w-4 h-4" /> Usage
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-4">
                <div className="space-y-3">
                  {orgDetail?.members?.map((member: any) => (
                    <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                          {member.role === "owner" ? (
                            <Crown className="w-4 h-4 text-amber-500" />
                          ) : member.role === "head_chef" ? (
                            <ChefHat className="w-4 h-4 text-primary" />
                          ) : (
                            <Shield className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{getProfileName(member.user_id)}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {format(new Date(member.joined_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={roleColor(member.role)}>
                          {roleLabel(member.role)}
                        </Badge>
                        {!member.is_active && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!orgDetail?.members || orgDetail.members.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No members</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="venues" className="mt-4">
                <div className="space-y-3">
                  {orgDetail?.venues?.map((venue: any) => (
                    <div key={venue.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">{venue.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[venue.address, venue.postcode].filter(Boolean).join(", ") || "No address"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={venue.is_active ? "default" : "secondary"}>
                          {venue.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {venue.phone && (
                        <p className="text-sm text-muted-foreground mt-2">📞 {venue.phone}</p>
                      )}
                    </div>
                  ))}
                  {(!orgDetail?.venues || orgDetail.venues.length === 0) && (
                    <p className="text-center text-muted-foreground py-4">No venues</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="usage" className="mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold">{orgDetail?.recipeCount || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Recipes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold">{orgDetail?.ingredientCount || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Ingredients</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-3xl font-bold">{orgDetail?.prepCount || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">Prep Lists</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4 p-4 rounded-lg border">
                  <h4 className="font-medium mb-2">Organisation Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Tier</span>
                    <span className="capitalize">{selectedOrg.subscription_tier}</span>
                    <span className="text-muted-foreground">Max Members</span>
                    <span>{selectedOrg.max_members}</span>
                    <span className="text-muted-foreground">Max Venues</span>
                    <span>{selectedOrg.max_venues}</span>
                    <span className="text-muted-foreground">Created</span>
                    <span>{format(new Date(selectedOrg.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrganizations;
