import type { AppVariant, StoreMode, ComplianceFramework } from "../types/store.types.ts";

// ── Regions ─────────────────────────────────────────────────────────
// Add a new region here when expanding to a new country/city.

export interface RegionConfig {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  units: "metric" | "imperial";
  compliance: ComplianceFramework;
  greeting: string;
  homeGreeting: string;
  locale: string;
}

export const REGIONS: Record<string, RegionConfig> = {
  au: {
    id: "au", name: "Australia", currency: "AUD", currencySymbol: "$",
    units: "metric", compliance: "bcc",
    greeting: "Hey Chef", homeGreeting: "Hey Boss", locale: "en-AU",
  },
  in: {
    id: "in", name: "India", currency: "INR", currencySymbol: "₹",
    units: "metric", compliance: "fssai",
    greeting: "Namaste Chef", homeGreeting: "Namaste", locale: "en-IN",
  },
  uae: {
    id: "uae", name: "UAE", currency: "AED", currencySymbol: "د.إ",
    units: "metric", compliance: "dm",
    greeting: "Hello Chef", homeGreeting: "Hello", locale: "en-AE",
  },
  uk: {
    id: "uk", name: "United Kingdom", currency: "GBP", currencySymbol: "£",
    units: "metric", compliance: "fsa",
    greeting: "Hey Chef", homeGreeting: "Hey", locale: "en-GB",
  },
  sg: {
    id: "sg", name: "Singapore", currency: "SGD", currencySymbol: "S$",
    units: "metric", compliance: "sfa",
    greeting: "Hey Chef", homeGreeting: "Hey", locale: "en-SG",
  },
  us: {
    id: "us", name: "United States", currency: "USD", currencySymbol: "$",
    units: "imperial", compliance: "fda",
    greeting: "Hey Chef", homeGreeting: "Hey", locale: "en-US",
  },
};

// ── Streams ─────────────────────────────────────────────────────────
// The 3 verticals. Rarely changes.

export type AppStream = "chefos" | "homechef" | "eatsafe" | "vendor";

export interface StreamConfig {
  id: AppStream;
  label: string;
  storeMode: StoreMode;
  layout: "full" | "compliance";
  baseFeatures: string[] | null;
  releaseModules: string[];
}

export const STREAMS: Record<AppStream, StreamConfig> = {
  chefos: {
    id: "chefos", label: "ChefOS", storeMode: "restaurant",
    layout: "full", baseFeatures: null, releaseModules: [],
  },
  homechef: {
    id: "homechef", label: "HomeChef", storeMode: "home_cook",
    layout: "full",
    baseFeatures: [
      "dashboard", "recipes", "kitchen", "todo", "food-safety",
      "cheatsheets", "money-lite", "settings", "feedback", "games",
      "companion",
    ],
    releaseModules: [],
  },
  eatsafe: {
    id: "eatsafe", label: "EatSafe", storeMode: "restaurant",
    layout: "compliance",
    baseFeatures: [
      "dashboard", "food-safety", "scanner", "reports", "settings", "games",
    ],
    releaseModules: [
      "recipes", "ingredients", "prep", "kitchen-sections", "inventory",
      "menu-engineering", "production", "team", "roster", "calendar",
      "invoices", "marketplace", "ai-chat", "money-lite", "training", "games",
    ],
  },
  vendor: {
    id: "vendor", label: "VendorOS", storeMode: "restaurant",
    layout: "full",
    baseFeatures: ["dashboard", "demands", "deals", "settings"],
    releaseModules: [],
  },
};

// ── Brand config per variant ────────────────────────────────────────

export interface VariantBrand {
  name: string;
  slug: string;
  bundleId: string;
  scheme: string;
  accent: string;
  bg: string;
  splash: string;
  textColor: string;
  subtextColor: string;
  inputBg: string;
  inputBorder: string;
  tagline: string;
  signupTitle: string;
  signupSubtitle: string;
  loginTitle: string;
  images: string[];
}

export interface VariantEntry {
  stream: AppStream;
  region: string;
  brand: VariantBrand;
}

// ── The registry ────────────────────────────────────────────────────
// To add a new variant: 1) add key to AppVariant type  2) add entry here

