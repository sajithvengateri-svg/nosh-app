import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  PartyPopper, CalendarDays, UtensilsCrossed, HeartPulse, User, CheckCircle2,
  ChevronLeft, ChevronRight, Minus, Plus, Loader2, Sparkles, Building, Home,
} from "lucide-react";
import WidgetChatBubble from "@/components/widget/WidgetChatBubble";

interface WidgetConfig {
  org_id: string;
  org_slug: string;
  primary_color: string;
  logo_url: string | null;
  venue_name: string | null;
  welcome_message: string | null;
  chat_agent_enabled: boolean;
  voice_agent_enabled: boolean;
  faq_answers: Record<string, string>;
  function_widget_enabled: boolean;
  max_function_party_size: number;
  menu_sets: string[];
}

const EVENT_TYPES = [
  { value: "Wedding", icon: "💒" },
  { value: "Corporate", icon: "🏢" },
  { value: "Birthday", icon: "🎂" },
  { value: "Private Dining", icon: "🍽️" },
  { value: "Cocktail Function", icon: "🍸" },
  { value: "Custom", icon: "✨" },
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free",
  "Nut-Free", "Halal", "Kosher",
];

const STEPS = [
  { label: "Event Type", icon: PartyPopper },
  { label: "Date & Guests", icon: CalendarDays },
  { label: "Menu", icon: UtensilsCrossed },
  { label: "Dietary", icon: HeartPulse },
  { label: "Contact", icon: User },
  { label: "Confirm", icon: CheckCircle2 },
];

const TIME_OPTIONS = [
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "17:00", "17:30", "18:00", "18:30", "19:00",
  "19:30", "20:00", "20:30", "21:00",
];

