import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface CookQuip {
  id: string;
  text: string;
  emoji: string;
}

const DEFAULT_QUIPS: CookQuip[] = [
  { id: "d1", text: "Going well!", emoji: "\u{1F44C}" },
  { id: "d2", text: "Nice one, chef!", emoji: "\u{1F468}\u200D\u{1F373}" },
  { id: "d3", text: "Looking great!", emoji: "\u2728" },
  { id: "d4", text: "Let's go!", emoji: "\u{1F525}" },
  { id: "d5", text: "You're killing it!", emoji: "\u{1F4AA}" },
  { id: "d6", text: "Smells amazing!", emoji: "\u{1F60B}" },
  { id: "d7", text: "Keep it up!", emoji: "\u{1F31F}" },
  { id: "d8", text: "Nearly there!", emoji: "\u{1F389}" },
  { id: "d9", text: "Pro move!", emoji: "\u2B50" },
  { id: "d10", text: "That's the way!", emoji: "\u{1F44F}" },
  { id: "d11", text: "Nailed it!", emoji: "\u{1F3AF}" },
  { id: "d12", text: "Chef's kiss!", emoji: "\u{1F48B}" },
];

export function useCookQuips(): CookQuip[] {
  const [quips, setQuips] = useState<CookQuip[]>(DEFAULT_QUIPS);

  useEffect(() => {
    supabase
      .from("ds_cook_quips")
      .select("id, text, emoji")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setQuips(data);
        }
      });
  }, []);

  return quips;
}
