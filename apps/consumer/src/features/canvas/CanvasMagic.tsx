import { useEffect, useRef } from "react";
import { useCompanionStore } from "../../lib/companion/companionStore";
import { useFavouritesStore } from "../../lib/stores/favouritesStore";
import { usePhotoStore } from "../../lib/stores/photoStore";
import type { NoshResponse } from "../../lib/companion/responseTypes";

// ── Curated Content ─────────────────────────────────────────────

const DEALS = [
  { text: "20% off organic veg -- Borough Market", icon: "tag" },
  { text: "Fresh sourdough -- 2 for 1 today", icon: "tag" },
  { text: "Wild salmon fillets -- half price", icon: "percent" },
  { text: "Free-range eggs -- 3 dozen for 2", icon: "tag" },
  { text: "Artisan cheese board -- 30% off", icon: "percent" },
  { text: "Seasonal fruit box -- only 4.99", icon: "tag" },
  { text: "Olive oil tasting set -- 25% off", icon: "tag" },
  { text: "Fresh herbs bundle -- buy 2 get 1 free", icon: "percent" },
  { text: "Local honey -- farm gate price today", icon: "tag" },
  { text: "Premium steak cuts -- weekend special", icon: "percent" },
];

const TIPS = [
  "Season your cast iron before first use",
  "Let steaks rest 5 minutes after cooking",
  "Toast spices in a dry pan for deeper flavour",
  "Salt pasta water until it tastes like the sea",
  "Pat proteins dry before searing for a better crust",
  "Add a splash of pasta water to finish sauces",
  "Sharpen knives weekly -- dull knives are dangerous",
  "Rest dough 30 min for easier rolling",
  "Deglaze the pan to capture all the flavour",
  "Taste as you go -- adjust seasoning throughout",
];

const VIDEOS = [
  {
    title: "Master knife skills in 5 min",
    url: "https://youtube.com/watch?v=20gwf7YttEM",
    subtitle: "youtube.com",
  },
  {
    title: "Perfect pan sauce every time",
    url: "https://youtube.com/watch?v=hE2lnaJBsXA",
    subtitle: "youtube.com",
  },
  {
    title: "How to julienne vegetables",
    url: "https://youtube.com/watch?v=Uv2gFnTUrHU",
    subtitle: "youtube.com",
  },
  {
    title: "Poach an egg like a pro",
    url: "https://youtube.com/watch?v=66bFAqoR2II",
    subtitle: "youtube.com",
  },
  {
    title: "Caramelise onions properly",
    url: "https://youtube.com/watch?v=HeGEzgMa_08",
    subtitle: "youtube.com",
  },
  {
    title: "Make fresh pasta from scratch",
    url: "https://youtube.com/watch?v=HdSLKZ6LN94",
    subtitle: "youtube.com",
  },
  {
    title: "Crispy skin salmon technique",
    url: "https://youtube.com/watch?v=3ijMIIR8JG4",
    subtitle: "youtube.com",
  },
  {
    title: "Emulsify a vinaigrette",
    url: "https://youtube.com/watch?v=BPOFQp5BWFE",
    subtitle: "youtube.com",
  },
  {
    title: "Rest and carve a roast chicken",
    url: "https://youtube.com/watch?v=G-EL7VD1FHY",
    subtitle: "youtube.com",
  },
  {
    title: "Temper chocolate at home",
    url: "https://youtube.com/watch?v=0PVQEenWB_8",
    subtitle: "youtube.com",
  },
];

const SOCIAL_NUDGES = [
  "Host a dinner this weekend?",
  "Share your recipe with friends",
  "Cook together with someone tonight",
  "Invite a friend to try NOSH",
  "Start a dinner club",
  "Challenge a mate to a cook-off",
  "Plan a Sunday roast for the group",
  "Share what you cooked last night",
];

