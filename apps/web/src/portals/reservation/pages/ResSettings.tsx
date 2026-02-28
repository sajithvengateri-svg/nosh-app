import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Grid3X3, Clock, MessageSquare, DollarSign, Users, Loader2, MapPin, Tag, Phone, Globe, ImagePlus, BrainCircuit, Ticket, CalendarOff, Shield, Plus, Trash2, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { fetchResSettings, upsertResSettings } from "@/lib/shared/queries/resQueries";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import TagManager from "../components/TagManager";
import { useResStore } from "@/lib/shared/state/resStore";
import VenueBrandKit, { type BrandKitData, DEFAULT_BRAND_KIT } from "../components/proposal/VenueBrandKit";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const CHANNELS = ["PHONE", "WALK_IN", "IN_PERSON", "WEBSITE", "GOOGLE_RESERVE", "VOICE_AI"];
const SMS_KEYS = [
  { key: "confirmation", label: "Confirmation" },
  { key: "reminder_24h", label: "24hr Reminder" },
  { key: "reminder_2h", label: "2hr Reminder" },
  { key: "waitlist_added", label: "Waitlist Added" },
  { key: "table_ready", label: "Table Ready" },
  { key: "no_show", label: "No-Show Follow-up" },
  { key: "post_visit", label: "Post-Visit Feedback" },
];

