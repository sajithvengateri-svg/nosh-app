import { useState, useCallback } from "react";

const STORAGE_KEY = "bevos_nav_config";

export interface BevNavItem {
  id: string;
  title: string;
  href: string;
  iconName: string;
}

export interface BevNavSection {
  id: string;
  title: string;
  items: BevNavItem[];
}

export const DEFAULT_BEV_NAV_SECTIONS: BevNavSection[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      { id: "dashboard", title: "Dashboard", href: "/bev/dashboard", iconName: "LayoutDashboard" },
    ],
  },
  {
    id: "products",
    title: "Products",
    items: [
      { id: "cellar", title: "Cellar", href: "/bev/cellar", iconName: "Package" },
      { id: "wine", title: "Wine Intelligence", href: "/bev/wine", iconName: "Wine" },
      { id: "draught", title: "Draught", href: "/bev/draught", iconName: "Beer" },
      { id: "cocktails", title: "Cocktails", href: "/bev/cocktails", iconName: "Martini" },
      { id: "coffee", title: "Coffee Program", href: "/bev/coffee", iconName: "Coffee" },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      { id: "pours", title: "Pours", href: "/bev/pours", iconName: "BarChart3" },
      { id: "bar-prep", title: "Bar Prep", href: "/bev/bar-prep", iconName: "ClipboardList" },
      { id: "stocktake", title: "Stocktake", href: "/bev/stocktake", iconName: "Layers" },
      { id: "waste-log", title: "Waste Log", href: "/bev/waste-log", iconName: "Trash2" },
      { id: "coravin", title: "Coravin", href: "/bev/coravin", iconName: "Droplets" },
      { id: "costing", title: "Bev Costing", href: "/bev/costing", iconName: "Calculator" },
    ],
  },
  {
    id: "team-training",
    title: "Team & Training",
    items: [
      { id: "team", title: "Team", href: "/bev/team", iconName: "Users" },
      { id: "flash-cards", title: "Flash Cards", href: "/bev/flash-cards", iconName: "GlassWater" },
      { id: "training", title: "Training", href: "/bev/training", iconName: "GraduationCap" },
      { id: "compliance", title: "Compliance", href: "/bev/compliance", iconName: "ShieldCheck" },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    items: [
      { id: "engineering", title: "Drinks Engineering", href: "/bev/engineering", iconName: "TrendingUp" },
      { id: "marketplace", title: "Marketplace", href: "/bev/marketplace", iconName: "Store" },
      { id: "ai", title: "BevAI", href: "/bev/ai", iconName: "Bot" },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    items: [
      { id: "stations", title: "Bar Stations", href: "/bev/stations", iconName: "LayoutGrid" },
      { id: "invoices", title: "Invoices", href: "/bev/invoices", iconName: "Receipt" },
      { id: "equipment", title: "Equipment", href: "/bev/equipment", iconName: "Wrench" },
      { id: "production", title: "Production", href: "/bev/production", iconName: "FlaskConical" },
      { id: "calendar", title: "Calendar", href: "/bev/calendar", iconName: "Calendar" },
      { id: "settings", title: "Settings", href: "/bev/settings", iconName: "Settings" },
    ],
  },
];

export const useBevNavOrder = () => {
  const [sections, setSections] = useState<BevNavSection[]>(() => {
    if (typeof window === "undefined") return DEFAULT_BEV_NAV_SECTIONS;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as BevNavSection[];
      } catch {
        return DEFAULT_BEV_NAV_SECTIONS;
      }
    }
    return DEFAULT_BEV_NAV_SECTIONS;
  });

  const save = useCallback((updated: BevNavSection[]) => {
    setSections(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const reorderSections = useCallback((fromIndex: number, toIndex: number) => {
    const updated = [...sections];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    save(updated);
  }, [sections, save]);

  const reorderItemsInSection = useCallback((sectionId: string, fromIndex: number, toIndex: number) => {
    const updated = sections.map(s => {
      if (s.id !== sectionId) return s;
      const items = [...s.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...s, items };
    });
    save(updated);
  }, [sections, save]);

  const moveItemToSection = useCallback((itemId: string, fromSectionId: string, toSectionId: string) => {
    let movedItem: BevNavItem | undefined;
    const updated = sections.map(s => {
      if (s.id === fromSectionId) {
        const item = s.items.find(i => i.id === itemId);
        if (item) movedItem = item;
        return { ...s, items: s.items.filter(i => i.id !== itemId) };
      }
      return s;
    }).map(s => {
      if (s.id === toSectionId && movedItem) {
        return { ...s, items: [...s.items, movedItem] };
      }
      return s;
    });
    save(updated);
  }, [sections, save]);

  const renameSection = useCallback((sectionId: string, newTitle: string) => {
    const updated = sections.map(s =>
      s.id === sectionId ? { ...s, title: newTitle } : s
    );
    save(updated);
  }, [sections, save]);

  const renameItem = useCallback((sectionId: string, itemId: string, newTitle: string) => {
    const updated = sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        items: s.items.map(i => i.id === itemId ? { ...i, title: newTitle } : i),
      };
    });
    save(updated);
  }, [sections, save]);

  const resetToDefault = useCallback(() => {
    setSections(DEFAULT_BEV_NAV_SECTIONS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    sections,
    reorderSections,
    reorderItemsInSection,
    moveItemToSection,
    renameSection,
    renameItem,
    resetToDefault,
  };
};
