import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Clock, User, CheckCircle2, ChevronLeft,
  ChevronRight, Minus, Plus, Loader2, Sparkles, CloudRain, Thermometer, Umbrella, Ticket,
} from "lucide-react";
import WidgetChatBubble from "@/components/widget/WidgetChatBubble";

interface WidgetConfig {
  org_id: string;
  org_slug: string;
  primary_color: string;
  logo_url: string | null;
  venue_name: string | null;
  welcome_message: string | null;
  slot_interval_minutes: number;
  max_online_party_size: number;
  chat_agent_enabled: boolean;
  voice_agent_enabled: boolean;
  faq_answers: Record<string, string>;
}

interface OperatingHours {
  [day: string]: { open?: string; close?: string };
}

const STEPS = [
  { label: "Date", icon: CalendarDays },
  { label: "Time", icon: Clock },
  { label: "Details", icon: User },
  { label: "Confirm", icon: CheckCircle2 },
];

function generateTimeSlots(open: string, close: string, intervalMin: number): string[] {
  const slots: string[] = [];
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  let mins = oh * 60 + om;
  const endMins = ch * 60 + cm;
  while (mins < endMins) {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    mins += intervalMin;
  }
  return slots;
}

const PublicBookingWidget = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({});
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", email: "",
    occasion: "", dietary: "", special_requests: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [weatherWarning, setWeatherWarning] = useState<string | null>(null);
  const [blockedPopup, setBlockedPopup] = useState<{ message: string } | null>(null);
  const [isPreTheatre, setIsPreTheatre] = useState(false);
  const [selectedShowId, setSelectedShowId] = useState("");

  useEffect(() => {
    if (!orgSlug) return;
    (async () => {
      const { data: wc } = await supabase
        .from("res_widget_config")
        .select("*")
        .eq("org_slug", orgSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (wc) {
        setConfig(wc as any);
        const { data: settings } = await supabase
          .from("res_settings_public" as any)
          .select("operating_hours")
          .eq("org_id", wc.org_id)
          .maybeSingle();
        if ((settings as any)?.operating_hours) setOperatingHours((settings as any).operating_hours as any);

        // Fetch venue postcode for weather warnings
        const { data: venue } = await supabase
          .from("org_venues" as any)
          .select("postcode")
          .eq("org_id", wc.org_id)
          .limit(1)
          .maybeSingle();
        if ((venue as any)?.postcode) {
          fetchWeatherWarning((venue as any).postcode);
        }
      }
      setLoading(false);
    })();
  }, [orgSlug]);

  // Fetch weather for the booking widget — lightweight, just for customer nudges
  const fetchWeatherWarning = async (postcode: string) => {
    try {
      const res = await fetch(
        `https://api.weather.bom.gov.au/v1/locations?search=${encodeURIComponent(postcode)}`
      );
      if (!res.ok) return;
      const search = await res.json();
      const loc = search?.data?.[0];
      if (!loc) return;
      const geohash = loc.geohash.substring(0, 6);
      const dailyRes = await fetch(
        `https://api.weather.bom.gov.au/v1/locations/${geohash}/forecasts/daily`
      );
      if (!dailyRes.ok) return;
      const daily = await dailyRes.json();
      // Store the daily forecast for date-based warnings
      (window as any).__widgetWeatherDays = daily.data || [];
    } catch {
      // Silent fail — weather is a nice-to-have
    }
  };

  const orgId = config?.org_id;

  const { data: blockedDates = [] } = useQuery({
    queryKey: ["res_blocked_dates_public", orgId],
    queryFn: async () => {
      const { data } = await supabase.from("res_blocked_dates_public" as any).select("*").eq("org_id", orgId!);
      return data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: publicShows = [] } = useQuery({
    queryKey: ["res_shows_public", orgId, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data } = await supabase.from("res_shows_public" as any).select("*")
        .eq("org_id", orgId!)
        .eq("show_date", dateStr)
        .eq("is_active", true);
      return data ?? [];
    },
    enabled: !!orgId && !!selectedDate,
  });

  // Compute weather warning for selected date
  useEffect(() => {
    if (!selectedDate) { setWeatherWarning(null); return; }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const days = (window as any).__widgetWeatherDays as any[] | undefined;
    if (!days) { setWeatherWarning(null); return; }
    const day = days.find((d: any) => d.date?.startsWith(dateStr));
    if (!day) { setWeatherWarning(null); return; }

    const rainChance = day.rain?.chance ?? 0;
    const tempMax = day.temp_max ?? 0;

    if (rainChance >= 70) {
      setWeatherWarning("Light showers possible on this day — don't worry, we have cozy indoor and covered backup spaces for you!");
    } else if (rainChance >= 40) {
      setWeatherWarning("There's a chance of rain — we have backup covered areas just in case!");
    } else if (tempMax >= 35) {
      setWeatherWarning(`It's expected to be hot (${tempMax}°C)! We have air-conditioned indoor seating available.`);
    } else {
      setWeatherWarning(null);
    }
  }, [selectedDate]);

  const primaryColor = config?.primary_color || "#0f766e";

  const dayName = selectedDate
    ? format(selectedDate, "EEEE").toLowerCase()
    : null;
  const todayHours = dayName ? operatingHours[dayName] : null;
  const timeSlots =
    todayHours?.open && todayHours?.close
      ? generateTimeSlots(todayHours.open, todayHours.close, config?.slot_interval_minutes || 30)
      : [];

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfDay(new Date()))) return true;
    const day = format(date, "EEEE").toLowerCase();
    const h = operatingHours[day];
    if (!h?.open || !h?.close) return true;

    // Check if date is fully blocked
    const dateStr = format(date, "yyyy-MM-dd");
    const isBlocked = blockedDates.some(
      (b: any) => b.block_date === dateStr && !b.service_period_key
    );
    if (isBlocked) return true;

    return false;
  };

  const handleSubmit = async () => {
    if (!config || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    try {
      // Find or create guest
      let guestId: string | null = null;
      if (form.phone) {
        const { data: existing } = await supabase
          .from("res_guests")
          .select("id")
          .eq("org_id", config.org_id)
          .eq("phone", form.phone)
          .limit(1);
        if (existing && existing.length > 0) {
          guestId = existing[0].id;
        }
      }
      if (!guestId) {
        const { data: newGuest } = await supabase
          .from("res_guests")
          .insert({
            org_id: config.org_id,
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone || null,
            email: form.email || null,
          } as any)
          .select("id")
          .single();
        guestId = newGuest?.id ?? null;
      }

      await supabase.from("res_reservations").insert({
        org_id: config.org_id,
        guest_id: guestId,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        party_size: partySize,
        status: "ENQUIRY",
        channel: "WEBSITE",
        occasion: form.occasion || null,
        dietary_requirements: form.dietary || null,
        special_requests: form.special_requests || null,
      } as any);

      setSubmitted(true);
    } catch (e: any) {
      toast.error("Failed to submit reservation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Booking widget not found or inactive.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Sonner />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Reservation Submitted!</h2>
          <p className="text-muted-foreground mb-1">
            {config.venue_name || "We"} will confirm your booking shortly.
          </p>
          <p className="text-sm font-medium mt-3">
            {format(selectedDate!, "EEEE, MMMM d")} at {selectedTime} · {partySize} guests
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ "--widget-primary": primaryColor } as any}>
      <Sonner />
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-3">
        {config.logo_url && <img src={config.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
        <div>
          <h1 className="text-lg font-bold">{config.venue_name || "Book a Table"}</h1>
          {config.welcome_message && (
            <p className="text-xs text-muted-foreground">{config.welcome_message}</p>
          )}
        </div>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-1 p-4 pb-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.label} className="flex items-center gap-1 flex-1">
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: active ? primaryColor : done ? `${primaryColor}20` : "transparent",
                  color: active ? "white" : done ? primaryColor : "hsl(var(--muted-foreground))",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px bg-border" />
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="flex flex-col items-center">
                <h2 className="text-lg font-semibold mb-3">Choose a Date</h2>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const blocked = blockedDates.find(
                        (b: any) => b.block_date === dateStr && !b.service_period_key
                      ) as any;
                      if (blocked) {
                        setBlockedPopup({ message: blocked.guest_message || "This date is unavailable for bookings." });
                        return;
                      }
                    }
                    setSelectedDate(d);
                    if (d) setStep(1);
                  }}
                  disabled={isDateDisabled}
                  fromDate={new Date()}
                  toDate={addDays(new Date(), 90)}
                  className="rounded-xl border shadow-sm"
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-lg font-semibold mb-1">Pick a Time</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d")}
                </p>

                {/* Weather warning banner for guests */}
                {weatherWarning && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 mb-4 flex items-start gap-2.5">
                    <Umbrella className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">{weatherWarning}</p>
                  </div>
                )}

                {/* Party Size */}
                <div className="flex items-center gap-3 mb-4">
                  <Label className="text-sm">Guests</Label>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setPartySize(Math.max(1, partySize - 1))}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="font-semibold text-lg w-6 text-center">{partySize}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setPartySize(Math.min(config.max_online_party_size, partySize + 1))}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {timeSlots.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No time slots available for this date.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((t) => (
                      <Button
                        key={t}
                        variant={selectedTime === t ? "default" : "outline"}
                        className="h-11 text-sm font-medium"
                        style={selectedTime === t ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                        onClick={() => { setSelectedTime(t); setStep(2); }}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="max-w-md mx-auto space-y-3">
                <h2 className="text-lg font-semibold mb-1">Your Details</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">First Name *</Label>
                    <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Last Name *</Label>
                    <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Phone *</Label>
                  <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Occasion</Label>
                  <Input placeholder="Birthday, Anniversary..." value={form.occasion}
                    onChange={(e) => setForm({ ...form, occasion: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Dietary Requirements</Label>
                  <Input placeholder="Vegan, gluten-free..." value={form.dietary}
                    onChange={(e) => setForm({ ...form, dietary: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Special Requests</Label>
                  <Textarea placeholder="Highchair, window seat..." value={form.special_requests}
                    onChange={(e) => setForm({ ...form, special_requests: e.target.value })} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="max-w-md mx-auto">
                <h2 className="text-lg font-semibold mb-4">Confirm Your Reservation</h2>
                <div className="rounded-xl border p-4 space-y-3 bg-card">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedDate && format(selectedDate, "EEE, MMM d yyyy")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium">{partySize}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{form.first_name} {form.last_name}</span>
                  </div>
                  {form.phone && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{form.phone}</span>
                    </div>
                  )}
                  {form.occasion && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Occasion</span>
                      <span className="font-medium">{form.occasion}</span>
                    </div>
                  )}
                  {form.dietary && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Dietary</span>
                      <span className="font-medium">{form.dietary}</span>
                    </div>
                  )}
                  {form.special_requests && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Requests</span>
                      <span className="font-medium">{form.special_requests}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Nav */}
      <div className="border-t p-4 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {step < 3 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 0 && !selectedDate) ||
              (step === 1 && !selectedTime) ||
              (step === 2 && (!form.first_name || !form.last_name || !form.phone))
            }
            style={{ backgroundColor: primaryColor }}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: primaryColor }}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Submit Reservation
          </Button>
        )}
      </div>

      {/* Chat Agent */}
      {config.chat_agent_enabled && (
        <WidgetChatBubble
          orgSlug={orgSlug!}
          venueName={config.venue_name || ""}
          primaryColor={primaryColor}
          currentStep={STEPS[step].label}
          voiceEnabled={config.voice_agent_enabled}
        />
      )}
    </div>
  );
};

export default PublicBookingWidget;