const ResSettings = () => {
  const { currentOrg, venues, refreshOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [venuePostcode, setVenuePostcode] = useState("");
  const { floorActionMode, setFloorActionMode } = useResStore();
  const [orgSettings, setOrgSettings] = useState<Record<string, any>>({});
  const [savingOrgSettings, setSavingOrgSettings] = useState(false);

  // Fetch org settings (organizations.settings JSONB)
  const { data: orgData } = useQuery({
    queryKey: ["org_settings", orgId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("organizations")
        .select("settings")
        .eq("id", orgId!)
        .single();
      return data?.settings || {};
    },
    enabled: !!orgId,
  });

  useEffect(() => {
    if (orgData) setOrgSettings(orgData);
  }, [orgData]);

  const updateOrgSetting = (key: string, value: any) => {
    setOrgSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveOrgSettings = async () => {
    if (!orgId) return;
    setSavingOrgSettings(true);
    try {
      await (supabase as any)
        .from("organizations")
        .update({ settings: orgSettings })
        .eq("id", orgId);
      qc.invalidateQueries({ queryKey: ["org_settings"] });
      toast.success("Proposal settings saved");
    } catch {
      toast.error("Failed to save proposal settings");
    } finally {
      setSavingOrgSettings(false);
    }
  };

  const { data: fetched, isLoading } = useQuery({
    queryKey: ["res_settings", orgId],
    queryFn: async () => { const { data } = await fetchResSettings(orgId!); return data; },
    enabled: !!orgId,
  });

  const SETTING_DEFAULTS: Record<string, any> = {
    pre_theatre_enabled: true,
    pre_theatre_bill_lead_minutes: 5,
    pre_theatre_turn_time: 90,
    pre_theatre_ask_in_widget: true,
    pre_theatre_max_sessions: 6,
    pre_theatre_data_source: "manual",
    weather_nudge_enabled: true,
    widget_weather_enabled: true,
    weather_auto_block_suggest: true,
    weather_rain_threshold: 40,
    weather_temp_threshold: 35,
  };

  useEffect(() => {
    if (fetched) {
      // Merge defaults for any keys not yet stored
      setSettings({ ...SETTING_DEFAULTS, ...fetched });
    } else if (orgId && !isLoading) {
      setSettings({
        org_id: orgId,
        operating_hours: {},
        active_channels: ["PHONE", "WALK_IN", "IN_PERSON", "WEBSITE"],
        sms_templates: {},
        deposit_threshold_party_size: 8,
        deposit_default_percent: 25,
        max_party_size_before_function: 12,
        cancellation_policy: "",
        pre_theatre_enabled: true,
        pre_theatre_bill_lead_minutes: 5,
        pre_theatre_turn_time: 90,
        pre_theatre_ask_in_widget: true,
        pre_theatre_max_sessions: 6,
        pre_theatre_data_source: "manual",
        weather_nudge_enabled: true,
        widget_weather_enabled: true,
        weather_auto_block_suggest: true,
        weather_rain_threshold: 40,
        weather_temp_threshold: 35,
      });
    }
  }, [fetched, orgId, isLoading]);

  useEffect(() => {
    const pc = venues?.[0]?.postcode;
    if (pc && pc !== "0000") setVenuePostcode(pc);
  }, [venues]);

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!orgId || !settings) return;
      await upsertResSettings(orgId, settings);
      // Save venue postcode — create venue record if none exists
      if (venuePostcode) {
        const venue = venues?.[0];
        if (venue) {
          if (venuePostcode !== venue.postcode) {
            await supabase.from("org_venues").update({ postcode: venuePostcode }).eq("id", venue.id);
          }
        } else {
          // No venue record yet — create one
          await supabase.from("org_venues").insert({
            org_id: orgId,
            name: currentOrg?.name || "Main Venue",
            postcode: venuePostcode,
            is_active: true,
          } as any);
        }
        await refreshOrg();
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_settings"] });
      qc.invalidateQueries({ queryKey: ["weather-forecast"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const updateField = (key: string, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const updateHours = (day: string, field: string, value: string) => {
    setSettings(prev => {
      if (!prev) return null;
      const hours = { ...(prev.operating_hours || {}) };
      hours[day] = { ...(hours[day] || {}), [field]: value };
      return { ...prev, operating_hours: hours };
    });
  };

  const toggleChannel = (ch: string) => {
    setSettings(prev => {
      if (!prev) return null;
      const channels = prev.active_channels || [];
      const next = channels.includes(ch) ? channels.filter((c: string) => c !== ch) : [...channels, ch];
      return { ...prev, active_channels: next };
    });
  };

  const updateSmsTemplate = (key: string, value: string) => {
    setSettings(prev => {
      if (!prev) return null;
      const templates = { ...(prev.sms_templates || {}) };
      templates[key] = value;
      return { ...prev, sms_templates: templates };
    });
  };

  if (isLoading || !settings) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6 text-primary" /> Settings</h1>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save All
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="gap-2"><Settings className="w-4 h-4" />General</TabsTrigger>
          <TabsTrigger value="tags" className="gap-2"><Tag className="w-4 h-4" />Tags</TabsTrigger>
          <TabsTrigger value="proposals" className="gap-2"><Globe className="w-4 h-4" />Proposals</TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="mt-4">
          <TagManager />
        </TabsContent>

        <TabsContent value="proposals" className="mt-4 space-y-4">
          {/* Public Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" /> Public Profile</CardTitle>
              <p className="text-xs text-muted-foreground">Contact info, socials & hours shown on client-facing proposals.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Venue Phone</Label>
                  <Input value={orgSettings.phone || ""} onChange={(e) => updateOrgSetting("phone", e.target.value)} placeholder="+61 7 1234 5678" />
                </div>
                <div>
                  <Label>Venue Email</Label>
                  <Input type="email" value={orgSettings.email || ""} onChange={(e) => updateOrgSetting("email", e.target.value)} placeholder="events@venue.com" />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={orgSettings.website || ""} onChange={(e) => updateOrgSetting("website", e.target.value)} placeholder="https://venue.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Instagram URL</Label>
                  <Input value={orgSettings.instagram || ""} onChange={(e) => updateOrgSetting("instagram", e.target.value)} placeholder="https://instagram.com/venue" />
                </div>
                <div>
                  <Label>Facebook URL</Label>
                  <Input value={orgSettings.facebook || ""} onChange={(e) => updateOrgSetting("facebook", e.target.value)} placeholder="https://facebook.com/venue" />
                </div>
                <div>
                  <Label>TikTok URL</Label>
                  <Input value={orgSettings.tiktok || ""} onChange={(e) => updateOrgSetting("tiktok", e.target.value)} placeholder="https://tiktok.com/@venue" />
                </div>
              </div>

              {/* Opening Hours */}
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Opening Hours (shown in proposal footer)</Label>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                  const hours: Array<{ day: string; open: string; close: string }> = orgSettings.opening_hours || [];
                  const existing = hours.find((h) => h.day === day) || { day, open: "", close: "" };
                  return (
                    <div key={day} className="flex items-center gap-3">
                      <span className="w-24 text-sm">{day}</span>
                      <Input
                        type="time"
                        className="w-28"
                        value={existing.open}
                        onChange={(e) => {
                          const updated = hours.filter((h) => h.day !== day);
                          updated.push({ day, open: e.target.value, close: existing.close });
                          updateOrgSetting("opening_hours", updated);
                        }}
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="time"
                        className="w-28"
                        value={existing.close}
                        onChange={(e) => {
                          const updated = hours.filter((h) => h.day !== day);
                          updated.push({ day, open: existing.open, close: e.target.value });
                          updateOrgSetting("opening_hours", updated);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Upsell Banner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><ImagePlus className="w-4 h-4" /> Upsell Banner</CardTitle>
              <p className="text-xs text-muted-foreground">Promote specials or deals at the bottom of proposal pages.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Enable Banner</Label>
                <Switch
                  checked={orgSettings.upsell_banner?.enabled || false}
                  onCheckedChange={(v) => updateOrgSetting("upsell_banner", { ...(orgSettings.upsell_banner || {}), enabled: v })}
                />
              </div>
              {orgSettings.upsell_banner?.enabled && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <div>
                    <Label>Banner Title</Label>
                    <Input
                      value={orgSettings.upsell_banner?.title || ""}
                      onChange={(e) => updateOrgSetting("upsell_banner", { ...(orgSettings.upsell_banner || {}), title: e.target.value })}
                      placeholder="Try our new A La Carte menu"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      rows={2}
                      value={orgSettings.upsell_banner?.description || ""}
                      onChange={(e) => updateOrgSetting("upsell_banner", { ...(orgSettings.upsell_banner || {}), description: e.target.value })}
                      placeholder="Enjoy our chef's seasonal specials..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>CTA Button Text</Label>
                      <Input
                        value={orgSettings.upsell_banner?.cta_text || ""}
                        onChange={(e) => updateOrgSetting("upsell_banner", { ...(orgSettings.upsell_banner || {}), cta_text: e.target.value })}
                        placeholder="View Menu"
                      />
                    </div>
                    <div>
                      <Label>CTA URL</Label>
                      <Input
                        value={orgSettings.upsell_banner?.cta_url || ""}
                        onChange={(e) => updateOrgSetting("upsell_banner", { ...(orgSettings.upsell_banner || {}), cta_url: e.target.value })}
                        placeholder="https://venue.com/menu"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brand Kit */}
          {orgId && (
            <VenueBrandKit
              orgId={orgId}
              brandKit={(orgSettings.brand_kit as BrandKitData) || DEFAULT_BRAND_KIT}
              onChange={(kit) => updateOrgSetting("brand_kit", kit)}
              saving={savingOrgSettings}
            />
          )}

          <Button onClick={saveOrgSettings} disabled={savingOrgSettings} className="w-full">
            {savingOrgSettings ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Proposal Settings
          </Button>
        </TabsContent>

        <TabsContent value="general" className="mt-4 space-y-4">
      {/* Floor Layout */}
      <Card>
        <CardHeader><CardTitle className="text-base">Floor Layout</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Configure your venue layout, add tables, and use AI to scan your room.</p>
          <Button onClick={() => navigate("/reservation/settings/floor")}>
            <Grid3X3 className="w-4 h-4 mr-2" /> Edit Floor Layout
          </Button>
        </CardContent>
      </Card>

      {/* Floor Table Actions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Floor Table Actions</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Choose how table actions appear when you click a table on the floor plan.</p>
          <RadioGroup value={floorActionMode} onValueChange={(v) => setFloorActionMode(v as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="radial" id="floor-radial" />
              <Label htmlFor="floor-radial">Radial Menu (default)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="popover" id="floor-popover" />
              <Label htmlFor="floor-popover">Popover Card</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Venue Postcode */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Venue Postcode</CardTitle></CardHeader>
        <CardContent>
          <div>
            <Label>Postcode</Label>
            <Input
              className="w-40 mt-1"
              placeholder="e.g. 4000"
              value={venuePostcode}
              onChange={e => setVenuePostcode(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground mt-1">Used for weather forecasts and rain radar on the Cover Forecast page.</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Weather Assistance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><BrainCircuit className="w-4 h-4" /> AI Weather Assistance</CardTitle>
          <p className="text-xs text-muted-foreground">Smart weather-based nudges for outdoor booking management.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Weather-based booking nudges</Label>
              <p className="text-[10px] text-muted-foreground">Show rain & heat alerts on the dashboard</p>
            </div>
            <Switch
              checked={settings.weather_nudge_enabled ?? true}
              onCheckedChange={(v) => updateField("weather_nudge_enabled", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Show weather warnings in booking widget</Label>
              <p className="text-[10px] text-muted-foreground">Customer-facing reassuring messages about rain/heat</p>
            </div>
            <Switch
              checked={settings.widget_weather_enabled ?? true}
              onCheckedChange={(v) => updateField("widget_weather_enabled", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-suggest outdoor table blocking</Label>
              <p className="text-[10px] text-muted-foreground">Suggest blocking outdoor tables on high-rain days</p>
            </div>
            <Switch
              checked={settings.weather_auto_block_suggest ?? true}
              onCheckedChange={(v) => updateField("weather_auto_block_suggest", v)}
            />
          </div>
          <div className="border-t pt-3 space-y-3">
            <div>
              <Label className="text-xs">Rain % threshold for outdoor warnings</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  type="number"
                  min={10}
                  max={90}
                  className="w-24"
                  value={settings.weather_rain_threshold ?? 40}
                  onChange={e => updateField("weather_rain_threshold", +e.target.value)}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div>
              <Label className="text-xs">Temperature threshold for heat warnings</Label>
              <div className="flex items-center gap-3 mt-1">
                <Input
                  type="number"
                  min={25}
                  max={45}
                  className="w-24"
                  value={settings.weather_temp_threshold ?? 35}
                  onChange={e => updateField("weather_temp_threshold", +e.target.value)}
                />
                <span className="text-sm text-muted-foreground">°C</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> Operating Hours</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DAYS.map(day => {
              const h = settings.operating_hours?.[day] || {};
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-24 text-sm capitalize">{day}</span>
                  <Input type="time" className="w-28" value={h.open || ""} placeholder="Open"
                    onChange={e => updateHours(day, "open", e.target.value)} />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input type="time" className="w-28" value={h.close || ""} placeholder="Close"
                    onChange={e => updateHours(day, "close", e.target.value)} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Service Periods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Timer className="w-4 h-4" /> Service Periods & Turn Times</CardTitle>
          <p className="text-xs text-muted-foreground">Define your service periods and default table turn times. Up to 6 periods.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {(settings.service_periods || [
            { key: "breakfast", label: "Breakfast", start: "06:00", end: "11:00" },
            { key: "lunch", label: "Lunch", start: "11:30", end: "15:00" },
            { key: "dinner", label: "Dinner", start: "17:00", end: "23:00" },
          ]).map((period: any, idx: number) => (
            <div key={period.key || idx} className="flex items-center gap-2">
              <Input
                className="w-28"
                value={period.label}
                onChange={(e) => {
                  const periods = [...(settings.service_periods || [])];
                  periods[idx] = { ...periods[idx], label: e.target.value, key: e.target.value.toLowerCase().replace(/\s/g, "_") };
                  updateField("service_periods", periods);
                }}
                placeholder="Label"
              />
              <Input
                type="time"
                className="w-28"
                value={period.start}
                onChange={(e) => {
                  const periods = [...(settings.service_periods || [])];
                  periods[idx] = { ...periods[idx], start: e.target.value };
                  updateField("service_periods", periods);
                }}
              />
              <span className="text-muted-foreground text-sm">to</span>
              <Input
                type="time"
                className="w-28"
                value={period.end}
                onChange={(e) => {
                  const periods = [...(settings.service_periods || [])];
                  periods[idx] = { ...periods[idx], end: e.target.value };
                  updateField("service_periods", periods);
                }}
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={30}
                  max={300}
                  step={15}
                  className="w-20"
                  value={period.default_turn_time_minutes || ""}
                  onChange={(e) => {
                    const periods = [...(settings.service_periods || [])];
                    periods[idx] = { ...periods[idx], default_turn_time_minutes: +e.target.value || undefined };
                    updateField("service_periods", periods);
                  }}
                  placeholder="Turn"
                />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">min</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                onClick={() => {
                  const periods = (settings.service_periods || []).filter((_: any, i: number) => i !== idx);
                  updateField("service_periods", periods);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {(settings.service_periods || []).length < 6 && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                const periods = [...(settings.service_periods || [])];
                const num = periods.length + 1;
                periods.push({ key: `period_${num}`, label: `Period ${num}`, start: "", end: "", default_turn_time_minutes: undefined });
                updateField("service_periods", periods);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Service Period
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground">Turn time = default seating duration per service. Can be overridden per-table in floor settings.</p>
        </CardContent>
      </Card>

      {/* Closures & Venue Hire */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><CalendarOff className="w-4 h-4" /> Closures & Venue Hire</CardTitle>
          <p className="text-xs text-muted-foreground">Block dates for private events, maintenance, or holidays. Guests see a message in the booking widget.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Manage blocked dates, venue closures, and private event bookings.</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Full day blocks prevent all bookings. Service-specific blocks only affect that period (e.g. block lunch for a private event but keep dinner open).
            Only managers and admins can block dates.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("/reservation/closures")}>
            <CalendarOff className="w-4 h-4 mr-1.5" /> Manage Closures
          </Button>
        </CardContent>
      </Card>

      {/* Pre-Theatre Dining */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Ticket className="w-4 h-4" /> Pre-Theatre Dining</CardTitle>
          <p className="text-xs text-muted-foreground">Enable pre-theatre features for venues near performance spaces.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable pre-theatre features</Label>
              <p className="text-[10px] text-muted-foreground">Ask guests if they're seeing a show, auto-bill before curtain</p>
            </div>
            <Switch
              checked={settings.pre_theatre_enabled || false}
              onCheckedChange={(v) => updateField("pre_theatre_enabled", v)}
            />
          </div>
          {settings.pre_theatre_enabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Bill drop lead time</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      className="w-20"
                      value={settings.pre_theatre_bill_lead_minutes ?? 5}
                      onChange={e => updateField("pre_theatre_bill_lead_minutes", +e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">min before curtain</span>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Default turn time (pre-theatre)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min={30}
                      max={180}
                      step={15}
                      className="w-20"
                      value={settings.pre_theatre_turn_time ?? 90}
                      onChange={e => updateField("pre_theatre_turn_time", +e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs">Ask in booking widget</Label>
                  <p className="text-[10px] text-muted-foreground">Show "Are you seeing a show?" to every online guest</p>
                </div>
                <Switch
                  checked={settings.pre_theatre_ask_in_widget ?? true}
                  onCheckedChange={(v) => updateField("pre_theatre_ask_in_widget", v)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Max sessions per day</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    className="w-20 mt-1"
                    value={settings.pre_theatre_max_sessions ?? 6}
                    onChange={e => updateField("pre_theatre_max_sessions", +e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Show data source</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Select
                      value={settings.pre_theatre_data_source ?? "manual"}
                      onValueChange={(v) => updateField("pre_theatre_data_source", v)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="airtable">Airtable</SelectItem>
                        <SelectItem value="api">API</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate("/reservation/shows")}>
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Access & Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Team Access</CardTitle>
          <p className="text-xs text-muted-foreground">FOH roles: Owner, Admin, Shift Manager, Server, Host. Grant temporary access with tokens.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-purple-100 text-purple-700">Owner</Badge>
                <span className="text-muted-foreground text-xs">Full access, manage team, grant tokens</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-blue-100 text-blue-700">FOH Admin</Badge>
                <span className="text-muted-foreground text-xs">All settings, shows, blocking, team</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-amber-100 text-amber-700">Shift Manager</Badge>
                <span className="text-muted-foreground text-xs">Same-day blocking, shift reservations</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-green-100 text-green-700">Server</Badge>
                <span className="text-muted-foreground text-xs">Assigned tables, walk-ins, bill drop</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="text-[10px] bg-gray-100 text-gray-700">Host</Badge>
                <span className="text-muted-foreground text-xs">Floor view, walk-ins, waitlist only</span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
            Roles are assigned via team invites. Temporary access tokens can be generated for shift cover — share a link that grants time-limited access.
          </p>
        </CardContent>
      </Card>

      {/* Booking Channels */}
      <Card>
        <CardHeader><CardTitle className="text-base">Booking Channels</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CHANNELS.map(ch => (
              <div key={ch} className="flex items-center justify-between">
                <span className="text-sm">{ch.replace(/_/g, " ")}</span>
                <Switch checked={settings.active_channels?.includes(ch)} onCheckedChange={() => toggleChannel(ch)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Voice Agent (Vapi) */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Phone className="w-4 h-4" /> Voice Agent (Vapi)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Enable AI voice agent to take reservations via your venue phone line.</p>
          <div className="flex items-center justify-between">
            <Label>Enable Voice Agent</Label>
            <Switch checked={settings.voice_agent_enabled || false} onCheckedChange={(v) => updateField("voice_agent_enabled", v)} />
          </div>
          {settings.voice_agent_enabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Label className="text-xs">Vapi API Key</Label>
                <Input
                  type="password"
                  placeholder="Enter your Vapi API key"
                  value={settings.vapi_api_key || ""}
                  onChange={e => updateField("vapi_api_key", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Assistant ID</Label>
                <Input
                  placeholder="Enter your Vapi Assistant ID"
                  value={settings.vapi_assistant_id || ""}
                  onChange={e => updateField("vapi_assistant_id", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Phone Number (forwarded to Vapi)</Label>
                <Input
                  placeholder="+61 4XX XXX XXX"
                  value={settings.vapi_phone_number || ""}
                  onChange={e => updateField("vapi_phone_number", e.target.value)}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Connect your venue phone number to Vapi to let AI handle reservation calls. Get your API key and Assistant ID from vapi.ai</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMS Templates */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4" /> SMS Templates</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {SMS_KEYS.map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs">{label}</Label>
              <Textarea
                className="min-h-[60px]"
                placeholder={`Enter ${label.toLowerCase()} template...`}
                value={settings.sms_templates?.[key] || ""}
                onChange={e => updateSmsTemplate(key, e.target.value)}
              />
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground">Use {"{{guest_name}}"}, {"{{date}}"}, {"{{time}}"}, {"{{venue}}"} as placeholders.</p>
        </CardContent>
      </Card>

      {/* Deposit Rules */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4" /> Deposit Rules</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Require deposit for parties of</Label>
              <Input type="number" min={1} value={settings.deposit_threshold_party_size || 8}
                onChange={e => updateField("deposit_threshold_party_size", +e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">or more guests</p>
            </div>
            <div>
              <Label>Default deposit (%)</Label>
              <Input type="number" min={0} max={100} value={settings.deposit_default_percent || 25}
                onChange={e => updateField("deposit_default_percent", +e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cancellation Policy</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            placeholder="Enter your cancellation policy text..."
            value={settings.cancellation_policy || ""}
            onChange={e => updateField("cancellation_policy", e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Max Party Size */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Party Size Limit</CardTitle></CardHeader>
        <CardContent>
          <div>
            <Label>Redirect to functions enquiry above</Label>
            <Input type="number" min={1} className="w-32 mt-1" value={settings.max_party_size_before_function || 12}
              onChange={e => updateField("max_party_size_before_function", +e.target.value)} />
            <p className="text-[10px] text-muted-foreground mt-1">guests</p>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResSettings;
