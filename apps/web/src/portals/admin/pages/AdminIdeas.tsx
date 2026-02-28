import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Lightbulb, Award, Search, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = ["submitted", "reviewed", "planned", "shipped", "declined"];

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  reviewed: "bg-blue-100 text-blue-800 border-blue-200",
  planned: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-muted text-muted-foreground",
};

const BADGE_NAMES = ["Innovator", "Game Changer", "Problem Solver", "Efficiency Expert", "UX Hero"];

export default function AdminIdeas() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ["admin-chef-ideas", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("chef_ideas")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_note }: { id: string; status?: string; admin_note?: string }) => {
      const updates: Record<string, unknown> = {};
      if (status) updates.status = status;
      if (admin_note !== undefined) updates.admin_note = admin_note;
      const { error } = await supabase.from("chef_ideas").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chef-ideas"] });
      toast({ title: "Idea updated" });
    },
  });

  const awardBadgeMutation = useMutation({
    mutationFn: async ({ idea }: { idea: any; badgeName: string }) => {
      // Award badge
      const { error: bErr } = await supabase.from("chef_idea_badges").insert({
        org_id: idea.org_id,
        user_id: idea.submitted_by,
        idea_id: idea.id,
        badge_name: "Innovator",
      });
      if (bErr) throw bErr;
      // Mark idea
      const { error } = await supabase.from("chef_ideas").update({ badge_awarded: true }).eq("id", idea.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chef-ideas"] });
      toast({ title: "Badge awarded! 🏆" });
    },
  });

  const filtered = ideas.filter(
    (i) =>
      i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.submitted_by_name?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: ideas.length,
    submitted: ideas.filter((i) => i.status === "submitted").length,
    planned: ideas.filter((i) => i.status === "planned").length,
    shipped: ideas.filter((i) => i.status === "shipped").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" /> Chef Ideas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage feedback from chefs across all organizations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "New", value: stats.submitted },
          { label: "Planned", value: stats.planned },
          { label: "Shipped", value: stats.shipped },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or chef name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ideas List */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No ideas found</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((idea) => {
            const isExpanded = expandedId === idea.id;
            return (
              <Card key={idea.id} className="overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => {
                    setExpandedId(isExpanded ? null : idea.id);
                    setAdminNote(idea.admin_note ?? "");
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{idea.title}</span>
                      {idea.badge_awarded && <Award className="w-4 h-4 text-yellow-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{idea.submitted_by_name ?? "Unknown"}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground capitalize">{idea.category}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[idea.status ?? "submitted"]}>
                    {idea.status}
                  </Badge>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>

                {isExpanded && (
                  <CardContent className="border-t pt-4 space-y-4">
                    {idea.description && (
                      <p className="text-sm text-foreground">{idea.description}</p>
                    )}

                    {/* Status update */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Set status:</span>
                      {STATUS_OPTIONS.map((s) => (
                        <Button
                          key={s}
                          variant={idea.status === s ? "default" : "outline"}
                          size="sm"
                          className="capitalize text-xs h-7"
                          onClick={() => updateMutation.mutate({ id: idea.id, status: s })}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>

                    {/* Admin note */}
                    <div className="space-y-1.5">
                      <span className="text-xs text-muted-foreground">Admin note</span>
                      <div className="flex gap-2">
                        <Textarea
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          rows={2}
                          className="text-sm"
                          placeholder="Internal note..."
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: idea.id, admin_note: adminNote })}
                        >
                          Save
                        </Button>
                      </div>
                    </div>

                    {/* Award badge */}
                    {!idea.badge_awarded && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => awardBadgeMutation.mutate({ idea, badgeName: "Innovator" })}
                      >
                        <Award className="w-4 h-4" /> Award Badge
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
