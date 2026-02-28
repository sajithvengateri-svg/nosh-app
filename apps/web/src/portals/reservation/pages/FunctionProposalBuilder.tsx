import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  Eye,
  Send,
  FileDown,
  UtensilsCrossed,
  Wine,
  FileText,
  Users,
  CalendarDays,
  DollarSign,
  ClipboardList,
  MessageSquare,
  Package,
  Receipt,
  Leaf,
  WheatOff,
  MilkOff,
  X,
  ImagePlus,
  Copy,
  Check,
  Link,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type {
  VFMenuTemplate,
  VFMenuSection,
  VFMenuItem,
  VFBeveragePackage,
  VFBeverageCategory,
} from "@/lib/shared/types/venueflow.types";
import ProposalHero from "../components/proposal/ProposalHero";
import ProposalMenuPage from "../components/proposal/ProposalMenuPage";
import ProposalRunsheet from "../components/proposal/ProposalRunsheet";
import ProposalVenueMap from "../components/proposal/ProposalVenueMap";
import ProposalInviteCard from "../components/proposal/ProposalInviteCard";
import VenueBrandKit, { type BrandKitData, DEFAULT_BRAND_KIT } from "../components/proposal/VenueBrandKit";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MenuSectionEditable {
  id?: string;
  title: string;
  description: string;
  pricing_type: "PER_HEAD" | "FLAT" | "INCLUDED";
  per_head_price: number;
  flat_price: number;
  sort_order: number;
  items: MenuItemEditable[];
}

interface MenuItemEditable {
  name: string;
  description: string;
  dietary_flags: string[];
}

interface AddOnItem {
  id: string;
  name: string;
  price: number;
}

interface DepositSchedule {
  deposit_percent: number;
  balance_due_days_before: number;
}

interface ProposalFormState {
  title: string;
  cover_message: string;
  event_date: string;
  start_time: string;
  end_time: string;
  party_size: number;
  room_hire_fee: number;
  minimum_spend: number;
  tax_rate: number;
  terms_and_conditions: string;
  venue_space_id: string;
  menu_template_id: string;
  beverage_package_id: string;
  client_name: string;
  client_company: string;
  client_email: string;
  client_phone: string;
}

// ---------------------------------------------------------------------------
// Dietary flag helpers
// ---------------------------------------------------------------------------

const DIETARY_FLAGS = [
  { value: "V", label: "Vegetarian", icon: Leaf, color: "bg-green-100 text-green-700" },
  { value: "VG", label: "Vegan", icon: Leaf, color: "bg-emerald-100 text-emerald-700" },
  { value: "GF", label: "Gluten Free", icon: WheatOff, color: "bg-amber-100 text-amber-700" },
  { value: "DF", label: "Dairy Free", icon: MilkOff, color: "bg-blue-100 text-blue-700" },
] as const;

