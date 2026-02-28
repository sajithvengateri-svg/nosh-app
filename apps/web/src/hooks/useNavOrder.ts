import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "chefos_nav_order";

interface NavOrderState {
  mainNavOrder: string[];
  secondaryNavOrder: string[];
}

export const useNavOrder = (
  defaultMainNav: string[],
  defaultSecondaryNav: string[]
) => {
  const [navOrder, setNavOrder] = useState<NavOrderState>(() => {
    if (typeof window === "undefined") {
      return { mainNavOrder: defaultMainNav, secondaryNavOrder: defaultSecondaryNav };
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as NavOrderState;
        // Ensure all items are included (in case new items were added)
        const mainOrder = [
          ...parsed.mainNavOrder.filter(p => defaultMainNav.includes(p)),
          ...defaultMainNav.filter(p => !parsed.mainNavOrder.includes(p))
        ];
        const secondaryOrder = [
          ...parsed.secondaryNavOrder.filter(p => defaultSecondaryNav.includes(p)),
          ...defaultSecondaryNav.filter(p => !parsed.secondaryNavOrder.includes(p))
        ];
        return { mainNavOrder: mainOrder, secondaryNavOrder: secondaryOrder };
      } catch {
        return { mainNavOrder: defaultMainNav, secondaryNavOrder: defaultSecondaryNav };
      }
    }
    return { mainNavOrder: defaultMainNav, secondaryNavOrder: defaultSecondaryNav };
  });

  const saveOrder = useCallback((newOrder: NavOrderState) => {
    setNavOrder(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  }, []);

  const updateMainNavOrder = useCallback((newOrder: string[]) => {
    saveOrder({ ...navOrder, mainNavOrder: newOrder });
  }, [navOrder, saveOrder]);

  const updateSecondaryNavOrder = useCallback((newOrder: string[]) => {
    saveOrder({ ...navOrder, secondaryNavOrder: newOrder });
  }, [navOrder, saveOrder]);

  const resetToDefault = useCallback(() => {
    const defaultOrder = { mainNavOrder: defaultMainNav, secondaryNavOrder: defaultSecondaryNav };
    setNavOrder(defaultOrder);
    localStorage.removeItem(STORAGE_KEY);
  }, [defaultMainNav, defaultSecondaryNav]);

  return {
    mainNavOrder: navOrder.mainNavOrder,
    secondaryNavOrder: navOrder.secondaryNavOrder,
    updateMainNavOrder,
    updateSecondaryNavOrder,
    resetToDefault
  };
};
