import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { CommunicationMode } from "../lib/companion/companionStore";

export interface NudgeConfigItem {
  id: string;
  key: string;
  label: string;
  pill_text: string | null;
  voice_prompt: string | null;
  icon_name: string;
  variant: "bubble" | "pill";
  pastel_color: string;
  enabled: boolean;
  sort_order: number;
  modes: string[];
  cam_relevant: boolean;
}

export function useNudgeConfig(mode?: CommunicationMode) {
  const [nudges, setNudges] = useState<NudgeConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ds_nudge_config")
        .select("*")
        .eq("enabled", true)
        .order("sort_order");
      if (data) setNudges(data as NudgeConfigItem[]);
      setIsLoading(false);
    })();
  }, []);

  // Filter by current mode if provided
  const filtered = mode
    ? nudges.filter((n) => {
        if (!n.modes.includes(mode === "mic" ? "voice" : mode)) return false;
        if (mode === "camera" && !n.cam_relevant) return false;
        return true;
      })
    : nudges;

  return { nudges: filtered, allNudges: nudges, isLoading };
}
