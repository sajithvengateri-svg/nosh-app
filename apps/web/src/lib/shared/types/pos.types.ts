// POS Types — pure TypeScript, no web APIs

export type POSRole = 'manager' | 'supervisor' | 'cashier' | 'bartender' | 'waiter';
export type POSOrderStatus = 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'PAID' | 'VOIDED';
export type POSOrderType = 'DINE_IN' | 'TAKEAWAY' | 'TAB' | 'FUNCTION';
export type POSPaymentMethod = 'CASH' | 'CARD' | 'TAB' | 'SPLIT' | 'OTHER';
export type POSTicketState = 'NEW' | 'STARTED' | 'READY' | 'COMPLETED';
export type POSStoreMode = 'FOCC_IT' | 'CHICC_IT';
export type POSStation = 'HOT' | 'COLD' | 'BAR' | 'PASS' | 'COFFEE';
export type POSCertStatus = 'VALID' | 'EXPIRING' | 'EXPIRED';

export interface POSStoreConfig {
  id: string;
  org_id: string;
  store_name: string;
  mode: POSStoreMode;
  tax_rate: number;
  card_surcharge_pct: number;
  stripe_account_id?: string;
  stripe_location_id?: string;
  stripe_reader_id?: string;
  receipt_header?: string;
  receipt_footer?: string;
  trading_hours: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface POSStaff {
  id: string;
  org_id: string;
  user_id: string;
  display_name: string;
  pos_role: POSRole;
  is_active: boolean;
}

export interface POSCategory {
  id: string;
  org_id: string;
  name: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
}

export interface POSMenuItem {
  id: string;
  org_id: string;
  category_id?: string;
  name: string;
  description?: string;
  price: number;
  cost_price: number;
  station: POSStation;
  image_url?: string;
  bev_product_id?: string;
  recipe_id?: string;
  is_active: boolean;
  sort_order: number;
}

export interface POSModifierGroup {
  id: string;
  org_id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
}

export interface POSModifier {
  id: string;
  group_id: string;
  name: string;
  price_adjustment: number;
  sort_order: number;
  is_active: boolean;
}

export interface POSOrder {
  id: string;
  org_id: string;
  order_number: number;
  order_type: POSOrderType;
  status: POSOrderStatus;
  table_number?: string;
  tab_id?: string;
  function_id?: string;
  reservation_id?: string;
  subtotal: number;
  tax: number;
  surcharge: number;
  discount: number;
  total: number;
  notes?: string;
  created_by?: string;
  paid_at?: string;
  created_at: string;
}

export interface POSOrderItem {
  id: string;
  order_id: string;
  menu_item_id?: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  modifiers: Array<{ name: string; price: number }>;
  notes?: string;
  station: POSStation;
  course_number: number;
}

export interface POSPayment {
  id: string;
  org_id: string;
  order_id: string;
  method: POSPaymentMethod;
  amount: number;
  tip: number;
  tendered?: number;
  change_given?: number;
  stripe_payment_intent_id?: string;
  card_last_four?: string;
  card_brand?: string;
  is_refund: boolean;
  refund_reason?: string;
  processed_by?: string;
}

export interface POSTab {
  id: string;
  org_id: string;
  name: string;
  stripe_setup_intent_id?: string;
  card_last_four?: string;
  status: 'OPEN' | 'CLOSED';
  opened_by?: string;
  opened_at: string;
  closed_at?: string;
}

export interface POSCert {
  id: string;
  org_id: string;
  user_id: string;
  cert_type: string;
  cert_name: string;
  issue_date?: string;
  expiry_date?: string;
  file_url?: string;
  qr_code?: string;
  status: POSCertStatus;
}

export interface POSAuditEvent {
  id: string;
  org_id: string;
  user_id?: string;
  authorised_by?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  reason?: string;
  created_at: string;
}

export interface POSDailyClose {
  id: string;
  org_id: string;
  close_date: string;
  total_sales: number;
  total_cash: number;
  total_card: number;
  expected_cash: number;
  actual_cash: number;
  variance: number;
  total_discounts: number;
  total_voids: number;
  total_refunds: number;
  order_count: number;
  closed_by?: string;
  notes?: string;
}

export interface POSWasteLog {
  id: string;
  org_id: string;
  menu_item_id?: string;
  item_name: string;
  quantity: number;
  cost: number;
  reason?: string;
  logged_by?: string;
  created_at: string;
}

export interface SyncQueueEntry {
  id: string;
  action: string;
  payload: Record<string, unknown>;
  timestamp: number;
  synced: boolean;
}

// Cart item used in Zustand store (local, pre-submit)
export interface CartItem {
  tempId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  modifiers: Array<{ name: string; price: number }>;
  notes?: string;
  station: POSStation;
  courseNumber: number;
}
