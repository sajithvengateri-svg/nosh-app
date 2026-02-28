import { create } from "zustand";
import { Keyboard } from "react-native";
import type { NoshResponse } from "./responseTypes";

// ── Types ──────────────────────────────────────────────────────────

export type CompanionPresence = "quiet" | "subtle" | "balanced" | "active";
export type CompanionPersona = "normal" | "sommelier" | "mixologist" | "kick_back";

export type BubbleState =
  | "idle"
  | "has_suggestion"
  | "listening"
  | "camera_ready"
  | "cooking"
  | "quiet";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export type CommunicationMode = "idle" | "mic" | "camera" | "text";

export interface SmartBubble {
  id: string;
  label: string;
  action: string;
  iconName?: string;
}

// ── Store ──────────────────────────────────────────────────────────

interface CompanionState {
  // Three-screen
  activeScreen: "canvas" | "feed" | "page";
  activePage: string | null;

  // Communication mode (mic / camera / text)
  communicationMode: CommunicationMode;
  textNavVisible: boolean;

  // Bubble
  bubbleState: BubbleState;
  persona: CompanionPersona;
  presence: CompanionPresence;

  // Inline input
  inputVisible: boolean;
  inputText: string;

  // Chat
  messages: ChatMessage[];
  isTyping: boolean;
  conversationId: string | null;

  // Response stack (canvas rich cards)
  responseStack: NoshResponse[];

  // Legacy smart bubbles (backward compat)
  smartBubbles: SmartBubble[];

  // Contextual pop-up
  popUpText: string | null;
  popUpVisible: boolean;

  // Wake-up state
  justWoke: boolean;

  // Voice output
  voiceEnabled: boolean;

  // Actions
  setActiveScreen: (screen: "canvas" | "feed" | "page") => void;
  setActivePage: (page: string | null) => void;
  setJustWoke: (v: boolean) => void;
  callNosh: () => void;
  setBubbleState: (state: BubbleState) => void;
  setPersona: (persona: CompanionPersona) => void;
  setPresence: (presence: CompanionPresence) => void;
  setInputVisible: (v: boolean) => void;
  setInputText: (text: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setIsTyping: (v: boolean) => void;
  setConversationId: (id: string | null) => void;
  pushResponse: (response: NoshResponse) => void;
  dismissResponse: (id: string) => void;
  clearResponses: () => void;
  setSmartBubbles: (bubbles: SmartBubble[]) => void;
  showPopUp: (text: string) => void;
  hidePopUp: () => void;
  setCommunicationMode: (mode: CommunicationMode) => void;
  setTextNavVisible: (v: boolean) => void;
  setVoiceEnabled: (v: boolean) => void;
  toggleVoice: () => void;
  clearMessages: () => void;
  reset: () => void;
}

const MAX_RESPONSES = 5;

export const useCompanionStore = create<CompanionState>((set) => ({
  activeScreen: "canvas",
  activePage: null,
  communicationMode: "idle",
  textNavVisible: false,
  bubbleState: "idle",
  persona: "normal",
  presence: "subtle",
  inputVisible: false,
  inputText: "",
  messages: [],
  isTyping: false,
  conversationId: null,
  responseStack: [],
  smartBubbles: [],
  popUpText: null,
  popUpVisible: false,
  justWoke: false,
  voiceEnabled: false,

  setActiveScreen: (activeScreen) => {
    Keyboard.dismiss();
    set((s) => ({
      activeScreen,
      // Reset communication mode when leaving canvas
      ...(activeScreen !== "canvas"
        ? { communicationMode: "idle" as const, textNavVisible: false, inputVisible: false }
        : {}),
    }));
  },
  setInputVisible: (inputVisible) => {
    if (!inputVisible) Keyboard.dismiss();
    set({ inputVisible });
  },
  setActivePage: (activePage) => set({ activePage }),
  setJustWoke: (justWoke) => set({ justWoke }),
  callNosh: () => {
    Keyboard.dismiss();
    set((s) => ({
      activeScreen: "canvas",
      activePage: null,
      justWoke: true,
      responseStack: [
        {
          id: `wake-${Date.now()}`,
          type: "pill" as const,
          content: "Hey! What can I help with?",
          icon: "sparkles",
          timestamp: Date.now(),
          dismissAfter: 8000,
        },
        ...s.responseStack,
      ].slice(0, MAX_RESPONSES),
    }));
  },
  setBubbleState: (bubbleState) => set({ bubbleState }),
  setPersona: (persona) => set({ persona }),
  setPresence: (presence) => set({ presence }),
  setInputText: (inputText) => set({ inputText }),
  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  setIsTyping: (isTyping) => set({ isTyping }),
  setConversationId: (conversationId) => set({ conversationId }),
  pushResponse: (response) =>
    set((s) => ({
      responseStack: [response, ...s.responseStack].slice(0, MAX_RESPONSES),
    })),
  dismissResponse: (id) =>
    set((s) => ({
      responseStack: s.responseStack.filter((r) => r.id !== id),
    })),
  clearResponses: () => set({ responseStack: [] }),
  setSmartBubbles: (smartBubbles) => set({ smartBubbles }),
  showPopUp: (text) => set({ popUpText: text, popUpVisible: true }),
  hidePopUp: () => set({ popUpText: null, popUpVisible: false }),
  setCommunicationMode: (communicationMode) => set({ communicationMode, textNavVisible: false }),
  setTextNavVisible: (textNavVisible) => set({ textNavVisible }),
  setVoiceEnabled: (voiceEnabled) => set({ voiceEnabled }),
  toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
  clearMessages: () => set({ messages: [], conversationId: null }),
  reset: () =>
    set({
      activeScreen: "canvas",
      activePage: null,
      communicationMode: "idle",
      textNavVisible: false,
      bubbleState: "idle",
      persona: "normal",
      inputVisible: false,
      inputText: "",
      messages: [],
      isTyping: false,
      conversationId: null,
      responseStack: [],
      smartBubbles: [],
      popUpText: null,
      popUpVisible: false,
      justWoke: false,
    }),
}));