const RECIPE_SUGGESTIONS = [
  { title: "Pesto Gnocchi", cuisine: "Italian" },
  { title: "Miso Glazed Aubergine", cuisine: "Japanese" },
  { title: "One-pot Chicken Orzo", cuisine: "Mediterranean" },
  { title: "Prawn Pad Thai", cuisine: "Thai" },
  { title: "Shakshuka", cuisine: "Middle Eastern" },
  { title: "Mushroom Risotto", cuisine: "Italian" },
  { title: "Crispy Tofu Bowl", cuisine: "Asian Fusion" },
  { title: "Lamb Kofta Wraps", cuisine: "Turkish" },
  { title: "Lemon Herb Salmon", cuisine: "French" },
  { title: "Black Bean Tacos", cuisine: "Mexican" },
];

const PHOTO_CAPTIONS = [
  "Remember this one?",
  "That looked incredible",
  "You nailed this cook",
  "One of your best",
  "Worth making again",
  "A proper meal right there",
];

// ── Time Periods ────────────────────────────────────────────────

type TimePeriod = "morning" | "afternoon" | "evening" | "night";

function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "afternoon";
  if (hour >= 16 && hour < 21) return "evening";
  return "night";
}

// ── Helpers ─────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function randomDismiss(): number {
  return 15000 + Math.floor(Math.random() * 15000); // 15-30 seconds
}

// ── Content Generators ──────────────────────────────────────────

function generateSpendBubble(): NoshResponse {
  const amount = 30 + Math.floor(Math.random() * 40); // 30-69
  return {
    id: makeId("spend"),
    type: "bubble",
    content: "This week's spend",
    number: amount,
    icon: "wallet",
    dismissAfter: randomDismiss(),
    timestamp: Date.now(),
  };
}

function generateDealPill(): NoshResponse {
  const deal = pickRandom(DEALS);
  return {
    id: makeId("deal"),
    type: "pill",
    content: deal.text,
    icon: deal.icon,
    dismissAfter: randomDismiss(),
    timestamp: Date.now(),
  };
}

function generateRecipeCard(favourites: string[]): NoshResponse {
  const suggestion = pickRandom(RECIPE_SUGGESTIONS);
  const hasFavs = favourites.length > 0;
  return {
    id: makeId("recipe"),
    type: "card",
    content: hasFavs
      ? `Based on your favourites: Try ${suggestion.title} tonight`
      : `Try something new: ${suggestion.title}`,
    subtitle: suggestion.cuisine,
    icon: "chef_hat",
    action: "open_meal_plan",
    dismissAfter: randomDismiss(),
    timestamp: Date.now(),
  };
}

function generateTipPill(): NoshResponse {
  const tip = pickRandom(TIPS);
  return {
    id: makeId("tip"),
    type: "pill",
    content: tip,
    icon: "lightbulb",
    dismissAfter: randomDismiss(),
    timestamp: Date.now(),
  };
}

function generateVideLink(): NoshResponse {
  const video = pickRandom(VIDEOS);
  return {
    id: makeId("video"),
    type: "link",
    content: video.title,
    subtitle: video.subtitle,
    linkUrl: video.url,
    dismissAfter: randomDismiss(),
    timestamp: Date.now(),
  };
}

function generatePhotoMemory(
  photoUri: string,
  caption?: string,
): NoshResponse {
  const memoryCaption = pickRandom(PHOTO_CAPTIONS);
  return {
    id: makeId("photo"),
    type: "media",
    content: caption ? `${memoryCaption} -- ${caption}` : memoryCaption,
    imageUrl: photoUri,
    dismissAfter: randomDismiss(),
    timestamp: Date.now(),
  };
}

function generateSocialNudge(): NoshResponse {
  const nudge = pickRandom(SOCIAL_NUDGES);
  return {
    id: makeId("social"),
    type: "pill",
    content: nudge,
    icon: "users",
    dismissAfter: randomDismiss(),
    timestamp: Date.now(),
  };
}

function generateMealPlanReminder(): NoshResponse {
  return {
    id: makeId("mealplan"),
    type: "action",
    content: "Plan this week's meals",
    icon: "calendar",
    action: "open_meal_plan",
    dismissAfter: randomDismiss(),
    timestamp: Date.now(),
  };
}

