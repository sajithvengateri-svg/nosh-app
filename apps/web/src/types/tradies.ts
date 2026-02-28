export const TRADIE_CATEGORIES = [
  "Plumber",
  "Electrician",
  "Gas Fitter",
  "Refrigeration",
  "Pest Control",
  "Hood Cleaner",
  "Fire Safety",
  "Locksmith",
  "Equipment Repair",
  "Equipment Supplier",
  "Cleaning Supplier",
  "Other",
] as const;

export type TradieCategory = (typeof TRADIE_CATEGORIES)[number];

export interface Tradie {
  id: string;
  org_id: string;
  name: string;
  company: string | null;
  category: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  abn: string | null;
  address: string | null;
  notes: string | null;
  photo_url: string | null;
  is_supplier: boolean;
  linked_equipment_ids: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type TradieInsert = Omit<Tradie, "id" | "created_at" | "updated_at">;

export interface ServiceCallLog {
  id: string;
  org_id: string;
  service_type: "tradie_callout";
  provider_name: string | null;
  service_date: string;
  cost: number | null;
  invoice_url: string | null;
  status: string;
  metadata: {
    tradie_id: string;
    equipment_id?: string;
    issue_description?: string;
    resolution?: string;
    follow_up_needed?: boolean;
  };
  notes: string | null;
  created_at: string;
}
