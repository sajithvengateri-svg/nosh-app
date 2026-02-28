import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Lightbulb, Award, Trophy, Medal, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  { value: "feature", label: "New Feature" },
  { value: "workflow", label: "Workflow" },
  { value: "ux", label: "UX / Design" },
  { value: "integration", label: "Integration" },
  { value: "other", label: "Other" },
];

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  reviewed: "bg-blue-100 text-blue-800 border-blue-200",
  planned: "bg-purple-100 text-purple-800 border-purple-200",
  shipped: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-muted text-muted-foreground",
};

export default function Feedback() {
  const { user, profile } = useAuth();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("feature");

  // Fetch my ideas
  const { data: myIdeas = [] } = useQuery({
    queryKey: ["chef-ideas", "mine", orgId],
    enabled: !!orgId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chef_ideas")
        .select("*")
        .eq("org_id", orgId!)
        .eq("submitted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch leaderboard: top 5 by ideas count + badge count
  const { data: leaderboard = [] } = useQuery({
    queryKey: ["chef-ideas", "leaderboard", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: ideas, error } = await supabase
        .from("chef_ideas")
        .select("submitted_by, submitted_by_name")
        .eq("org_id", orgId!);
      if (error) throw error;

      const { data: badges, error: bErr } = await supabase
        .from("chef_idea_badges")
        .select("user_id")
        .eq("org_id", orgId!);
      if (bErr) throw bErr;

      // Aggregate
      const map = new Map<string, { name: string; ideas: number; badges: number }>();
      for (const idea of ideas ?? []) {
        const entry = map.get(idea.submitted_by) ?? {
          name: idea.submitted_by_name ?? "Chef",
          ideas: 0,
          badges: 0,
        };
        entry.ideas++;
        map.set(idea.submitted_by, entry);
      }
      for (const b of badges ?? []) {
        const entry = map.get(b.user_id);
        if (entry) entry.badges++;
      }

      return Array.from(map.entries())
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.ideas - a.ideas || b.badges - a.badges)
        .slice(0, 5);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chef_ideas").insert({
        org_id: orgId!,
        submitted_by: user!.id,
        submitted_by_name: profile?.full_name ?? user!.email?.split("@")[0] ?? "Chef",
        title,
        description,
        category,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Idea submitted! 🎉", description: "Thanks for helping shape ChefOS." });
      setTitle("");
      setDescription("");
      setCategory("feature");
      queryClient.invalidateQueries({ queryKey: ["chef-ideas"] });
    },
    onError: () => toast({ title: "Couldn't submit", description: "Please try again.", variant: "destructive" }),
  });

  const rankIcon = (i: number) => {
    if (i === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (i === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (i === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="w-5 text-center text-sm text-muted-foreground">{i + 1}</span>;
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* Submit */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">Submit an Idea</CardTitle>
          </div>
          <CardDescription>Your ideas shape ChefOS. Tell us what would make your day easier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="idea-title">Title</Label>
            <Input
              id="idea-title"
              placeholder="e.g. Auto-generate prep list from tomorrow's bookings"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="idea-desc">Description (optional)</Label>
            <Textarea
              id="idea-desc"
              placeholder="Tell us more..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!title.trim() || submitMutation.isPending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-1" /> Submit Idea
          </Button>
        </CardContent>
      </Card>

      {/* My Ideas */}
      {myIdeas.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">My Ideas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myIdeas.map((idea) => (
              <div key={idea.id} className="flex items-start justify-between gap-3 border-b last:border-0 pb-3 last:pb-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{idea.title}</span>
                    {idea.badge_awarded && <Award className="w-4 h-4 text-yellow-500 shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{idea.category}</span>
                </div>
                <Badge variant="outline" className={STATUS_STYLES[idea.status ?? "submitted"]}>
                  {idea.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ideas Leaderboard</CardTitle>
            <CardDescription>Top contributors shaping the future of ChefOS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                  i === 0 ? "bg-yellow-50 dark:bg-yellow-950/20" : ""
                }`}
              >
                {rankIcon(i)}
                <span className="font-medium text-sm flex-1 truncate">{entry.name}</span>
                <span className="text-xs text-muted-foreground">{entry.ideas} ideas</span>
                {entry.badges > 0 && (
                  <span className="flex items-center gap-1 text-xs text-yellow-600">
                    <Award className="w-3.5 h-3.5" /> {entry.badges}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
