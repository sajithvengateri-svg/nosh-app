import { create } from "zustand";
import { Share } from "react-native";
import { supabase } from "../supabase";
import { useFeedStore } from "./feedStore";
import { useCompanionStore } from "../companion/companionStore";
import { successNotification } from "../haptics";
import {
  buildShareMessage,
  tallyVotes,
  getEventTypeLabel,
} from "../utils/socialCookingUtils";

// ── Types ──────────────────────────────────────────────────────────

export type SocialEventType = "sunday_roast" | "party" | "dutch_nosh";

export type SocialEventStatus =
  | "planning"
  | "voting"
  | "locked"
  | "shopping"
  | "cooking"
  | "done"
  | "cancelled";

export type SocialView =
  | "picker"
  | "setup"
  | "invite"
  | "voting"
  | "menu_pick"
  | "role_assign"
  | "dish_board"
  | "boss_decides"
  | "dashboard";

export interface SocialEvent {
  id: string;
  host_user_id: string;
  event_type: SocialEventType;
  title: string;
  occasion: string | null;
  date_time: string;
  location: string | null;
  expected_guests: number | null;
  kids_count: number;
  dietary_requirements: string[];
  cuisine: string | null;
  vibe: string | null;
  budget_per_head: number | null;
  menu_selected: Record<string, unknown> | null;
  boss_user_id: string | null;
  ai_decides: boolean;
  public_url: string | null;
  status: SocialEventStatus;
  created_at?: string;
  updated_at?: string;
}

export interface SocialGuest {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  is_nosh_user: boolean;
  rsvp_status: "invited" | "confirmed" | "declined" | "maybe";
  dietary_requirements: string[];
}

export interface SocialVote {
  id: string;
  event_id: string;
  voter_user_id: string | null;
  voter_name: string | null;
  vote_category: string;
  vote_value: string;
}

export interface SocialDish {
  id: string;
  event_id: string;
  dish_category: string;
  dish_name: string;
  recipe_id: string | null;
  recipe_data: Record<string, unknown> | null;
  assigned_to_user_id: string | null;
  assigned_to_name: string | null;
  shopping_list: Record<string, unknown> | null;
  prep_timeline: Record<string, unknown> | null;
  status: "open" | "claimed" | "prepping" | "ready" | "dropped";
  check_in_48h: boolean;
  check_in_day_of: boolean;
}

export interface SocialRole {
  id: string;
  event_id: string;
  user_id: string | null;
  person_name: string;
  role_name: string;
  tasks: string[];
}

// ── Store ──────────────────────────────────────────────────────────

interface SocialCookingState {
  currentView: SocialView;
  activeEvent: SocialEvent | null;
  guests: SocialGuest[];
  votes: SocialVote[];
  dishes: SocialDish[];
  roles: SocialRole[];
  myEvents: SocialEvent[];
  isLoading: boolean;
  draft: Partial<SocialEvent>;

  // Navigation
  setView: (view: SocialView) => void;
  reset: () => void;

  // CRUD
  fetchMyEvents: () => Promise<void>;
  createEvent: (type: SocialEventType) => void;
  saveEvent: () => Promise<string | null>;
  loadEvent: (eventId: string) => Promise<void>;
  updateEventStatus: (status: SocialEventStatus) => Promise<void>;
  cancelEvent: () => Promise<void>;
  updateDraft: (fields: Partial<SocialEvent>) => void;

  // Guests
  addGuest: (guest: Omit<SocialGuest, "id" | "event_id">) => Promise<void>;
  removeGuest: (guestId: string) => Promise<void>;

  // Sunday Roast
  castVote: (category: string, value: string) => Promise<void>;
  lockVoting: () => Promise<void>;
  bossDecides: (menu: Record<string, unknown>) => Promise<void>;

  // Party Mode
  setMenuOption: (option: Record<string, unknown>) => Promise<void>;
  assignRole: (personName: string, roleName: string, tasks: string[]) => Promise<void>;
  removeRole: (roleId: string) => Promise<void>;

