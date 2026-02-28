// OverheadOS type definitions

export type CostType = 'FIXED' | 'VARIABLE' | 'SEMI_VARIABLE';
export type CostFrequency = 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
export type CostSource = 'MANUAL' | 'RECURRING' | 'XERO_SYNC' | 'PRODUCT_FEED';
export type ProductSource = 'RESTOS' | 'BEVOS' | 'CHEFOS' | 'LABOUROS' | 'MARKETINGOS' | 'RESERVATIONOS';
export type AlertSeverity = 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type AlertComparison = 'ABOVE' | 'BELOW';
export type AlertMetric = 'PERCENTAGE' | 'DOLLAR' | 'COUNT';
export type AlertPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type PnlPeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface OverheadCategory {
  id: string;
  org_id: string;
  name: string;
  parent_category: string | null;
  type: CostType;
  is_cogs: boolean;
  is_labour: boolean;
  xero_account_code: string | null;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface OverheadRecurring {
  id: string;
  org_id: string;
  category_id: string;
  description: string;
  supplier_name: string | null;
  amount: number;
  frequency: CostFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string | null;
  auto_generate: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  // joined
  category?: OverheadCategory;
}

export interface OverheadEntry {
  id: string;
  org_id: string;
  category_id: string;
  recurring_id: string | null;
  description: string;
  amount: number;
  date: string;
  supplier_name: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  is_auto_generated: boolean;
  source: CostSource;
  product_source: ProductSource | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // joined
  category?: OverheadCategory;
}

export interface DepreciationAsset {
  id: string;
  org_id: string;
  name: string;
  purchase_price: number;
  purchase_date: string;
  useful_life_years: number;
  depreciation_method: string;
  salvage_value: number;
  monthly_depreciation: number;
  current_book_value: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface OverheadAlertRule {
  id: string;
  org_id: string;
  cost_category: string;
  metric: AlertMetric;
  threshold_warning: number | null;
  threshold_critical: number | null;
  comparison: AlertComparison;
  period: AlertPeriod;
  notify_in_app: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notify_pos: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface OverheadAlert {
  id: string;
  org_id: string;
  rule_id: string | null;
  severity: AlertSeverity;
  metric_name: string;
  actual_value: number;
  threshold_value: number;
  message: string;
  pattern_insight: string | null;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  triggered_at: string;
}

export interface OverheadBenchmark {
  id: string;
  org_id: string;
  venue_type: string;
  metric: string;
  target_value: number;
  benchmark_low: number;
  benchmark_high: number;
  benchmark_avg: number;
  is_default: boolean;
  created_at: string;
}

export interface PnlSnapshot {
  id: string;
  org_id: string;
  period_type: PnlPeriodType;
  period_start: string;
  period_end: string;
  revenue_total: number;
  cogs_food: number;
  cogs_bev: number;
  cogs_waste_food: number;
  cogs_waste_bev: number;
  gross_profit: number;
  gross_margin_pct: number;
  labour_wages: number;
  labour_super: number;
  labour_overtime: number;
  labour_total: number;
  labour_pct: number;
  prime_cost: number;
  prime_cost_pct: number;
  overhead_total: number;
  overhead_pct: number;
  net_profit: number;
  net_profit_pct: number;
  break_even_revenue: number;
  data_completeness_pct: number;
  generated_at: string;
}

// P&L calculation types
export interface PnlLineItem {
  label: string;
  amount: number;
  pctOfRevenue: number;
  status: 'ok' | 'warning' | 'critical';
  source: 'live' | 'partial' | 'manual';
}

export interface PnlSummary {
  revenue: PnlLineItem[];
  revenueTotal: number;
  cogs: PnlLineItem[];
  cogsTotal: number;
  grossProfit: number;
  grossMarginPct: number;
  labour: PnlLineItem[];
  labourTotal: number;
  primeCost: number;
  primeCostPct: number;
  overheads: PnlLineItem[];
  overheadTotal: number;
  netProfit: number;
  netProfitPct: number;
}
