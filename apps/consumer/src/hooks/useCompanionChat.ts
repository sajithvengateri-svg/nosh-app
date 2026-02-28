import { useState, useCallback } from "react";
import { supabase, supabaseUrl } from "../lib/supabase";
import { useCompanionStore, SmartBubble } from "../lib/companion/companionStore";
import { useAuth } from "../contexts/AuthProvider";
import { noshSpeak } from "../lib/companion/noshSpeak";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface CompanionResponse {
  message: string;
  bubbles?: SmartBubble[];
}

/**
 * useCompanionChat — sends messages to the companion-chat edge function
 * and updates the companion store with responses and smart bubbles.
 */
export function useCompanionChat() {
  const { profile } = useAuth();
  const { setBubbleState, setSmartBubbles, showPopUp, addMessage, voiceEnabled } =
    useCompanionStore();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (message: string) => {
      setIsLoading(true);
      setBubbleState("listening");
      addMessage({ role: "user", content: message, timestamp: Date.now() });

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const context = {
          cuisinePrefs: profile?.cuisine_preferences ?? [],
          spiceLevel: profile?.spice_level ?? 2,
          adventureLevel: profile?.adventure_level ?? 2,
          budgetPreference: profile?.budget_preference ?? "moderate",
        };

        const response = await fetch(
          `${supabaseUrl}/functions/v1/companion-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              message,
              history: history.slice(-6),
              context,
            }),
          }
        );

        const data: CompanionResponse = await response.json();

        // Update history
        const newHistory: ChatMessage[] = [
          ...history,
          { role: "user", content: message },
          { role: "assistant", content: data.message },
        ];
        setHistory(newHistory);

        // Update companion store
        addMessage({ role: "assistant", content: data.message, timestamp: Date.now() });
        showPopUp(data.message);

        // Speak response if voice mode is on
        if (voiceEnabled) {
          noshSpeak(data.message);
        }

        if (data.bubbles && data.bubbles.length > 0) {
          setSmartBubbles(data.bubbles);
          setBubbleState("has_suggestion");
        } else {
          setBubbleState("idle");
        }
      } catch (err) {
        console.error("companion chat error:", err);
        showPopUp("Sorry, I'm having a moment. Try again?");
        setBubbleState("idle");
      } finally {
        setIsLoading(false);
      }
    },
    [history, profile, setBubbleState, setSmartBubbles, showPopUp, addMessage]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    sendMessage,
    clearHistory,
    isLoading,
    history,
  };
}