  // Dutch Nosh
  addDish: (category: string, dishName: string, recipeId?: string) => Promise<void>;
  claimDish: (dishId: string, name: string) => Promise<void>;
  unclaimDish: (dishId: string) => Promise<void>;
  updateDishStatus: (dishId: string, status: string) => Promise<void>;

  // Sharing
  shareEvent: () => Promise<void>;
}

export const useSocialCookingStore = create<SocialCookingState>((set, get) => ({
  currentView: "picker",
  activeEvent: null,
  guests: [],
  votes: [],
  dishes: [],
  roles: [],
  myEvents: [],
  isLoading: false,
  draft: {},

  // ── Navigation ──────────────────────────────────────────────────

  setView: (view) => set({ currentView: view }),

  reset: () =>
    set({
      currentView: "picker",
      activeEvent: null,
      guests: [],
      votes: [],
      dishes: [],
      roles: [],
      isLoading: false,
      draft: {},
    }),

  // ── CRUD ────────────────────────────────────────────────────────

  fetchMyEvents: async () => {
    set({ isLoading: true });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Events I host
      const { data: hosted } = await supabase
        .from("ds_social_events")
        .select("*")
        .eq("host_user_id", user.user.id)
        .not("status", "in", '("done","cancelled")')
        .order("date_time", { ascending: true });

      // Events I'm invited to
      const { data: invites } = await supabase
        .from("ds_social_event_guests")
        .select("event_id")
        .eq("user_id", user.user.id);

      let invitedEvents: SocialEvent[] = [];
      if (invites && invites.length > 0) {
        const ids = invites.map((i) => i.event_id);
        const { data: events } = await supabase
          .from("ds_social_events")
          .select("*")
          .in("id", ids)
          .not("status", "in", '("done","cancelled")');
        invitedEvents = (events ?? []) as SocialEvent[];
      }

      const all = [...(hosted ?? []), ...invitedEvents] as SocialEvent[];
      // Deduplicate by id
      const seen = new Set<string>();
      const unique = all.filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      set({ myEvents: unique, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createEvent: (type) => {
    set({
      draft: { event_type: type, kids_count: 0, ai_decides: false, dietary_requirements: [] },
      currentView: "setup",
      activeEvent: null,
      guests: [],
      votes: [],
      dishes: [],
      roles: [],
    });
  },

  saveEvent: async () => {
    const { draft } = get();
    if (!draft.title || !draft.date_time || !draft.event_type) return null;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const record = {
        host_user_id: user.user.id,
        event_type: draft.event_type,
        title: draft.title,
        occasion: draft.occasion ?? null,
        date_time: draft.date_time,
        location: draft.location ?? null,
        expected_guests: draft.expected_guests ?? null,
        kids_count: draft.kids_count ?? 0,
        dietary_requirements: JSON.stringify(draft.dietary_requirements ?? []),
        cuisine: draft.cuisine ?? null,
        vibe: draft.vibe ?? null,
        budget_per_head: draft.budget_per_head ?? null,
        boss_user_id: draft.boss_user_id ?? null,
        ai_decides: draft.ai_decides ?? false,
        status: "planning" as const,
      };

      const { data, error } = await supabase
        .from("ds_social_events")
        .insert(record)
        .select()
        .single();

      if (error || !data) return null;

      const event = data as SocialEvent;
      set({ activeEvent: event, currentView: "invite" });

      // Inject feed card
      useFeedStore.getState().prependCard({
        id: `social-${event.id}`,
        type: "social_event",
        data: {
          eventId: event.id,
          eventType: event.event_type,
          title: event.title,
          hostName: "You",
          isHost: true,
          dateTime: event.date_time,
          status: event.status,
          guestCount: 0,
        },
      });

      // Signal enrichment — personality engine
      import("./personalityStore").then(({ usePersonalityStore }) => {
        usePersonalityStore.getState().logSignal("social_event_created", JSON.stringify({
          eventType: event.event_type,
          guestCount: event.expected_guests ?? 0,
        }));
      });

      return event.id;
    } catch {
      return null;
    }
  },

  loadEvent: async (eventId) => {
    set({ isLoading: true });
    try {
      const [eventRes, guestsRes, votesRes, dishesRes, rolesRes] = await Promise.all([
        supabase.from("ds_social_events").select("*").eq("id", eventId).single(),
        supabase.from("ds_social_event_guests").select("*").eq("event_id", eventId),
        supabase.from("ds_social_event_votes").select("*").eq("event_id", eventId),
        supabase.from("ds_social_event_dishes").select("*").eq("event_id", eventId),
        supabase.from("ds_social_event_roles").select("*").eq("event_id", eventId),
      ]);

      const event = eventRes.data as SocialEvent | null;
      if (!event) {
        set({ isLoading: false });
        return;
      }

      // Determine which view to show based on status + event type
      let view: SocialView = "dashboard";
      if (event.status === "planning") view = "setup";
      else if (event.status === "voting") view = "voting";

      set({
        activeEvent: event,
        guests: (guestsRes.data ?? []) as SocialGuest[],
        votes: (votesRes.data ?? []) as SocialVote[],
        dishes: (dishesRes.data ?? []) as SocialDish[],
        roles: (rolesRes.data ?? []) as SocialRole[],
        currentView: view,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  updateEventStatus: async (status) => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      await supabase
        .from("ds_social_events")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", activeEvent.id);

      set({ activeEvent: { ...activeEvent, status } });

      if (status === "done") {
        successNotification();
        useCompanionStore.getState().showPopUp("Dinner is served! Nice one.");
      }
    } catch {
      // Silently fail
    }
  },

  cancelEvent: async () => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      await supabase
        .from("ds_social_events")
        .update({ status: "cancelled" })
        .eq("id", activeEvent.id);

      set({ activeEvent: null, currentView: "picker" });
    } catch {
      // Silently fail
    }
  },

  updateDraft: (fields) =>
    set((s) => ({ draft: { ...s.draft, ...fields } })),

  // ── Guests ──────────────────────────────────────────────────────

  addGuest: async (guest) => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      const { data, error } = await supabase
        .from("ds_social_event_guests")
        .insert({ ...guest, event_id: activeEvent.id })
        .select()
        .single();

      if (!error && data) {
        set((s) => ({ guests: [...s.guests, data as SocialGuest] }));
      }
    } catch {
      // Silently fail
    }
  },

  removeGuest: async (guestId) => {
    try {
      await supabase.from("ds_social_event_guests").delete().eq("id", guestId);
      set((s) => ({ guests: s.guests.filter((g) => g.id !== guestId) }));
    } catch {
      // Silently fail
    }
  },

  // ── Sunday Roast: Voting ────────────────────────────────────────

  castVote: async (category, value) => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("ds_social_event_votes")
        .insert({
          event_id: activeEvent.id,
          voter_user_id: user.user?.id ?? null,
          voter_name: null,
          vote_category: category,
          vote_value: value,
        })
        .select()
        .single();

      if (!error && data) {
        set((s) => ({ votes: [...s.votes, data as SocialVote] }));
      }
    } catch {
      // Silently fail
    }
  },

  lockVoting: async () => {
    const { activeEvent, votes } = get();
    if (!activeEvent) return;

    const results = tallyVotes(votes);
    const menu = { votes: results, lockedAt: new Date().toISOString() };

    try {
      await supabase
        .from("ds_social_events")
        .update({
          status: "locked",
          menu_selected: menu,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeEvent.id);

      set({
        activeEvent: {
          ...activeEvent,
          status: "locked",
          menu_selected: menu,
        },
        currentView: "dashboard",
      });

      useCompanionStore.getState().showPopUp("Votes are in! Dinner is decided.");
    } catch {
      // Silently fail
    }
  },

  bossDecides: async (menu) => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      await supabase
        .from("ds_social_events")
        .update({
          status: "locked",
          menu_selected: menu,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeEvent.id);

      set({
        activeEvent: {
          ...activeEvent,
          status: "locked",
          menu_selected: menu,
        },
        currentView: "dashboard",
      });
    } catch {
      // Silently fail
    }
  },

  // ── Party Mode ──────────────────────────────────────────────────

  setMenuOption: async (option) => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      await supabase
        .from("ds_social_events")
        .update({
          menu_selected: option,
          status: "locked",
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeEvent.id);

      set({
        activeEvent: { ...activeEvent, menu_selected: option, status: "locked" },
        currentView: "role_assign",
      });
    } catch {
      // Silently fail
    }
  },

  assignRole: async (personName, roleName, tasks) => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      const { data, error } = await supabase
        .from("ds_social_event_roles")
        .insert({
          event_id: activeEvent.id,
          person_name: personName,
          role_name: roleName,
          tasks: JSON.stringify(tasks),
        })
        .select()
        .single();

      if (!error && data) {
        set((s) => ({ roles: [...s.roles, data as SocialRole] }));
      }
    } catch {
      // Silently fail
    }
  },

  removeRole: async (roleId) => {
    try {
      await supabase.from("ds_social_event_roles").delete().eq("id", roleId);
      set((s) => ({ roles: s.roles.filter((r) => r.id !== roleId) }));
    } catch {
      // Silently fail
    }
  },

  // ── Dutch Nosh: Dishes ──────────────────────────────────────────

  addDish: async (category, dishName, recipeId) => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      const { data, error } = await supabase
        .from("ds_social_event_dishes")
        .insert({
          event_id: activeEvent.id,
          dish_category: category,
          dish_name: dishName,
          recipe_id: recipeId ?? null,
          status: "open",
        })
        .select()
        .single();

      if (!error && data) {
        set((s) => ({ dishes: [...s.dishes, data as SocialDish] }));
      }
    } catch {
      // Silently fail
    }
  },

  claimDish: async (dishId, name) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      await supabase
        .from("ds_social_event_dishes")
        .update({
          assigned_to_user_id: user.user?.id ?? null,
          assigned_to_name: name,
          status: "claimed",
        })
        .eq("id", dishId);

      set((s) => ({
        dishes: s.dishes.map((d) =>
          d.id === dishId
            ? { ...d, assigned_to_user_id: user.user?.id ?? null, assigned_to_name: name, status: "claimed" as const }
            : d,
        ),
      }));
    } catch {
      // Silently fail
    }
  },

  unclaimDish: async (dishId) => {
    try {
      await supabase
        .from("ds_social_event_dishes")
        .update({
          assigned_to_user_id: null,
          assigned_to_name: null,
          status: "open",
        })
        .eq("id", dishId);

      set((s) => ({
        dishes: s.dishes.map((d) =>
          d.id === dishId
            ? { ...d, assigned_to_user_id: null, assigned_to_name: null, status: "open" as const }
            : d,
        ),
      }));
    } catch {
      // Silently fail
    }
  },

  updateDishStatus: async (dishId, status) => {
    try {
      await supabase
        .from("ds_social_event_dishes")
        .update({ status })
        .eq("id", dishId);

      set((s) => ({
        dishes: s.dishes.map((d) =>
          d.id === dishId ? { ...d, status: status as SocialDish["status"] } : d,
        ),
      }));
    } catch {
      // Silently fail
    }
  },

  // ── Sharing ─────────────────────────────────────────────────────

  shareEvent: async () => {
    const { activeEvent } = get();
    if (!activeEvent) return;

    try {
      const { message, url } = buildShareMessage(activeEvent);
      await Share.share({
        message,
        url,
        title: `${getEventTypeLabel(activeEvent.event_type)}: ${activeEvent.title}`,
      });
    } catch {
      // User cancelled or share failed
    }
  },
}));
