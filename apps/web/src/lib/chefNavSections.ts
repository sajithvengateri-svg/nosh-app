import {
  Home, ChefHat, Utensils, Shield, Gamepad2,
} from "lucide-react";
import { ALL_CHEF_NAV, type ChefNavItem, type ChefNavSectionKey } from "./chefNavItems";

export interface ChefNavSection {
  sectionKey: ChefNavSectionKey;
  label: string;
  homeCookLabel?: string;
  icon: React.ElementType;
  /** Where clicking the section heading navigates */
  hubPath: string;
  /** If true, render as a direct link (no accordion sub-items) */
  directLink: boolean;
}

export const CHEF_NAV_SECTIONS: ChefNavSection[] = [
  { sectionKey: "home", label: "Home", icon: Home, hubPath: "/dashboard", directLink: true },
  { sectionKey: "recipes", label: "Recipes", homeCookLabel: "My Recipes", icon: ChefHat, hubPath: "/recipes", directLink: false },
  { sectionKey: "kitchen", label: "Kitchen", homeCookLabel: "My Kitchen", icon: Utensils, hubPath: "/prep", directLink: false },
  { sectionKey: "safety", label: "Safety", homeCookLabel: "Safety Checks", icon: Shield, hubPath: "/food-safety", directLink: false },
  { sectionKey: "games", label: "Games", icon: Gamepad2, hubPath: "/games", directLink: true },
];

/** Get all nav items belonging to a given section */
export function getItemsForSection(sectionKey: ChefNavSectionKey): ChefNavItem[] {
  return ALL_CHEF_NAV.filter((item) => item.section === sectionKey);
}

/** Build a path map of section key → all paths in that section (for useSidebarSections) */
export function buildSectionPathMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const section of CHEF_NAV_SECTIONS) {
    const items = getItemsForSection(section.sectionKey);
    map[section.sectionKey] = items.length > 0
      ? items.map((i) => i.path)
      : [section.hubPath];
  }
  return map;
}
