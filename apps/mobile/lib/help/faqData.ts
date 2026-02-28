import type { HelpStream } from "./helpData";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  /** Show only for these streams. Omit = show everywhere. */
  streams?: HelpStream[];
  /** Show only for these regions. Omit = show everywhere. */
  regions?: string[];
}

export function getFAQForVariant(items: FAQItem[], stream: HelpStream, region: string): FAQItem[] {
  return items.filter((item) => {
    if (item.streams && !item.streams.includes(stream)) return false;
    if (item.regions && !item.regions.includes(region)) return false;
    return true;
  });
}

export interface FAQCategory {
  key: string;
  label: string;
}

export const FAQ_CATEGORIES: FAQCategory[] = [
  { key: "general", label: "General" },
  { key: "account", label: "Account & Data" },
  { key: "features", label: "Features" },
  { key: "food-safety", label: "Food Safety" },
  { key: "troubleshooting", label: "Troubleshooting" },
];

export const FAQ_ITEMS: FAQItem[] = [
  // ── General ─────────────────────────────────────────
  {
    id: "faq-what-is",
    question: "What is Queitos?",
    answer:
      "Queitos is a kitchen management app available in two editions: ChefOS for professional kitchens (restaurants, cafes, catering) and HomeChef for home cooks. It covers recipes, inventory, food safety compliance, prep lists, costing, team management, and more.",
    category: "general",
  },
  {
    id: "faq-who-for",
    question: "Who is the app designed for?",
    answer:
      "ChefOS is built for head chefs, sous chefs, kitchen managers, and food safety officers in professional kitchens. HomeChef is designed for home cooks who want to organise recipes, plan meals, manage their pantry, and learn cooking skills with an AI companion.",
    category: "general",
  },
  {
    id: "faq-platforms",
    question: "What platforms does Queitos run on?",
    answer:
      "Queitos is available as a mobile app on iOS and Android, and as a web app accessible from any modern browser. Your data syncs across all devices in real time.",
    category: "general",
  },
  {
    id: "faq-offline",
    question: "Does the app work offline?",
    answer:
      "Core features like viewing recipes and prep lists work offline. Changes sync automatically when you reconnect. Some features like AI chat, scanning, and real-time team updates require an internet connection.",
    category: "general",
  },

  // ── Account & Data ──────────────────────────────────
  {
    id: "faq-free",
    question: "Is the app free to use?",
    answer:
      "The core features are free. Premium features like advanced analytics, additional team members, and extended compliance reporting are available through a subscription. Check Settings for current plan details.",
    category: "account",
  },
  {
    id: "faq-delete-account",
    question: "How do I delete my account?",
    answer:
      "Go to Settings > Privacy > Delete Account. This permanently removes all your data including recipes, logs, and team information. This action cannot be undone.",
    category: "account",
  },
  {
    id: "faq-data-privacy",
    question: "Is my data private and secure?",
    answer:
      "Yes. Your data is stored securely with end-to-end encryption in transit. We never share or sell your personal data. Food safety logs and compliance records are stored in accordance with local regulations. See our Privacy Policy in Settings for full details.",
    category: "account",
  },
  {
    id: "faq-export",
    question: "Can I export my data?",
    answer:
      "Yes. You can export recipes, inventory lists, food safety logs, and compliance reports. Go to Settings > Privacy > Export Data. Exports are available in PDF and CSV formats depending on the data type.",
    category: "account",
  },

  // ── Features ────────────────────────────────────────
  {
    id: "faq-scanning",
    question: "How does invoice/docket scanning work?",
    answer:
      "Point your camera at an invoice, docket, or food label. The AI reads the document, extracts item names, quantities, and prices, then lets you review and confirm before adding to your inventory or cost records. Works with most printed and handwritten documents.",
    category: "features",
  },
  {
    id: "faq-ai-companion",
    question: "What can the AI companion do?",
    answer:
      "The AI companion (HomeChef edition) helps with recipe suggestions, cooking techniques, meal planning, substitutions, and general kitchen advice. It learns your preferences over time and can operate in text or voice mode. It does not provide medical, dietary, or nutritional advice.",
    category: "features",
    streams: ["homechef"],
  },
  {
    id: "faq-mastery",
    question: "What is the Mastery Suite?",
    answer:
      "The Mastery Suite is a collection of skill-building games that help you improve kitchen speed and knowledge. Earn XP, climb leagues, and unlock achievements. Current games include Onion Blitz (speed slicing) and Alley Cat (ingredient catching). More games are added regularly.",
    category: "features",
  },
  {
    id: "faq-recipe-costing",
    question: "How does recipe costing work?",
    answer:
      "When you create a recipe, add ingredients with their purchase costs. The app calculates the cost per serving, food cost percentage, and suggested selling price based on your target margin. Costs update automatically when you update ingredient prices in your inventory.",
    category: "features",
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "faq-command-centre",
    question: "What is the To Do?",
    answer:
      "The To Do is your productivity hub. It includes a to-do list, shopping list, routines/workflows, and templates. You can create tasks by typing, scanning, or voice input. Tasks can be assigned to team members and tracked on a kanban board.",
    category: "features",
    streams: ["chefos", "homechef"],
  },

  // ── Food Safety ─────────────────────────────────────
  {
    id: "faq-compliance",
    question: "What compliance standards are supported?",
    answer:
      "ChefOS supports multiple compliance frameworks including BCC (Brisbane City Council), FSSAI (India), and general HACCP-based food safety standards. The framework is selected during setup and determines which checklists, audits, and reports are available.",
    category: "food-safety",
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "faq-temp-legal",
    question: "Are temperature logs legally valid?",
    answer:
      "Temperature logs recorded in the app include timestamps, user identity, and location data, making them suitable for compliance records. However, always check with your local food safety authority for specific record-keeping requirements in your jurisdiction.",
    category: "food-safety",
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "faq-temp-ranges",
    question: "What are the safe temperature ranges?",
    answer:
      "Cold storage: below 5\u00b0C (41\u00b0F). Frozen: below -18\u00b0C (0\u00b0F). Hot holding: above 60\u00b0C (140\u00b0F). Danger zone: 5-60\u00b0C (41-140\u00b0F). Cooking minimums vary by protein \u2014 chicken 75\u00b0C (165\u00b0F), beef/lamb 63\u00b0C (145\u00b0F) with 3-minute rest. The app flags out-of-range readings automatically.",
    category: "food-safety",
  },
  {
    id: "faq-haccp",
    question: "What is HACCP and how does the app help?",
    answer:
      "HACCP (Hazard Analysis Critical Control Points) is a systematic approach to food safety. The app helps you identify critical control points, set monitoring procedures, record temperature logs, track corrective actions, and generate audit-ready reports.",
    category: "food-safety",
    streams: ["chefos", "eatsafe"],
  },

  // ── Troubleshooting ─────────────────────────────────
  {
    id: "faq-camera-issue",
    question: "Camera is not working for scanning",
    answer:
      "Make sure you have granted camera permissions. Go to your device Settings > Apps > Queitos > Permissions > Camera and enable it. If the camera opens but scanning fails, ensure good lighting and hold the document steady. Restart the app if the issue persists.",
    category: "troubleshooting",
  },
  {
    id: "faq-slow",
    question: "The app is running slowly",
    answer:
      "Try closing and reopening the app. Clear the app cache in device Settings if needed. Make sure you are on the latest version. If you have a large number of recipes or logs, the app may take a moment to load \u2014 this is normal and improves after the initial sync.",
    category: "troubleshooting",
  },
  {
    id: "faq-sync",
    question: "My data is not syncing across devices",
    answer:
      "Ensure you are signed in with the same account on all devices and have a stable internet connection. Pull down to refresh on the main screen. If data is still missing, go to Settings > Privacy > Force Sync. Contact support if the issue continues.",
    category: "troubleshooting",
  },
  {
    id: "faq-lost-data",
    question: "I lost my data after an update",
    answer:
      "App updates do not delete data. If data appears missing, try signing out and back in, or force-syncing from Settings > Privacy. If you recently changed organisations or accounts, your data may be under a different profile. Contact support for recovery assistance.",
    category: "troubleshooting",
  },
];
