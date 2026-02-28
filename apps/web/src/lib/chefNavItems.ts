import {
  LayoutDashboard,
  ChefHat,
  Package,
  ClipboardList,
  Shield,
  GraduationCap,
  Receipt,
  Utensils,
  Factory,
  Menu,
  Users,
  AlertTriangle,
  BookOpen,
  Calendar,
  Wrench,
  Store,
  LayoutGrid,
  Trash2,
  Lightbulb,
  ListChecks,
  Gift,
  Activity,
  Gamepad2,
} from "lucide-react";

export type ChefNavSectionKey = "home" | "recipes" | "kitchen" | "safety" | "games";

export interface ChefNavItem {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  module: string;
  homeCookLabel?: string;
  /** If true, this item only appears in home_cook mode */
  homeCookOnly?: boolean;
  /** Which sidebar section this item belongs to */
  section?: ChefNavSectionKey;
}

export const CHEF_MAIN_NAV: ChefNavItem[] = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", module: "dashboard", section: "home" },
  { path: "/recipes", icon: ChefHat, label: "Recipe Bank", module: "recipes", homeCookLabel: "My Recipes", section: "recipes" },
  { path: "/kitchen", icon: ChefHat, label: "Kitchen", module: "kitchen", homeCookLabel: "My Kitchen", homeCookOnly: true, section: "kitchen" },
  { path: "/todo", icon: ListChecks, label: "Todo", module: "todo", section: "kitchen" },
  { path: "/ingredients", icon: Utensils, label: "Ingredients", module: "ingredients", homeCookLabel: "My Pantry", section: "recipes" },
  { path: "/invoices", icon: Receipt, label: "Invoices", module: "invoices", section: "recipes" },
  { path: "/inventory", icon: Package, label: "Inventory", module: "inventory", homeCookLabel: "My Stock", section: "kitchen" },
  { path: "/prep", icon: ClipboardList, label: "Prep Lists", module: "prep", homeCookLabel: "Prep", section: "kitchen" },
  { path: "/production", icon: Factory, label: "Production", module: "production", section: "kitchen" },
  { path: "/marketplace", icon: Store, label: "Marketplace", module: "marketplace", section: "recipes" },
  { path: "/allergens", icon: AlertTriangle, label: "Allergens", module: "allergens", section: "recipes" },
  { path: "/waste-log", icon: Trash2, label: "Waste Log", module: "waste-log", homeCookLabel: "Waste Tracker", section: "kitchen" },
  { path: "/housekeeping", icon: Activity, label: "Housekeeping", module: "housekeeping", section: "safety" },
  { path: "/games", icon: Gamepad2, label: "Mastery Suite", module: "games", homeCookLabel: "Games", section: "games" },
];

export const CHEF_SECONDARY_NAV: ChefNavItem[] = [
  { path: "/menu-engineering", icon: Menu, label: "Menu Engineering", module: "menu-engineering", section: "recipes" },
  { path: "/roster", icon: Users, label: "Roster", module: "roster", section: "kitchen" },
  { path: "/calendar", icon: Calendar, label: "Calendar", module: "calendar", section: "kitchen" },
  { path: "/kitchen-sections", icon: LayoutGrid, label: "Kitchen Sections", module: "kitchen-sections", section: "kitchen" },
  { path: "/equipment", icon: Wrench, label: "Equipment", module: "equipment", section: "kitchen" },
  { path: "/cheatsheets", icon: BookOpen, label: "Cheatsheets", module: "cheatsheets", section: "safety" },
  { path: "/food-safety", icon: Shield, label: "Food Safety", module: "food-safety", homeCookLabel: "Safety Checks", section: "safety" },
  { path: "/training", icon: GraduationCap, label: "Training", module: "training", section: "safety" },
  { path: "/team", icon: Users, label: "Team", module: "team", section: "kitchen" },
];

export const ALL_CHEF_NAV = [...CHEF_MAIN_NAV, ...CHEF_SECONDARY_NAV];
export const DEFAULT_MAIN_PATHS = CHEF_MAIN_NAV.map(i => i.path);
export const DEFAULT_SECONDARY_PATHS = CHEF_SECONDARY_NAV.map(i => i.path);
