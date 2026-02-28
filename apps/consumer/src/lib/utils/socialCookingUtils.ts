import React from "react";
import { format } from "date-fns";
import {
  UtensilsCrossed,
  PartyPopper,
  CookingPot,
  Salad,
  Beef,
  CakeSlice,
  Wine,
} from "lucide-react-native";
import { Colors } from "../../constants/colors";
import type {
  SocialEvent,
  SocialEventType,
  SocialEventStatus,
  SocialVote,
} from "../stores/socialCookingStore";

// ── Share Messages ────────────────────────────────────────────────

export function buildShareMessage(event: SocialEvent): {
  message: string;
  url?: string;
} {
  const dateStr = formatEventDate(event.date_time);

  switch (event.event_type) {
    case "sunday_roast":
      return {
        message: `Sunday Roast: ${event.title}\n${dateStr}${event.location ? ` at ${event.location}` : ""}\n\nOpen Prep Mi to vote on dinner!`,
        url: buildDeepLink(event.id),
      };
    case "party":
      return {
        message: `Party: ${event.title}\n${dateStr}${event.location ? ` at ${event.location}` : ""}\n\nOpen Prep Mi to see the menu and your role!`,
        url: buildDeepLink(event.id),
      };
    case "dutch_nosh":
      return {
        message: `Potluck: ${event.title}\n${dateStr}${event.location ? ` at ${event.location}` : ""}\n\nClaim a dish to bring!\n${buildPublicUrl(event.id)}`,
        url: buildPublicUrl(event.id),
      };
  }
}

export function buildDeepLink(eventId: string): string {
  return `nosh://social/${eventId}`;
}

export function buildPublicUrl(eventId: string): string {
  return `https://prepmi.app/potluck/${eventId}`;
}

// ── Vote Tallying ─────────────────────────────────────────────────

export function tallyVotes(
  votes: SocialVote[],
): Record<string, { winner: string; count: number; all: Record<string, number> }> {
  const categories: Record<string, Record<string, number>> = {};

  for (const vote of votes) {
    if (!categories[vote.vote_category]) {
      categories[vote.vote_category] = {};
    }
    const cat = categories[vote.vote_category];
    cat[vote.vote_value] = (cat[vote.vote_value] ?? 0) + 1;
  }

  const results: Record<string, { winner: string; count: number; all: Record<string, number> }> = {};

  for (const [category, tallies] of Object.entries(categories)) {
    let winner = "";
    let maxCount = 0;
    for (const [value, count] of Object.entries(tallies)) {
      if (count > maxCount) {
        winner = value;
        maxCount = count;
      }
    }
    results[category] = { winner, count: maxCount, all: tallies };
  }

  return results;
}

// ── Formatting ────────────────────────────────────────────────────

export function formatEventDate(dateTime: string): string {
  try {
    return format(new Date(dateTime), "EEEE d MMMM, h:mma");
  } catch {
    return dateTime;
  }
}

// ── Status ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<SocialEventStatus, string> = {
  planning: "Planning",
  voting: "Voting Open",
  locked: "Menu Locked",
  shopping: "Shopping",
  cooking: "Cooking",
  done: "Done",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<SocialEventStatus, string> = {
  planning: Colors.text.secondary,
  voting: Colors.primary,
  locked: Colors.success,
  shopping: Colors.alert,
  cooking: Colors.primary,
  done: Colors.success,
  cancelled: Colors.text.muted,
};

export function getStatusLabel(status: SocialEventStatus): string {
  return STATUS_LABELS[status];
}

export function getStatusColor(status: SocialEventStatus): string {
  return STATUS_COLORS[status];
}

// ── Event Type ────────────────────────────────────────────────────

const TYPE_ICON: Record<SocialEventType, React.ComponentType<any>> = {
  sunday_roast: UtensilsCrossed,
  party: PartyPopper,
  dutch_nosh: CookingPot,
};

const TYPE_LABELS: Record<SocialEventType, string> = {
  sunday_roast: "Sunday Roast",
  party: "Party Mode",
  dutch_nosh: "Dutch Prep",
};

export function getEventTypeIcon(type: SocialEventType): React.ComponentType<any> {
  return TYPE_ICON[type];
}

export function getEventTypeLabel(type: SocialEventType): string {
  return TYPE_LABELS[type];
}

// ── Party Mode Roles ──────────────────────────────────────────────

export function getRoleSuggestions(): { roleName: string; tasks: string[] }[] {
  return [
    { roleName: "Grill Master", tasks: ["Fire up the grill", "Cook proteins", "Monitor temps"] },
    { roleName: "Salad Prep", tasks: ["Wash greens", "Chop vegetables", "Make dressing"] },
    { roleName: "Sauce Boss", tasks: ["Make sauces", "Season dishes", "Taste test"] },
    { roleName: "Drink Mixer", tasks: ["Set up bar", "Make cocktails", "Keep drinks flowing"] },
    { roleName: "Dessert Chief", tasks: ["Prep dessert", "Plate sweets", "Coffee/tea service"] },
    { roleName: "Setup Crew", tasks: ["Set table", "Arrange seating", "Music + vibe"] },
  ];
}

// ── Dutch Nosh ────────────────────────────────────────────────────

export function getDishCategories(): string[] {
  return ["Starter", "Main", "Side", "Dessert", "Drinks"];
}

const CATEGORY_ICON: Record<string, React.ComponentType<any>> = {
  Starter: Salad,
  Main: Beef,
  Side: CookingPot,
  Dessert: CakeSlice,
  Drinks: Wine,
};

export function getDishCategoryIcon(category: string): React.ComponentType<any> {
  return CATEGORY_ICON[category] ?? UtensilsCrossed;
}