function DietaryBadge({ flag }: { flag: string }) {
  const info = DIETARY_FLAGS.find((d) => d.value === flag);
  if (!info) return <Badge variant="outline" className="text-[10px] px-1">{flag}</Badge>;
  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${info.color} border-0`}>
      {info.value}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Money formatter
// ---------------------------------------------------------------------------

function money(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FunctionProposalBuilder = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId");
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id;

  // ------ Local state ------
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");
  const [clientView, setClientView] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const [proposal, setProposal] = useState<ProposalFormState>({
    title: "Event Proposal",
    cover_message:
      "Thank you for considering our venue for your upcoming event. We are delighted to present the following proposal for your consideration.",
    event_date: format(new Date(), "yyyy-MM-dd"),
    start_time: "18:00",
    end_time: "23:00",
    party_size: 20,
    room_hire_fee: 0,
    minimum_spend: 0,
    tax_rate: 10,
    terms_and_conditions:
      "A 50% deposit is required to confirm your booking. The balance is due 7 days prior to the event. Cancellations within 14 days of the event will forfeit the deposit.",
    venue_space_id: "",
    menu_template_id: "",
    beverage_package_id: "",
    client_name: "",
    client_company: "",
    client_email: "",
    client_phone: "",
  });

  const [menuSections, setMenuSections] = useState<MenuSectionEditable[]>([]);
  const [addOns, setAddOns] = useState<AddOnItem[]>([]);
  const [depositSchedule, setDepositSchedule] = useState<DepositSchedule>({
    deposit_percent: 50,
    balance_due_days_before: 7,
  });

  // New landing page fields
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [venueParkingNotes, setVenueParkingNotes] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [runsheet, setRunsheet] = useState<{ time: string; activity: string; notes: string }[]>([]);
  const [sectionsConfig, setSectionsConfig] = useState<Record<string, boolean>>({
    hero: true, event_details: true, menu: true, beverages: true,
    venue_map: true, runsheet: false, add_ons: true, pricing: true,
    deposit: true, terms: true, invite_card: false,
  });

  const [mediaItems, setMediaItems] = useState<Array<{ url: string; media_type: "image" | "video"; caption: string | null }>>([]);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaInputRef = React.useRef<HTMLInputElement>(null);

  // ------ Queries ------

  // Existing proposal (edit mode)
  const { data: existing, isLoading: loadingProposal } = useQuery({
    queryKey: ["res_function_proposal", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("res_function_proposals")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Existing menu sections (edit mode)
  const { data: existingSections = [] } = useQuery({
    queryKey: ["res_proposal_menu_sections", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("res_proposal_menu_sections")
        .select("*")
        .eq("proposal_id", id!)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!id,
  });

  // Existing proposal media (edit mode)
  const { data: existingMedia = [] } = useQuery({
    queryKey: ["res_proposal_media", id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("res_proposal_media")
        .select("*")
        .eq("proposal_id", id!)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!id,
  });

  // Venue spaces
  const { data: venueSpaces = [] } = useQuery({
    queryKey: ["res_venue_spaces", orgId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("res_venue_spaces")
        .select("*")
        .eq("org_id", orgId!)
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Client info (auto-fill from CRM)
  const { data: clientData } = useQuery({
    queryKey: ["res_function_clients", clientId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("res_function_clients")
        .select("*")
        .eq("id", clientId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  // Menu templates
  const { data: menuTemplates = [] } = useQuery({
    queryKey: ["vf_menu_templates", orgId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("vf_menu_templates")
        .select("*")
        .eq("org_id", orgId!)
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Beverage packages
  const { data: beveragePackages = [] } = useQuery({
    queryKey: ["vf_beverage_packages", orgId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("vf_beverage_packages")
        .select("*")
        .eq("org_id", orgId!)
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Organization settings (for brand kit)
  const { data: orgSettings } = useQuery({
    queryKey: ["org_settings_builder", orgId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("organizations")
        .select("settings")
        .eq("id", orgId!)
        .single();
      return (data?.settings || {}) as Record<string, any>;
    },
    enabled: !!orgId,
  });

  const brandKit: BrandKitData = (orgSettings?.brand_kit as BrandKitData) || DEFAULT_BRAND_KIT;

  const loadFromBrandKit = useCallback(() => {
    const items: Array<{ url: string; media_type: "image" | "video"; caption: string | null }> = [];
    if (brandKit.hero_photos && brandKit.hero_photos.length > 0) {
      brandKit.hero_photos.forEach((url) => items.push({ url, media_type: "image", caption: null }));
    }
    if (brandKit.food_bev_photos && brandKit.food_bev_photos.length > 0) {
      brandKit.food_bev_photos.forEach((url) => items.push({ url, media_type: "image", caption: null }));
    }
    if (brandKit.room_photos && brandKit.room_photos.length > 0) {
      brandKit.room_photos.forEach((url) => items.push({ url, media_type: "image", caption: null }));
    }
    if (items.length > 0) {
      setMediaItems(items);
      toast.success(`Loaded ${items.length} photos from Brand Kit`);
    } else {
      toast.info("No photos in Brand Kit. Upload photos in Settings → Proposals.");
    }
  }, [brandKit]);

  // ------ Auto-fill client from CRM ------
  useEffect(() => {
    if (clientData && isNew) {
      const c = clientData as any;
      setProposal((p) => ({
        ...p,
        client_name: c.contact_name || "",
        client_company: c.company_name || "",
        client_email: c.email || "",
        client_phone: c.phone || "",
      }));
    }
  }, [clientData, isNew]);

  // ------ Load existing proposal into form ------
  useEffect(() => {
    if (existing) {
      const e = existing as any;
      setProposal((p) => ({
        ...p,
        title: e.title || "Event Proposal",
        cover_message: e.cover_message || "",
        event_date: e.event_date || "",
        start_time: e.start_time?.slice(0, 5) || "18:00",
        end_time: e.end_time?.slice(0, 5) || "23:00",
        party_size: e.party_size || 20,
        room_hire_fee: Number(e.room_hire_fee) || 0,
        minimum_spend: Number(e.minimum_spend) || 0,
        tax_rate: Number(e.tax_rate) || 10,
        terms_and_conditions: e.terms_and_conditions || "",
        venue_space_id: e.venue_space_id || "",
        menu_template_id: e.menu_template_id || "",
        beverage_package_id: e.beverage_package_id || "",
        client_name: e.client_name || "",
        client_company: e.client_company || "",
        client_email: e.client_email || "",
        client_phone: e.client_phone || "",
      }));
      // Restore add-ons if stored
      if (Array.isArray(e.add_ons)) {
        setAddOns(e.add_ons);
      }
      // Restore deposit schedule if stored
      if (e.deposit_percent != null) {
        setDepositSchedule({
          deposit_percent: Number(e.deposit_percent) || 50,
          balance_due_days_before: Number(e.balance_due_days_before) || 7,
        });
      }
      // Restore new landing page fields
      if (e.hero_headline) setHeroHeadline(e.hero_headline);
      if (e.hero_subheadline) setHeroSubheadline(e.hero_subheadline);
      if (e.venue_address) setVenueAddress(e.venue_address);
      if (e.venue_parking_notes) setVenueParkingNotes(e.venue_parking_notes);
      if (e.invite_message) setInviteMessage(e.invite_message);
      if (Array.isArray(e.runsheet)) setRunsheet(e.runsheet);
      if (e.sections_config && typeof e.sections_config === 'object') {
        setSectionsConfig(prev => ({ ...prev, ...e.sections_config }));
      }
      // Load existing share URL if proposal was already sent
      if (e.share_token) {
        setShareUrl(`${window.location.origin}/proposal/${e.share_token}`);
      }
    }
  }, [existing]);

  // ------ Load existing menu sections ------
  useEffect(() => {
    if (existingSections.length > 0) {
      setMenuSections(
        existingSections.map((s: any) => ({
          id: s.id,
          title: s.title,
          description: s.description || "",
          pricing_type: s.pricing_type || "PER_HEAD",
          per_head_price: Number(s.per_head_price) || 0,
          flat_price: Number(s.flat_price) || 0,
          sort_order: s.sort_order,
          items: Array.isArray(s.items)
            ? s.items.map((item: any) => ({
                name: item.name || "",
                description: item.description || "",
                dietary_flags: Array.isArray(item.dietary_flags)
                  ? item.dietary_flags
                  : [],
              }))
            : [],
        }))
      );
    }
  }, [existingSections]);

  // ------ Load existing media ------
  useEffect(() => {
    if (existingMedia.length > 0) {
      setMediaItems(
        existingMedia.map((m: any) => ({
          url: m.url,
          media_type: m.media_type || "image",
          caption: m.caption || null,
        }))
      );
    }
  }, [existingMedia]);

  // ------ Selected beverage package data ------
  const selectedBevPackage: VFBeveragePackage | null = useMemo(() => {
    if (!proposal.beverage_package_id || beveragePackages.length === 0) return null;
    return (
      (beveragePackages as any[]).find(
        (bp: any) => bp.id === proposal.beverage_package_id
      ) || null
    );
  }, [proposal.beverage_package_id, beveragePackages]);

  // ------ Selected venue space data ------
  const selectedSpace = useMemo(() => {
    if (!proposal.venue_space_id || venueSpaces.length === 0) return null;
    return (venueSpaces as any[]).find((s: any) => s.id === proposal.venue_space_id) || null;
  }, [proposal.venue_space_id, venueSpaces]);

  // ------ Pricing calculations ------
  const menuPerHead = useMemo(() => {
    return menuSections.reduce((sum, s) => {
      if (s.pricing_type === "PER_HEAD") return sum + s.per_head_price;
      return sum;
    }, 0);
  }, [menuSections]);

  const menuFlatTotal = useMemo(() => {
    return menuSections.reduce((sum, s) => {
      if (s.pricing_type === "FLAT") return sum + s.flat_price;
      return sum;
    }, 0);
  }, [menuSections]);

  const bevPerHead = selectedBevPackage
    ? Number((selectedBevPackage as any).price_per_head) || 0
    : 0;

  const addOnsTotal = useMemo(() => {
    return addOns.reduce((sum, item) => sum + item.price, 0);
  }, [addOns]);

  const foodBevTotal =
    (menuPerHead + bevPerHead) * proposal.party_size + menuFlatTotal;
  const subtotal = foodBevTotal + proposal.room_hire_fee + addOnsTotal;
  const taxAmount = subtotal * (proposal.tax_rate / 100);
  const total = subtotal + taxAmount;
  const depositAmount = total * (depositSchedule.deposit_percent / 100);
  const balanceAmount = total - depositAmount;

  // ------ Media file upload handler ------
  const handleMediaFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !orgId) return;
    setUploadingMedia(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${orgId}/proposals/${Date.now()}.${ext}`;
        const { error } = await (supabase as any).storage
          .from("venue-photos")
          .upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = (supabase as any).storage.from("venue-photos").getPublicUrl(path);
        setMediaItems((prev) => [...prev, { url: data.publicUrl, media_type: "image", caption: null }]);
      }
      toast.success(`Photo${files.length > 1 ? "s" : ""} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = "";
    }
  }, [orgId]);

  // ------ Menu template selection handler ------
  const handleMenuTemplateSelect = useCallback(
    (templateId: string) => {
      setProposal((p) => ({ ...p, menu_template_id: templateId }));
      if (!templateId) {
        setMenuSections([]);
        return;
      }
      const template = (menuTemplates as any[]).find(
        (t: any) => t.id === templateId
      );
      if (!template) return;

      const sections: VFMenuSection[] = Array.isArray(template.sections)
        ? template.sections
        : [];

      setMenuSections(
        sections.map((sec: VFMenuSection, idx: number) => ({
          title: sec.title,
          description: "",
          pricing_type: "PER_HEAD" as const,
          per_head_price: Number(template.price_per_head) || 0,
          flat_price: 0,
          sort_order: idx,
          items: sec.items.map((item: VFMenuItem) => ({
            name: item.name,
            description: item.description || "",
            dietary_flags: Array.isArray(item.dietary_flags)
              ? item.dietary_flags
              : [],
          })),
        }))
      );
    },
    [menuTemplates]
  );

  // ------ Venue space selection handler ------
  const handleVenueSpaceSelect = useCallback(
    (spaceId: string) => {
      const space = (venueSpaces as any[]).find((s: any) => s.id === spaceId);
      setProposal((p) => ({
        ...p,
        venue_space_id: spaceId,
        room_hire_fee: space ? Number(space.room_hire_fee) || 0 : p.room_hire_fee,
        minimum_spend: space
          ? Number(space.minimum_spend) || 0
          : p.minimum_spend,
      }));
      // Auto-populate venue photos
      if (space?.photo_urls && Array.isArray(space.photo_urls) && space.photo_urls.length > 0) {
        setMediaItems(space.photo_urls.map((url: string) => ({
          url, media_type: "image" as const, caption: null,
        })));
      }
    },
    [venueSpaces]
  );

  // ------ Menu section helpers ------
  const updateSection = (idx: number, field: string, value: any) => {
    setMenuSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  const addMenuItem = (sectionIdx: number) => {
    setMenuSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              items: [
                ...s.items,
                { name: "", description: "", dietary_flags: [] },
              ],
            }
          : s
      )
    );
  };

  const updateMenuItem = (
    sectionIdx: number,
    itemIdx: number,
    field: string,
    value: any
  ) => {
    setMenuSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              items: s.items.map((item, j) =>
                j === itemIdx ? { ...item, [field]: value } : item
              ),
            }
          : s
      )
    );
  };

  const toggleDietaryFlag = (
    sectionIdx: number,
    itemIdx: number,
    flag: string
  ) => {
    setMenuSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? {
              ...s,
              items: s.items.map((item, j) =>
                j === itemIdx
                  ? {
                      ...item,
                      dietary_flags: item.dietary_flags.includes(flag)
                        ? item.dietary_flags.filter((f) => f !== flag)
                        : [...item.dietary_flags, flag],
                    }
                  : item
              ),
            }
          : s
      )
    );
  };

  const removeMenuItem = (sectionIdx: number, itemIdx: number) => {
    setMenuSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? { ...s, items: s.items.filter((_, j) => j !== itemIdx) }
          : s
      )
    );
  };

  const addSection = () => {
    setMenuSections((prev) => [
      ...prev,
      {
        title: "New Section",
        description: "",
        pricing_type: "PER_HEAD",
        per_head_price: 0,
        flat_price: 0,
        sort_order: prev.length,
        items: [],
      },
    ]);
  };

  const removeSection = (idx: number) => {
    setMenuSections((prev) => prev.filter((_, i) => i !== idx));
  };

  // ------ Add-on helpers ------
  const addAddOn = () => {
    setAddOns((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", price: 0 },
    ]);
  };

  const updateAddOn = (id: string, field: keyof AddOnItem, value: any) => {
    setAddOns((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeAddOn = (id: string) => {
    setAddOns((prev) => prev.filter((item) => item.id !== id));
  };

  // ------ Save handler ------
  const handleSave = async (statusOverride?: string) => {
    if (!orgId) return;
    setSaving(true);

    try {
      let proposalId = id;
      const proposalPayload = {
        org_id: orgId,
        client_id: clientId || null,
        title: proposal.title,
        cover_message: proposal.cover_message,
        event_date: proposal.event_date,
        start_time: proposal.start_time,
        end_time: proposal.end_time,
        party_size: proposal.party_size,
        room_hire_fee: proposal.room_hire_fee,
        minimum_spend: proposal.minimum_spend,
        subtotal,
        tax_rate: proposal.tax_rate,
        tax_amount: taxAmount,
        total,
        terms_and_conditions: proposal.terms_and_conditions,
        venue_space_id: proposal.venue_space_id || null,
        menu_template_id: proposal.menu_template_id || null,
        beverage_package_id: proposal.beverage_package_id || null,
        client_name: proposal.client_name || null,
        client_company: proposal.client_company || null,
        client_email: proposal.client_email || null,
        client_phone: proposal.client_phone || null,
        add_ons: addOns,
        deposit_percent: depositSchedule.deposit_percent,
        balance_due_days_before: depositSchedule.balance_due_days_before,
        deposit_amount: depositAmount,
        total_amount: total,
        hero_headline: heroHeadline || null,
        hero_subheadline: heroSubheadline || null,
        venue_address: venueAddress || null,
        venue_parking_notes: venueParkingNotes || null,
        invite_message: inviteMessage || null,
        runsheet: runsheet.length > 0 ? runsheet : [],
        sections_config: sectionsConfig,
      } as any;

      if (statusOverride) {
        proposalPayload.status = statusOverride;
      }

      if (isNew) {
        const proposalNumber = `P-${Date.now().toString(36).toUpperCase()}`;
        proposalPayload.proposal_number = proposalNumber;
        if (!statusOverride) proposalPayload.status = "draft";

        const { data, error } = await (supabase as any)
          .from("res_function_proposals")
          .insert(proposalPayload)
          .select()
          .single();
        if (error) throw error;
        proposalId = (data as any).id;
      } else {
        const { error } = await (supabase as any)
          .from("res_function_proposals")
          .update(proposalPayload)
          .eq("id", id!);
        if (error) throw error;

        // Delete existing sections, re-insert
        await (supabase as any)
          .from("res_proposal_menu_sections")
          .delete()
          .eq("proposal_id", id!);
      }

      // Insert menu sections
      if (menuSections.length > 0) {
        const sectionsToInsert = menuSections.map((s, i) => ({
          proposal_id: proposalId,
          title: s.title,
          description: s.description,
          pricing_type: s.pricing_type,
          per_head_price: s.per_head_price,
          flat_price: s.flat_price,
          sort_order: i,
          items: s.items,
        }));
        const { error: secError } = await (supabase as any)
          .from("res_proposal_menu_sections")
          .insert(sectionsToInsert);
        if (secError) throw secError;
      }

      // Save media items
      if (proposalId) {
        await (supabase as any)
          .from("res_proposal_media")
          .delete()
          .eq("proposal_id", proposalId);
        if (mediaItems.length > 0) {
          const mediaToInsert = mediaItems.map((m, i) => ({
            proposal_id: proposalId,
            url: m.url,
            media_type: m.media_type,
            caption: m.caption,
            sort_order: i,
          }));
          await (supabase as any)
            .from("res_proposal_media")
            .insert(mediaToInsert);
        }
      }

      toast.success("Proposal saved");
      qc.invalidateQueries({ queryKey: ["res_function_proposal"] });
      qc.invalidateQueries({ queryKey: ["res_proposal_menu_sections"] });
      qc.invalidateQueries({ queryKey: ["res_function_proposals_client"] });

      if (isNew && proposalId) {
        navigate(`/reservation/functions/proposals/${proposalId}`, {
          replace: true,
        });
      }

      return proposalId;
    } catch (e: any) {
      toast.error(e.message || "Failed to save proposal");
      return null;
    } finally {
      setSaving(false);
    }
  };

  // ------ Send proposal handler ------
  const handleSendProposal = async () => {
    if (!orgId) return;
    setSending(true);

    try {
      // Save first, then update with share token + sent status
      const savedId = await handleSave();
      const proposalId = savedId || id;

      if (!proposalId) {
        throw new Error("Failed to save proposal before sending");
      }

      const shareToken = crypto.randomUUID();
      const { error } = await (supabase as any)
        .from("res_function_proposals")
        .update({
          status: "sent",
          share_token: shareToken,
        } as any)
        .eq("id", proposalId);

      if (error) throw error;

      const shareUrl = `${window.location.origin}/proposal/${shareToken}`;

      // Email client if email is set
      if (proposal.client_email) {
        try {
          await supabase.functions.invoke("vf-email-send", {
            body: {
              to: proposal.client_email,
              subject: `Your Event Proposal from ${currentOrg?.name || "Our Venue"}`,
              body: `Hi ${proposal.client_name || "there"},\n\nPlease find your event proposal attached. Click below to review the details and accept.\n\nWe look forward to hosting your event!`,
              orgId,
              type: "PROPOSAL_SENT",
              clientId: clientId || null,
              proposalShareUrl: shareUrl,
            },
          });
        } catch {
          // Email send is best-effort, don't block the flow
        }
      }

      // Log CRM activity
      if (clientId) {
        try {
          await (supabase as any).from("vf_pipeline_activities").insert({
            org_id: orgId,
            client_id: clientId,
            activity_type: "PROPOSAL_SENT",
            subject: `Proposal sent: ${proposal.title}`,
            body: `Share link: ${shareUrl}`,
          });
        } catch {
          // Activity log is best-effort
        }
      }

      // Store share URL for copy button
      setShareUrl(shareUrl);

      // Copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
        toast.success("Proposal sent! Share link copied to clipboard.", { duration: 5000 });
      } catch {
        toast.success(`Proposal sent! Share link: ${shareUrl}`, { duration: 8000 });
      }

      qc.invalidateQueries({ queryKey: ["res_function_proposal"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to send proposal");
    } finally {
      setSending(false);
    }
  };

  // ------ Loading state ------
  if (loadingProposal && !isNew) {
    return (
      <div className="flex items-center justify-center h-screen bg-vf-cream">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a2744] mx-auto" />
          <p className="text-sm text-muted-foreground">Loading proposal...</p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // EDITOR PANE
  // =========================================================================
  const EditorPane = (
    <div className="space-y-5 p-4 lg:p-6">
      {/* --- Client Info --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Users className="w-4 h-4 text-[#c9a55a]" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Contact Name</Label>
              <Input
                value={proposal.client_name}
                onChange={(e) =>
                  setProposal((p) => ({ ...p, client_name: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Company / Organisation</Label>
              <Input
                value={proposal.client_company}
                onChange={(e) =>
                  setProposal((p) => ({
                    ...p,
                    client_company: e.target.value,
                  }))
                }
                placeholder="Company name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={proposal.client_email}
                onChange={(e) =>
                  setProposal((p) => ({ ...p, client_email: e.target.value }))
                }
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={proposal.client_phone}
                onChange={(e) =>
                  setProposal((p) => ({ ...p, client_phone: e.target.value }))
                }
                placeholder="+61 400 000 000"
              />
            </div>
          </div>
          {clientId && clientData && (
            <p className="text-xs text-muted-foreground">
              Auto-filled from CRM record
            </p>
          )}
        </CardContent>
      </Card>

      {/* --- Event Details --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <CalendarDays className="w-4 h-4 text-[#c9a55a]" />
            Event Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Proposal Title</Label>
            <Input
              value={proposal.title}
              onChange={(e) =>
                setProposal((p) => ({ ...p, title: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Event Date</Label>
              <Input
                type="date"
                value={proposal.event_date}
                onChange={(e) =>
                  setProposal((p) => ({ ...p, event_date: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input
                type="time"
                value={proposal.start_time}
                onChange={(e) =>
                  setProposal((p) => ({ ...p, start_time: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>End Time</Label>
              <Input
                type="time"
                value={proposal.end_time}
                onChange={(e) =>
                  setProposal((p) => ({ ...p, end_time: e.target.value }))
                }
              />
            </div>
            <div>
              <Label>Guests</Label>
              <Input
                type="number"
                min={1}
                value={proposal.party_size}
                onChange={(e) =>
                  setProposal((p) => ({
                    ...p,
                    party_size: Math.max(1, +e.target.value || 1),
                  }))
                }
              />
            </div>
          </div>
          {venueSpaces.length > 0 && (
            <div>
              <Label>Venue Space</Label>
              <Select
                value={proposal.venue_space_id}
                onValueChange={handleVenueSpaceSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a space..." />
                </SelectTrigger>
                <SelectContent>
                  {(venueSpaces as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.hire_type}) — {s.capacity_max} pax
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Menu Template --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <UtensilsCrossed className="w-4 h-4 text-[#c9a55a]" />
            Menu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {menuTemplates.length > 0 && (
            <div>
              <Label>Menu Template</Label>
              <Select
                value={proposal.menu_template_id}
                onValueChange={handleMenuTemplateSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a menu template..." />
                </SelectTrigger>
                <SelectContent>
                  {(menuTemplates as any[]).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.tier}) — {money(Number(t.price_per_head))}/pp
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecting a template will replace current menu sections
              </p>
            </div>
          )}

          {/* Menu Sections */}
          {menuSections.map((section, si) => (
            <div
              key={si}
              className="border rounded-lg p-3 space-y-3 border-l-4 border-l-[#c9a55a]/40"
            >
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(si, "title", e.target.value)}
                  className="text-sm font-semibold border-none p-0 h-auto focus-visible:ring-0 shadow-none"
                  placeholder="Section title..."
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSection(si)}
                  className="text-destructive hover:text-destructive shrink-0 h-7 w-7"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Input
                value={section.description}
                onChange={(e) =>
                  updateSection(si, "description", e.target.value)
                }
                placeholder="Section description (optional)"
                className="text-xs"
              />

              <div className="flex items-center gap-3 flex-wrap">
                <Select
                  value={section.pricing_type}
                  onValueChange={(v) => updateSection(si, "pricing_type", v)}
                >
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_HEAD">Per Head</SelectItem>
                    <SelectItem value="FLAT">Flat Fee</SelectItem>
                    <SelectItem value="INCLUDED">Included</SelectItem>
                  </SelectContent>
                </Select>
                {section.pricing_type === "PER_HEAD" && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-20 h-8 text-xs"
                      value={section.per_head_price}
                      onChange={(e) =>
                        updateSection(si, "per_head_price", +e.target.value)
                      }
                    />
                    <span className="text-xs text-muted-foreground">/head</span>
                  </div>
                )}
                {section.pricing_type === "FLAT" && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={0}
                      className="w-24 h-8 text-xs"
                      value={section.flat_price}
                      onChange={(e) =>
                        updateSection(si, "flat_price", +e.target.value)
                      }
                    />
                  </div>
                )}
                {section.pricing_type !== "INCLUDED" && (
                  <span className="text-xs font-medium ml-auto text-[#1a2744]">
                    {money(
                      section.pricing_type === "PER_HEAD"
                        ? section.per_head_price * proposal.party_size
                        : section.flat_price
                    )}
                  </span>
                )}
              </div>

              <Separator />

              {/* Menu Items */}
              <div className="space-y-2">
                {section.items.map((item, ii) => (
                  <div key={ii} className="space-y-1.5 pl-2 border-l-2 border-gray-200">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateMenuItem(si, ii, "name", e.target.value)
                          }
                          placeholder="Dish name"
                          className="font-medium text-sm h-8"
                        />
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateMenuItem(
                              si,
                              ii,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Description (optional)"
                          className="text-xs h-7"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-7 w-7"
                        onClick={() => removeMenuItem(si, ii)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    {/* Dietary flags */}
                    <div className="flex gap-1 flex-wrap">
                      {DIETARY_FLAGS.map((df) => (
                        <button
                          key={df.value}
                          type="button"
                          onClick={() => toggleDietaryFlag(si, ii, df.value)}
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                            item.dietary_flags.includes(df.value)
                              ? df.color + " border-transparent font-medium"
                              : "bg-transparent text-muted-foreground border-gray-200 hover:border-gray-400"
                          }`}
                        >
                          {df.value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => addMenuItem(si)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Dish
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={addSection}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Menu Section
          </Button>
        </CardContent>
      </Card>

      {/* --- Beverage Package --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Wine className="w-4 h-4 text-[#c9a55a]" />
            Beverage Package
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {beveragePackages.length > 0 ? (
            <>
              <Select
                value={proposal.beverage_package_id}
                onValueChange={(v) =>
                  setProposal((p) => ({ ...p, beverage_package_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a beverage package..." />
                </SelectTrigger>
                <SelectContent>
                  {(beveragePackages as any[]).map((bp: any) => (
                    <SelectItem key={bp.id} value={bp.id}>
                      {bp.name} ({bp.tier}) —{" "}
                      {money(Number(bp.price_per_head))}/pp,{" "}
                      {bp.duration_hours}hr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBevPackage && (
                <div className="bg-muted/50 rounded-md p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">
                      {(selectedBevPackage as any).name}
                    </span>
                    <span>
                      {money(Number((selectedBevPackage as any).price_per_head))}
                      /pp
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(selectedBevPackage as any).duration_hours}-hour package
                  </p>
                  {Array.isArray((selectedBevPackage as any).includes) && (
                    <div className="space-y-1">
                      {((selectedBevPackage as any).includes as VFBeverageCategory[]).map(
                        (cat, ci) => (
                          <div key={ci} className="text-xs">
                            <span className="font-medium text-[#1a2744]">
                              {cat.category}:
                            </span>{" "}
                            <span className="text-muted-foreground">
                              {cat.items.join(", ")}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No beverage packages configured. Add packages in VenueFlow
              settings.
            </p>
          )}
        </CardContent>
      </Card>

      {/* --- Add-ons --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Package className="w-4 h-4 text-[#c9a55a]" />
            Add-ons & Extras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Room Hire Fee ($)</Label>
              <Input
                type="number"
                min={0}
                value={proposal.room_hire_fee}
                onChange={(e) =>
                  setProposal((p) => ({
                    ...p,
                    room_hire_fee: +e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Minimum Spend ($)</Label>
              <Input
                type="number"
                min={0}
                value={proposal.minimum_spend}
                onChange={(e) =>
                  setProposal((p) => ({
                    ...p,
                    minimum_spend: +e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Custom Line Items
            </Label>
            {addOns.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <Input
                  value={item.name}
                  onChange={(e) =>
                    updateAddOn(item.id, "name", e.target.value)
                  }
                  placeholder="Item name"
                  className="flex-1 h-8 text-sm"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) =>
                      updateAddOn(item.id, "price", +e.target.value)
                    }
                    className="w-24 h-8 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removeAddOn(item.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addAddOn}
              className="w-full h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Line Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- Dynamic Pricing Summary --- */}
      <Card className="border-[#c9a55a]/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <DollarSign className="w-4 h-4 text-[#c9a55a]" />
            Pricing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Menu ({money(menuPerHead)}/pp x {proposal.party_size} guests
              {menuFlatTotal > 0 ? ` + ${money(menuFlatTotal)} flat` : ""})
            </span>
            <span>
              {money(menuPerHead * proposal.party_size + menuFlatTotal)}
            </span>
          </div>
          {bevPerHead > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Beverages ({money(bevPerHead)}/pp x {proposal.party_size}{" "}
                guests)
              </span>
              <span>{money(bevPerHead * proposal.party_size)}</span>
            </div>
          )}
          {proposal.room_hire_fee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Room Hire</span>
              <span>{money(proposal.room_hire_fee)}</span>
            </div>
          )}
          {addOnsTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Add-ons</span>
              <span>{money(addOnsTotal)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm items-center">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Tax</span>
              <Input
                type="number"
                min={0}
                max={30}
                className="w-14 h-6 text-xs"
                value={proposal.tax_rate}
                onChange={(e) =>
                  setProposal((p) => ({ ...p, tax_rate: +e.target.value }))
                }
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <span>{money(taxAmount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-bold text-[#1a2744]">
            <span>Total</span>
            <span>{money(total)}</span>
          </div>
          {proposal.minimum_spend > 0 && total < proposal.minimum_spend && (
            <p className="text-xs text-amber-600 font-medium">
              Below minimum spend of {money(proposal.minimum_spend)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* --- Deposit Schedule --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Receipt className="w-4 h-4 text-[#c9a55a]" />
            Deposit Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Deposit (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={depositSchedule.deposit_percent}
                onChange={(e) =>
                  setDepositSchedule((d) => ({
                    ...d,
                    deposit_percent: Math.min(100, Math.max(0, +e.target.value)),
                  }))
                }
              />
            </div>
            <div>
              <Label>Balance Due (days before)</Label>
              <Input
                type="number"
                min={0}
                value={depositSchedule.balance_due_days_before}
                onChange={(e) =>
                  setDepositSchedule((d) => ({
                    ...d,
                    balance_due_days_before: +e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="bg-muted/50 rounded-md p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Deposit on booking ({depositSchedule.deposit_percent}%)
              </span>
              <span className="font-medium">{money(depositAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Balance due {depositSchedule.balance_due_days_before} days
                before event
              </span>
              <span className="font-medium">{money(balanceAmount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* --- Terms & Conditions --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <ClipboardList className="w-4 h-4 text-[#c9a55a]" />
            Terms & Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={5}
            value={proposal.terms_and_conditions}
            onChange={(e) =>
              setProposal((p) => ({
                ...p,
                terms_and_conditions: e.target.value,
              }))
            }
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* --- Cover Message --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <MessageSquare className="w-4 h-4 text-[#c9a55a]" />
            Cover Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={proposal.cover_message}
            onChange={(e) =>
              setProposal((p) => ({
                ...p,
                cover_message: e.target.value,
              }))
            }
            placeholder="Personalised greeting for the client..."
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* --- Hero & Branding --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Eye className="w-4 h-4 text-[#c9a55a]" />
            Hero & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Headline</Label>
            <Input value={heroHeadline} onChange={e => setHeroHeadline(e.target.value)} placeholder="An evening to remember..." />
          </div>
          <div>
            <Label>Subheadline</Label>
            <Input value={heroSubheadline} onChange={e => setHeroSubheadline(e.target.value)} placeholder="Crafted exclusively for your celebration" />
          </div>
        </CardContent>
      </Card>

      {/* --- Media & Photos --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <ImagePlus className="w-4 h-4 text-[#c9a55a]" />
            Media & Photos
          </CardTitle>
          <p className="text-xs text-muted-foreground">Add venue photos for the hero section and gallery.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => mediaInputRef.current?.click()}
              disabled={uploadingMedia}
              className="gap-1.5"
            >
              {uploadingMedia ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              Upload Photo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFromBrandKit}
              className="gap-1.5"
            >
              <ImagePlus className="w-4 h-4" />
              Load from Brand Kit
            </Button>
          </div>
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleMediaFileUpload}
          />
          <div className="flex gap-2">
            <Input
              value={newMediaUrl}
              onChange={e => setNewMediaUrl(e.target.value)}
              placeholder="Or paste image URL..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (newMediaUrl.trim()) {
                  setMediaItems(prev => [...prev, { url: newMediaUrl.trim(), media_type: "image", caption: null }]);
                  setNewMediaUrl("");
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
          {mediaItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {mediaItems.map((item, idx) => (
                <div key={idx} className="relative group rounded-md overflow-hidden border border-gray-200">
                  <img src={item.url} alt={item.caption || `Photo ${idx + 1}`} className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => setMediaItems(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 rounded-full bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {mediaItems.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No photos added. Upload photos, load from Brand Kit, or paste URLs above.</p>
          )}
        </CardContent>
      </Card>

      {/* --- Venue & Location --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Package className="w-4 h-4 text-[#c9a55a]" />
            Venue & Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Venue Address</Label>
            <Input value={venueAddress} onChange={e => setVenueAddress(e.target.value)} placeholder="123 Main St, Brisbane QLD 4000" />
          </div>
          <div>
            <Label>Parking Notes</Label>
            <Textarea rows={2} value={venueParkingNotes} onChange={e => setVenueParkingNotes(e.target.value)} placeholder="Street parking available on Smith St..." />
          </div>
        </CardContent>
      </Card>

      {/* --- Day-of Runsheet --- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <ClipboardList className="w-4 h-4 text-[#c9a55a]" />
              Runsheet
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setRunsheet(prev => [...prev, { time: "", activity: "", notes: "" }])}>
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {runsheet.length === 0 && <p className="text-sm text-muted-foreground">No runsheet items yet. Add items to create a day-of timeline.</p>}
          {runsheet.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input className="w-24" type="time" value={item.time} onChange={e => {
                const next = [...runsheet]; next[i] = { ...next[i], time: e.target.value }; setRunsheet(next);
              }} />
              <Input className="flex-1" value={item.activity} placeholder="Activity" onChange={e => {
                const next = [...runsheet]; next[i] = { ...next[i], activity: e.target.value }; setRunsheet(next);
              }} />
              <Input className="flex-1" value={item.notes} placeholder="Notes" onChange={e => {
                const next = [...runsheet]; next[i] = { ...next[i], notes: e.target.value }; setRunsheet(next);
              }} />
              <Button variant="ghost" size="icon" onClick={() => setRunsheet(prev => prev.filter((_, j) => j !== i))}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* --- Invite Card --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Send className="w-4 h-4 text-[#c9a55a]" />
            Invite Card Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={3} value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} placeholder="We'd love for you to join us for a special evening..." />
        </CardContent>
      </Card>

      {/* --- Section Visibility --- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Eye className="w-4 h-4 text-[#c9a55a]" />
            Section Visibility
          </CardTitle>
          <p className="text-xs text-muted-foreground">Toggle which sections appear on the client-facing proposal page.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(sectionsConfig).map(([key, visible]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize">{key.replace(/_/g, " ")}</span>
              <Switch checked={visible} onCheckedChange={v => setSectionsConfig(prev => ({ ...prev, [key]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bottom spacer for mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );

  // =========================================================================
  // PREVIEW PANE
  // =========================================================================
  const PreviewPane = (
    <div className="bg-white min-h-[600px] rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Hero Section */}
      {sectionsConfig.hero !== false && (
        <ProposalHero
          headline={heroHeadline || proposal.title || "Event Proposal"}
          subheadline={heroSubheadline || (proposal.client_name ? `Prepared for ${proposal.client_name}` : null)}
          eventDate={proposal.event_date || new Date().toISOString().split("T")[0]}
          venueName={selectedSpace ? (selectedSpace as any).name : currentOrg?.name || "Venue"}
          venueLogoUrl={(currentOrg as any)?.logo_url || null}
          mediaItems={mediaItems}
        />
      )}

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Cover Message */}
        {proposal.cover_message && (
          <div className="border-b border-gray-100 pb-6">
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{proposal.cover_message}</p>
          </div>
        )}

        {/* Event Details */}
        {sectionsConfig.event_details !== false && (
          <div className="border-b border-gray-100 pb-6">
            <h2 className="text-sm font-display uppercase tracking-widest text-[#c9a55a] mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Date</span>
                <p className="font-medium text-[#1a2744]">
                  {proposal.event_date ? format(new Date(proposal.event_date + "T00:00:00"), "EEEE, MMMM d, yyyy") : "TBD"}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Time</span>
                <p className="font-medium text-[#1a2744]">{proposal.start_time} &ndash; {proposal.end_time}</p>
              </div>
              <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Guests</span>
                <p className="font-medium text-[#1a2744]">{proposal.party_size}</p>
              </div>
              {selectedSpace && (
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Venue</span>
                  <p className="font-medium text-[#1a2744]">{(selectedSpace as any).name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Menu */}
        {sectionsConfig.menu !== false && menuSections.length > 0 && (
          <div className="border-b border-gray-100 pb-6">
            <ProposalMenuPage
              menuSections={menuSections.filter(s => s.items.some(i => i.name)).map(s => ({
                title: s.title || "Untitled Section",
                description: s.description || null,
                per_head_price: s.pricing_type === "PER_HEAD" ? s.per_head_price : 0,
                items: s.items.filter(i => i.name).map(i => ({ name: i.name, description: i.description })),
              }))}
              mediaItems={mediaItems.filter(m => m.media_type === "image").map(m => ({ url: m.url, caption: m.caption }))}
            />
          </div>
        )}

        {/* Beverage Package */}
        {sectionsConfig.beverages !== false && selectedBevPackage && (
          <div className="border-b border-gray-100 pb-6">
            <h2 className="text-sm font-display uppercase tracking-widest text-[#c9a55a] mb-4">Beverage Package</h2>
            <p className="text-sm font-medium text-[#1a2744] mb-1">{(selectedBevPackage as any).name}</p>
            <p className="text-xs text-gray-400 mb-3">
              {(selectedBevPackage as any).duration_hours}-hour package &middot; {money(Number((selectedBevPackage as any).price_per_head))} per person
            </p>
            {Array.isArray((selectedBevPackage as any).includes) && (
              <div className="space-y-1.5">
                {((selectedBevPackage as any).includes as VFBeverageCategory[]).map((cat, ci) => (
                  <div key={ci} className="text-xs">
                    <span className="font-medium text-[#1a2744]">{cat.category}</span>
                    <span className="text-gray-400"> &mdash; {cat.items.join(", ")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Venue & Location */}
        {sectionsConfig.venue_map !== false && (venueAddress || selectedSpace) && (
          <div className="border-b border-gray-100 pb-6">
            <ProposalVenueMap
              venueName={selectedSpace ? (selectedSpace as any).name : "Venue"}
              address={venueAddress || null}
              parkingNotes={venueParkingNotes || null}
            />
          </div>
        )}

        {/* Runsheet */}
        {sectionsConfig.runsheet !== false && runsheet.length > 0 && (
          <div className="border-b border-gray-100 pb-6">
            <ProposalRunsheet runsheet={runsheet} />
          </div>
        )}

        {/* Add-ons Preview */}
        {sectionsConfig.add_ons !== false && addOns.filter(a => a.name && a.price > 0).length > 0 && (
          <div className="border-b border-gray-100 pb-6">
            <h2 className="text-sm font-display uppercase tracking-widest text-[#c9a55a] mb-4">Add-ons & Extras</h2>
            <div className="space-y-2">
              {addOns.filter(a => a.name && a.price > 0).map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.name}</span>
                  <span className="text-[#1a2744]">{money(item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing */}
        {sectionsConfig.pricing !== false && (
          <div className="border-b border-gray-100 pb-6">
            <h2 className="text-sm font-display uppercase tracking-widest text-[#c9a55a] mb-4">Pricing</h2>
            <div className="space-y-2">
              {menuPerHead > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Menu ({money(menuPerHead)}/pp x {proposal.party_size})</span>
                  <span className="text-[#1a2744]">{money(menuPerHead * proposal.party_size)}</span>
                </div>
              )}
              {menuFlatTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Menu (flat items)</span>
                  <span className="text-[#1a2744]">{money(menuFlatTotal)}</span>
                </div>
              )}
              {bevPerHead > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Beverages ({money(bevPerHead)}/pp x {proposal.party_size})</span>
                  <span className="text-[#1a2744]">{money(bevPerHead * proposal.party_size)}</span>
                </div>
              )}
              {proposal.room_hire_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Room Hire</span>
                  <span className="text-[#1a2744]">{money(proposal.room_hire_fee)}</span>
                </div>
              )}
              {addOnsTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Add-ons</span>
                  <span className="text-[#1a2744]">{money(addOnsTotal)}</span>
                </div>
              )}
              <div className="w-full h-px bg-gray-200 my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-[#1a2744]">{money(subtotal)}</span>
              </div>
              {proposal.tax_rate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({proposal.tax_rate}%)</span>
                  <span className="text-[#1a2744]">{money(taxAmount)}</span>
                </div>
              )}
              <div className="w-full h-px bg-[#1a2744] my-2" />
              <div className="flex justify-between text-lg font-display font-bold text-[#1a2744]">
                <span>Total</span>
                <span>{money(total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Deposit Schedule */}
        {sectionsConfig.deposit !== false && (
          <div className="border-b border-gray-100 pb-6">
            <h2 className="text-sm font-display uppercase tracking-widest text-[#c9a55a] mb-4">Payment Schedule</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-[#1a2744]">Deposit on Booking</p>
                  <p className="text-xs text-gray-400">{depositSchedule.deposit_percent}% of total</p>
                </div>
                <span className="font-medium text-[#1a2744]">{money(depositAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="font-medium text-[#1a2744]">Balance Due</p>
                  <p className="text-xs text-gray-400">{depositSchedule.balance_due_days_before} days before event</p>
                </div>
                <span className="font-medium text-[#1a2744]">{money(balanceAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        {sectionsConfig.terms !== false && proposal.terms_and_conditions && (
          <div className="border-b border-gray-100 pb-6">
            <h2 className="text-sm font-display uppercase tracking-widest text-[#c9a55a] mb-4">Terms & Conditions</h2>
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{proposal.terms_and_conditions}</p>
          </div>
        )}

        {/* Invite Card */}
        {sectionsConfig.invite_card !== false && inviteMessage && (
          <ProposalInviteCard
            eventName={proposal.title || "Event"}
            eventDate={proposal.event_date || new Date().toISOString().split("T")[0]}
            venueName={selectedSpace ? (selectedSpace as any).name : currentOrg?.name || "Venue"}
            venueAddress={venueAddress || null}
            message={inviteMessage}
            shareUrl={typeof window !== "undefined" ? window.location.href : "#"}
          />
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#1a2744] text-center py-4 px-8">
        <p className="text-[10px] text-gray-400 tracking-widest uppercase">Powered by VenueFlow</p>
      </div>
    </div>
  );

  // =========================================================================
  // MAIN RENDER
  // =========================================================================
  return (
    <div className="min-h-screen bg-vf-cream">
      {/* ====== TOP ACTION BAR ====== */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <div className="flex items-center gap-2">
            {/* Client View toggle - desktop only */}
            <div className="hidden md:flex items-center gap-2 mr-3">
              <Label htmlFor="client-view-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Client View
              </Label>
              <Switch
                id="client-view-toggle"
                checked={clientView}
                onCheckedChange={setClientView}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled
              className="gap-1.5"
              title="PDF export coming soon"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave()}
              disabled={saving || sending}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Save Draft</span>
            </Button>

            {shareUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                    toast.success("Share link copied!");
                  } catch {
                    toast.info(shareUrl, { duration: 8000 });
                  }
                }}
                className="gap-1.5"
              >
                {linkCopied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                <span className="hidden sm:inline">{linkCopied ? "Copied!" : "Copy Link"}</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleSendProposal}
              disabled={saving || sending}
              className="gap-1.5 bg-[#1a2744] hover:bg-[#243556] text-white"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Send Proposal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ====== DESKTOP: Dual Pane Layout ====== */}
      <div className="hidden md:grid grid-cols-2 max-w-[1600px] mx-auto">
        {/* Left Pane - Editor (scrollable) */}
        <div className="h-[calc(100vh-53px)] overflow-y-auto border-r border-gray-200">
          {EditorPane}
        </div>

        {/* Right Pane - Preview (sticky, scrollable) */}
        <div className="h-[calc(100vh-53px)] overflow-y-auto bg-gray-50">
          <div className="p-6">
            {clientView && (
              <div className="mb-4 text-center">
                <Badge
                  variant="outline"
                  className="bg-[#c9a55a]/10 text-[#c9a55a] border-[#c9a55a]/30 font-display"
                >
                  <Eye className="w-3 h-3 mr-1.5" />
                  Client View Preview
                </Badge>
              </div>
            )}
            <div className="max-w-[600px] mx-auto">{PreviewPane}</div>
          </div>
        </div>
      </div>

      {/* ====== MOBILE: Tabbed Layout ====== */}
      <div className="md:hidden">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as "editor" | "preview")}
          className="w-full"
        >
          <TabsContent value="editor" className="mt-0">
            {EditorPane}
          </TabsContent>
          <TabsContent value="preview" className="mt-0">
            <div className="p-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Label htmlFor="client-view-toggle-mobile" className="text-xs text-muted-foreground cursor-pointer">
                  Client View
                </Label>
                <Switch
                  id="client-view-toggle-mobile"
                  checked={clientView}
                  onCheckedChange={setClientView}
                />
              </div>
              {PreviewPane}
            </div>
          </TabsContent>

          {/* Mobile bottom tab bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 md:hidden">
            <TabsList className="w-full h-14 rounded-none bg-white p-0">
              <TabsTrigger
                value="editor"
                className="flex-1 h-full rounded-none data-[state=active]:bg-[#1a2744]/5 data-[state=active]:text-[#1a2744] data-[state=active]:shadow-none gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className="flex-1 h-full rounded-none data-[state=active]:bg-[#1a2744]/5 data-[state=active]:text-[#1a2744] data-[state=active]:shadow-none gap-1.5"
              >
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default FunctionProposalBuilder;
