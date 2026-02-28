import { create } from 'zustand';
import { 
  Menu, 
  MenuItem, 
  MenuAnalytics,
  POSConnection,
  POSProvider,
  Allergen
} from '../types/menu.types';

// Empty initial state - no mock data
const initialMenus: Menu[] = [];

// POS connections
const initialPOSConnections: POSConnection[] = [
  { id: 'pos-1', provider: 'lightspeed', displayName: 'Lightspeed', isConnected: false },
  { id: 'pos-2', provider: 'square', displayName: 'Square', isConnected: false },
  { id: 'pos-3', provider: 'toast', displayName: 'Toast', isConnected: false },
  { id: 'pos-4', provider: 'clover', displayName: 'Clover', isConnected: false },
  { id: 'pos-5', provider: 'revel', displayName: 'Revel', isConnected: false },
];

interface MenuStore {
  menus: Menu[];
  activeMenu: Menu | null;
  posConnections: POSConnection[];
  selectedPOS: POSConnection | null;

  // Menu CRUD
  getActiveMenu: () => Menu | null;
  getArchivedMenus: () => Menu[];
  getDraftMenus: () => Menu[];
  getMenuById: (menuId: string) => Menu | undefined;
  createMenu: (name: string, basedOnMenuId?: string) => Menu;
  renameMenu: (menuId: string, newName: string) => void;
  archiveMenu: (menuId: string) => void;
  unarchiveMenu: (menuId: string) => void;
  deleteMenu: (menuId: string) => void;
  activateMenu: (menuId: string) => void;
  duplicateMenu: (menuId: string, newName: string) => Menu;
  updateMenuItem: (menuId: string, item: MenuItem) => void;
  addMenuItem: (menuId: string, item: MenuItem) => void;
  deleteMenuItem: (menuId: string, itemId: string) => void;

  // Analytics
  getMenuAnalytics: (menuId: string) => MenuAnalytics;
  getItemProfitability: (item: MenuItem, avgPopularity: number, avgMargin: number) => MenuItem['profitability'];

  // Comparison
  compareMenus: (menuId1: string, menuId2: string) => { 
    menu1: Menu | undefined; 
    menu2: Menu | undefined;
    addedItems: MenuItem[];
    removedItems: MenuItem[];
    priceChanges: { item: MenuItem; oldPrice: number; newPrice: number; change: number }[];
  };

  // POS
  connectPOS: (provider: POSProvider, credentials: any) => void;
  disconnectPOS: (connectionId: string) => void;

  // Allergen filtering
  filterDishesByAllergens: (customerAllergens: Allergen[]) => { safe: MenuItem[]; unsafe: MenuItem[] };
}

