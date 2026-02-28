import {
  LayoutDashboard, ChefHat, Utensils, Receipt, Package, ClipboardList,
  Factory, Store, AlertTriangle, Trash2, Menu, Users, Calendar,
  LayoutGrid, Wrench, BookOpen, Shield, GraduationCap, Settings,
  BarChart3, Zap, Activity, Camera, TrendingUp, Clock, Star,
  FileText, Search, Bell, Layers, Award, CheckCircle2,
  ListChecks, Gamepad2, Gift, Lightbulb, Home, MessageSquare,
  type LucideIcon,
} from "lucide-react";
import type { StoreMode } from "./shared/types/store.types";

export interface WalkthroughFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface WalkthroughSlide {
  module: string;
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  features: [WalkthroughFeature, WalkthroughFeature, WalkthroughFeature];
  screenshot?: string;
  route: string;
  /** Optional home cook overrides */
  homeCookTitle?: string;
  homeCookDescription?: string;
}

const HOME_COOK_MODULES = [
  "dashboard", "kitchen", "todo", "recipes", "inventory", "waste-log", "food-safety", "cheatsheets", "settings",
];

/** Return filtered slides based on store mode, with label overrides for home cooks */
export function getWalkthroughSlides(mode?: StoreMode | null): WalkthroughSlide[] {
  if (!mode || mode !== "home_cook") return WALKTHROUGH_SLIDES;

  return WALKTHROUGH_SLIDES
    .filter((s) => HOME_COOK_MODULES.includes(s.module))
    .map((s) => ({
      ...s,
      title: s.homeCookTitle ?? s.title,
      description: s.homeCookDescription ?? s.description,
    }));
}

