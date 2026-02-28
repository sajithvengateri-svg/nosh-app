import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Rocket, Wrench, Plus, Calendar, FileText, Clock, Zap, CalendarClock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isPast } from "date-fns";

interface FeatureRelease {
  id: string;
  module_slug: string;
  module_name: string;
  description: string | null;
  status: string;
  release_type: string;
  target_release: string | null;
  release_notes: string | null;
  sort_order: number;
  released_at: string | null;
  scheduled_release_at: string | null;
  version_tag: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  development: "bg-muted text-muted-foreground",
  beta: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  released: "bg-green-500/20 text-green-700 dark:text-green-400",
};

const AdminUpdates = () => {
  const [releases, setReleases] = useState<FeatureRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newImprovement, setNewImprovement] = useState({
    module_slug: "",
    module_name: "",
    description: "",
    target_release: "",
  });

  const fetchReleases = async () => {
    const { data, error } = await supabase
      .from("feature_releases")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Error loading releases", description: error.message, variant: "destructive" });
    } else {
      setReleases((data || []) as FeatureRelease[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReleases(); }, []);

  const updateRelease = async (id: string, updates: Partial<FeatureRelease>) => {
    if (updates.status === "released") {
      updates.released_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("feature_releases")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated successfully" });
      fetchReleases();
    }
  };

  const releaseNow = async (id: string) => {
    await updateRelease(id, {
      status: "released",
      released_at: new Date().toISOString(),
      scheduled_release_at: null,
    });
  };

  const scheduleRelease = async (id: string, date: Date) => {
    await updateRelease(id, {
      scheduled_release_at: date.toISOString(),
    });
  };

  const addImprovement = async () => {
    if (!newImprovement.module_slug || !newImprovement.description) return;
    const { error } = await supabase.from("feature_releases").insert({
      module_slug: newImprovement.module_slug,
      module_name: newImprovement.module_name || newImprovement.module_slug,
      description: newImprovement.description,
      target_release: newImprovement.target_release || null,
      release_type: "improvement",
      sort_order: releases.length + 1,
    });

    if (error) {
      toast({ title: "Failed to add", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Improvement added" });
      setShowAddForm(false);
      setNewImprovement({ module_slug: "", module_name: "", description: "", target_release: "" });
      fetchReleases();
    }
  };

  const newModules = releases.filter(r => r.release_type === "new");
  const improvements = releases.filter(r => r.release_type === "improvement");

  const nextStatus = (current: string) => {
    if (current === "development") return "beta";
    if (current === "beta") return "released";
    return current;
  };

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feature Updates</h1>
        <p className="text-muted-foreground">Track new modules and improvements — schedule or release instantly</p>
      </div>

      <Tabs defaultValue="modules">
        <TabsList>
          <TabsTrigger value="modules" className="gap-2">
            <Rocket className="w-4 h-4" /> New Modules
          </TabsTrigger>
          <TabsTrigger value="improvements" className="gap-2">
            <Wrench className="w-4 h-4" /> Improvements
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarClock className="w-4 h-4" /> Release Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="modules">
          <div className="grid gap-4 md:grid-cols-2">
            {newModules.map((mod) => (
              <ReleaseCard
                key={mod.id}
                release={mod}
                onUpdate={updateRelease}
                onReleaseNow={releaseNow}
                onSchedule={scheduleRelease}
                nextStatus={nextStatus}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="improvements">
          <div className="space-y-4">
            <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Improvement
            </Button>

            {showAddForm && (
              <Card>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Module slug (e.g. recipes)" value={newImprovement.module_slug} onChange={(e) => setNewImprovement(p => ({ ...p, module_slug: e.target.value }))} />
                    <Input placeholder="Display name (e.g. Recipes)" value={newImprovement.module_name} onChange={(e) => setNewImprovement(p => ({ ...p, module_name: e.target.value }))} />
                  </div>
                  <Input placeholder="Description" value={newImprovement.description} onChange={(e) => setNewImprovement(p => ({ ...p, description: e.target.value }))} />
                  <Input placeholder="Target release (e.g. April 2026)" value={newImprovement.target_release} onChange={(e) => setNewImprovement(p => ({ ...p, target_release: e.target.value }))} />
                  <Button size="sm" onClick={addImprovement}>Save</Button>
                </CardContent>
              </Card>
            )}

            {improvements.length === 0 && !showAddForm && (
              <p className="text-muted-foreground text-sm">No improvements tracked yet.</p>
            )}

            {improvements.map((imp) => (
              <ReleaseCard
                key={imp.id}
                release={imp}
                onUpdate={updateRelease}
                onReleaseNow={releaseNow}
                onSchedule={scheduleRelease}
                nextStatus={nextStatus}
                compact
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <ReleaseCalendarView releases={releases} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

/* ── Release Card ── */
interface ReleaseCardProps {
  release: FeatureRelease;
  onUpdate: (id: string, updates: Partial<FeatureRelease>) => Promise<void>;
  onReleaseNow: (id: string) => Promise<void>;
  onSchedule: (id: string, date: Date) => Promise<void>;
  nextStatus: (s: string) => string;
  compact?: boolean;
}

const ReleaseCard = ({ release, onUpdate, onReleaseNow, onSchedule, nextStatus, compact }: ReleaseCardProps) => {
  const [schedDate, setSchedDate] = useState<Date | undefined>(
    release.scheduled_release_at ? new Date(release.scheduled_release_at) : undefined
  );
  const [schedOpen, setSchedOpen] = useState(false);

  const isScheduled = !!release.scheduled_release_at && release.status !== "released";
  const scheduledDate = release.scheduled_release_at ? new Date(release.scheduled_release_at) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={compact ? "text-base" : "text-lg"}>{release.module_name}</CardTitle>
          <div className="flex items-center gap-2">
            {isScheduled && (
              <Badge variant="outline" className="text-xs gap-1">
                <Clock className="w-3 h-3" />
                {scheduledDate && isPast(scheduledDate)
                  ? "Processing..."
                  : `In ${formatDistanceToNow(scheduledDate!)}`}
              </Badge>
            )}
            <Badge className={statusColors[release.status]}>{release.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{release.description}</p>

        {!compact && (
          <>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="e.g. March 2026"
                value={release.target_release || ""}
                onChange={(e) => onUpdate(release.id, { target_release: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Version tag (e.g. v2.4)"
                value={release.version_tag || ""}
                onChange={(e) => onUpdate(release.id, { version_tag: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-muted-foreground mt-2" />
              <Textarea
                placeholder="Release notes..."
                value={release.release_notes || ""}
                onChange={(e) => onUpdate(release.id, { release_notes: e.target.value })}
                className="text-sm min-h-[60px]"
              />
            </div>
          </>
        )}

        {release.status !== "released" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={() => onReleaseNow(release.id)} className="gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Release Now
            </Button>

            <Popover open={schedOpen} onOpenChange={setSchedOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  {isScheduled ? "Reschedule" : "Schedule"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarPicker
                  mode="single"
                  selected={schedDate}
                  onSelect={(d) => {
                    if (d) {
                      setSchedDate(d);
                      onSchedule(release.id, d);
                      setSchedOpen(false);
                    }
                  }}
                  disabled={(d) => d < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {!isScheduled && (
              <Button size="sm" variant="ghost" onClick={() => onUpdate(release.id, { status: nextStatus(release.status) })}>
                → {nextStatus(release.status)}
              </Button>
            )}
          </div>
        )}

        {release.released_at && (
          <p className="text-xs text-muted-foreground">
            Released: {format(new Date(release.released_at), "MMM d, yyyy")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/* ── Release Calendar / Timeline ── */
const ReleaseCalendarView = ({ releases }: { releases: FeatureRelease[] }) => {
  const scheduled = releases
    .filter(r => r.scheduled_release_at && r.status !== "released")
    .sort((a, b) => new Date(a.scheduled_release_at!).getTime() - new Date(b.scheduled_release_at!).getTime());

  const recent = releases
    .filter(r => r.status === "released" && r.released_at)
    .sort((a, b) => new Date(b.released_at!).getTime() - new Date(a.released_at!).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" /> Upcoming Releases
        </h3>
        {scheduled.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scheduled releases.</p>
        ) : (
          <div className="space-y-2">
            {scheduled.map(r => (
              <div key={r.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground text-sm">{r.module_name}</span>
                  {r.version_tag && <span className="text-xs text-muted-foreground ml-2">{r.version_tag}</span>}
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {format(new Date(r.scheduled_release_at!), "MMM d, yyyy")}
                </Badge>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(r.scheduled_release_at!), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Rocket className="w-4 h-4" /> Recent Releases
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No releases yet.</p>
        ) : (
          <div className="space-y-2">
            {recent.map(r => (
              <div key={r.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground text-sm">{r.module_name}</span>
                  {r.version_tag && <span className="text-xs text-muted-foreground ml-2">{r.version_tag}</span>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(r.released_at!), "MMM d, yyyy")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUpdates;
