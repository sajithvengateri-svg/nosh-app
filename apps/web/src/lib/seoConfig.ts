const BASE = "https://chefos.ai";

export interface PageSEO {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
  hreflang?: { lang: string; href: string }[];
}

export const SEO: Record<string, PageSEO> = {
  "/": {
    title: "ChefOS — Kitchen Operating System for Chefs",
    description:
      "ChefOS is the all-in-one kitchen management platform. Recipe costing, inventory tracking, prep lists, food safety, team management and more — built by chefs, for chefs.",
    canonical: `${BASE}/`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "ChefOS",
      url: BASE,
      logo: `${BASE}/chefos-og.png`,
      description: "Kitchen Operating System for professional chefs and home cooks.",
      sameAs: [],
    },
    hreflang: [
      { lang: "en", href: `${BASE}/` },
      { lang: "en-IN", href: `${BASE}/chefos-india` },
      { lang: "en-AE", href: `${BASE}/chefos-gcc` },
    ],
  },

  "/home-cook": {
    title: "ChefOS for Home Cooks — Organise Your Kitchen",
    description:
      "Manage recipes, track your pantry, reduce food waste and plan meals. ChefOS Home Cook mode makes home cooking simpler and smarter.",
    canonical: `${BASE}/home-cook`,
  },

  "/vendor-landing": {
    title: "ChefOS Marketplace — Sell Direct to Kitchens",
    description:
      "Join the ChefOS Marketplace. List your products, receive orders from professional kitchens, and grow your wholesale business.",
    canonical: `${BASE}/vendor-landing`,
  },

  "/food-safety-landing": {
    title: "EatSafe by ChefOS — Digital Food Safety & HACCP",
    description:
      "Digitise your food safety with EatSafe. Temperature logs, cleaning checklists, audit reports and HACCP compliance — paperless and real-time.",
    canonical: `${BASE}/food-safety-landing`,
  },

  "/chefos-india": {
    title: "ChefOS India — Kitchen Management for Indian Restaurants",
    description:
      "ChefOS for Indian kitchens. Recipe costing in INR, tandoor & curry section management, FSSAI compliance tools and supplier integration.",
    canonical: `${BASE}/chefos-india`,
    hreflang: [
      { lang: "en", href: `${BASE}/` },
      { lang: "en-IN", href: `${BASE}/chefos-india` },
      { lang: "en-AE", href: `${BASE}/chefos-gcc` },
    ],
  },

  "/chefos-gcc": {
    title: "ChefOS GCC — Kitchen Management for Gulf Restaurants",
    description:
      "ChefOS for GCC kitchens. Recipe costing in AED, halal compliance tracking, multi-venue management and supplier tools for the Gulf region.",
    canonical: `${BASE}/chefos-gcc`,
    hreflang: [
      { lang: "en", href: `${BASE}/` },
      { lang: "en-IN", href: `${BASE}/chefos-india` },
      { lang: "en-AE", href: `${BASE}/chefos-gcc` },
    ],
  },

  "/home-cook-india": {
    title: "ChefOS Home Cook India — Organise Your Indian Kitchen",
    description:
      "Manage recipes, track your pantry, reduce food waste and plan meals. ChefOS Home Cook mode built for the Indian home kitchen.",
    canonical: `${BASE}/home-cook-india`,
    hreflang: [
      { lang: "en", href: `${BASE}/home-cook` },
      { lang: "en-IN", href: `${BASE}/home-cook-india` },
      { lang: "en-AE", href: `${BASE}/home-cook-gcc` },
    ],
  },

  "/food-safety-india": {
    title: "Food Safety OS India — FSSAI Compliance Simplified",
    description:
      "Digital food safety management for Indian restaurants and food businesses. FSSAI log books, temperature monitoring, audit reports and compliance dashboards.",
    canonical: `${BASE}/food-safety-india`,
    hreflang: [
      { lang: "en", href: `${BASE}/food-safety` },
      { lang: "en-IN", href: `${BASE}/food-safety-india` },
      { lang: "en-AE", href: `${BASE}/food-safety-gcc` },
    ],
  },

  "/home-cook-gcc": {
    title: "ChefOS Home Cook GCC — Organise Your Gulf Kitchen",
    description:
      "Manage recipes, track your pantry, reduce food waste and plan meals. ChefOS Home Cook mode built for home cooks in the Gulf.",
    canonical: `${BASE}/home-cook-gcc`,
    hreflang: [
      { lang: "en", href: `${BASE}/home-cook` },
      { lang: "en-IN", href: `${BASE}/home-cook-india` },
      { lang: "en-AE", href: `${BASE}/home-cook-gcc` },
    ],
  },

  "/food-safety-gcc": {
    title: "Food Safety OS GCC — Dubai Municipality & SFDA Compliance",
    description:
      "Digital food safety management for Gulf restaurants, hotels and catering. Dubai Municipality, SFDA and Halal compliance tools.",
    canonical: `${BASE}/food-safety-gcc`,
    hreflang: [
      { lang: "en", href: `${BASE}/food-safety` },
      { lang: "en-IN", href: `${BASE}/food-safety-india` },
      { lang: "en-AE", href: `${BASE}/food-safety-gcc` },
    ],
  },

  "/money-landing": {
    title: "MoneyOS — Financial Intelligence for Hospitality",
    description:
      "MoneyOS by ChefOS. P&L reactor, cost simulator, forensic analysis and real-time financial dashboards built for restaurant operators.",
    canonical: `${BASE}/money-landing`,
  },

  "/taste": {
    title: "Taste of IT — Technology for Hospitality",
    description:
      "Explore how technology transforms hospitality. From kitchen automation to guest experience — discover the Taste of IT by ChefOS.",
    canonical: `${BASE}/taste`,
  },

  "/faq": {
    title: "FAQ — ChefOS Help & Answers",
    description:
      "Find answers to common questions about ChefOS. Setup, pricing, features, integrations and more.",
    canonical: `${BASE}/faq`,
  },

  "/terms": {
    title: "Terms of Service — ChefOS",
    description: "ChefOS terms of service and user agreement.",
    canonical: `${BASE}/terms`,
  },

  "/privacy": {
    title: "Privacy Policy — ChefOS",
    description: "ChefOS privacy policy. How we collect, use and protect your data.",
    canonical: `${BASE}/privacy`,
  },

  "/auth": {
    title: "Sign In — ChefOS",
    description: "Sign in or create your ChefOS account.",
    canonical: `${BASE}/auth`,
    noindex: true,
  },
};