export const VARIANT_REGISTRY: Record<AppVariant, VariantEntry> = {
  chefos: {
    stream: "chefos", region: "au",
    brand: {
      name: "ChefOS", slug: "chefos", bundleId: "com.chefos.pro", scheme: "chefos",
      accent: "#6366F1", bg: "#1A1A2E", splash: "#1A1A2E",
      textColor: "#FFFFFF", subtextColor: "#A0A0B0",
      inputBg: "#252542", inputBorder: "#3B3B5C",
      tagline: "Professional kitchen management.",
      signupTitle: "Create Account",
      signupSubtitle: "Professional kitchen management starts here",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80",
        "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80",
        "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800&q=80",
      ],
    },
  },

  homechef: {
    stream: "homechef", region: "au",
    brand: {
      name: "HomeChef", slug: "homechef", bundleId: "com.chefos.homechef", scheme: "homechef",
      accent: "#EA580C", bg: "#FFF7ED", splash: "#FF6B35",
      textColor: "#EA580C", subtextColor: "#78716C",
      inputBg: "#FFFFFF", inputBorder: "#E5E7EB",
      tagline: "Your home kitchen, organised.",
      signupTitle: "Join HomeChef",
      signupSubtitle: "Start organising your home kitchen",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
        "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800&q=80",
        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
      ],
    },
  },

  eatsafe_brisbane: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe", bundleId: "com.eatsafe.brisbane", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Brisbane.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "Food safety compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1599493758267-c6c884c4a70d?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  // ── Australia: State-Based EatSafe Variants ──────────────────────

  eatsafe_sydney: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe-sydney", bundleId: "com.eatsafe.sydney", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Sydney.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "NSW Food Authority compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  eatsafe_melbourne: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe-melbourne", bundleId: "com.eatsafe.melbourne", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Melbourne.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "Victorian food safety compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  eatsafe_perth: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe-perth", bundleId: "com.eatsafe.perth", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Perth.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "WA food safety compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1599493758267-c6c884c4a70d?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  eatsafe_adelaide: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe-adelaide", bundleId: "com.eatsafe.adelaide", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Adelaide.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "SA Health compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1599493758267-c6c884c4a70d?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  eatsafe_hobart: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe-hobart", bundleId: "com.eatsafe.hobart", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Hobart.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "Tasmanian food safety compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1599493758267-c6c884c4a70d?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  eatsafe_canberra: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe-canberra", bundleId: "com.eatsafe.canberra", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Canberra.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "ACT food safety compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1599493758267-c6c884c4a70d?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  eatsafe_darwin: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe-darwin", bundleId: "com.eatsafe.darwin", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Darwin.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "NT food safety compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1599493758267-c6c884c4a70d?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  eatsafe_au: {
    stream: "eatsafe", region: "au",
    brand: {
      name: "EatSafe", slug: "eatsafe-au", bundleId: "com.eatsafe.au", scheme: "eatsafe",
      accent: "#000080", bg: "#F0F0FF", splash: "#000080",
      textColor: "#000080", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D0D0E8",
      tagline: "Food safety compliance for Australia.",
      signupTitle: "Join EatSafe",
      signupSubtitle: "State-specific food safety compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1599493758267-c6c884c4a70d?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  india_fssai: {
    stream: "eatsafe", region: "in",
    brand: {
      name: "EatSafe India", slug: "chefos-in", bundleId: "com.chefos.india", scheme: "chefosin",
      accent: "#FF9933", bg: "#FFFAF0", splash: "#FF9933",
      textColor: "#FF9933", subtextColor: "#78716C",
      inputBg: "#FFFFFF", inputBorder: "#E5E7EB",
      tagline: "FSSAI food safety compliance, simplified.",
      signupTitle: "Join EatSafe India",
      signupSubtitle: "FSSAI food safety compliance for your kitchen",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
        "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80",
        "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?w=800&q=80",
      ],
    },
  },

  gcc_uae: {
    stream: "eatsafe", region: "uae",
    brand: {
      name: "EatSafe UAE", slug: "chefos-uae", bundleId: "com.chefos.uae", scheme: "chefosuae",
      accent: "#059669", bg: "#F0FDF4", splash: "#059669",
      textColor: "#059669", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D1E7DD",
      tagline: "Dubai Municipality & ADAFSA compliance, simplified.",
      signupTitle: "Join EatSafe UAE",
      signupSubtitle: "Dubai Municipality compliance for your kitchen",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
        "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
      ],
    },
  },
  // ── India: ChefOS + HomeChef ──────────────────────────────────────

  chefos_in: {
    stream: "chefos", region: "in",
    brand: {
      name: "ChefOS India", slug: "chefos-in", bundleId: "com.chefos.india.pro", scheme: "chefosinpro",
      accent: "#FF9933", bg: "#1A1A2E", splash: "#1A1A2E",
      textColor: "#FFFFFF", subtextColor: "#A0A0B0",
      inputBg: "#252542", inputBorder: "#3B3B5C",
      tagline: "Professional kitchen management for India.",
      signupTitle: "Create Account",
      signupSubtitle: "FSSAI-ready kitchen management",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
        "https://images.unsplash.com/photo-1567337710282-00832b415979?w=800&q=80",
        "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80",
      ],
    },
  },

  homechef_in: {
    stream: "homechef", region: "in",
    brand: {
      name: "HomeChef India", slug: "homechef-in", bundleId: "com.chefos.homechef.india", scheme: "homechefin",
      accent: "#EA580C", bg: "#FFF7ED", splash: "#FF6B35",
      textColor: "#EA580C", subtextColor: "#78716C",
      inputBg: "#FFFFFF", inputBorder: "#E5E7EB",
      tagline: "Your home kitchen, organised.",
      signupTitle: "Join HomeChef",
      signupSubtitle: "Organise your home kitchen",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
        "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800&q=80",
        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
      ],
    },
  },

  // ── UAE: ChefOS + HomeChef ──────────────────────────────────────

  chefos_uae: {
    stream: "chefos", region: "uae",
    brand: {
      name: "ChefOS UAE", slug: "chefos-uae-pro", bundleId: "com.chefos.uae.pro", scheme: "chefosuaepro",
      accent: "#059669", bg: "#1A1A2E", splash: "#1A1A2E",
      textColor: "#FFFFFF", subtextColor: "#A0A0B0",
      inputBg: "#252542", inputBorder: "#3B3B5C",
      tagline: "Professional kitchen management for the UAE.",
      signupTitle: "Create Account",
      signupSubtitle: "DM-compliant kitchen management",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80",
        "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80",
      ],
    },
  },

  homechef_uae: {
    stream: "homechef", region: "uae",
    brand: {
      name: "HomeChef UAE", slug: "homechef-uae", bundleId: "com.chefos.homechef.uae", scheme: "homechefuae",
      accent: "#059669", bg: "#F0FDF4", splash: "#059669",
      textColor: "#059669", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#D1E7DD",
      tagline: "Your home kitchen, organised.",
      signupTitle: "Join HomeChef",
      signupSubtitle: "Organise your home kitchen",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
        "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800&q=80",
        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
      ],
    },
  },

  // ── UK: London ──────────────────────────────────────────────────

  eatsafe_london: {
    stream: "eatsafe", region: "uk",
    brand: {
      name: "EatSafe London", slug: "eatsafe-london", bundleId: "com.eatsafe.london", scheme: "eatsafelon",
      accent: "#1E40AF", bg: "#EFF6FF", splash: "#1E40AF",
      textColor: "#1E40AF", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#BFDBFE",
      tagline: "Food safety compliance for London.",
      signupTitle: "Join EatSafe London",
      signupSubtitle: "FSA compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  chefos_uk: {
    stream: "chefos", region: "uk",
    brand: {
      name: "ChefOS UK", slug: "chefos-uk", bundleId: "com.chefos.uk", scheme: "chefosuk",
      accent: "#1E40AF", bg: "#1A1A2E", splash: "#1A1A2E",
      textColor: "#FFFFFF", subtextColor: "#A0A0B0",
      inputBg: "#252542", inputBorder: "#3B3B5C",
      tagline: "Professional kitchen management for the UK.",
      signupTitle: "Create Account",
      signupSubtitle: "FSA-ready kitchen management",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
        "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80",
        "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800&q=80",
      ],
    },
  },

  homechef_uk: {
    stream: "homechef", region: "uk",
    brand: {
      name: "HomeChef UK", slug: "homechef-uk", bundleId: "com.chefos.homechef.uk", scheme: "homechefuk",
      accent: "#1E40AF", bg: "#EFF6FF", splash: "#1E40AF",
      textColor: "#1E40AF", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#BFDBFE",
      tagline: "Your home kitchen, organised.",
      signupTitle: "Join HomeChef",
      signupSubtitle: "Organise your home kitchen",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
        "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800&q=80",
        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
      ],
    },
  },

  // ── Singapore ───────────────────────────────────────────────────

  eatsafe_sg: {
    stream: "eatsafe", region: "sg",
    brand: {
      name: "EatSafe Singapore", slug: "eatsafe-sg", bundleId: "com.eatsafe.sg", scheme: "eatsafesg",
      accent: "#DC2626", bg: "#FFF1F2", splash: "#DC2626",
      textColor: "#DC2626", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#FECDD3",
      tagline: "SFA food safety compliance, simplified.",
      signupTitle: "Join EatSafe Singapore",
      signupSubtitle: "SFA compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  chefos_sg: {
    stream: "chefos", region: "sg",
    brand: {
      name: "ChefOS Singapore", slug: "chefos-sg", bundleId: "com.chefos.sg", scheme: "chefossg",
      accent: "#DC2626", bg: "#1A1A2E", splash: "#1A1A2E",
      textColor: "#FFFFFF", subtextColor: "#A0A0B0",
      inputBg: "#252542", inputBorder: "#3B3B5C",
      tagline: "Professional kitchen management for Singapore.",
      signupTitle: "Create Account",
      signupSubtitle: "SFA-ready kitchen management",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
        "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80",
        "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800&q=80",
      ],
    },
  },

  homechef_sg: {
    stream: "homechef", region: "sg",
    brand: {
      name: "HomeChef Singapore", slug: "homechef-sg", bundleId: "com.chefos.homechef.sg", scheme: "homechefsg",
      accent: "#DC2626", bg: "#FFF1F2", splash: "#DC2626",
      textColor: "#DC2626", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#FECDD3",
      tagline: "Your home kitchen, organised.",
      signupTitle: "Join HomeChef",
      signupSubtitle: "Organise your home kitchen",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
        "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800&q=80",
        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
      ],
    },
  },

  // ── US: New York ────────────────────────────────────────────────

  eatsafe_ny: {
    stream: "eatsafe", region: "us",
    brand: {
      name: "EatSafe New York", slug: "eatsafe-ny", bundleId: "com.eatsafe.ny", scheme: "eatsafeny",
      accent: "#7C3AED", bg: "#F5F3FF", splash: "#7C3AED",
      textColor: "#7C3AED", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#DDD6FE",
      tagline: "FDA food safety compliance, simplified.",
      signupTitle: "Join EatSafe NY",
      signupSubtitle: "FDA compliance for your venue",
      loginTitle: "EatSafe Login",
      images: [
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        "https://images.unsplash.com/photo-1560053608-13721e0d69e8?w=800&q=80",
      ],
    },
  },

  chefos_us: {
    stream: "chefos", region: "us",
    brand: {
      name: "ChefOS US", slug: "chefos-us", bundleId: "com.chefos.us", scheme: "chefosus",
      accent: "#7C3AED", bg: "#1A1A2E", splash: "#1A1A2E",
      textColor: "#FFFFFF", subtextColor: "#A0A0B0",
      inputBg: "#252542", inputBorder: "#3B3B5C",
      tagline: "Professional kitchen management for the US.",
      signupTitle: "Create Account",
      signupSubtitle: "FDA-ready kitchen management",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80",
        "https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=800&q=80",
      ],
    },
  },

  homechef_us: {
    stream: "homechef", region: "us",
    brand: {
      name: "HomeChef US", slug: "homechef-us", bundleId: "com.chefos.homechef.us", scheme: "homechefus",
      accent: "#7C3AED", bg: "#F5F3FF", splash: "#7C3AED",
      textColor: "#7C3AED", subtextColor: "#64748B",
      inputBg: "#FFFFFF", inputBorder: "#DDD6FE",
      tagline: "Your home kitchen, organized.",
      signupTitle: "Join HomeChef",
      signupSubtitle: "Organize your home kitchen",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
        "https://images.unsplash.com/photo-1607478900766-efe13248b125?w=800&q=80",
        "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80",
      ],
    },
  },

  // ── Vendor ────────────────────────────────────────────────────────

  vendor: {
    stream: "vendor", region: "au",
    brand: {
      name: "VendorOS", slug: "vendoros", bundleId: "com.chefos.vendor", scheme: "vendoros",
      accent: "#0EA5E9", bg: "#0C1222", splash: "#0C1222",
      textColor: "#FFFFFF", subtextColor: "#94A3B8",
      inputBg: "#1E293B", inputBorder: "#334155",
      tagline: "Your vendor command centre.",
      signupTitle: "Register Your Business",
      signupSubtitle: "Start selling to hospitality professionals",
      loginTitle: "Welcome Back",
      images: [
        "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80",
        "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&q=80",
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80",
      ],
    },
  },
};

// ── Helpers ─────────────────────────────────────────────────────────

export function getVariant(key: AppVariant): VariantEntry {
  return VARIANT_REGISTRY[key];
}

export function getRegion(key: AppVariant): RegionConfig {
  return REGIONS[VARIANT_REGISTRY[key].region];
}

export function getStream(key: AppVariant): StreamConfig {
  return STREAMS[VARIANT_REGISTRY[key].stream];
}

export function isCompliance(key: AppVariant): boolean {
  return getStream(key).layout === "compliance";
}

export function isHomeCook(key: AppVariant): boolean {
  return getStream(key).storeMode === "home_cook";
}

export function isVendor(key: AppVariant): boolean {
  return getStream(key).id === "vendor";
}

// ── Derived lookups (backward compat for modeConfig consumers) ──────

export function getBaseFeatures(key: AppVariant): string[] | null {
  return getStream(key).baseFeatures;
}

export function getReleaseModules(key: AppVariant): string[] {
  return getStream(key).releaseModules;
}

export function getCompliance(key: AppVariant): ComplianceFramework {
  return getRegion(key).compliance;
}
