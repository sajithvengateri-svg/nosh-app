// Menu Engineering, Rostering, and Allergen Types

// ==================== MENU ENGINEERING ====================

export type WorkflowStage = 'input' | 'saved' | 'approved' | 'sales_added' | 'analysed' | 'acted' | 'archived';

export interface RemedialNote {
  id: string;
  text: string;
  author: string;
  date: string;
  item_id?: string;
  item_name?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description?: string;
  recipeId?: string;
  sellPrice: number;
  foodCost: number;
  foodCostPercent: number;
  contributionMargin: number;
  popularity: number;
  profitability: 'star' | 'plow-horse' | 'puzzle' | 'dog';
  isActive: boolean;
  menuId: string;
  allergens: Allergen[];
}

export interface Menu {
  id: string;
  name: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  effectiveFrom: Date;
  effectiveTo?: Date;
  items: MenuItem[];
  avgFoodCostPercent: number;
  totalItems: number;
  createdAt: Date;
  updatedAt: Date;
  workflowStage: WorkflowStage;
  archiveNotes?: string;
  remedialNotes: RemedialNote[];
}

export interface MenuAnalytics {
  menuId: string;
  period: { start: Date; end: Date };
  avgFoodCostPercent: number;
  totalRevenue: number;
  totalFoodCost: number;
  grossProfit: number;
  topSellers: { itemId: string; name: string; sales: number; revenue: number }[];
  underperformers: { itemId: string; name: string; sales: number; reason: string }[];
  categoryBreakdown: { category: string; revenue: number; foodCostPercent: number; itemCount: number }[];
}

// POS Integration Types
export type POSProvider = 'lightspeed' | 'square' | 'toast' | 'clover' | 'revel' | 'custom';

export interface POSConnection {
  id: string;
  provider: POSProvider;
  displayName: string;
  isConnected: boolean;
  lastSync?: Date;
  credentials?: {
    apiKey?: string;
    merchantId?: string;
    locationId?: string;
  };
}

export interface POSSalesData {
  itemId: string;
  itemName: string;
  quantity: number;
  revenue: number;
  date: Date;
}

// ==================== ROSTERING ====================

export type RosterProvider = 'deputy' | 'employment-hero' | 'tanda' | 'planday' | 'custom';

export interface RosterConnection {
  id: string;
  provider: RosterProvider;
  displayName: string;
  isConnected: boolean;
  lastSync?: Date;
}

export type StaffRole = 'head-chef' | 'sous-chef' | 'line-cook' | 'prep-cook' | 'dishwasher' | 'server' | 'manager';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  avatar?: string;
  phone?: string;
  email?: string;
}

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  role: StaffRole;
  date: Date;
  startTime: string;
  endTime: string;
  station?: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'no-show' | 'cancelled';
  isOverride?: boolean;
}

export interface DailyRoster {
  date: Date;
  shifts: Shift[];
  totalStaff: number;
  byRole: { role: string; count: number }[];
}

// ==================== LINE CHEF PREP LISTS ====================

export interface LinePrepTask {
  id: string;
  task: string;
  recipeId?: string;
  recipeName?: string;
  quantity: number;
  unit: string;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface LinePrepList {
  id: string;
  createdBy: string;
  createdByRole: StaffRole;
  forDate: Date;
  shift: 'AM' | 'PM';
  station?: string;
  tasks: LinePrepTask[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

// ==================== RESERVATIONS / DEMAND ====================

export type ReservationProvider = 'sevenrooms' | 'opentable' | 'resdiary' | 'yelp' | 'custom';

export interface ReservationConnection {
  id: string;
  provider: ReservationProvider;
  displayName: string;
  isConnected: boolean;
  lastSync?: Date;
}

export interface Reservation {
  id: string;
  guestName: string;
  partySize: number;
  date: Date;
  time: string;
  status: 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  allergens?: Allergen[];
}

export interface DemandForecast {
  date: Date;
  expectedCovers: number;
  reservationCount: number;
  walkInEstimate: number;
  peakHours: { hour: number; expectedCovers: number }[];
  suggestedPrepMultiplier: number;
}

// ==================== ALLERGENS ====================

export type Allergen = 
  | 'gluten' 
  | 'dairy' 
  | 'eggs' 
  | 'fish' 
  | 'shellfish' 
  | 'tree-nuts' 
  | 'peanuts' 
  | 'soy' 
  | 'sesame'
  | 'sulphites'
  | 'celery'
  | 'mustard'
  | 'lupin'
  | 'molluscs';

export interface AllergenInfo {
  id: Allergen;
  name: string;
  icon: string;
  description: string;
}

export interface DishAllergenProfile {
  dishId: string;
  dishName: string;
  containsAllergens: Allergen[];
  mayContainAllergens: Allergen[];
  isSafe: boolean;
}

export interface CustomerAllergenQuery {
  allergens: Allergen[];
  safeDishes: DishAllergenProfile[];
  unsafeDishes: DishAllergenProfile[];
}

// All allergen definitions
export const ALLERGENS: AllergenInfo[] = [
  { id: 'gluten', name: 'Gluten', icon: '🌾', description: 'Wheat, barley, rye, oats' },
  { id: 'dairy', name: 'Dairy', icon: '🥛', description: 'Milk and milk products' },
  { id: 'eggs', name: 'Eggs', icon: '🥚', description: 'Eggs and egg products' },
  { id: 'fish', name: 'Fish', icon: '🐟', description: 'All fish species' },
  { id: 'shellfish', name: 'Shellfish', icon: '🦐', description: 'Crustaceans' },
  { id: 'tree-nuts', name: 'Tree Nuts', icon: '🌰', description: 'Almonds, cashews, walnuts, etc.' },
  { id: 'peanuts', name: 'Peanuts', icon: '🥜', description: 'Peanuts and peanut oil' },
  { id: 'soy', name: 'Soy', icon: '🫘', description: 'Soy and soy products' },
  { id: 'sesame', name: 'Sesame', icon: '⚪', description: 'Sesame seeds and oil' },
  { id: 'sulphites', name: 'Sulphites', icon: '🍷', description: 'Wine, dried fruits' },
  { id: 'celery', name: 'Celery', icon: '🥬', description: 'Celery and celeriac' },
  { id: 'mustard', name: 'Mustard', icon: '🟡', description: 'Mustard seeds and oil' },
  { id: 'lupin', name: 'Lupin', icon: '🌸', description: 'Lupin seeds and flour' },
  { id: 'molluscs', name: 'Molluscs', icon: '🦪', description: 'Oysters, mussels, squid' },
];
