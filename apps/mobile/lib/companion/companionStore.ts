import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────────

export interface CompanionPreferences {
  skill_level: "beginner" | "intermediate" | "advanced" | null;
  cuisine_interests: string[];
  dietary_restrictions: string[];
  favorite_ingredients: string[];
  disliked_ingredients: string[];
  cooking_goals: string[];
  household_size: number | null;
  household_allergies: string[];
  kitchen_equipment: string[];
  time_preference: "quick" | "moderate" | "leisurely" | null;
  budget_preference: "budget" | "moderate" | "premium" | null;
  spice_tolerance: "mild" | "medium" | "hot" | "extra_hot" | null;
}

export interface CompanionMemory {
  successful_recipes: string[];
  failed_attempts: string[];
  learned_techniques: string[];
  conversation_topics: string[];
  last_interaction_summary: string | null;
  interaction_count: number;
  tips_given: number;
}

export interface CompanionProfile {
  id: string;
  user_id: string;
  org_id: string;
  companion_name: string;
  avatar_key: string;
  personality: "friendly" | "witty" | "calm" | "energetic";
  preferences: CompanionPreferences;
  memory: CompanionMemory;
  region: string;
  locale: string;
  units: string;
  currency: string;
  voice_enabled: boolean;
  voice_provider: "elevenlabs" | "vapi" | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ── Store ──────────────────────────────────────────────────────────

interface CompanionState {
  profile: CompanionProfile | null;
  isProfileLoaded: boolean;

  messages: ChatMessage[];
  isTyping: boolean;
  conversationId: string | null;

  setProfile: (p: CompanionProfile | null) => void;
  setProfileLoaded: (v: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  setIsTyping: (v: boolean) => void;
  setConversationId: (id: string | null) => void;
  clearMessages: () => void;
  reset: () => void;
}

export const useCompanionStore = create<CompanionState>((set) => ({
  profile: null,
  isProfileLoaded: false,
  messages: [],
  isTyping: false,
  conversationId: null,

  setProfile: (profile) => set({ profile }),
  setProfileLoaded: (isProfileLoaded) => set({ isProfileLoaded }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setIsTyping: (isTyping) => set({ isTyping }),
  setConversationId: (conversationId) => set({ conversationId }),
  clearMessages: () => set({ messages: [], conversationId: null }),
  reset: () => set({
    profile: null,
    isProfileLoaded: false,
    messages: [],
    isTyping: false,
    conversationId: null,
  }),
}));
