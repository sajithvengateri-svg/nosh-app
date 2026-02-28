import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isPast, parseISO } from "date-fns";
import {
  Loader2,
  FileX,
  Clock,
  CheckCircle2,
  Users,
  CalendarDays,
  MapPin,
  Utensils,
  Wine,
  Receipt,
  FileText,
  Pen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import ProposalHero from "../components/proposal/ProposalHero";
import ProposalMenuPage from "../components/proposal/ProposalMenuPage";
import ProposalAddOns from "../components/proposal/ProposalAddOns";
import ProposalRunsheet from "../components/proposal/ProposalRunsheet";
import ProposalVenueMap from "../components/proposal/ProposalVenueMap";
import ProposalInviteCard from "../components/proposal/ProposalInviteCard";
import AnimatedSection from "../components/proposal/AnimatedSection";
import ProposalTopBar from "../components/proposal/ProposalTopBar";
import ProposalFooter from "../components/proposal/ProposalFooter";
import ProposalUpsellBanner from "../components/proposal/ProposalUpsellBanner";
import ProposalFloatingCTA from "../components/proposal/ProposalFloatingCTA";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Proposal {
  id: string;
  status: string;
  cover_message: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  party_size: number | null;
  venue_space_id: string | null;
  beverage_package_id: string | null;
  subtotal: number | null;
  room_hire_fee: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number | null;
  terms_and_conditions: string | null;
  expires_at: string | null;
  signature_name: string | null;
  signature_date: string | null;
  org_id: string | null;
  sections_config?: Record<string, boolean> | null;
  hero_headline?: string | null;
  hero_subheadline?: string | null;
  venue_address?: string | null;
  venue_parking_notes?: string | null;
  runsheet?: Array<{ time: string; activity: string; notes: string }> | null;
  add_ons?: Array<{
    id: string;
    name: string;
    price: number;
  }> | null;
  invite_message?: string | null;
  deposit_percent?: number | null;
  balance_due_days_before?: number | null;
}

interface ProposalMediaItem {
  id: string;
  url: string;
  media_type: "image" | "video";
  caption: string | null;
  sort_order: number;
}

interface MenuSection {
  id: string;
  title: string;
  sort_order: number;
  per_head_price: number | null;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  dietary_flags: string[] | null;
  sort_order: number;
}

interface VenueSpace {
  id: string;
  name: string;
  room_type: string | null;
}

interface BeveragePackage {
  id: string;
  name: string;
  tier: string | null;
  duration_hours: number | null;
  items: BeverageItem[];
}

interface BeverageItem {
  id: string;
  name: string;
  category: string | null;
}

interface OrgSettings {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  opening_hours?: Array<{ day: string; open: string; close: string }>;
  brand_kit?: {
    logo_url?: string | null;
    hero_photos?: string[];
    food_bev_photos?: string[];
    room_photos?: string[];
    show_logo?: boolean;
    show_hero?: boolean;
    show_food_bev?: boolean;
    show_room?: boolean;
  };
  upsell_banner?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    cta_text?: string;
    cta_url?: string;
  };
}

interface Organization {
  name: string;
  logo_url: string | null;
  settings: OrgSettings | null;
  currency?: string | null;
  store_mode?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number | null | undefined, currencyCode = "AUD"): string {
  if (value == null) return `${getCurrencySym(currencyCode)}0.00`;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode,
  }).format(value);
}

function getCurrencySym(code: string): string {
  const map: Record<string, string> = { AUD: "$", USD: "$", GBP: "\u00a3", INR: "\u20b9", AED: "\u062f.\u0625", SGD: "S$" };
  return map[code.toUpperCase()] ?? "$";
}