export const useMenuStore = create<MenuStore>((set, get) => ({
  menus: initialMenus,
  activeMenu: initialMenus.find(m => m.status === 'active') || null,
  posConnections: initialPOSConnections,
  selectedPOS: null,

  getActiveMenu: () => {
    return get().menus.find(m => m.status === 'active') || null;
  },

  getArchivedMenus: () => {
    return get().menus.filter(m => m.status === 'archived');
  },

  getDraftMenus: () => {
    return get().menus.filter(m => m.status === 'draft');
  },

  getMenuById: (menuId: string) => {
    return get().menus.find(m => m.id === menuId);
  },

  createMenu: (name: string, basedOnMenuId?: string) => {
    const { menus } = get();
    const baseMenu = basedOnMenuId ? menus.find(m => m.id === basedOnMenuId) : null;
    const menuId = `menu-${Date.now()}`;
    
    const newMenu: Menu = {
      id: menuId,
      name,
      version: 1,
      status: 'draft',
      effectiveFrom: new Date(),
      avgFoodCostPercent: baseMenu?.avgFoodCostPercent || 0,
      totalItems: baseMenu?.items.length || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: baseMenu?.items.map(item => ({ 
        ...item, 
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        menuId 
      })) || [],
    };

    set({ menus: [...menus, newMenu] });
    return newMenu;
  },

  renameMenu: (menuId: string, newName: string) => {
    set(state => ({
      menus: state.menus.map(m => 
        m.id === menuId 
          ? { ...m, name: newName, updatedAt: new Date() }
          : m
      ),
      activeMenu: state.activeMenu?.id === menuId 
        ? { ...state.activeMenu, name: newName, updatedAt: new Date() }
        : state.activeMenu,
    }));
  },

  archiveMenu: (menuId: string) => {
    set(state => ({
      menus: state.menus.map(m => 
        m.id === menuId 
          ? { ...m, status: 'archived' as const, effectiveTo: new Date(), updatedAt: new Date() }
          : m
      ),
      activeMenu: state.activeMenu?.id === menuId ? null : state.activeMenu,
    }));
  },

  unarchiveMenu: (menuId: string) => {
    set(state => ({
      menus: state.menus.map(m => 
        m.id === menuId 
          ? { ...m, status: 'draft' as const, effectiveTo: undefined, updatedAt: new Date() }
          : m
      ),
    }));
  },

  deleteMenu: (menuId: string) => {
    set(state => ({
      menus: state.menus.filter(m => m.id !== menuId),
      activeMenu: state.activeMenu?.id === menuId ? null : state.activeMenu,
    }));
  },

  activateMenu: (menuId: string) => {
    set(state => ({
      menus: state.menus.map(m => ({
        ...m,
        status: m.id === menuId ? 'active' as const : (m.status === 'active' ? 'archived' as const : m.status),
        effectiveTo: m.status === 'active' && m.id !== menuId ? new Date() : m.effectiveTo,
        updatedAt: m.id === menuId || m.status === 'active' ? new Date() : m.updatedAt,
      })),
      activeMenu: state.menus.find(m => m.id === menuId) || null,
    }));
  },

  duplicateMenu: (menuId: string, newName: string) => {
    const { menus } = get();
    const sourceMenu = menus.find(m => m.id === menuId);
    if (!sourceMenu) throw new Error('Menu not found');
    
    const newMenuId = `menu-${Date.now()}`;
    const newMenu: Menu = {
      ...sourceMenu,
      id: newMenuId,
      name: newName,
      status: 'draft',
      version: 1,
      effectiveFrom: new Date(),
      effectiveTo: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: sourceMenu.items.map(item => ({
        ...item,
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        menuId: newMenuId,
      })),
    };

    set({ menus: [...menus, newMenu] });
    return newMenu;
  },

  updateMenuItem: (menuId: string, item: MenuItem) => {
    set(state => ({
      menus: state.menus.map(m => 
        m.id === menuId 
          ? { 
              ...m, 
              items: m.items.map(i => i.id === item.id ? item : i),
              updatedAt: new Date(),
            }
          : m
      ),
    }));
  },

  addMenuItem: (menuId: string, item: MenuItem) => {
    set(state => ({
      menus: state.menus.map(m => 
        m.id === menuId 
          ? { 
              ...m, 
              items: [...m.items, item],
              totalItems: m.items.length + 1,
              updatedAt: new Date(),
            }
          : m
      ),
    }));
  },

  deleteMenuItem: (menuId: string, itemId: string) => {
    set(state => ({
      menus: state.menus.map(m => 
        m.id === menuId 
          ? { 
              ...m, 
              items: m.items.filter(i => i.id !== itemId),
              totalItems: m.items.length - 1,
              updatedAt: new Date(),
            }
          : m
      ),
    }));
  },

  getMenuAnalytics: (menuId: string) => {
    const menu = get().menus.find(m => m.id === menuId);
    if (!menu) {
      return {
        menuId,
        period: { start: new Date(), end: new Date() },
        avgFoodCostPercent: 0,
        totalRevenue: 0,
        totalFoodCost: 0,
        grossProfit: 0,
        topSellers: [],
        underperformers: [],
        categoryBreakdown: [],
      };
    }

    const totalRevenue = menu.items.reduce((sum, item) => sum + (item.sellPrice * item.popularity), 0);
    const totalFoodCost = menu.items.reduce((sum, item) => sum + (item.foodCost * item.popularity), 0);

    const topSellers = [...menu.items]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5)
      .map(item => ({
        itemId: item.id,
        name: item.name,
        sales: item.popularity,
        revenue: item.sellPrice * item.popularity,
      }));

    const underperformers = menu.items
      .filter(item => item.profitability === 'dog')
      .map(item => ({
        itemId: item.id,
        name: item.name,
        sales: item.popularity,
        reason: item.foodCostPercent > 30 ? 'High food cost' : 'Low sales',
      }));

    const categoryBreakdown = Object.entries(
      menu.items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = { revenue: 0, totalCost: 0, count: 0 };
        }
        acc[item.category].revenue += item.sellPrice * item.popularity;
        acc[item.category].totalCost += item.foodCost * item.popularity;
        acc[item.category].count += 1;
        return acc;
      }, {} as Record<string, { revenue: number; totalCost: number; count: number }>)
    ).map(([category, data]) => ({
      category,
      revenue: data.revenue,
      foodCostPercent: data.revenue > 0 ? (data.totalCost / data.revenue) * 100 : 0,
      itemCount: data.count,
    }));

    return {
      menuId,
      period: { start: menu.effectiveFrom, end: menu.effectiveTo || new Date() },
      avgFoodCostPercent: menu.avgFoodCostPercent,
      totalRevenue,
      totalFoodCost,
      grossProfit: totalRevenue - totalFoodCost,
      topSellers,
      underperformers,
      categoryBreakdown,
    };
  },

  compareMenus: (menuId1: string, menuId2: string) => {
    const { menus } = get();
    const menu1 = menus.find(m => m.id === menuId1);
    const menu2 = menus.find(m => m.id === menuId2);

    if (!menu1 || !menu2) {
      return { menu1, menu2, addedItems: [], removedItems: [], priceChanges: [] };
    }

    const menu1ItemNames = new Set(menu1.items.map(i => i.name.toLowerCase()));
    const menu2ItemNames = new Set(menu2.items.map(i => i.name.toLowerCase()));

    const addedItems = menu2.items.filter(i => !menu1ItemNames.has(i.name.toLowerCase()));
    const removedItems = menu1.items.filter(i => !menu2ItemNames.has(i.name.toLowerCase()));

    const priceChanges: { item: MenuItem; oldPrice: number; newPrice: number; change: number }[] = [];
    menu2.items.forEach(item2 => {
      const item1 = menu1.items.find(i => i.name.toLowerCase() === item2.name.toLowerCase());
      if (item1 && item1.sellPrice !== item2.sellPrice) {
        priceChanges.push({
          item: item2,
          oldPrice: item1.sellPrice,
          newPrice: item2.sellPrice,
          change: ((item2.sellPrice - item1.sellPrice) / item1.sellPrice) * 100,
        });
      }
    });

    return { menu1, menu2, addedItems, removedItems, priceChanges };
  },

  getItemProfitability: (item: MenuItem, avgPopularity: number, avgMargin: number) => {
    const isHighPopularity = item.popularity >= avgPopularity;
    const isHighMargin = item.contributionMargin >= avgMargin;

    if (isHighPopularity && isHighMargin) return 'star';
    if (isHighPopularity && !isHighMargin) return 'plow-horse';
    if (!isHighPopularity && isHighMargin) return 'puzzle';
    return 'dog';
  },

  connectPOS: (provider: POSProvider, credentials: any) => {
    set(state => ({
      posConnections: state.posConnections.map(c => 
        c.provider === provider 
          ? { ...c, isConnected: true, lastSync: new Date(), credentials }
          : c
      ),
      selectedPOS: state.posConnections.find(c => c.provider === provider) || null,
    }));
  },

  disconnectPOS: (connectionId: string) => {
    set(state => ({
      posConnections: state.posConnections.map(c => 
        c.id === connectionId 
          ? { ...c, isConnected: false, credentials: undefined }
          : c
      ),
      selectedPOS: state.selectedPOS?.id === connectionId ? null : state.selectedPOS,
    }));
  },

  filterDishesByAllergens: (customerAllergens: Allergen[]) => {
    const activeMenu = get().getActiveMenu();
    if (!activeMenu) return { safe: [], unsafe: [] };

    const safe: MenuItem[] = [];
    const unsafe: MenuItem[] = [];

    activeMenu.items.forEach(item => {
      const hasAllergen = item.allergens.some(a => customerAllergens.includes(a));
      if (hasAllergen) {
        unsafe.push(item);
      } else {
        safe.push(item);
      }
    });

    return { safe, unsafe };
  },
}));
