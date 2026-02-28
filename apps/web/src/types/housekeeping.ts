export type DefaultServiceType =
  | "cooking_oil"
  | "hood_grease"
  | "grease_trap"
  | "waste"
  | "cleaning_tanks"
  | "first_aid";

export type ServiceType = DefaultServiceType | string;

export interface MetadataField {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "toggle" | "select" | "multi_select";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  unit?: string;
}

export interface GraphMetric {
  key: string;
  label: string;
  color: string;
}

export interface ServiceConfig {
  key: ServiceType;
  label: string;
  icon: string;
  color: string;
  hasCalendar: boolean;
  hasGraph: boolean;
  graphMetrics?: GraphMetric[];
  metadataFields: MetadataField[];
}

export interface ServiceLog {
  id: string;
  org_id: string;
  service_type: string;
  provider_name: string | null;
  provider_contact: string | null;
  provider_phone: string | null;
  service_date: string;
  next_due_date: string | null;
  invoice_url: string | null;
  pick_slip_url: string | null;
  cost: number | null;
  status: string;
  logged_by: string | null;
  logged_by_name: string | null;
  signature_name: string | null;
  metadata: Record<string, any>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_SERVICES: ServiceConfig[] = [
  {
    key: "cooking_oil",
    label: "Cooking Oil",
    icon: "Droplets",
    color: "text-amber-500",
    hasCalendar: false,
    hasGraph: true,
    graphMetrics: [
      { key: "litres_fresh", label: "Fresh (L)", color: "hsl(142, 71%, 45%)" },
      { key: "litres_dirty", label: "Dirty (L)", color: "hsl(38, 92%, 50%)" },
    ],
    metadataFields: [
      { key: "oil_type", label: "Oil Type", type: "text", placeholder: "Canola, Vegetable..." },
      { key: "litres_fresh", label: "Fresh Oil (L)", type: "number", unit: "L" },
      { key: "litres_dirty", label: "Dirty Oil (L)", type: "number", unit: "L" },
      { key: "tpm_reading", label: "TPM Reading", type: "number", placeholder: "0-40" },
      { key: "fryer_id", label: "Fryer", type: "text", placeholder: "Fryer 1, Fryer 2..." },
    ],
  },
  {
    key: "hood_grease",
    label: "Hood & Grease",
    icon: "Wind",
    color: "text-blue-500",
    hasCalendar: true,
    hasGraph: false,
    metadataFields: [
      { key: "areas_cleaned", label: "Areas Cleaned", type: "multi_select", options: ["Kitchen Hood", "Exhaust Filters", "Canopy", "Ductwork"] },
      { key: "method", label: "Method", type: "text", placeholder: "Steam, chemical..." },
      { key: "filter_condition", label: "Filter Condition", type: "select", options: ["Good", "Fair", "Replace"] },
    ],
  },
  {
    key: "grease_trap",
    label: "Grease Trap",
    icon: "Container",
    color: "text-orange-500",
    hasCalendar: true,
    hasGraph: true,
    graphMetrics: [
      { key: "grease_level_pct", label: "Grease Level %", color: "hsl(25, 95%, 53%)" },
    ],
    metadataFields: [
      { key: "pump_out", label: "Pump Out Performed", type: "toggle" },
      { key: "grease_level_pct", label: "Grease Level %", type: "number", placeholder: "0-100" },
      { key: "condition", label: "Condition Notes", type: "text", placeholder: "Condition of trap..." },
    ],
  },
  {
    key: "waste",
    label: "Waste",
    icon: "Trash2",
    color: "text-green-600",
    hasCalendar: false,
    hasGraph: true,
    graphMetrics: [
      { key: "weight_kg", label: "Weight (kg)", color: "hsl(142, 71%, 45%)" },
    ],
    metadataFields: [
      { key: "waste_type", label: "Waste Type", type: "select", options: ["General", "Organic", "Recyclable", "Oil", "Hazardous"] },
      { key: "weight_kg", label: "Weight (kg)", type: "number", unit: "kg" },
      { key: "disposal_method", label: "Disposal Method", type: "text", placeholder: "Pickup, drop-off..." },
      { key: "bin_count", label: "Bin Count", type: "number" },
    ],
  },
  {
    key: "cleaning_tanks",
    label: "Tanks",
    icon: "Cylinder",
    color: "text-cyan-500",
    hasCalendar: true,
    hasGraph: false,
    metadataFields: [
      { key: "tank_type", label: "Tank Type", type: "select", options: ["Water", "Grease", "Chemical", "Other"] },
      { key: "cleaning_method", label: "Cleaning Method", type: "text", placeholder: "Flush, chemical, manual..." },
      { key: "water_quality", label: "Water Quality", type: "select", options: ["Clear", "Cloudy", "Contaminated"] },
    ],
  },
  {
    key: "first_aid",
    label: "First Aid",
    icon: "Cross",
    color: "text-red-500",
    hasCalendar: false,
    hasGraph: false,
    metadataFields: [
      { key: "incident_type", label: "Incident Type", type: "select", options: ["Cut", "Burn", "Slip", "Allergy", "Other"] },
      { key: "items_used", label: "Items Used", type: "multi_select", options: ["Bandage", "Antiseptic", "Burn Gel", "Ice Pack", "Gloves", "Eye Wash"] },
      { key: "restock_needed", label: "Restock Needed", type: "toggle" },
    ],
  },
];

export const CPI_THRESHOLD = 0.05; // 5% above rolling average

// ── Service schedules ──────────────────────────────────────────────

export const SCHEDULE_FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "FORTNIGHTLY", label: "Fortnightly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "ANNUALLY", label: "Annually" },
] as const;

export type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number]["value"];

export interface ServiceSchedule {
  id: string;
  org_id: string;
  service_type: string;
  frequency: ScheduleFrequency;
  provider_name: string | null;
  estimated_cost: number | null;
  start_date: string;
  next_due_date: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceSummary {
  totalSpend: number;
  entryCount: number;
  avgFrequencyDays: number | null;
  nextDueDate: string | null;
  isOverdue: boolean;
}