// ── Weighted Pool by Time ───────────────────────────────────────

type GeneratorKey =
  | "spend"
  | "deal"
  | "recipe"
  | "tip"
  | "video"
  | "photo"
  | "social"
  | "mealplan";

const TIME_WEIGHTS: Record<TimePeriod, GeneratorKey[]> = {
  morning: [
    "mealplan",
    "mealplan",
    "deal",
    "deal",
    "tip",
    "tip",
    "recipe",
  ],
  afternoon: [
    "deal",
    "deal",
    "recipe",
    "recipe",
    "video",
    "video",
    "tip",
  ],
  evening: [
    "recipe",
    "recipe",
    "spend",
    "spend",
    "social",
    "social",
    "tip",
  ],
  night: [
    "photo",
    "photo",
    "mealplan",
    "tip",
    "tip",
    "social",
    "video",
  ],
};

// ── Hook ────────────────────────────────────────────────────────

const CYCLE_INTERVAL = 30000; // 30 seconds
const MAX_ITEMS_PER_CYCLE = 3;
const STAGGER_DELAY = 2500; // 2.5 seconds between pushes

export function useCanvasMagic() {
  const pushResponse = useCompanionStore((s) => s.pushResponse);
  const activeScreen = useCompanionStore((s) => s.activeScreen);
  const shownIds = useRef(new Set<string>()).current;
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Only run magic on the canvas screen
    if (activeScreen !== "canvas") return;

    function generateContent(key: GeneratorKey): NoshResponse | null {
      const favourites = useFavouritesStore.getState().favourites;
      const photos = usePhotoStore.getState().photos;
      const favouriteIds = favourites.map((f) => f.recipe_id);

      switch (key) {
        case "spend":
          return generateSpendBubble();
        case "deal":
          return generateDealPill();
        case "recipe":
          return generateRecipeCard(favouriteIds);
        case "tip":
          return generateTipPill();
        case "video":
          return generateVideLink();
        case "photo": {
          if (photos.length === 0) return null;
          // Prefer photos older than a few days for nostalgia
          const oldPhotos = photos.filter(
            (p) => Date.now() - p.timestamp > 3 * 24 * 60 * 60 * 1000,
          );
          const pool = oldPhotos.length > 0 ? oldPhotos : photos;
          const photo = pickRandom(pool);
          return generatePhotoMemory(photo.uri, photo.caption);
        }
        case "social":
          return generateSocialNudge();
        case "mealplan":
          return generateMealPlanReminder();
        default:
          return null;
      }
    }

    function runCycle() {
      const hour = new Date().getHours();
      const period = getTimePeriod(hour);
      const pool = TIME_WEIGHTS[period];

      // Pick 2-3 items from the weighted pool
      const count =
        2 + (Math.random() > 0.5 ? 1 : 0); // 2 or 3
      const selected: NoshResponse[] = [];
      const usedKeys = new Set<GeneratorKey>();

      for (let i = 0; i < count && selected.length < MAX_ITEMS_PER_CYCLE; i++) {
        const key = pickRandom(pool);

        // Avoid duplicate types within the same cycle
        if (usedKeys.has(key)) continue;
        usedKeys.add(key);

        const item = generateContent(key);
        if (!item) continue;

        // Deduplicate by checking content text against what we've shown
        const contentKey = `${item.type}:${item.content}`;
        if (shownIds.has(contentKey)) continue;

        shownIds.add(contentKey);
        selected.push(item);
      }

      // Stagger pushes so items appear organically
      selected.forEach((item, index) => {
        const timer = setTimeout(() => {
          pushResponse(item);
        }, index * STAGGER_DELAY);
        timersRef.current.push(timer);
      });
    }

    // Run initial cycle with a short delay so the screen settles first
    const initialTimer = setTimeout(runCycle, 1500);
    timersRef.current.push(initialTimer);

    // Periodic cycles
    const interval = setInterval(runCycle, CYCLE_INTERVAL);

    return () => {
      clearInterval(interval);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [activeScreen, pushResponse, shownIds]);
}