export const WALKTHROUGH_SLIDES: WalkthroughSlide[] = [
  {
    module: "dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Your kitchen hub — everything at a glance.",
    gradient: "from-primary/80 to-primary/40",
    route: "/dashboard",
    homeCookTitle: "My Kitchen",
    homeCookDescription: "Your home kitchen hub — everything at a glance.",
    features: [
      { icon: BarChart3, title: "Live Stats", desc: "Real-time prep, stock & cost metrics" },
      { icon: Zap, title: "Quick Actions", desc: "One-tap access to common tasks" },
      { icon: Activity, title: "Team Activity", desc: "See what your crew is working on" },
    ],
  },
  {
    module: "todo",
    icon: ListChecks,
    title: "Todo",
    description: "Your personal task board — never miss a thing.",
    gradient: "from-primary/70 to-accent/40",
    route: "/todo",
    features: [
      { icon: CheckCircle2, title: "Quick Capture", desc: "Add tasks on the fly from anywhere" },
      { icon: Clock, title: "Due Dates", desc: "Set deadlines and get reminders" },
      { icon: Users, title: "Assign Tasks", desc: "Delegate to team and track progress" },
    ],
  },
  {
    module: "kitchen",
    icon: Home,
    title: "My Kitchen",
    description: "Your home kitchen hub — recipes, stock & shopping in one place.",
    gradient: "from-sage/70 to-primary/40",
    route: "/kitchen",
    homeCookTitle: "My Kitchen",
    homeCookDescription: "Your home kitchen hub — everything you need at a glance.",
    features: [
      { icon: ChefHat, title: "Quick Cook", desc: "See what you can make right now" },
      { icon: Package, title: "Pantry View", desc: "Check what's in stock at home" },
      { icon: ClipboardList, title: "Shopping List", desc: "Auto-generate lists from recipes" },
    ],
  },
  {
    module: "recipes",
    icon: ChefHat,
    title: "Recipe Bank",
    description: "Create, cost, and manage every recipe in one place.",
    gradient: "from-accent/80 to-accent/40",
    route: "/recipes",
    homeCookTitle: "My Recipes",
    homeCookDescription: "Save and organise your favourite recipes.",
    features: [
      { icon: TrendingUp, title: "Cost Analysis", desc: "Automatic food cost calculations" },
      { icon: Camera, title: "PDF / Photo Import", desc: "Snap or upload existing recipes" },
      { icon: Layers, title: "Scaling Tools", desc: "Scale portions up or down instantly" },
    ],
  },
  {
    module: "ingredients",
    icon: Utensils,
    title: "Ingredients",
    description: "Your complete ingredient library with pricing.",
    gradient: "from-copper/80 to-copper-light/60",
    route: "/ingredients",
    homeCookTitle: "My Pantry",
    homeCookDescription: "Keep track of what's in your pantry.",
    features: [
      { icon: TrendingUp, title: "Supplier Pricing", desc: "Track costs across suppliers" },
      { icon: AlertTriangle, title: "Allergen Tags", desc: "Flag allergens at ingredient level" },
      { icon: BarChart3, title: "Par Levels", desc: "Set minimum stock thresholds" },
    ],
  },
  {
    module: "invoices",
    icon: Receipt,
    title: "Invoices",
    description: "Scan, track, and reconcile supplier invoices.",
    gradient: "from-primary/70 to-copper-light/50",
    route: "/invoices",
    features: [
      { icon: Camera, title: "Photo Scanning", desc: "Snap an invoice, auto-extract data" },
      { icon: TrendingUp, title: "Auto Price Updates", desc: "Ingredient prices update on scan" },
      { icon: Clock, title: "Cost History", desc: "Track price changes over time" },
    ],
  },
  {
    module: "inventory",
    icon: Package,
    title: "Inventory",
    description: "Track stock across all your venues in real time.",
    gradient: "from-warning/70 to-warning/30",
    route: "/inventory",
    homeCookTitle: "My Stock",
    homeCookDescription: "Know what you have at home. Never overbuy again.",
    features: [
      { icon: CheckCircle2, title: "Quick Count", desc: "Fast stocktake from your phone" },
      { icon: Bell, title: "Low Stock Alerts", desc: "Get notified before you run out" },
      { icon: FileText, title: "Shopping List", desc: "See what you need to restock" },
    ],
  },
  {
    module: "prep",
    icon: ClipboardList,
    title: "Prep Lists",
    description: "Daily prep task management for the whole team.",
    gradient: "from-primary/80 to-primary/40",
    route: "/prep",
    features: [
      { icon: Users, title: "Assign to Staff", desc: "Delegate tasks to team members" },
      { icon: CheckCircle2, title: "Track Completion", desc: "Real-time progress tracking" },
      { icon: Clock, title: "Recurring Lists", desc: "Auto-generate daily prep lists" },
    ],
  },
  {
    module: "production",
    icon: Factory,
    title: "Production",
    description: "Batch production planning and scheduling.",
    gradient: "from-accent/70 to-sage-light/50",
    route: "/production",
    features: [
      { icon: Layers, title: "Scale Recipes", desc: "Batch up recipes for large runs" },
      { icon: Calendar, title: "Schedule Batches", desc: "Plan production across the week" },
      { icon: BarChart3, title: "Yield Tracking", desc: "Monitor actual vs expected output" },
    ],
  },
  {
    module: "marketplace",
    icon: Store,
    title: "Marketplace",
    description: "Discover suppliers and compare products.",
    gradient: "from-sage/70 to-sage-light/50",
    route: "/marketplace",
    features: [
      { icon: Search, title: "Compare Prices", desc: "Find the best deal across vendors" },
      { icon: FileText, title: "Order Direct", desc: "Send orders straight to suppliers" },
      { icon: Star, title: "Supplier Reviews", desc: "Rate and review your suppliers" },
    ],
  },
  {
    module: "allergens",
    icon: AlertTriangle,
    title: "Allergens",
    description: "Manage allergen compliance across all menus.",
    gradient: "from-destructive/60 to-destructive/30",
    route: "/allergens",
    features: [
      { icon: Zap, title: "Auto-Detection", desc: "Allergens flagged from ingredients" },
      { icon: FileText, title: "Menu Labels", desc: "Generate allergen labels for menus" },
      { icon: Shield, title: "Compliance Reports", desc: "Audit-ready allergen documentation" },
    ],
  },
  {
    module: "waste-log",
    icon: Trash2,
    title: "Waste Log",
    description: "Track and reduce food waste across your kitchen.",
    gradient: "from-warning/70 to-warning/30",
    route: "/waste-log",
    homeCookTitle: "Waste Tracker",
    homeCookDescription: "Track what you toss. Reduce waste, save money.",
    features: [
      { icon: Layers, title: "Log by Category", desc: "Prep waste, spoilage, leftovers" },
      { icon: TrendingUp, title: "Cost Impact", desc: "See the dollar cost of waste" },
      { icon: BarChart3, title: "Spot Patterns", desc: "Identify what you waste most" },
    ],
  },
  {
    module: "menu-engineering",
    icon: Menu,
    title: "Menu Engineering",
    description: "Optimise your menu for maximum profitability.",
    gradient: "from-primary/80 to-accent/40",
    route: "/menu-engineering",
    features: [
      { icon: Star, title: "Star / Dog Matrix", desc: "Identify winners and underperformers" },
      { icon: TrendingUp, title: "Margin Analysis", desc: "Deep dive into item profitability" },
      { icon: BarChart3, title: "Price Suggestions", desc: "AI-powered pricing recommendations" },
    ],
  },
  {
    module: "roster",
    icon: Users,
    title: "Roster",
    description: "Staff scheduling made simple.",
    gradient: "from-accent/70 to-accent/30",
    route: "/roster",
    features: [
      { icon: Calendar, title: "Shift Templates", desc: "Create reusable shift patterns" },
      { icon: Clock, title: "Availability", desc: "Staff set their own availability" },
      { icon: TrendingUp, title: "Labour Cost Tracking", desc: "Monitor wages in real time" },
    ],
  },
  {
    module: "calendar",
    icon: Calendar,
    title: "Calendar",
    description: "Kitchen calendar for events and services.",
    gradient: "from-primary/60 to-copper-light/40",
    route: "/calendar",
    features: [
      { icon: Clock, title: "Service Schedules", desc: "Plan daily service windows" },
      { icon: Bell, title: "Reminders", desc: "Never miss a prep deadline" },
      { icon: Users, title: "Team Sync", desc: "Shared calendar for the whole crew" },
    ],
  },
  {
    module: "kitchen-sections",
    icon: LayoutGrid,
    title: "Kitchen Sections",
    description: "Organise your kitchen into stations.",
    gradient: "from-sage/60 to-sage-light/40",
    route: "/kitchen-sections",
    features: [
      { icon: Users, title: "Station Assignment", desc: "Assign chefs to their sections" },
      { icon: ChefHat, title: "Section Recipes", desc: "Link recipes to stations" },
      { icon: Activity, title: "Workflow View", desc: "Visualise your kitchen flow" },
    ],
  },
  {
    module: "equipment",
    icon: Wrench,
    title: "Equipment",
    description: "Track and maintain kitchen equipment.",
    gradient: "from-copper/60 to-copper-light/40",
    route: "/equipment",
    features: [
      { icon: Calendar, title: "Maintenance Schedules", desc: "Never miss a service date" },
      { icon: Shield, title: "Warranties", desc: "Track warranty expiry dates" },
      { icon: FileText, title: "Service Logs", desc: "Full history of repairs" },
    ],
  },
  {
    module: "cheatsheets",
    icon: BookOpen,
    title: "Cheatsheets",
    description: "Quick reference guides for your team.",
    gradient: "from-accent/70 to-sage-light/50",
    route: "/cheatsheets",
    features: [
      { icon: FileText, title: "Custom Cards", desc: "Create cards for any topic" },
      { icon: Camera, title: "Photo Guides", desc: "Visual plating and prep guides" },
      { icon: LayoutGrid, title: "Station Cheatsheets", desc: "Station-specific quick refs" },
    ],
  },
  {
    module: "food-safety",
    icon: Shield,
    title: "Food Safety",
    description: "HACCP compliance and safety monitoring.",
    gradient: "from-success/70 to-success/30",
    route: "/food-safety",
    features: [
      { icon: BarChart3, title: "Temp Logs", desc: "Digital temperature recording" },
      { icon: CheckCircle2, title: "Cleaning Checklists", desc: "Daily cleaning sign-offs" },
      { icon: FileText, title: "Audit Reports", desc: "Generate compliance reports" },
    ],
  },
  {
    module: "training",
    icon: GraduationCap,
    title: "Training",
    description: "Staff training modules and progress tracking.",
    gradient: "from-primary/70 to-primary/30",
    route: "/training",
    features: [
      { icon: BookOpen, title: "Interactive Courses", desc: "Built-in training materials" },
      { icon: CheckCircle2, title: "Quiz Tracking", desc: "Test and track understanding" },
      { icon: Award, title: "Certifications", desc: "Issue and manage certificates" },
    ],
  },
  {
    module: "team",
    icon: Users,
    title: "Team",
    description: "Manage your kitchen team and roles.",
    gradient: "from-accent/60 to-accent/30",
    route: "/team",
    features: [
      { icon: Shield, title: "Roles & Permissions", desc: "Control who sees and edits what" },
      { icon: BarChart3, title: "Performance", desc: "Track individual contributions" },
      { icon: GraduationCap, title: "Onboarding", desc: "Structured new-starter flows" },
    ],
  },
  {
    module: "referral",
    icon: Gift,
    title: "Refer & Save",
    description: "Share ChefOS and earn rewards for every sign-up.",
    gradient: "from-primary/60 to-accent/40",
    route: "/referral",
    features: [
      { icon: Gift, title: "Unique Code", desc: "Get your personal referral link" },
      { icon: TrendingUp, title: "Track Referrals", desc: "See who signed up through you" },
      { icon: Award, title: "Earn Rewards", desc: "Unlock perks as referrals grow" },
    ],
  },
  {
    module: "housekeeping",
    icon: Activity,
    title: "Housekeeping",
    description: "Daily cleaning and maintenance checklists.",
    gradient: "from-sage/60 to-sage-light/30",
    route: "/housekeeping",
    features: [
      { icon: CheckCircle2, title: "Daily Checklists", desc: "Opening, mid-service & closing tasks" },
      { icon: Users, title: "Staff Sign-off", desc: "Track who completed each task" },
      { icon: BarChart3, title: "Compliance Score", desc: "Monitor completion rates over time" },
    ],
  },
  {
    module: "games",
    icon: Gamepad2,
    title: "Mastery Suite",
    description: "Level up your skills with gamified kitchen challenges.",
    gradient: "from-accent/80 to-primary/40",
    route: "/games",
    homeCookTitle: "Games",
    homeCookDescription: "Fun kitchen challenges to test your skills.",
    features: [
      { icon: Gamepad2, title: "Kitchen Games", desc: "Speed challenges & trivia rounds" },
      { icon: Award, title: "Leaderboards", desc: "Compete with your team for top spot" },
      { icon: TrendingUp, title: "Skill Tracking", desc: "Watch your mastery grow over time" },
    ],
  },
  {
    module: "feedback",
    icon: MessageSquare,
    title: "Feedback",
    description: "Share ideas and suggestions to improve ChefOS.",
    gradient: "from-primary/50 to-muted-foreground/30",
    route: "/feedback",
    features: [
      { icon: Lightbulb, title: "Feature Requests", desc: "Suggest new features you need" },
      { icon: MessageSquare, title: "Bug Reports", desc: "Report issues for quick fixes" },
      { icon: Star, title: "Vote & Prioritise", desc: "Upvote ideas from other chefs" },
    ],
  },
  {
    module: "settings",
    icon: Settings,
    title: "Settings",
    description: "Customise ChefOS to suit your kitchen.",
    gradient: "from-muted-foreground/40 to-muted-foreground/20",
    route: "/settings",
    homeCookTitle: "Settings",
    homeCookDescription: "Customise your home kitchen experience.",
    features: [
      { icon: LayoutGrid, title: "Preferences", desc: "Units, theme, and display options" },
      { icon: Bell, title: "Notifications", desc: "Fine-tune alerts and reminders" },
      { icon: Zap, title: "Replay This Tour", desc: "Re-launch this walkthrough anytime" },
    ],
  },
];
