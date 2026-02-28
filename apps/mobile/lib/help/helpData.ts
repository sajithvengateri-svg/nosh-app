/**
 * Help Centre content — all articles and workflows.
 * Version-tagged so content can be refreshed per release.
 */

export const APP_VERSION = "1.0.0";

// ── Types ────────────────────────────────────────────────

/** Streams the item applies to. Omit or set null for all. */
export type HelpStream = "chefos" | "homechef" | "eatsafe";

export interface HelpArticle {
  id: string;
  type: "article";
  category: string;
  icon: string;
  color: string;
  title: string;
  content: string[];
  tags: string[];
  appVersion: string;
  /** Show only for these streams. Omit = show everywhere. */
  streams?: HelpStream[];
  /** Show only for these regions (au, in, uae, uk, sg, us). Omit = show everywhere. */
  regions?: string[];
}

export interface WorkflowStep {
  title: string;
  description: string;
  icon: string;
  tip?: string;
}

export interface HelpWorkflow {
  id: string;
  type: "workflow";
  category: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  navigateTo?: string;
  tags: string[];
  appVersion: string;
  /** Show only for these streams. Omit = show everywhere. */
  streams?: HelpStream[];
  /** Show only for these regions. Omit = show everywhere. */
  regions?: string[];
}

export type HelpItem = HelpArticle | HelpWorkflow;

// ── Categories ───────────────────────────────────────────

export const CATEGORIES = [
  { key: "getting-started", label: "Getting Started", icon: "LayoutDashboard", color: "#6366F1" },
  { key: "recipes", label: "Recipes", icon: "BookOpen", color: "#F59E0B" },
  { key: "kitchen", label: "Kitchen & Prep", icon: "UtensilsCrossed", color: "#10B981" },
  { key: "command-centre", label: "To Do", icon: "ClipboardList", color: "#3B82F6" },
  { key: "food-safety", label: "Food Safety", icon: "ShieldCheck", color: "#EF4444" },
  { key: "scanning", label: "Scanning", icon: "Camera", color: "#8B5CF6" },
  { key: "games", label: "Games & XP", icon: "Gamepad2", color: "#F97316" },
  { key: "ai-companion", label: "AI Companion", icon: "Bot", color: "#06B6D4" },
  { key: "settings", label: "Settings", icon: "Settings", color: "#64748B" },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];

// ── Articles ─────────────────────────────────────────────

const V = APP_VERSION;