function deriveCurrencyCode(org: Organization | null): string {
  if (org?.currency) return org.currency.toUpperCase();
  const mode = org?.store_mode;
  if (mode === "india") return "INR";
  if (mode === "gcc" || mode === "uae") return "AED";
  if (mode === "uk") return "GBP";
  if (mode === "sg") return "SGD";
  if (mode === "us") return "USD";
  return "AUD";
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "TBC";
  try {
    return format(parseISO(dateStr), "EEEE, d MMMM yyyy");
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "TBC";
  try {
    const [hours, minutes] = timeStr.split(":");
    const d = new Date();
    d.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return format(d, "h:mm a");
  } catch {
    return timeStr;
  }
}

function isSectionVisible(
  config: Record<string, boolean> | null | undefined,
  sectionKey: string,
): boolean {
  if (!config) return true;
  return config[sectionKey] !== false;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function GoldDivider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-vf-gold to-transparent my-6" />;
}

function SectionHeading({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <Icon className="h-5 w-5 text-vf-gold" />
      <h2 className="font-serif text-2xl text-vf-navy">{children}</h2>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function ProposalClientView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [searchParams] = useSearchParams();

  // Data state
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [venueSpace, setVenueSpace] = useState<VenueSpace | null>(null);
  const [beveragePackage, setBeveragePackage] = useState<BeveragePackage | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [proposalMedia, setProposalMedia] = useState<ProposalMediaItem[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);

  // Acceptance form
  const [signatureName, setSignatureName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [accepting, setAccepting] = useState(false);

  // Add-on selections
  const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

  const handleToggleAddOn = useCallback((id: string) => {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addOnTotal = useMemo(() => {
    if (!proposal?.add_ons) return 0;
    return proposal.add_ons
      .filter((a) => selectedAddOns.has(a.id))
      .reduce((sum, a) => sum + a.price, 0);
  }, [proposal?.add_ons, selectedAddOns]);

  // Smooth scroll
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  // Handle payment return
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      toast.success("Payment received! Your booking is confirmed.");
    } else if (paymentStatus === "cancelled") {
      toast.info("Payment was cancelled. You can try again anytime.");
    }
  }, [searchParams]);

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!shareToken) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function loadProposal() {
      try {
        const { data: proposalData, error: proposalError } = await (supabase
          .from("res_function_proposals")
          .select("*")
          .eq("share_token", shareToken!)
          .in("status", ["sent", "accepted", "SENT", "ACCEPTED"])
          .single() as any);

        if (proposalError || !proposalData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        const p = proposalData as Proposal;

        if (p.expires_at && isPast(parseISO(p.expires_at))) {
          setExpired(true);
          setProposal(p);
          setLoading(false);
          return;
        }

        setProposal(p);

        const promises: Promise<void>[] = [];

        // Proposal media
        promises.push(
          (async () => {
            const { data: media } = await (supabase
              .from("res_proposal_media")
              .select("*")
              .eq("proposal_id", p.id)
              .order("sort_order") as any);

            if (media && media.length > 0) {
              setProposalMedia(
                media.map((m: any) => ({
                  id: m.id,
                  url: m.url,
                  media_type: m.media_type ?? "image",
                  caption: m.caption ?? null,
                  sort_order: m.sort_order ?? 0,
                })),
              );
            }
          })(),
        );

        // Menu sections
        promises.push(
          (async () => {
            const { data: sections } = await (supabase
              .from("res_proposal_menu_sections")
              .select("*")
              .eq("proposal_id", p.id)
              .order("sort_order", { ascending: true }) as any);

            if (sections && sections.length > 0) {
              const enriched: MenuSection[] = sections.map((s: any) => ({
                id: s.id,
                title: s.title || s.name || "Menu Section",
                sort_order: s.sort_order ?? 0,
                per_head_price: s.per_head_price ?? null,
                items: Array.isArray(s.items)
                  ? s.items.map((item: any, idx: number) => ({
                      id: item.id || `item-${idx}`,
                      name: item.name || "",
                      description: item.description || null,
                      dietary_flags: item.dietary_flags || null,
                      sort_order: item.sort_order ?? idx,
                    }))
                  : [],
              }));
              setMenuSections(enriched);
            }
          })(),
        );

        // Venue space
        if (p.venue_space_id) {
          promises.push(
            (async () => {
              const { data: space } = await (supabase
                .from("res_venue_spaces")
                .select("id, name, room_type")
                .eq("id", p.venue_space_id!)
                .single() as any);
              if (space) setVenueSpace(space as VenueSpace);
            })(),
          );
        }

        // Beverage package
        if (p.beverage_package_id) {
          promises.push(
            (async () => {
              const { data: pkg } = await (supabase
                .from("vf_beverage_packages")
                .select("*")
                .eq("id", p.beverage_package_id!)
                .single() as any);
              if (pkg) {
                setBeveragePackage({
                  id: pkg.id,
                  name: pkg.name || "Beverage Package",
                  tier: pkg.tier || null,
                  duration_hours: pkg.duration_hours || null,
                  items: Array.isArray(pkg.items)
                    ? pkg.items.map((item: any, idx: number) => ({
                        id: item.id || `bev-${idx}`,
                        name: item.name || "",
                        category: item.category || null,
                      }))
                    : [],
                });
              }
            })(),
          );
        }

        // Organization branding + settings
        if (p.org_id) {
          promises.push(
            (async () => {
              const { data: org } = await (supabase
                .from("organizations")
                .select("name, logo_url, settings, currency, store_mode")
                .eq("id", p.org_id!)
                .single() as any);
              if (org) {
                const raw = org as any;
                const parsedSettings: OrgSettings = typeof raw.settings === "object" && raw.settings ? raw.settings : {};
                setOrganization({
                  name: raw.name,
                  logo_url: raw.logo_url,
                  settings: parsedSettings,
                  currency: raw.currency,
                  store_mode: raw.store_mode,
                });
              }
            })(),
          );
        }

        await Promise.all(promises);
      } catch (err) {
        console.error("Error loading proposal:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadProposal();
  }, [shareToken]);

  // -----------------------------------------------------------------------
  // Accept proposal
  // -----------------------------------------------------------------------

  async function handleAccept() {
    if (!proposal) return;
    if (!signatureName.trim()) {
      toast.error("Please enter your name to accept the proposal.");
      return;
    }
    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions to proceed.");
      return;
    }

    setAccepting(true);

    try {
      const now = new Date().toISOString();

      const { error } = await (supabase
        .from("res_function_proposals")
        .update({
          status: "accepted",
          signature_name: signatureName.trim(),
          signature_date: now,
        })
        .eq("id", proposal.id) as any);

      if (error) throw error;

      setProposal((prev) =>
        prev
          ? { ...prev, status: "accepted", signature_name: signatureName.trim(), signature_date: now }
          : prev,
      );

      // Try Stripe checkout
      try {
        const depositPercent = proposal.deposit_percent ?? 50;
        const adjustedTotal = (proposal.total ?? 0) + addOnTotal;
        const depositAmt = adjustedTotal * (depositPercent / 100);
        const returnUrl = window.location.href.split("?")[0];

        const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
          "vf-stripe-checkout",
          {
            body: {
              proposalId: proposal.id,
              depositAmount: depositAmt,
              currency: currencyCode.toLowerCase(),
              orgName: organization?.name || "Venue",
              returnUrl,
            },
          },
        );

        if (!stripeError && stripeData?.url) {
          window.location.href = stripeData.url;
          return;
        }
      } catch {
        // Stripe not configured - graceful fallback
      }

      toast.success("Proposal accepted successfully! We will be in touch shortly.");
    } catch (err) {
      console.error("Error accepting proposal:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  }

  // -----------------------------------------------------------------------
  // Derived data
  // -----------------------------------------------------------------------

  const sectionsConfig = proposal?.sections_config ?? null;
  const currencyCode = deriveCurrencyCode(organization);
  const fmt = (v: number | null | undefined) => formatCurrency(v, currencyCode);
  const orgSettings = organization?.settings ?? {};
  const brandKit = orgSettings.brand_kit;
  const upsellBanner = orgSettings.upsell_banner;

  // Normalize status to lowercase for comparisons
  const normalizedStatus = proposal?.status?.toLowerCase() ?? "";

  // Brand kit logo fallback
  const effectiveLogoUrl = organization?.logo_url
    || (brandKit?.show_logo !== false ? brandKit?.logo_url : null)
    || null;

  // Hero media with brand kit fallback
  const heroMediaItems = useMemo(() => {
    if (proposalMedia.length > 0) {
      return proposalMedia.map((m) => ({
        url: m.url,
        media_type: m.media_type,
        caption: m.caption,
      }));
    }
    // Fallback to brand kit hero photos
    if (brandKit?.show_hero !== false && brandKit?.hero_photos && brandKit.hero_photos.length > 0) {
      return brandKit.hero_photos.map((url) => ({
        url,
        media_type: "image" as const,
        caption: null,
      }));
    }
    return [];
  }, [proposalMedia, brandKit]);

  // Menu media
  const menuMediaItems = useMemo(() => {
    const fromProposal = proposalMedia
      .filter((m) => m.media_type === "image")
      .map((m) => ({ url: m.url, caption: m.caption }));
    if (fromProposal.length > 0) return fromProposal;
    // Fallback to brand kit food/bev photos
    if (brandKit?.show_food_bev !== false && brandKit?.food_bev_photos && brandKit.food_bev_photos.length > 0) {
      return brandKit.food_bev_photos.map((url) => ({ url, caption: null }));
    }
    return [];
  }, [proposalMedia, brandKit]);

  // Nav links for ProposalTopBar
  const navLinks = useMemo(() => {
    if (!proposal) return [];
    const links: Array<{ id: string; label: string }> = [];
    if (isSectionVisible(sectionsConfig, "event_details")) links.push({ id: "event-details", label: "Details" });
    if (menuSections.length > 0 && isSectionVisible(sectionsConfig, "menu")) links.push({ id: "menu", label: "Menu" });
    if (beveragePackage && isSectionVisible(sectionsConfig, "beverages")) links.push({ id: "beverages", label: "Beverages" });
    if ((proposal.venue_address || venueSpace) && isSectionVisible(sectionsConfig, "venue_map")) links.push({ id: "venue", label: "Venue" });
    if (isSectionVisible(sectionsConfig, "pricing")) links.push({ id: "pricing", label: "Pricing" });
    if (normalizedStatus === "sent") links.push({ id: "accept", label: "Accept" });
    return links;
  }, [proposal, menuSections, beveragePackage, venueSpace, sectionsConfig]);

  // Menu sections for ProposalMenuPage
  const menuPageSections = useMemo(() => {
    return menuSections.map((s) => ({
      title: s.title,
      description: null as string | null,
      per_head_price: s.per_head_price ?? 0,
      items: s.items.map((item) => ({
        name: item.name,
        description: item.description ?? "",
      })),
    }));
  }, [menuSections]);

  // -----------------------------------------------------------------------
  // Render: Loading
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-vf-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-vf-navy/60 font-serif text-lg">Loading your proposal...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-vf-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-vf-gold/20 shadow-lg text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <FileX className="h-16 w-16 text-vf-gold/40 mx-auto" />
            <h1 className="font-serif text-2xl text-vf-navy">This Proposal Is Not Available</h1>
            <p className="text-vf-navy/60">
              The proposal you are looking for may have been withdrawn or the link is no longer valid.
              Please contact the venue if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-vf-cream flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-vf-gold/20 shadow-lg text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <Clock className="h-16 w-16 text-vf-gold/40 mx-auto" />
            <h1 className="font-serif text-2xl text-vf-navy">This Proposal Has Expired</h1>
            <p className="text-vf-navy/60">
              This proposal expired on{" "}
              <span className="font-medium text-vf-navy">
                {proposal?.expires_at ? formatDate(proposal.expires_at) : "a previous date"}
              </span>
              . Please contact the venue to request an updated proposal.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!proposal) return null;

  const depositPercent = proposal.deposit_percent ?? 50;
  const balanceDueDays = proposal.balance_due_days_before ?? 7;
  const adjustedTotal = (proposal.total ?? 0) + addOnTotal;
  const adjustedDeposit = adjustedTotal * (depositPercent / 100);
  const adjustedBalance = adjustedTotal - adjustedDeposit;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  // -----------------------------------------------------------------------
  // Render: Main Proposal
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-vf-cream">
      {/* Top Bar */}
      <ProposalTopBar
        venueName={organization?.name ?? "Venue"}
        venueLogoUrl={effectiveLogoUrl}
        phone={orgSettings.phone ?? null}
        navLinks={navLinks}
        showAcceptCta={normalizedStatus === "sent"}
        onAcceptClick={() => document.getElementById("accept")?.scrollIntoView({ behavior: "smooth" })}
      />

      {/* Hero Section */}
      {isSectionVisible(sectionsConfig, "hero") && proposal.event_date && (
        <div id="proposal-hero">
          <ProposalHero
            headline={proposal.hero_headline ?? organization?.name ?? null}
            subheadline={proposal.hero_subheadline ?? null}
            eventDate={proposal.event_date}
            venueName={organization?.name ?? "Your Venue"}
            venueLogoUrl={effectiveLogoUrl}
            mediaItems={heroMediaItems}
          />
        </div>
      )}

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6 lg:px-8 space-y-8">
        {/* Header fallback when hero hidden */}
        {!isSectionVisible(sectionsConfig, "hero") && (
          <header className="text-center space-y-4">
            {effectiveLogoUrl && (
              <img src={effectiveLogoUrl} alt={organization?.name ?? ""} className="h-16 mx-auto object-contain" />
            )}
            <h1 className="font-serif text-3xl sm:text-4xl text-vf-navy tracking-tight">
              {organization?.name || "Your Proposal"}
            </h1>
            <div className="h-px w-24 bg-vf-gold mx-auto" />
            <p className="text-vf-navy/50 text-sm uppercase tracking-widest">Function Proposal</p>
          </header>
        )}

        {/* Cover Message */}
        {proposal.cover_message && isSectionVisible(sectionsConfig, "cover_message") && (
          <AnimatedSection>
            <GoldDivider />
            <div className="text-center px-4">
              <p className="font-serif text-lg text-vf-navy/80 leading-relaxed italic whitespace-pre-line">
                {proposal.cover_message}
              </p>
            </div>
          </AnimatedSection>
        )}

        <GoldDivider />

        {/* Event Details */}
        {isSectionVisible(sectionsConfig, "event_details") && (
          <AnimatedSection id="event-details" className="scroll-mt-20">
            <Card className="border-vf-gold/20 shadow-lg">
              <CardHeader className="pb-2">
                <SectionHeading icon={CalendarDays}>Event Details</SectionHeading>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-vf-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-vf-navy/50 uppercase tracking-wider">Date</p>
                      <p className="text-vf-navy font-medium">{formatDate(proposal.event_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-vf-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-vf-navy/50 uppercase tracking-wider">Time</p>
                      <p className="text-vf-navy font-medium">
                        {formatTime(proposal.start_time)}
                        {proposal.end_time ? ` – ${formatTime(proposal.end_time)}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-vf-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-vf-navy/50 uppercase tracking-wider">Guest Count</p>
                      <p className="text-vf-navy font-medium">
                        {proposal.party_size ?? "TBC"} {proposal.party_size ? "guests" : ""}
                      </p>
                    </div>
                  </div>
                  {venueSpace && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-vf-gold mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-vf-navy/50 uppercase tracking-wider">Venue Space</p>
                        <div className="flex items-center gap-2">
                          <p className="text-vf-navy font-medium">{venueSpace.name}</p>
                          {venueSpace.room_type && (
                            <Badge variant="outline" className="text-xs border-vf-gold/30 text-vf-navy/70">
                              {venueSpace.room_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Menu */}
        {menuSections.length > 0 && isSectionVisible(sectionsConfig, "menu") && (
          <AnimatedSection id="menu" className="scroll-mt-20">
            <ProposalMenuPage menuSections={menuPageSections} mediaItems={menuMediaItems} />
          </AnimatedSection>
        )}

        {/* Beverage Package */}
        {beveragePackage && isSectionVisible(sectionsConfig, "beverages") && (
          <AnimatedSection id="beverages" className="scroll-mt-20">
            <Card className="border-vf-gold/20 shadow-lg">
              <CardHeader className="pb-2">
                <SectionHeading icon={Wine}>Beverage Package</SectionHeading>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-serif text-lg text-vf-navy">{beveragePackage.name}</h3>
                  {beveragePackage.tier && (
                    <Badge className="bg-vf-gold/10 text-vf-gold border-vf-gold/30" variant="outline">
                      {beveragePackage.tier}
                    </Badge>
                  )}
                  {beveragePackage.duration_hours && (
                    <Badge variant="outline" className="border-vf-navy/20 text-vf-navy/60">
                      {beveragePackage.duration_hours} hour{beveragePackage.duration_hours !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                {beveragePackage.items.length > 0 && (
                  <div className="space-y-3">
                    {Object.entries(
                      beveragePackage.items.reduce<Record<string, BeverageItem[]>>((acc, item) => {
                        const cat = item.category || "Other";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(item);
                        return acc;
                      }, {}),
                    ).map(([category, items]) => (
                      <div key={category}>
                        <p className="text-xs text-vf-navy/50 uppercase tracking-wider mb-1">{category}</p>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <span key={item.id} className="text-sm text-vf-navy bg-white/60 px-2.5 py-1 rounded-md border border-vf-gold/10">
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Add-Ons */}
        {proposal.add_ons && proposal.add_ons.length > 0 && isSectionVisible(sectionsConfig, "add_ons") && (
          <AnimatedSection id="add-ons" className="scroll-mt-20">
            <ProposalAddOns addOns={proposal.add_ons} selectedIds={Array.from(selectedAddOns)} onToggle={handleToggleAddOn} />
          </AnimatedSection>
        )}

        {/* Venue Map */}
        {proposal.venue_address && isSectionVisible(sectionsConfig, "venue_map") && (
          <AnimatedSection id="venue" className="scroll-mt-20">
            <ProposalVenueMap
              venueName={venueSpace?.name ?? organization?.name ?? "Venue"}
              address={proposal.venue_address}
              parkingNotes={proposal.venue_parking_notes ?? null}
            />
          </AnimatedSection>
        )}

        {/* Runsheet */}
        {proposal.runsheet && proposal.runsheet.length > 0 && isSectionVisible(sectionsConfig, "runsheet") && (
          <AnimatedSection id="runsheet" className="scroll-mt-20">
            <ProposalRunsheet runsheet={proposal.runsheet} />
          </AnimatedSection>
        )}

        {/* Pricing */}
        {isSectionVisible(sectionsConfig, "pricing") && (
          <AnimatedSection id="pricing" className="scroll-mt-20">
            <Card className="border-vf-gold/20 shadow-lg">
              <CardHeader className="pb-2">
                <SectionHeading icon={Receipt}>Pricing Breakdown</SectionHeading>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-vf-navy/70">
                    <span>Subtotal</span>
                    <span>{fmt(proposal.subtotal)}</span>
                  </div>
                  {(proposal.room_hire_fee ?? 0) > 0 && (
                    <div className="flex justify-between text-vf-navy/70">
                      <span>Room Hire</span>
                      <span>{fmt(proposal.room_hire_fee)}</span>
                    </div>
                  )}
                  {(proposal.tax_amount ?? 0) > 0 && (
                    <div className="flex justify-between text-vf-navy/70">
                      <span>Tax{proposal.tax_rate ? ` (${proposal.tax_rate}%)` : ""}</span>
                      <span>{fmt(proposal.tax_amount)}</span>
                    </div>
                  )}
                  {addOnTotal > 0 && (
                    <div className="flex justify-between text-vf-gold font-medium">
                      <span>Add-Ons ({selectedAddOns.size} selected)</span>
                      <span>+ {fmt(addOnTotal)}</span>
                    </div>
                  )}
                  <Separator className="bg-vf-gold/20" />
                  <div className="flex justify-between text-vf-navy font-serif text-xl font-semibold">
                    <span>Total</span>
                    <span>{fmt(adjustedTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Deposit Schedule */}
        {isSectionVisible(sectionsConfig, "deposit") && (
          <AnimatedSection>
            <Card className="border-vf-gold/20 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-xl text-vf-navy">Deposit Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-vf-gold/5 border border-vf-gold/10">
                    <div>
                      <p className="text-vf-navy font-medium">{depositPercent}% Deposit</p>
                      <p className="text-sm text-vf-navy/50">Due on acceptance</p>
                    </div>
                    <p className="text-vf-navy font-serif text-lg font-semibold">
                      {fmt(adjustedDeposit)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/40 border border-vf-gold/10">
                    <div>
                      <p className="text-vf-navy font-medium">Balance</p>
                      <p className="text-sm text-vf-navy/50">Due {balanceDueDays} days before event</p>
                    </div>
                    <p className="text-vf-navy font-serif text-lg font-semibold">
                      {fmt(adjustedBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Terms & Conditions */}
        {proposal.terms_and_conditions && isSectionVisible(sectionsConfig, "terms") && (
          <AnimatedSection>
            <Card className="border-vf-gold/20 shadow-lg">
              <CardHeader className="pb-2">
                <SectionHeading icon={FileText}>Terms & Conditions</SectionHeading>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-vf-navy/70 leading-relaxed whitespace-pre-line">
                  {proposal.terms_and_conditions}
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Acceptance Section */}
        {normalizedStatus === "sent" && (
          <AnimatedSection id="accept" className="scroll-mt-20">
            <Card className="border-vf-gold/30 shadow-xl bg-white">
              <CardHeader className="pb-2">
                <SectionHeading icon={Pen}>Accept This Proposal</SectionHeading>
                <p className="text-sm text-vf-navy/60">
                  Please review the details above and sign below to accept this proposal.
                </p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="signature-name" className="text-sm font-medium text-vf-navy">
                    Full Name (Signature)
                  </label>
                  <Input
                    id="signature-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="border-vf-gold/30 focus-visible:ring-vf-gold/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-vf-navy">Date</label>
                  <Input
                    type="text"
                    value={format(new Date(), "d MMMM yyyy")}
                    disabled
                    className="bg-vf-cream/50 border-vf-gold/20 text-vf-navy/70"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="accept-terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-0.5 border-vf-gold/40 data-[state=checked]:bg-vf-gold data-[state=checked]:border-vf-gold"
                  />
                  <label htmlFor="accept-terms" className="text-sm text-vf-navy/70 cursor-pointer leading-snug">
                    I have read and accept the terms and conditions outlined in this proposal.
                  </label>
                </div>
                <Button
                  onClick={handleAccept}
                  disabled={accepting || !signatureName.trim() || !termsAccepted}
                  className="w-full bg-vf-gold hover:bg-vf-gold/90 text-white font-semibold text-base py-6 shadow-md transition-all"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Accept & Proceed to Payment"
                  )}
                </Button>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Already Accepted */}
        {normalizedStatus === "accepted" && (
          <AnimatedSection>
            <Card className="border-green-300/50 shadow-xl bg-green-50/30">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="font-serif text-2xl text-vf-navy">Proposal Accepted</h2>
                <p className="text-vf-navy/60">
                  This proposal has been accepted. Thank you for confirming your event.
                </p>
                {proposal.signature_name && (
                  <div className="inline-block bg-white/60 border border-green-200 rounded-lg px-6 py-4 mt-2">
                    <p className="text-xs text-vf-navy/40 uppercase tracking-wider mb-1">Signed by</p>
                    <p className="text-vf-navy font-serif text-lg">{proposal.signature_name}</p>
                    {proposal.signature_date && (
                      <p className="text-sm text-vf-navy/50 mt-1">
                        {formatDate(proposal.signature_date.split("T")[0])}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Invite Card */}
        {proposal.invite_message && proposal.event_date && isSectionVisible(sectionsConfig, "invite_card") && (
          <AnimatedSection id="invite" className="scroll-mt-20">
            <ProposalInviteCard
              eventName={proposal.hero_headline ?? organization?.name ?? "Your Event"}
              eventDate={proposal.event_date}
              venueName={venueSpace?.name ?? organization?.name ?? "Venue"}
              venueAddress={proposal.venue_address ?? null}
              message={proposal.invite_message ?? null}
              shareUrl={shareUrl}
            />
          </AnimatedSection>
        )}
      </div>

      {/* Upsell Banner */}
      {upsellBanner?.enabled && upsellBanner.title && upsellBanner.description && (
        <AnimatedSection>
          <ProposalUpsellBanner
            title={upsellBanner.title}
            description={upsellBanner.description}
            ctaText={upsellBanner.cta_text}
            ctaUrl={upsellBanner.cta_url}
          />
        </AnimatedSection>
      )}

      {/* Footer */}
      <ProposalFooter
        venueName={organization?.name ?? "Venue"}
        venueLogoUrl={effectiveLogoUrl}
        address={proposal.venue_address ?? undefined}
        orgSettings={orgSettings}
      />

      {/* Floating CTA */}
      <ProposalFloatingCTA visible={normalizedStatus === "sent"} />
    </div>
  );
}

export default ProposalClientView;
