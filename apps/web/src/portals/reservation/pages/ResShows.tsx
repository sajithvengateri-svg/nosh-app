import { useState } from "react";
import {
  format,
  parseISO,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import {
  Ticket,
  Plus,
  Calendar,
  RefreshCw,
  Clock,
  MapPin,
  Users,
  Check,
  X,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Globe,
  Database,
  Wifi,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { usePreTheatre } from "../hooks/usePreTheatre";
import { useShowSync, ShowDataSource } from "../hooks/useShowSync";
import type { ResShow } from "../types";

function ShowCard({
  show,
  isSuggestion,
  onConfirm,
  onDismiss,
}: {
  show: ResShow;
  isSuggestion?: boolean;
  onConfirm?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <Card className={cn(isSuggestion && "border-amber-200 bg-amber-50/30")}>
      <CardContent className="py-3 px-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{show.title}</h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  isSuggestion
                    ? "border-amber-300 text-amber-700"
                    : "border-teal-300 text-teal-700"
                )}
              >
                {isSuggestion
                  ? "Suggestion"
                  : `Session ${show.session_number}`}
              </Badge>
              {show.genre && (
                <Badge variant="secondary" className="text-[10px]">
                  {show.genre}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {show.venue_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {show.venue_name}
                </span>
              )}
              {show.doors_time && (
                <span>Doors {show.doors_time.slice(0, 5)}</span>
              )}
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Clock className="w-3 h-3" />
                Curtain {show.curtain_time.slice(0, 5)}
              </span>
              {show.end_time && (
                <span>Ends {show.end_time.slice(0, 5)}</span>
              )}
              {show.expected_attendance && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {show.expected_attendance} expected
                </span>
              )}
            </div>
          </div>
          {isSuggestion && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={onConfirm}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={onDismiss}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const ResShows = () => {
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const [newShow, setNewShow] = useState({
    title: "",
    venue_name: "",
    show_date: selectedDate,
    doors_time: "",
    curtain_time: "19:30",
    end_time: "",
    genre: "",
    expected_attendance: "",
  });

  const [sourceConfig, setSourceConfig] = useState({
    source: "manual" as ShowDataSource,
    website_url: "https://brisbanepowerhouse.org/whats-on/",
    airtable_base_id: "",
    airtable_table_name: "",
    airtable_api_key: "",
    api_url: "",
    api_auth_header: "",
  });

  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const { shows, confirmedShows, suggestedShows, showsLoading } =
    usePreTheatre(selectedDate);
  const {
    isSyncing,
    syncShows,
    confirmShow,
    dismissShow,
    error: syncError,
  } = useShowSync();

  const handleAddShow = async () => {
    if (!orgId || !newShow.title || !newShow.curtain_time) return;

    await supabase.from("res_shows").insert({
      org_id: orgId,
      ...newShow,
      expected_attendance: newShow.expected_attendance
        ? parseInt(newShow.expected_attendance)
        : null,
      source: "manual",
      is_suggestion: false,
      is_active: true,
      session_number: confirmedShows.length + 1,
    });

    queryClient.invalidateQueries({ queryKey: ["res_shows"] });

    setNewShow({
      title: "",
      venue_name: "",
      show_date: selectedDate,
      doors_time: "",
      curtain_time: "19:30",
      end_time: "",
      genre: "",
      expected_attendance: "",
    });
    setShowAddDialog(false);
  };

  const weekStart = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: endOfWeek(weekStart, { weekStartsOn: 1 }),
  });

  const getTimelinePosition = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 17 * 60; // 17:00
    const endMinutes = 23 * 60; // 23:00
    const range = endMinutes - startMinutes;
    return Math.max(
      0,
      Math.min(100, ((totalMinutes - startMinutes) / range) * 100)
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5" /> Shows &amp; Sessions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage show schedules for pre-theatre dining
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigDialog(true)}
          >
            <Globe className="w-4 h-4 mr-1.5" /> Data Source
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncShows(sourceConfig)}
            disabled={isSyncing || sourceConfig.source === "manual"}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-1.5", isSyncing && "animate-spin")}
            />{" "}
            Sync
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setNewShow((prev) => ({ ...prev, show_date: selectedDate }));
              setShowAddDialog(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Show
          </Button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            setSelectedDate(
              format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd")
            )
          }
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-40 h-8 text-sm"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() =>
            setSelectedDate(
              format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd")
            )
          }
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
        >
          Today
        </Button>
        <span className="text-sm font-medium ml-2">
          {format(parseISO(selectedDate), "EEEE, d MMMM yyyy")}
        </span>
      </div>

      {/* Session Timeline */}
      {shows.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Session Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
              {/* Show blocks positioned by curtain time */}
              {shows.map((show) => {
                const leftPercent = show.curtain_time
                  ? getTimelinePosition(show.curtain_time)
                  : 0;
                return (
                  <div
                    key={show.id}
                    className={cn(
                      "absolute top-1 bottom-1 rounded px-2 flex items-center text-[10px] font-medium text-white truncate",
                      show.is_suggestion ? "bg-amber-500" : "bg-teal-600"
                    )}
                    style={{ left: `${leftPercent}%`, width: "120px" }}
                  >
                    <Ticket className="w-3 h-3 mr-1 flex-shrink-0" />
                    {show.curtain_time?.slice(0, 5)} — {show.title}
                  </div>
                );
              })}
              {/* Hour markers */}
              {[17, 18, 19, 20, 21, 22, 23].map((h) => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 border-l border-border/50"
                  style={{ left: `${((h - 17) / 6) * 100}%` }}
                >
                  <span className="text-[8px] text-muted-foreground ml-0.5">
                    {h}:00
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show Cards */}
      {showsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : shows.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No shows scheduled for this date. Add one manually or sync from a
            data source.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* Suggested shows first */}
          {suggestedShows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                Suggestions (auto-fetched)
              </p>
              {suggestedShows.map((show) => (
                <ShowCard
                  key={show.id}
                  show={show}
                  isSuggestion
                  onConfirm={() => confirmShow(show.id)}
                  onDismiss={() => dismissShow(show.id)}
                />
              ))}
            </div>
          )}
          {confirmedShows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
                Confirmed Shows
              </p>
              {confirmedShows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weekly Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isSelected = dateStr === selectedDate;
              const isToday =
                dateStr === format(new Date(), "yyyy-MM-dd");
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={cn(
                    "rounded-md border p-2 text-center transition-colors hover:bg-muted/50",
                    isSelected && "border-primary bg-primary/5",
                    isToday && !isSelected && "border-teal-300"
                  )}
                >
                  <p className="text-[9px] text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p className="text-sm font-medium">{format(day, "d")}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Show Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Show</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input
                value={newShow.title}
                onChange={(e) =>
                  setNewShow((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="e.g. Comedy Gala"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={newShow.show_date}
                  onChange={(e) =>
                    setNewShow((p) => ({ ...p, show_date: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Venue</Label>
                <Input
                  value={newShow.venue_name}
                  onChange={(e) =>
                    setNewShow((p) => ({ ...p, venue_name: e.target.value }))
                  }
                  placeholder="e.g. Powerhouse Theatre"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Doors</Label>
                <Input
                  type="time"
                  value={newShow.doors_time}
                  onChange={(e) =>
                    setNewShow((p) => ({ ...p, doors_time: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Curtain *</Label>
                <Input
                  type="time"
                  value={newShow.curtain_time}
                  onChange={(e) =>
                    setNewShow((p) => ({ ...p, curtain_time: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input
                  type="time"
                  value={newShow.end_time}
                  onChange={(e) =>
                    setNewShow((p) => ({ ...p, end_time: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Genre</Label>
                <Input
                  value={newShow.genre}
                  onChange={(e) =>
                    setNewShow((p) => ({ ...p, genre: e.target.value }))
                  }
                  placeholder="comedy, theatre, music..."
                />
              </div>
              <div>
                <Label className="text-xs">Expected Attendance</Label>
                <Input
                  type="number"
                  value={newShow.expected_attendance}
                  onChange={(e) =>
                    setNewShow((p) => ({
                      ...p,
                      expected_attendance: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleAddShow}
              disabled={!newShow.title || !newShow.curtain_time}
            >
              Add Show
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Data Source Config Dialog */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Show Data Source</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Source</Label>
              <Select
                value={sourceConfig.source}
                onValueChange={(v) =>
                  setSourceConfig((p) => ({
                    ...p,
                    source: v as ShowDataSource,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="website">Website Scrape</SelectItem>
                  <SelectItem value="airtable">Airtable</SelectItem>
                  <SelectItem value="api">Custom API</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sourceConfig.source === "website" && (
              <div>
                <Label className="text-xs">Website URL</Label>
                <Input
                  value={sourceConfig.website_url}
                  onChange={(e) =>
                    setSourceConfig((p) => ({
                      ...p,
                      website_url: e.target.value,
                    }))
                  }
                  placeholder="https://brisbanepowerhouse.org/whats-on/"
                />
              </div>
            )}
            {sourceConfig.source === "airtable" && (
              <>
                <div>
                  <Label className="text-xs">Base ID</Label>
                  <Input
                    value={sourceConfig.airtable_base_id}
                    onChange={(e) =>
                      setSourceConfig((p) => ({
                        ...p,
                        airtable_base_id: e.target.value,
                      }))
                    }
                    placeholder="appXXXXXXX"
                  />
                </div>
                <div>
                  <Label className="text-xs">Table Name</Label>
                  <Input
                    value={sourceConfig.airtable_table_name}
                    onChange={(e) =>
                      setSourceConfig((p) => ({
                        ...p,
                        airtable_table_name: e.target.value,
                      }))
                    }
                    placeholder="Shows"
                  />
                </div>
                <div>
                  <Label className="text-xs">API Key</Label>
                  <Input
                    type="password"
                    value={sourceConfig.airtable_api_key}
                    onChange={(e) =>
                      setSourceConfig((p) => ({
                        ...p,
                        airtable_api_key: e.target.value,
                      }))
                    }
                    placeholder="pat..."
                  />
                </div>
              </>
            )}
            {sourceConfig.source === "api" && (
              <>
                <div>
                  <Label className="text-xs">Endpoint URL</Label>
                  <Input
                    value={sourceConfig.api_url}
                    onChange={(e) =>
                      setSourceConfig((p) => ({
                        ...p,
                        api_url: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Auth Header</Label>
                  <Input
                    value={sourceConfig.api_auth_header}
                    onChange={(e) =>
                      setSourceConfig((p) => ({
                        ...p,
                        api_auth_header: e.target.value,
                      }))
                    }
                    placeholder="Bearer ..."
                  />
                </div>
              </>
            )}
            {syncError && (
              <p className="text-xs text-red-500">{syncError}</p>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => syncShows(sourceConfig)}
                disabled={isSyncing || sourceConfig.source === "manual"}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                )}
                Test &amp; Sync
              </Button>
              <Button
                className="flex-1"
                onClick={() => setShowConfigDialog(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResShows;