export const HELP_ARTICLES: HelpArticle[] = [
  // ── Getting Started ──
  {
    id: "gs-dashboard",
    type: "article",
    category: "getting-started",
    icon: "LayoutDashboard",
    color: "#6366F1",
    title: "Dashboard Overview",
    content: [
      "Your dashboard is the home screen — it shows key stats, companion widget, alerts, and your daily to-do list at a glance.",
      "The bottom tabs let you navigate between core features: Home, Recipes, Kitchen, Safety, Games, and Settings.",
      "Tap any card or widget to dive deeper. Most features are just one tap away.",
      "Pull down to refresh the dashboard stats and alerts.",
    ],
    tags: ["home", "dashboard", "start", "navigation", "stats"],
    appVersion: V,
  },
  {
    id: "gs-navigation",
    type: "article",
    category: "getting-started",
    icon: "Navigation",
    color: "#6366F1",
    title: "Navigation Guide",
    content: [
      "The bottom tab bar is your main navigation. Tap any icon to switch between sections.",
      "Within each section, hub grids show related features with icons and descriptions. Tap any card to enter that feature.",
      "Swipe back or tap the back arrow to return to the previous screen.",
      "Long-press the app icon on the dashboard for quick access to settings or sign out.",
    ],
    tags: ["tabs", "navigate", "menu", "back", "hub"],
    appVersion: V,
  },
  {
    id: "gs-setup",
    type: "article",
    category: "getting-started",
    icon: "UserPlus",
    color: "#6366F1",
    title: "First-Time Setup",
    content: [
      "After signing up, you'll see a getting-started checklist on your dashboard with key setup steps.",
      "Add your first recipe, log a temperature check, and create a prep list to unlock all features.",
      "Your AI companion can be set up from the dashboard — give it a name and pick a personality.",
      "Enable notifications in Settings to get reminders for prep tasks, safety checks, and low stock alerts.",
    ],
    tags: ["onboarding", "new", "account", "setup", "checklist"],
    appVersion: V,
  },

  // ── Recipes ──
  {
    id: "rec-create",
    type: "article",
    category: "recipes",
    icon: "PenLine",
    color: "#F59E0B",
    title: "Create a Recipe",
    content: [
      "Tap the Recipes tab, then the + button to create a new recipe.",
      "Add a title, category (Main, Starter, Dessert, etc.), and optionally a photo.",
      "Add ingredients with quantities and units. If the ingredient exists in your pantry, costs auto-calculate.",
      "Write method steps in order. You can reorder them by dragging.",
      "Save and your recipe is instantly available across your team.",
    ],
    tags: ["recipe", "create", "add", "new", "method", "ingredients"],
    appVersion: V,
  },
  {
    id: "rec-import",
    type: "article",
    category: "recipes",
    icon: "Camera",
    color: "#F59E0B",
    title: "Import Recipe from Photo",
    content: [
      "Take a photo of a handwritten recipe, printed card, or cookbook page.",
      "The AI reads the text and extracts the recipe title, ingredients, and method steps.",
      "Review the imported recipe, make any edits, and save.",
      "This works with various formats — handwritten notes, typed pages, and printed recipes.",
    ],
    tags: ["recipe", "import", "photo", "scan", "ocr", "camera"],
    appVersion: V,
  },
  {
    id: "rec-costing",
    type: "article",
    category: "recipes",
    icon: "DollarSign",
    color: "#F59E0B",
    title: "Costing & Margins",
    content: [
      "Each recipe auto-calculates food cost based on ingredient prices from your pantry.",
      "Set a selling price and the system shows your margin, cost percentage, and profit per portion.",
      "Ingredient costs update automatically when you scan new invoices or update supplier prices.",
      "Use Menu Engineering to identify which dishes are most profitable.",
    ],
    tags: ["cost", "price", "margin", "profit", "food cost", "money"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "rec-allergens",
    type: "article",
    category: "recipes",
    icon: "AlertTriangle",
    color: "#F59E0B",
    title: "Allergen Tracking",
    content: [
      "Each ingredient can be tagged with allergens (gluten, dairy, nuts, etc.).",
      "When you add ingredients to a recipe, allergens are automatically flagged on the recipe card.",
      "The allergen dashboard shows a matrix of all recipes and their allergen status.",
      "This helps you quickly answer customer allergy questions and stay compliant.",
    ],
    tags: ["allergen", "allergy", "gluten", "dairy", "nuts", "safety"],
    appVersion: V,
  },
  {
    id: "rec-collections",
    type: "article",
    category: "recipes",
    icon: "FolderOpen",
    color: "#F59E0B",
    title: "Recipe Collections",
    content: [
      "Organise recipes into collections like 'Summer Menu', 'Staff Meals', or 'Bake Sale'.",
      "Search recipes by name, ingredient, or category to find what you need fast.",
      "Filter by allergen status to quickly find safe options for dietary requirements.",
    ],
    tags: ["collection", "organise", "search", "filter", "category"],
    appVersion: V,
    streams: ["chefos", "homechef"],
  },

  // ── Kitchen & Prep ──
  {
    id: "kit-prep",
    type: "article",
    category: "kitchen",
    icon: "ClipboardList",
    color: "#10B981",
    title: "Prep Lists",
    content: [
      "Create daily prep lists from your recipes or add custom items.",
      "Assign prep tasks to team members and track completion in real time.",
      "The dashboard shows a summary of pending vs completed prep for the day.",
      "AI can suggest prep items based on reservations, sales forecasts, and par levels.",
    ],
    tags: ["prep", "list", "task", "assign", "daily", "plan"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "kit-inventory",
    type: "article",
    category: "kitchen",
    icon: "Package",
    color: "#10B981",
    title: "Inventory & Pantry",
    content: [
      "Track what you have in stock with quantities, expiry dates, and par levels.",
      "Get low-stock alerts when items drop below par level.",
      "Stocktake mode lets you quickly count items and update quantities.",
      "Scanning invoices auto-updates your inventory with received items.",
    ],
    tags: ["inventory", "pantry", "stock", "par", "expiry", "count"],
    appVersion: V,
  },
  {
    id: "kit-equipment",
    type: "article",
    category: "kitchen",
    icon: "Wrench",
    color: "#10B981",
    title: "Equipment Registry",
    content: [
      "Log all kitchen equipment with details, purchase dates, and warranty info.",
      "Set maintenance reminders for servicing, calibration, and replacements.",
      "Scan equipment labels to quickly add or look up items.",
      "Track repair history and costs over time.",
    ],
    tags: ["equipment", "maintenance", "repair", "tools", "asset"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "kit-waste",
    type: "article",
    category: "kitchen",
    icon: "Trash2",
    color: "#10B981",
    title: "Waste Log",
    content: [
      "Record food waste with reason codes (expired, overproduction, trim, spoiled).",
      "Track waste costs and trends over time to reduce losses.",
      "Waste data feeds into your food cost calculations for better accuracy.",
    ],
    tags: ["waste", "loss", "spoilage", "expired", "cost"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "kit-calendar",
    type: "article",
    category: "kitchen",
    icon: "Calendar",
    color: "#10B981",
    title: "Kitchen Calendar",
    content: [
      "View prep tasks, deliveries, events, and team schedules on a weekly calendar.",
      "Navigate between days to see what's planned ahead.",
      "Tap any day to see detailed tasks and events for that date.",
    ],
    tags: ["calendar", "schedule", "week", "plan", "date"],
    appVersion: V,
    streams: ["chefos", "homechef"],
  },

  // ── To Do ──
  {
    id: "cmd-tasks",
    type: "article",
    category: "command-centre",
    icon: "ListChecks",
    color: "#3B82F6",
    title: "Tasks & Kanban",
    content: [
      "Your daily task hub with list and kanban views for managing work.",
      "Create tasks with title, priority, category, and due date.",
      "Switch between list view and kanban board for different perspectives.",
      "Tasks can be archived and reviewed later.",
    ],
    tags: ["task", "kanban", "list", "priority", "todo", "daily"],
    appVersion: V,
    streams: ["chefos"],
  },
  {
    id: "cmd-shopping",
    type: "article",
    category: "command-centre",
    icon: "ShoppingCart",
    color: "#3B82F6",
    title: "Shopping List",
    content: [
      "The shopping tab auto-populates with items below par level from your inventory.",
      "Items are grouped by supplier for efficient ordering.",
      "Add manual items with name, quantity, and optional supplier.",
      "Check off items as you shop, then clear completed items.",
    ],
    tags: ["shopping", "list", "buy", "supplier", "order", "stock"],
    appVersion: V,
    streams: ["chefos"],
  },
  {
    id: "cmd-workflows",
    type: "article",
    category: "command-centre",
    icon: "Repeat",
    color: "#3B82F6",
    title: "Workflows & Routines",
    content: [
      "Create recurring workflows that auto-generate tasks on a schedule.",
      "Set daily, weekly, or monthly recurrence with specific days.",
      "Assign categories and priorities to auto-generated tasks.",
      "Great for morning checklists, weekly deep cleans, and monthly stocktakes.",
    ],
    tags: ["workflow", "routine", "recurring", "schedule", "automate"],
    appVersion: V,
    streams: ["chefos"],
  },
  {
    id: "cmd-templates",
    type: "article",
    category: "command-centre",
    icon: "BookOpen",
    color: "#3B82F6",
    title: "Task Templates",
    content: [
      "Save your current task list as a template for reuse.",
      "Load a template to instantly populate tasks for a specific day or event.",
      "Great for repeating event prep, holiday menus, or special occasion checklists.",
    ],
    tags: ["template", "save", "reuse", "preset"],
    appVersion: V,
    streams: ["chefos"],
  },
  {
    id: "cmd-ai-suggest",
    type: "article",
    category: "command-centre",
    icon: "Sparkles",
    color: "#3B82F6",
    title: "AI Task Suggestions",
    content: [
      "Tap AI Suggest to get smart task recommendations based on your kitchen state.",
      "The AI considers your inventory levels, upcoming events, and historical patterns.",
      "Review suggestions and add them to your task list with one tap.",
    ],
    tags: ["ai", "suggest", "smart", "recommend", "auto"],
    appVersion: V,
    streams: ["chefos"],
  },

  // ── Food Safety ──
  {
    id: "fs-temp",
    type: "article",
    category: "food-safety",
    icon: "Thermometer",
    color: "#EF4444",
    title: "Temperature Logging",
    content: [
      "Log temperature checks for fridges, freezers, hot-holds, and delivery items.",
      "Set up temperature points for each piece of equipment in your kitchen.",
      "Readings outside safe range are flagged and prompt a corrective action.",
      "View historical temperature data and trend charts in reports.",
      "You can also scan a thermometer display with your camera for quick entry.",
    ],
    tags: ["temperature", "temp", "fridge", "freezer", "hot", "cold", "log", "check"],
    appVersion: V,
  },
  {
    id: "fs-cleaning",
    type: "article",
    category: "food-safety",
    icon: "Sparkles",
    color: "#EF4444",
    title: "Cleaning Schedules",
    content: [
      "Create daily, weekly, and monthly cleaning task schedules.",
      "Assign cleaning zones and tasks to team members.",
      "Track completion with timestamps and optional photo evidence.",
      "Review cleaning history in the compliance reports.",
    ],
    tags: ["cleaning", "clean", "schedule", "hygiene", "sanitise"],
    appVersion: V,
  },
  {
    id: "fs-haccp",
    type: "article",
    category: "food-safety",
    icon: "FileText",
    color: "#EF4444",
    title: "HACCP Plans",
    content: [
      "Document your Hazard Analysis and Critical Control Points for compliance.",
      "Define critical control points, limits, monitoring procedures, and corrective actions.",
      "Keep your HACCP plan up to date and accessible for inspectors.",
    ],
    tags: ["haccp", "hazard", "control", "compliance", "plan"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "fs-audit",
    type: "article",
    category: "food-safety",
    icon: "ClipboardCheck",
    color: "#EF4444",
    title: "Audits & Self-Assessment",
    content: [
      "Run self-assessment checklists to gauge your compliance readiness.",
      "Score your kitchen against BCC, FSSAI, or local standards.",
      "Upload audit documents, inspection reports, and certificates.",
      "Track corrective actions from audits with severity and status.",
    ],
    tags: ["audit", "assessment", "inspection", "score", "compliance", "bcc", "fssai"],
    appVersion: V,
  },
  {
    id: "fs-training",
    type: "article",
    category: "food-safety",
    icon: "GraduationCap",
    color: "#EF4444",
    title: "Training Register",
    content: [
      "Track food safety training and certifications for each team member.",
      "Set expiry alerts so you never miss a renewal date.",
      "Record training topics, dates, and evidence (certificates, photos).",
    ],
    tags: ["training", "certificate", "staff", "team", "learn", "expiry"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "fs-receiving",
    type: "article",
    category: "food-safety",
    icon: "Truck",
    color: "#EF4444",
    title: "Receiving & Deliveries",
    content: [
      "Log incoming deliveries with temperature checks and quality assessments.",
      "Flag rejected items with reasons and photos.",
      "Receiving data links to your supplier records and inventory.",
    ],
    tags: ["receiving", "delivery", "supplier", "check", "quality"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "fs-pest",
    type: "article",
    category: "food-safety",
    icon: "Bug",
    color: "#EF4444",
    title: "Pest Control",
    content: [
      "Record pest control visits, treatments, and findings.",
      "Upload reports from your pest control provider.",
      "Track pest sighting incidents and corrective actions.",
    ],
    tags: ["pest", "control", "bug", "rodent", "insect"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "fs-chemical",
    type: "article",
    category: "food-safety",
    icon: "FlaskConical",
    color: "#EF4444",
    title: "Chemical Safety",
    content: [
      "Maintain a register of all chemicals used in your kitchen.",
      "Record COSHH data, dilution rates, and safety data sheet locations.",
      "Common items: dish detergent, rinse aid, floor cleaner, sanitiser, oven cleaner, hand soap, degreaser.",
    ],
    tags: ["chemical", "coshh", "safety", "cleaning", "hazard", "sds"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },

  // ── Scanning ──
  {
    id: "scan-invoice",
    type: "article",
    category: "scanning",
    icon: "Receipt",
    color: "#8B5CF6",
    title: "Invoice Scanning",
    content: [
      "Take a photo of a supplier invoice to extract items, quantities, and prices.",
      "The AI reads various invoice formats — typed, handwritten, or printed.",
      "Scanned data auto-updates your inventory and supplier records.",
      "Review extracted items before confirming to ensure accuracy.",
    ],
    tags: ["invoice", "scan", "receipt", "supplier", "price", "ocr"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "scan-docket",
    type: "article",
    category: "scanning",
    icon: "FileCheck",
    color: "#8B5CF6",
    title: "Delivery Docket Scanning",
    content: [
      "Scan delivery dockets to verify received items against your orders.",
      "Flag discrepancies — missing items, wrong quantities, or quality issues.",
      "Docket data links to your receiving log for full traceability.",
    ],
    tags: ["docket", "delivery", "scan", "verify", "receiving"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "scan-label",
    type: "article",
    category: "scanning",
    icon: "Tag",
    color: "#8B5CF6",
    title: "Label Scanning",
    content: [
      "Scan ingredient labels to extract nutrition facts, allergen info, and ingredient lists.",
      "Useful for allergen detection and verifying supplier claims.",
      "Works with product barcodes, nutrition panels, and ingredient declarations.",
    ],
    tags: ["label", "barcode", "nutrition", "ingredient", "allergen", "scan"],
    appVersion: V,
  },
  {
    id: "scan-thermo",
    type: "article",
    category: "scanning",
    icon: "Thermometer",
    color: "#8B5CF6",
    title: "Thermometer Display Scan",
    content: [
      "Point your camera at a digital thermometer display to auto-read the temperature.",
      "The AI extracts the number and logs it directly to your temperature check.",
      "Works with most digital probe and infrared thermometers.",
    ],
    tags: ["thermometer", "display", "camera", "temperature", "scan", "auto"],
    appVersion: V,
  },

  // ── Games ──
  {
    id: "gm-overview",
    type: "article",
    category: "games",
    icon: "Gamepad2",
    color: "#F97316",
    title: "Mastery Suite Overview",
    content: [
      "The Mastery Suite is a gamified learning system built into the app.",
      "Complete daily compliance tasks (temps, prep, waste) to unlock games each day.",
      "Earn XP from games and daily tasks to level up through the kitchen brigade ranks.",
      "Compete on leaderboards and unlock achievements as you progress.",
    ],
    tags: ["games", "mastery", "xp", "level", "compete", "unlock"],
    appVersion: V,
  },
  {
    id: "gm-onion",
    type: "article",
    category: "games",
    icon: "Cherry",
    color: "#F97316",
    title: "Onion Blitz",
    content: [
      "A 45-second slicing frenzy. Swipe to cut pink onions for points.",
      "Avoid white onions — they break your combo and deduct points.",
      "Red onions are deadly — slice one and it's game over with tears everywhere!",
      "Build combos for multiplied scores: 3x = 1.5x, 5x = 2x multiplier.",
    ],
    tags: ["onion", "blitz", "slice", "game", "fruit ninja", "combo"],
    appVersion: V,
  },
  {
    id: "gm-cat",
    type: "article",
    category: "games",
    icon: "Cat",
    color: "#F97316",
    title: "The Alley Cat",
    content: [
      "A 40-second de-stressing game. Pat and rub a stray alley cat to calm it down.",
      "Use slow, gentle strokes to build the calm meter. Too fast scares it!",
      "Watch the mood change: Nervous → Calm → Purring → Sleeping.",
      "Take a breather between services — the goal is to unwind and reset, not speed.",
    ],
    tags: ["cat", "alley", "zen", "calm", "pet", "game", "relax"],
    appVersion: V,
  },
  {
    id: "gm-gauntlet",
    type: "article",
    category: "games",
    icon: "Shield",
    color: "#F97316",
    title: "The Gauntlet",
    content: [
      "A food safety speed test. Answer questions about safe temperatures, storage, and hygiene.",
      "Beat the clock to earn the highest grade and XP.",
      "Questions are based on real food safety standards and best practices.",
    ],
    tags: ["gauntlet", "quiz", "food safety", "speed", "test", "game"],
    appVersion: V,
  },
  {
    id: "gm-xp",
    type: "article",
    category: "games",
    icon: "Zap",
    color: "#F97316",
    title: "XP, Levels & Leagues",
    content: [
      "Earn XP from games and daily compliance tasks.",
      "Level up through kitchen ranks: Scullery Hand → Commis → Chef de Partie → Sous Chef → Head Chef → Master Chef.",
      "Maintain a 7-day compliance streak to qualify for the Pro League.",
      "Check the leaderboard to see how you rank against others.",
    ],
    tags: ["xp", "level", "league", "rank", "streak", "leaderboard"],
    appVersion: V,
  },

  // ── AI Companion ──
  {
    id: "ai-setup",
    type: "article",
    category: "ai-companion",
    icon: "Bot",
    color: "#06B6D4",
    title: "Companion Setup & Personality",
    content: [
      "Your AI companion is a personal kitchen buddy. Set it up from the dashboard.",
      "Choose a name (2-20 characters) and pick a personality: Friendly, Witty, Calm, or Energetic.",
      "The companion remembers your preferences and learns what you like over time.",
      "You can change the personality or name anytime in Settings > AI.",
    ],
    tags: ["companion", "ai", "setup", "name", "personality", "buddy"],
    appVersion: V,
    streams: ["homechef"],
  },
  {
    id: "ai-chat",
    type: "article",
    category: "ai-companion",
    icon: "MessageCircle",
    color: "#06B6D4",
    title: "Chat with Your Companion",
    content: [
      "Ask for recipe ideas, cooking tips, substitutions, meal plans, or just chat about food.",
      "The companion understands context — mention an ingredient and it suggests recipes.",
      "It focuses on cooking and kitchen productivity. It won't give medical or financial advice.",
    ],
    tags: ["chat", "ai", "ask", "recipe", "tips", "companion"],
    appVersion: V,
    streams: ["homechef"],
  },
  {
    id: "ai-voice",
    type: "article",
    category: "ai-companion",
    icon: "Mic",
    color: "#06B6D4",
    title: "Voice Mode",
    content: [
      "Enable voice mode in Settings > AI for hands-free interaction while cooking.",
      "Talk to your companion and hear responses read aloud.",
      "Great for when your hands are full of dough or covered in sauce.",
    ],
    tags: ["voice", "hands-free", "talk", "speak", "audio", "companion"],
    appVersion: V,
    streams: ["homechef"],
  },

  // ── Settings ──
  {
    id: "set-theme",
    type: "article",
    category: "settings",
    icon: "Palette",
    color: "#64748B",
    title: "Theme & Appearance",
    content: [
      "Choose between light and dark themes, or let the app follow your system preference.",
      "The app adapts its entire colour scheme to your chosen theme.",
    ],
    tags: ["theme", "dark", "light", "appearance", "colour", "mode"],
    appVersion: V,
  },
  {
    id: "set-units",
    type: "article",
    category: "settings",
    icon: "Ruler",
    color: "#64748B",
    title: "Units & Currency",
    content: [
      "Switch between metric and imperial units for recipes and inventory.",
      "Set your preferred currency for costing and pricing.",
      "Date format can be adjusted to match your region.",
    ],
    tags: ["units", "metric", "imperial", "currency", "date", "format"],
    appVersion: V,
  },
  {
    id: "set-privacy",
    type: "article",
    category: "settings",
    icon: "Lock",
    color: "#64748B",
    title: "Privacy & Data",
    content: [
      "Control analytics sharing, activity status visibility, and session timeouts.",
      "Your data is stored securely and never shared with third parties.",
      "Delete your account and all associated data from Settings > Account.",
    ],
    tags: ["privacy", "data", "security", "delete", "account", "analytics"],
    appVersion: V,
  },
  {
    id: "set-free-to-use",
    type: "article",
    category: "settings",
    icon: "CreditCard",
    color: "#64748B",
    title: "Is the App Free to Use?",
    content: [
      "Yes! The app is completely free during our launch period — enjoy full access to all core features at no cost.",
      "After the free period, we will introduce tiered pricing plans based on the features you need.",
      "Plans will range from a free basic tier for small operations to professional and enterprise tiers for larger teams.",
      "We will give plenty of notice before any changes. Your data and setup will always be preserved.",
    ],
    tags: ["free", "pricing", "plans", "cost", "account", "subscription", "tier"],
    appVersion: V,
  },
  {
    id: "set-integrations",
    type: "article",
    category: "settings",
    icon: "Plug",
    color: "#64748B",
    title: "Integrations",
    content: [
      "Connect POS systems to auto-import sales data and dish-level analytics.",
      "Link reservation platforms for cover predictions and prep planning.",
      "Supplier integrations allow automatic price updates and order tracking.",
    ],
    tags: ["integration", "pos", "reservation", "supplier", "connect", "sync"],
    appVersion: V,
    streams: ["chefos"],
  },
];

// ── Workflows ────────────────────────────────────────────

export const HELP_WORKFLOWS: HelpWorkflow[] = [
  {
    id: "wf-temp-check",
    type: "workflow",
    category: "food-safety",
    icon: "Thermometer",
    color: "#EF4444",
    title: "Log Your First Temperature Check",
    description: "Step-by-step guide to logging a temperature reading for fridges, freezers, or hot-held items.",
    steps: [
      {
        title: "Open the Safety tab",
        description: "Tap the Safety icon in the bottom navigation bar. This is your food safety hub.",
        icon: "ShieldCheck",
      },
      {
        title: "Tap Food Safety",
        description: "From the Safety hub, tap the 'Food Safety' card to enter the compliance section.",
        icon: "Thermometer",
      },
      {
        title: "Select your equipment zone",
        description: "Choose the type of equipment you're checking — fridge, freezer, hot-hold, or a custom temperature point.",
        icon: "MapPin",
        tip: "Set up your temperature points in advance from the temp setup screen for faster logging.",
      },
      {
        title: "Enter the temperature reading",
        description: "Type in the temperature reading manually, or tap the camera icon to scan your thermometer display. The AI will read the number for you.",
        icon: "Camera",
        tip: "Point your camera directly at the thermometer display for the best scan accuracy.",
      },
      {
        title: "Review the result",
        description: "The system checks your reading against safe temperature ranges. If it's out of range, you'll be prompted to log a corrective action — like adjusting the thermostat or discarding food.",
        icon: "AlertTriangle",
      },
      {
        title: "Done — logged to your record",
        description: "Your temperature check is saved to your compliance record with a timestamp. View historical data anytime in the reports section.",
        icon: "CheckCircle",
        tip: "Log temps at the same time each day to build a consistent compliance record.",
      },
    ],
    navigateTo: "/(app)/food-safety",
    tags: ["temperature", "temp", "check", "log", "fridge", "safety", "compliance", "first"],
    appVersion: V,
  },
  {
    id: "wf-recipe-photo",
    type: "workflow",
    category: "recipes",
    icon: "Camera",
    color: "#F59E0B",
    title: "Create a Recipe from Photo",
    description: "Snap a photo of a handwritten or printed recipe and let AI do the rest.",
    steps: [
      {
        title: "Open Recipes tab",
        description: "Tap the Recipes icon in the bottom navigation to see your recipe library.",
        icon: "BookOpen",
      },
      {
        title: "Tap the + button",
        description: "Hit the add button to start creating a new recipe. Choose 'Import from Photo'.",
        icon: "Plus",
      },
      {
        title: "Take a photo or pick from gallery",
        description: "Point your camera at the recipe page — handwritten notes, printed cards, or cookbook pages all work.",
        icon: "Camera",
        tip: "Good lighting and a flat surface give the best results.",
      },
      {
        title: "AI extracts the recipe",
        description: "The AI reads the image and extracts the title, ingredients with quantities, and method steps automatically.",
        icon: "Sparkles",
      },
      {
        title: "Review and edit",
        description: "Check the extracted recipe. Fix any misreads, adjust quantities, and add categories or allergen tags.",
        icon: "PenLine",
      },
      {
        title: "Save",
        description: "Tap Save and your recipe is ready to use. Costs auto-calculate if ingredients are in your pantry.",
        icon: "CheckCircle",
      },
    ],
    navigateTo: "/(app)/recipe/edit",
    tags: ["recipe", "photo", "import", "camera", "scan", "create"],
    appVersion: V,
  },
  {
    id: "wf-cleaning-schedule",
    type: "workflow",
    category: "food-safety",
    icon: "Sparkles",
    color: "#10B981",
    title: "Set Up a Cleaning Schedule",
    description: "Create daily, weekly, and monthly cleaning tasks for your kitchen.",
    steps: [
      {
        title: "Open Safety tab",
        description: "Tap Safety in the bottom navigation bar.",
        icon: "ShieldCheck",
      },
      {
        title: "Tap Cleaning Management",
        description: "From the Safety hub, select 'Cleaning' to enter the cleaning schedule section.",
        icon: "Sparkles",
      },
      {
        title: "Add a cleaning zone",
        description: "Create zones like 'Kitchen Floor', 'Walk-in Fridge', 'Hood & Vents', or 'Prep Station'.",
        icon: "MapPin",
      },
      {
        title: "Set frequency and assign",
        description: "Choose daily, weekly, or monthly. Assign to team members if applicable.",
        icon: "Repeat",
        tip: "Start with daily essentials — floors, surfaces, handwash stations — then add weekly deep cleans.",
      },
      {
        title: "Track completion",
        description: "Team members mark tasks as done with timestamps. Optionally require photo evidence.",
        icon: "CheckCircle",
      },
    ],
    navigateTo: "/(app)/cleaning-management",
    tags: ["cleaning", "schedule", "hygiene", "zone", "daily", "weekly"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "wf-scan-invoice",
    type: "workflow",
    category: "scanning",
    icon: "Receipt",
    color: "#8B5CF6",
    title: "Scan an Invoice",
    description: "Photograph a supplier invoice to auto-extract items and update inventory.",
    steps: [
      {
        title: "Open the Scanner",
        description: "Go to Recipes tab and tap 'Invoices', or use the Scanner tab if available.",
        icon: "Camera",
      },
      {
        title: "Take a photo of the invoice",
        description: "Photograph the full invoice page. Make sure all text is visible and in focus.",
        icon: "Camera",
        tip: "Hold the phone steady and ensure good lighting. Avoid shadows and glare.",
      },
      {
        title: "AI extracts line items",
        description: "The AI reads the invoice and extracts each item, quantity, unit price, and total.",
        icon: "Sparkles",
      },
      {
        title: "Review and confirm",
        description: "Check extracted items for accuracy. Edit any misreads before confirming.",
        icon: "PenLine",
      },
      {
        title: "Inventory updated",
        description: "Confirmed items are added to your inventory and linked to the supplier.",
        icon: "Package",
      },
    ],
    navigateTo: "/(app)/invoices",
    tags: ["invoice", "scan", "supplier", "price", "inventory", "receipt"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "wf-prep-list",
    type: "workflow",
    category: "kitchen",
    icon: "ClipboardList",
    color: "#10B981",
    title: "Create & Assign a Prep List",
    description: "Plan your day's prep and assign tasks to your team.",
    steps: [
      {
        title: "Open Kitchen tab",
        description: "Tap Kitchen in the bottom navigation.",
        icon: "UtensilsCrossed",
      },
      {
        title: "Tap Prep Lists",
        description: "Select 'Prep Lists' from the kitchen hub.",
        icon: "ClipboardList",
      },
      {
        title: "Create a new prep list",
        description: "Give it a name (e.g. 'Friday Lunch Prep') and start adding items.",
        icon: "Plus",
      },
      {
        title: "Add items from recipes or custom",
        description: "Pick items from your recipes or type custom prep tasks. Set quantities.",
        icon: "PenLine",
        tip: "AI can suggest prep items based on reservations and sales forecasts.",
      },
      {
        title: "Assign and track",
        description: "Assign tasks to team members. Track completion in real time from the dashboard.",
        icon: "Users",
      },
    ],
    navigateTo: "/(app)/prep-lists",
    tags: ["prep", "list", "create", "assign", "team", "task", "plan"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },

  // ── To Do Workflows ───────────────────────────

  {
    id: "wf-cc-overview",
    type: "workflow",
    category: "command-centre",
    icon: "ClipboardList",
    color: "#3B82F6",
    title: "Navigate the To Do",
    description: "A quick tour of the To Do — learn the three tabs, day carousel, progress bar, and quick actions.",
    steps: [
      {
        title: "Find the To Do",
        description: "On your dashboard, scroll down to find the 'To Do / To Do' section (or 'My Day' on HomeChef). It's your daily hub for tasks, shopping, and workflows.",
        icon: "ClipboardList",
        tip: "The To Do is embedded in the dashboard — no need to navigate to a separate screen.",
      },
      {
        title: "Browse the day carousel",
        description: "Swipe the horizontal date picker at the top to select any day of the week. Tasks are filtered by date, so you can plan ahead or review past days.",
        icon: "Calendar",
      },
      {
        title: "Check your progress bar",
        description: "Below the carousel, a progress bar shows how many tasks you've completed versus total for the day, with a percentage. Hit 100% and it turns green!",
        icon: "CheckCircle",
      },
      {
        title: "Use quick actions",
        description: "The horizontal quick-action buttons let you jump to Log Temp, Scan Invoice, Start Prep, and Add Recipe — all in one tap without leaving the dashboard.",
        icon: "Play",
      },
      {
        title: "Switch between tabs",
        description: "Tap the Tasks, Shopping, or Workflows pill tabs to switch context. Each tab has its own view and actions — Tasks for daily work, Shopping for stock needs, Workflows for recurring rules.",
        icon: "ListChecks",
      },
    ],
    navigateTo: "/(app)/(tabs)/dashboard",
    tags: ["overview", "tour", "navigate", "todo", "tabs", "day", "carousel", "getting started"],
    appVersion: V,
  },
  {
    id: "wf-cc-create-task",
    type: "workflow",
    category: "command-centre",
    icon: "ListChecks",
    color: "#3B82F6",
    title: "Create & Complete Tasks",
    description: "Add a task with priority and category, check it off when done, and manage your daily to-do list.",
    steps: [
      {
        title: "Tap the + Add Task button",
        description: "At the bottom of the Tasks tab, tap the blue '+ Add Task' button. A form sheet slides up from the bottom.",
        icon: "Plus",
      },
      {
        title: "Fill in the task details",
        description: "Enter a task name (required), an optional list name, select priority (Low/Medium/High), pick a category (Prep, Cleaning, Ordering, Admin), and set a due date.",
        icon: "PenLine",
        tip: "On HomeChef, categories are Cooking, Grocery, Cleaning, and General instead.",
      },
      {
        title: "Save the task",
        description: "Tap Save. Your task appears in the list under the selected date. A haptic confirmation pulse confirms it was created.",
        icon: "CheckCircle",
      },
      {
        title: "Check off completed tasks",
        description: "Tap any task row to toggle the checkbox. The circle fills green with a checkmark, and the task text gets a strikethrough.",
        icon: "CheckCircle",
        tip: "The progress bar updates automatically as you check off tasks.",
      },
      {
        title: "Delete or manage tasks",
        description: "Long-press on a task to see the actions menu — you can delete individual tasks. Long-press on a list header to delete the entire list and all its tasks.",
        icon: "AlertTriangle",
      },
    ],
    navigateTo: "/(app)/(tabs)/dashboard",
    tags: ["task", "create", "add", "complete", "check", "priority", "category", "delete", "manage"],
    appVersion: V,
  },
  {
    id: "wf-cc-ai-scan",
    type: "workflow",
    category: "command-centre",
    icon: "Sparkles",
    color: "#3B82F6",
    title: "AI Suggest & Scan a Prep Note",
    description: "Let AI recommend tasks based on your kitchen state, or photograph a handwritten prep note to auto-extract tasks.",
    steps: [
      {
        title: "Tap AI Suggest",
        description: "On the Tasks tab, find the 'AI Suggest' pill button (with the sparkle icon). Tap it and wait a moment while the AI analyses your inventory, upcoming events, and patterns.",
        icon: "Sparkles",
      },
      {
        title: "Review AI suggestions",
        description: "Suggestions appear as tappable chips in a horizontal scroll. Each shows a task title. Tap any chip to instantly add it to your task list for today.",
        icon: "Plus",
        tip: "Tap 'Dismiss' in the top-right to clear all suggestions if they aren't relevant.",
      },
      {
        title: "Tap Scan Note",
        description: "Next to AI Suggest, tap the 'Scan Note' button (with the camera icon). An image picker opens.",
        icon: "Camera",
      },
      {
        title: "Photograph your prep note",
        description: "Take a photo of a handwritten prep list, whiteboard, or printed note. The AI reads the image and extracts individual tasks with quantities.",
        icon: "ScanLine",
        tip: "Ensure good lighting and hold the phone steady. The AI works best with clear handwriting.",
      },
      {
        title: "Tasks auto-imported",
        description: "Extracted tasks are added as a new list called 'Scanned Prep Note' under today's date. A toast confirms how many tasks were imported.",
        icon: "CheckCircle",
      },
    ],
    navigateTo: "/(app)/(tabs)/dashboard",
    tags: ["ai", "suggest", "scan", "prep", "note", "camera", "photo", "import", "smart"],
    appVersion: V,
    streams: ["chefos"],
  },
  {
    id: "wf-cc-audit",
    type: "workflow",
    category: "command-centre",
    icon: "ShieldCheck",
    color: "#3B82F6",
    title: "Run a Pre-Service Audit",
    description: "Run an AI-powered kitchen readiness audit before service and turn flagged issues into tasks.",
    steps: [
      {
        title: "Tap the Audit button",
        description: "On the Tasks tab, find the yellow 'Audit' pill button with the shield icon. Tap it to start a pre-service readiness check.",
        icon: "ShieldCheck",
      },
      {
        title: "Wait for the AI analysis",
        description: "The audit analyses your temperature logs, cleaning records, inventory levels, and prep completion. A spinner shows while it's running.",
        icon: "Sparkles",
        tip: "Run the audit about 30 minutes before service for the most useful results.",
      },
      {
        title: "Review your readiness score",
        description: "A toast notification shows your score out of 100, with a count of critical issues and warnings. The colour indicates status: green (75+), yellow (50-74), or red (below 50).",
        icon: "AlertTriangle",
      },
      {
        title: "Review the audit report",
        description: "The full report appears below the action buttons — critical issues in red, warnings in yellow, and all-clear items in green. Each issue shows a title and description.",
        icon: "FileText",
      },
      {
        title: "Add issues as tasks",
        description: "Tap any critical issue or warning to instantly add it as a high-priority task to today's list. This turns audit findings into actionable items your team can work through.",
        icon: "Plus",
        tip: "Address critical issues first — they have the biggest impact on your readiness score.",
      },
    ],
    navigateTo: "/(app)/(tabs)/dashboard",
    tags: ["audit", "pre-service", "readiness", "score", "kitchen", "safety", "check"],
    appVersion: V,
    streams: ["chefos"],
  },
  {
    id: "wf-cc-shopping",
    type: "workflow",
    category: "command-centre",
    icon: "ShoppingCart",
    color: "#3B82F6",
    title: "Manage Your Shopping List",
    description: "View auto-populated low-stock items, check them off as you shop, and add manual items.",
    steps: [
      {
        title: "Switch to the Shopping tab",
        description: "Tap the 'Shopping' pill tab in the To Do. The list auto-populates with ingredients that have dropped below their par level in your inventory.",
        icon: "ShoppingCart",
      },
      {
        title: "Browse items grouped by supplier",
        description: "Items are organised under supplier headers. Each item shows the quantity needed, current stock level versus par level, and estimated cost.",
        icon: "Package",
      },
      {
        title: "Check off items as you shop",
        description: "Tap any item to toggle its checkbox. The circle fills green with a checkmark, and the item shows as struck through. The header counter updates to show progress.",
        icon: "CheckCircle",
      },
      {
        title: "Clear completed items",
        description: "When you've bought items, tap the green 'Clear Done' button in the header to remove all checked items from the list.",
        icon: "CheckCircle",
        tip: "Tap 'Refresh Stock' to re-sync with your latest inventory levels.",
      },
      {
        title: "Add a manual item",
        description: "Tap '+ Add Item' at the bottom. Enter the item name, quantity, and optionally a supplier. Tap Save to add it to the list alongside the auto-generated items.",
        icon: "Plus",
        tip: "Long-press a manual item to remove it from the list.",
      },
    ],
    navigateTo: "/(app)/(tabs)/dashboard",
    tags: ["shopping", "list", "stock", "supplier", "buy", "par", "inventory", "check"],
    appVersion: V,
  },
  {
    id: "wf-cc-recurring",
    type: "workflow",
    category: "command-centre",
    icon: "Repeat",
    color: "#3B82F6",
    title: "Set Up Recurring Workflows",
    description: "Create daily, weekly, or monthly rules that auto-generate tasks — perfect for morning checklists and deep cleans.",
    steps: [
      {
        title: "Switch to the Workflows tab",
        description: "Tap the 'Workflows' pill tab (or 'Routines' on HomeChef) in the To Do. You'll see any existing workflows listed here.",
        icon: "Repeat",
      },
      {
        title: "Tap + New Workflow",
        description: "Tap the blue '+ New Workflow' button at the top. A form sheet slides up.",
        icon: "Plus",
      },
      {
        title: "Fill in workflow details",
        description: "Enter a title (e.g. 'Morning Temp Check'), an optional description, select a category and priority, then choose the recurrence: Daily, Weekly, or Monthly.",
        icon: "PenLine",
      },
      {
        title: "Set the schedule",
        description: "For Weekly, tap the day circles (Sun-Sat) to select which days. For Monthly, enter the day of the month (1-28). Daily workflows run every day automatically.",
        icon: "Calendar",
        tip: "Start with daily essentials, then add weekly deep cleans and monthly stocktakes.",
      },
      {
        title: "Save and watch tasks auto-generate",
        description: "Tap Save. The workflow appears in the list with a recurrence badge. From now on, tasks are auto-created on the scheduled days and appear in your Tasks tab.",
        icon: "CheckCircle",
      },
      {
        title: "Edit or delete workflows",
        description: "Tap the pencil icon on any workflow card to edit its details. Tap the trash icon to delete it — a confirmation dialog ensures you don't remove it accidentally.",
        icon: "PenLine",
        tip: "Deleted workflows stop generating new tasks, but previously created tasks remain.",
      },
    ],
    navigateTo: "/(app)/(tabs)/dashboard",
    tags: ["workflow", "recurring", "daily", "weekly", "monthly", "automate", "routine", "schedule"],
    appVersion: V,
  },
  {
    id: "wf-cc-templates-kanban",
    type: "workflow",
    category: "command-centre",
    icon: "BookOpen",
    color: "#3B82F6",
    title: "Templates & Kanban Board",
    description: "Save reusable task templates for repeating events, and toggle between list and kanban board views.",
    steps: [
      {
        title: "Open the Templates panel",
        description: "On the Tasks tab, tap the 'Templates' button in the action row (next to AI Suggest and Scan Note). A form sheet opens showing your saved templates.",
        icon: "BookOpen",
      },
      {
        title: "Save current tasks as a template",
        description: "Enter a name for the template (e.g. 'Friday Prep List') and tap 'Save Current'. All your pending (unchecked) tasks are saved as a reusable template.",
        icon: "PenLine",
        tip: "Templates save task names, categories, and priorities — perfect for recurring event prep.",
      },
      {
        title: "Load a saved template",
        description: "Tap the 'Load' button next to any template in the list. All template items are instantly added as tasks for the selected day.",
        icon: "Play",
      },
      {
        title: "Switch to Kanban view",
        description: "In the top-right corner of the To Do, find the list/grid toggle buttons. Tap the grid icon to switch to Kanban board view.",
        icon: "LayoutGrid",
        tip: "Kanban view groups tasks by list name in visual columns — great for planning.",
      },
      {
        title: "Work with the Kanban board",
        description: "Each column represents a task list. Tasks show checkboxes to toggle completion. Tap tasks to check them off. Use the list icon to switch back to the standard list view.",
        icon: "ListChecks",
      },
    ],
    navigateTo: "/(app)/(tabs)/dashboard",
    tags: ["template", "save", "load", "kanban", "board", "view", "reuse", "visual"],
    appVersion: V,
    streams: ["chefos"],
  },

  // ── Food Safety Workflows ───────────────────────────────

  {
    id: "wf-fs-compliance-setup",
    type: "workflow",
    category: "food-safety",
    icon: "ShieldCheck",
    color: "#10B981",
    title: "Set Up Food Safety Compliance",
    description: "Enable compliance from scratch — run an audit, complete the 5-step wizard, toggle logs, and earn the Green Shield.",
    steps: [
      {
        title: "Open Food Safety",
        description: "Tap Food Safety from the Kitchen tab. You'll see the compliance workflow bar at the top showing your current stage.",
        icon: "ShieldCheck",
      },
      {
        title: "Run the Self-Assessment",
        description: "Tap 'Run Self-Assessment' to complete the A1–A40 audit (or your framework equivalent). This scores your venue and gives a star rating.",
        icon: "ClipboardList",
        tip: "Be honest — the audit identifies gaps so you can fix them before enabling compliance.",
      },
      {
        title: "Review your star rating",
        description: "After submission your score is calculated. Stars are awarded based on compliance level. Use the results to identify areas for improvement.",
        icon: "CheckCircle",
      },
      {
        title: "Enable Compliance",
        description: "Tap 'Enable Compliance' to start the 5-step setup wizard: Licence → Category → Food Safety Supervisor → Program → Sections.",
        icon: "ShieldCheck",
      },
      {
        title: "Complete the Setup Wizard",
        description: "Enter your licence number, select food category, add a food safety supervisor, choose your compliance program, and pick which sections to track.",
        icon: "PenLine",
        tip: "You can always update these settings later from the Sections page.",
      },
      {
        title: "Configure section toggles",
        description: "Toggle which compliance logs to maintain — temperature, cleaning, pest control, staff health, and more. Only enabled sections appear on your dashboard.",
        icon: "ListChecks",
      },
      {
        title: "Earn the Green Shield",
        description: "Once all requirements are met (licence, documents, FSS certificate, self-audit), the Green Shield activates — showing your venue is fully compliant.",
        icon: "ShieldCheck",
        tip: "The Green Shield badge appears on all food safety pages when active.",
      },
    ],
    navigateTo: "/(app)/food-safety",
    tags: ["compliance", "setup", "enable", "audit", "stars", "green shield", "wizard", "food safety"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "wf-fs-daily-burst",
    type: "workflow",
    category: "food-safety",
    icon: "Thermometer",
    color: "#10B981",
    title: "Complete Daily Compliance Checks",
    description: "Work through the daily compliance burst — log temperatures, check equipment, and record staff health in one workflow.",
    steps: [
      {
        title: "Open Daily Burst",
        description: "From Food Safety, tap 'Daily Burst'. A set of compliance cards for today loads — each represents a check you need to complete.",
        icon: "Play",
      },
      {
        title: "Log temperature readings",
        description: "Start with fridge and freezer temps. Enter values and the system auto-calculates pass/fail based on thresholds (fridge 0–5°C, freezer ≤ −18°C).",
        icon: "Thermometer",
        tip: "Amber warnings mean the reading is borderline — add a corrective action note.",
      },
      {
        title: "Complete each compliance card",
        description: "Work through cooking temps (≥75°C), cooling logs, display monitoring, and other enabled sections. Each card shows its own thresholds.",
        icon: "CheckCircle",
      },
      {
        title: "Add corrective actions",
        description: "For any failed checks, tap the notes icon and describe the corrective action taken — e.g. 'Moved food to backup fridge, temp restored in 20 min'.",
        icon: "PenLine",
      },
      {
        title: "Complete all cards",
        description: "Once all burst cards are done, your daily compliance is recorded. The food safety dashboard updates with today's log count for each section.",
        icon: "CheckCircle",
        tip: "Consistency is key — completing the burst daily builds your compliance history for audits.",
      },
    ],
    navigateTo: "/(app)/food-safety",
    tags: ["daily", "burst", "temperature", "compliance", "check", "log", "food safety"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "wf-fs-staff-health",
    type: "workflow",
    category: "food-safety",
    icon: "FileText",
    color: "#10B981",
    title: "Log Staff Health & Upload Certificates",
    description: "Record staff fitness-to-work checks and upload health certificates or food handler documents.",
    steps: [
      {
        title: "Open Staff Health",
        description: "From Food Safety, tap 'Staff Health'. The page shows today's date with AM/PM shift toggle and a list of health check items.",
        icon: "FileText",
      },
      {
        title: "Check staff fitness",
        description: "For each staff member, record their name and select 'Fit to Work' — Yes or No. If unfit, add illness details in the notes field.",
        icon: "CheckCircle",
        tip: "Staff with symptoms of vomiting, diarrhoea, or fever must not handle food — record the details.",
      },
      {
        title: "Upload health certificates",
        description: "Tap 'Upload Document' to attach health certificates or medical clearance docs. Use the camera to scan, or browse for an existing file.",
        icon: "Camera",
      },
      {
        title: "Save the log entry",
        description: "Tap Save to record the health check. It's saved to the daily compliance log with timestamp and your user ID.",
        icon: "CheckCircle",
      },
      {
        title: "Review staff health history",
        description: "Scroll down to see the 7-day history of staff health checks. Search by staff name to find specific records.",
        icon: "Search",
      },
    ],
    navigateTo: "/(app)/food-safety/staff-health",
    tags: ["staff", "health", "certificate", "upload", "fitness", "food handler", "food safety"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
  {
    id: "wf-fs-audit-folder",
    type: "workflow",
    category: "food-safety",
    icon: "ClipboardList",
    color: "#10B981",
    title: "Prepare for an Inspection",
    description: "Review your audit folder, check section completion, and share a compliance summary with your inspector.",
    steps: [
      {
        title: "Open Audit Folder",
        description: "From Food Safety, tap 'Audit Folder'. The 14 compliance sections are listed with document counts and completion status.",
        icon: "ClipboardList",
      },
      {
        title: "Check section completion",
        description: "Each section shows a green badge with the document count, or 'Missing' in red if no documents are uploaded. Address any missing sections first.",
        icon: "CheckCircle",
        tip: "Focus on sections marked 'Missing' — these are what inspectors look for.",
      },
      {
        title: "Upload missing documents",
        description: "Tap any section to open it. Use 'Scan Document' or 'Upload File' in Food Safety Docs to add the required certificates, logs, or reports.",
        icon: "Camera",
      },
      {
        title: "Share the audit summary",
        description: "Tap the share icon to export or email your audit folder summary. This gives inspectors a quick overview of your compliance status.",
        icon: "FileText",
      },
      {
        title: "Maintain green status",
        description: "Keep all 14 sections green by regularly uploading updated documents. The audit folder tracks your compliance period (daily/weekly/monthly).",
        icon: "ShieldCheck",
        tip: "Set a monthly reminder to review and update expiring certificates.",
      },
    ],
    navigateTo: "/(app)/food-safety",
    tags: ["audit", "inspection", "folder", "compliance", "documents", "prepare", "food safety"],
    appVersion: V,
    streams: ["chefos", "eatsafe"],
  },
];

// ── Combined + Utilities ─────────────────────────────────

export const ALL_HELP_ITEMS: HelpItem[] = [...HELP_ARTICLES, ...HELP_WORKFLOWS];

export function getHelpItem(id: string): HelpItem | undefined {
  return ALL_HELP_ITEMS.find((item) => item.id === id);
}

export function getItemsByCategory(category: string): HelpItem[] {
  return ALL_HELP_ITEMS.filter((item) => item.category === category);
}

export function getOutdatedItems(currentVersion: string): HelpItem[] {
  return ALL_HELP_ITEMS.filter((item) => item.appVersion < currentVersion);
}

/**
 * Filter help items for the current app variant.
 * Items without streams/regions fields are shown to everyone.
 */
export function getItemsForVariant(
  items: HelpItem[],
  stream: HelpStream,
  region: string
): HelpItem[] {
  return items.filter((item) => {
    if (item.streams && !item.streams.includes(stream)) return false;
    if (item.regions && !item.regions.includes(region)) return false;
    return true;
  });
}