const PublicFunctionWidget = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [eventType, setEventType] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [partySize, setPartySize] = useState(30);
  const [startTime, setStartTime] = useState("");
  const [venueHire, setVenueHire] = useState<"Private Room" | "Full Venue Hire">("Private Room");
  const [selectedMenu, setSelectedMenu] = useState("");
  const [addOns, setAddOns] = useState({ canapes: false, beverage_package: false, kids_menu: false });
  const [dietaryChecked, setDietaryChecked] = useState<string[]>([]);
  const [dietaryOther, setDietaryOther] = useState("");
  const [numChildren, setNumChildren] = useState(0);
  const [kidsMenuRequired, setKidsMenuRequired] = useState(false);
  const [allergyNotes, setAllergyNotes] = useState("");
  const [contact, setContact] = useState({
    client_name: "", client_email: "", client_phone: "",
    occasion: "", special_requests: "",
  });

  useEffect(() => {
    if (!orgSlug) return;
    (async () => {
      const { data: wc } = await supabase
        .from("res_widget_config")
        .select("*")
        .eq("org_slug", orgSlug)
        .maybeSingle();
      if (wc) setConfig(wc as any);
      setLoading(false);
    })();
  }, [orgSlug]);

  const primaryColor = config?.primary_color || "#0f766e";
  const maxParty = config?.max_function_party_size || 200;
  const menuSets: string[] = Array.isArray(config?.menu_sets)
    ? config.menu_sets
    : ["Set Menu 1", "Set Menu 2", "Shared Platters", "Cocktail Function", "Custom"];

  const buildNotes = () => {
    const parts: string[] = [];
    if (selectedMenu) parts.push(`Menu: ${selectedMenu}`);
    const activeAddOns = Object.entries(addOns).filter(([, v]) => v).map(([k]) =>
      k === "canapes" ? "Canapés on Arrival" : k === "beverage_package" ? "Beverage Package" : "Kids Menu"
    );
    if (activeAddOns.length) parts.push(`Add-ons: ${activeAddOns.join(", ")}`);
    if (numChildren > 0) parts.push(`Children: ${numChildren}`);
    if (kidsMenuRequired) parts.push("Kids menu required");
    if (contact.special_requests) parts.push(`Requests: ${contact.special_requests}`);
    return parts.join(" | ") || null;
  };

  const buildDietary = () => {
    const items = [...dietaryChecked];
    if (dietaryOther.trim()) items.push(`Other: ${dietaryOther.trim()}`);
    if (allergyNotes.trim()) items.push(`Allergies: ${allergyNotes.trim()}`);
    return items.length > 0 ? items.join(", ") : null;
  };

  const handleSubmit = async () => {
    if (!config || !selectedDate || !startTime || !contact.client_name) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("res_functions").insert({
        org_id: config.org_id,
        event_type: eventType,
        event_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: startTime,
        party_size: partySize,
        room: venueHire,
        client_name: contact.client_name,
        client_email: contact.client_email || null,
        client_phone: contact.client_phone || null,
        dietary_requirements: buildDietary(),
        notes: buildNotes(),
        status: "ENQUIRY",
      } as any);
      if (error) throw error;
      setSubmitted(true);
    } catch (e: any) {
      toast.error("Failed to submit enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!eventType;
      case 1: return !!selectedDate && !!startTime;
      case 2: return !!selectedMenu;
      case 3: return true;
      case 4: return !!contact.client_name && (!!contact.client_email || !!contact.client_phone);
      default: return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (!config || !config.function_widget_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Function enquiry widget not found or inactive.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Sonner />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Enquiry Submitted!</h2>
          <p className="text-muted-foreground mb-1">
            {config.venue_name || "We"} will be in touch shortly with a proposal.
          </p>
          <p className="text-sm font-medium mt-3">
            {eventType} · {selectedDate && format(selectedDate, "EEEE, MMMM d")} · {partySize} guests
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sonner />
      {/* Header */}
      <header className="border-b p-4 flex items-center gap-3">
        {config.logo_url && <img src={config.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
        <div>
          <h1 className="text-lg font-bold">{config.venue_name || "Function Enquiry"}</h1>
          <p className="text-xs text-muted-foreground">Plan your private event with us</p>
        </div>
      </header>

      {/* Stepper */}
      <div className="flex items-center gap-1 p-4 pb-0 overflow-x-auto">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.label} className="flex items-center gap-1 flex-1 min-w-0">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  backgroundColor: active ? primaryColor : done ? `${primaryColor}20` : "transparent",
                  color: active ? "white" : done ? primaryColor : "hsl(var(--muted-foreground))",
                }}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden md:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border min-w-2" />}
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
            className="max-w-lg mx-auto"
          >
            {/* Step 0: Event Type */}
            {step === 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">What type of event?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {EVENT_TYPES.map((et) => (
                    <button
                      key={et.value}
                      onClick={() => setEventType(et.value)}
                      className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                        eventType === et.value ? "shadow-md" : "border-border"
                      }`}
                      style={eventType === et.value ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
                    >
                      <span className="text-2xl block mb-1">{et.icon}</span>
                      <span className="text-sm font-medium">{et.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Date & Guests */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Date & Guests</h2>

                <div className="flex flex-col items-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(d) => isBefore(d, startOfDay(new Date()))}
                    fromDate={new Date()}
                    toDate={addDays(new Date(), 365)}
                    className="rounded-xl border shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Label className="text-sm w-20">Guests</Label>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setPartySize(Math.max(10, partySize - 5))}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="font-semibold text-lg w-10 text-center">{partySize}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setPartySize(Math.min(maxParty, partySize + 5))}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                <div>
                  <Label className="text-xs">Preferred Start Time</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger><SelectValue placeholder="Select time..." /></SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Venue Hire</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["Private Room", "Full Venue Hire"] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setVenueHire(opt)}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                          venueHire === opt ? "shadow-md" : "border-border"
                        }`}
                        style={venueHire === opt ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
                      >
                        {opt === "Private Room" ? <Building className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                        <span className="text-sm font-medium">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Menu & Extras */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Menu & Extras</h2>

                <div>
                  <Label className="text-xs">Menu Selection</Label>
                  <Select value={selectedMenu} onValueChange={setSelectedMenu}>
                    <SelectTrigger><SelectValue placeholder="Choose a menu style..." /></SelectTrigger>
                    <SelectContent>
                      {menuSets.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Add-ons</Label>
                  {[
                    { key: "canapes" as const, label: "Canapés on Arrival", desc: "Passed around on arrival" },
                    { key: "beverage_package" as const, label: "Beverage Package", desc: "All-inclusive drinks" },
                    { key: "kids_menu" as const, label: "Kids Menu", desc: "Separate menu for children" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-[10px] text-muted-foreground">{desc}</p>
                      </div>
                      <Switch
                        checked={addOns[key]}
                        onCheckedChange={(v) => setAddOns({ ...addOns, [key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Dietary & Requirements */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Dietary & Requirements</h2>

                <div className="space-y-2">
                  <Label className="text-xs">Dietary Requirements</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIETARY_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50">
                        <Checkbox
                          checked={dietaryChecked.includes(opt)}
                          onCheckedChange={(checked) => {
                            setDietaryChecked(checked
                              ? [...dietaryChecked, opt]
                              : dietaryChecked.filter((d) => d !== opt)
                            );
                          }}
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label className="text-xs">Other Dietary</Label>
                    <Input placeholder="Any other requirements..." value={dietaryOther}
                      onChange={(e) => setDietaryOther(e.target.value)} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="text-sm w-36">Number of Children</Label>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setNumChildren(Math.max(0, numChildren - 1))}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="font-semibold text-lg w-6 text-center">{numChildren}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setNumChildren(numChildren + 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>

                {numChildren > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">Kids Menu Required?</p>
                      <p className="text-[10px] text-muted-foreground">Separate children's menu</p>
                    </div>
                    <Switch checked={kidsMenuRequired} onCheckedChange={setKidsMenuRequired} />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Allergy Notes</Label>
                  <Textarea placeholder="Any severe allergies or notes for the kitchen..."
                    className="min-h-[60px]" value={allergyNotes}
                    onChange={(e) => setAllergyNotes(e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 4: Contact Details */}
            {step === 4 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Contact Details</h2>
                <div>
                  <Label className="text-xs">Full Name *</Label>
                  <Input value={contact.client_name}
                    onChange={(e) => setContact({ ...contact, client_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input type="email" value={contact.client_email}
                    onChange={(e) => setContact({ ...contact, client_email: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input type="tel" value={contact.client_phone}
                    onChange={(e) => setContact({ ...contact, client_phone: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Occasion / Description</Label>
                  <Input placeholder="What's the occasion?" value={contact.occasion}
                    onChange={(e) => setContact({ ...contact, occasion: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Special Requests</Label>
                  <Textarea placeholder="AV equipment, decorations, cake..."
                    className="min-h-[60px]" value={contact.special_requests}
                    onChange={(e) => setContact({ ...contact, special_requests: e.target.value })} />
                </div>
              </div>
            )}

            {/* Step 5: Confirm */}
            {step === 5 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Confirm Your Enquiry</h2>
                <div className="rounded-xl border p-4 space-y-2 bg-card">
                  {[
                    ["Event Type", eventType],
                    ["Date", selectedDate ? format(selectedDate, "EEE, MMM d yyyy") : ""],
                    ["Time", startTime],
                    ["Guests", String(partySize)],
                    ["Venue", venueHire],
                    ["Menu", selectedMenu],
                    ["Add-ons", Object.entries(addOns).filter(([,v]) => v).map(([k]) =>
                      k === "canapes" ? "Canapés" : k === "beverage_package" ? "Beverage Pkg" : "Kids Menu"
                    ).join(", ") || "None"],
                    ["Dietary", buildDietary() || "None"],
                    ["Children", numChildren > 0 ? `${numChildren}${kidsMenuRequired ? " (kids menu)": ""}` : "None"],
                    ["Name", contact.client_name],
                    ["Email", contact.client_email],
                    ["Phone", contact.client_phone || "—"],
                  ].filter(([, v]) => v).map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                  {contact.occasion && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Occasion</span>
                      <span className="font-medium">{contact.occasion}</span>
                    </div>
                  )}
                  {contact.special_requests && (
                    <div className="pt-2 border-t text-sm">
                      <span className="text-muted-foreground block text-xs mb-1">Special Requests</span>
                      <span>{contact.special_requests}</span>
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
        {step < 5 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            style={{ backgroundColor: primaryColor }}
            className="text-white"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} style={{ backgroundColor: primaryColor }} className="text-white">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Submit Enquiry
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

export default PublicFunctionWidget;
