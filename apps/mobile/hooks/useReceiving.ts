import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useOrg } from "../contexts/OrgProvider";
import { useAuth } from "../contexts/AuthProvider";

// ── Types ────────────────────────────────────────────────────────────

export interface ReceivingSetting {
  id: string;
  org_id: string;
  product_category: string;
  temp_min: number | null;
  temp_max: number | null;
  requires_temp_check: boolean;
  ai_quality_check_enabled: boolean;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  products_supplied: string[] | null;
  is_approved: boolean;
}

export type CorrectiveActionType = "received" | "send_back" | "credit";

// ── Product category → common items ─────────────────────────────────

export const PRODUCT_CATEGORIES = [
  "dairy",
  "meat",
  "seafood",
  "poultry",
  "produce",
  "frozen",
  "dry_goods",
  "bakery",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  dairy: "Dairy",
  meat: "Meat",
  seafood: "Seafood",
  poultry: "Poultry",
  produce: "Produce",
  frozen: "Frozen",
  dry_goods: "Dry Goods",
  bakery: "Bakery",
};

export const PRODUCT_CATEGORY_ITEMS: Record<ProductCategory, string[]> = {
  dairy: [
    "Milk", "Cream", "Butter", "Cheese", "Yoghurt", "Sour Cream",
    "Cream Cheese", "Parmesan", "Mozzarella", "Ricotta", "Feta",
  ],
  meat: [
    "Beef Mince", "Beef Scotch Fillet", "Beef Eye Fillet", "Lamb Rack",
    "Lamb Cutlets", "Lamb Leg", "Pork Belly", "Pork Loin", "Bacon",
    "Sausages", "Prosciutto", "Salami", "Veal",
  ],
  seafood: [
    "Salmon", "Barramundi", "Snapper", "Prawns", "Calamari", "Mussels",
    "Oysters", "Tuna", "Cod", "Flathead", "Scallops", "Crab", "Lobster",
  ],
  poultry: [
    "Chicken Breast", "Chicken Thigh", "Chicken Wings", "Whole Chicken",
    "Duck Breast", "Duck Leg", "Turkey Breast", "Quail",
  ],
  produce: [
    "Lettuce", "Tomatoes", "Onions", "Carrots", "Potatoes", "Capsicum",
    "Broccoli", "Spinach", "Mushrooms", "Zucchini", "Avocado", "Herbs",
    "Lemons", "Limes", "Oranges", "Berries", "Apples", "Bananas",
  ],
  frozen: [
    "Frozen Chips", "Frozen Peas", "Frozen Corn", "Frozen Berries",
    "Frozen Pastry", "Ice Cream", "Frozen Fish", "Frozen Prawns",
  ],
  dry_goods: [
    "Flour", "Sugar", "Rice", "Pasta", "Olive Oil", "Vegetable Oil",
    "Salt", "Pepper", "Canned Tomatoes", "Coconut Milk", "Soy Sauce",
    "Vinegar", "Spices", "Breadcrumbs",
  ],
  bakery: [
    "Bread Rolls", "Sourdough", "Croissants", "Baguettes", "Wraps",
    "Burger Buns", "Brioche", "Ciabatta", "Pita Bread",
  ],
};

// ── Default receiving temp benchmarks ───────────────────────────────

export const DEFAULT_RECEIVING_SETTINGS: Omit<ReceivingSetting, "id" | "org_id">[] = [
  { product_category: "dairy",     temp_min: 0,   temp_max: 5,   requires_temp_check: true,  ai_quality_check_enabled: false },
  { product_category: "meat",      temp_min: 0,   temp_max: 5,   requires_temp_check: true,  ai_quality_check_enabled: true },
  { product_category: "seafood",   temp_min: -1,  temp_max: 5,   requires_temp_check: true,  ai_quality_check_enabled: true },
  { product_category: "poultry",   temp_min: 0,   temp_max: 5,   requires_temp_check: true,  ai_quality_check_enabled: false },
  { product_category: "produce",   temp_min: 1,   temp_max: 12,  requires_temp_check: true,  ai_quality_check_enabled: true },
  { product_category: "frozen",    temp_min: -25, temp_max: -15, requires_temp_check: true,  ai_quality_check_enabled: false },
  { product_category: "dry_goods", temp_min: null, temp_max: null, requires_temp_check: false, ai_quality_check_enabled: false },
  { product_category: "bakery",    temp_min: null, temp_max: null, requires_temp_check: false, ai_quality_check_enabled: false },
];

// ── Receiving temp status check ─────────────────────────────────────

export function getReceivingTempStatus(
  temp: number,
  setting: ReceivingSetting
): "pass" | "fail" | "no_check" {
  if (!setting.requires_temp_check || setting.temp_min == null || setting.temp_max == null) {
    return "no_check";
  }
  return temp >= setting.temp_min && temp <= setting.temp_max ? "pass" : "fail";
}

// ── Hook: useSuppliers ──────────────────────────────────────────────

export function useSuppliers() {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const queryKey = ["suppliers", orgId];

  const { data, isLoading, refetch } = useQuery<Supplier[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) {
        return queryClient.getQueryData<Supplier[]>(queryKey) ?? [
          { id: "dev-sup-1", supplier_name: "Bidfood", products_supplied: ["meat", "seafood", "dairy", "frozen"], is_approved: true },
          { id: "dev-sup-2", supplier_name: "PFD Foods", products_supplied: ["meat", "poultry", "dry_goods"], is_approved: true },
          { id: "dev-sup-3", supplier_name: "Coles Fresh", products_supplied: ["produce", "dairy", "bakery"], is_approved: true },
          { id: "dev-sup-4", supplier_name: "De Costi Seafoods", products_supplied: ["seafood"], is_approved: true },
          { id: "dev-sup-5", supplier_name: "Riviana Foods", products_supplied: ["dry_goods", "frozen"], is_approved: true },
        ];
      }
      const { data, error } = await supabase
        .from("bcc_supplier_register")
        .select("id, supplier_name, products_supplied, is_approved")
        .eq("org_id", orgId)
        .eq("is_approved", true)
        .order("supplier_name");
      if (error) throw error;
      return (data as unknown as Supplier[]) || [];
    },
    enabled: !!orgId,
  });

  return { suppliers: data ?? [], isLoading, refetch };
}

// ── Hook: useReceivingSettings ──────────────────────────────────────

export function useReceivingSettings() {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const queryKey = ["receiving-settings", orgId];

  const { data, isLoading, refetch } = useQuery<ReceivingSetting[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) {
        return queryClient.getQueryData<ReceivingSetting[]>(queryKey) ??
          DEFAULT_RECEIVING_SETTINGS.map((s, i) => ({
            ...s,
            id: `dev-rs-${i}`,
            org_id: orgId,
          }));
      }
      const { data, error } = await supabase
        .from("receiving_settings")
        .select("*")
        .eq("org_id", orgId)
        .order("product_category");
      if (error) throw error;
      return (data as unknown as ReceivingSetting[]) || [];
    },
    enabled: !!orgId,
  });

  return { settings: data ?? [], isLoading, refetch, queryKey };
}

// ── Hook: useReceivingSettingsMutations ──────────────────────────────

export function useReceivingSettingsMutations() {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const queryKey = ["receiving-settings", orgId];

  const devSetCache = (updater: (prev: ReceivingSetting[]) => ReceivingSetting[]) => {
    queryClient.setQueryData<ReceivingSetting[]>(queryKey, (prev) => updater(prev ?? []));
  };
  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const updateSetting = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReceivingSetting> & { id: string }) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
        return;
      }
      const { error } = await supabase
        .from("receiving_settings")
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const seedDefaults = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache(() =>
          DEFAULT_RECEIVING_SETTINGS.map((s, i) => ({
            ...s,
            id: `dev-rs-${i}`,
            org_id: orgId,
          }))
        );
        return;
      }
      const rows = DEFAULT_RECEIVING_SETTINGS.map((s) => ({ ...s, org_id: orgId }));
      const { error } = await supabase.from("receiving_settings").upsert(rows, {
        onConflict: "org_id,product_category",
      });
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  const insertSetting = useMutation({
    mutationFn: async (data: Omit<ReceivingSetting, "id" | "org_id">) => {
      if (!orgId) throw new Error("No org selected");
      if (isDevBypass) {
        devSetCache((prev) => [
          ...prev,
          { ...data, id: `dev-rs-${Date.now()}`, org_id: orgId },
        ]);
        return;
      }
      const { error } = await supabase
        .from("receiving_settings")
        .insert({ ...data, org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => { if (!isDevBypass) invalidate(); },
  });

  return { updateSetting, seedDefaults, insertSetting };
}

// ── Hook: useReceivingLogs ──────────────────────────────────────────

export function useReceivingLogs(dateFilter?: string) {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const date = dateFilter || new Date().toISOString().split("T")[0];
  const queryKey = ["receiving-logs", orgId, date];

  const { data, isLoading, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) {
        return queryClient.getQueryData<any[]>(queryKey) ?? [];
      }
      const { data, error } = await supabase
        .from("daily_compliance_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "receiving")
        .eq("log_date", date)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });

  return { logs: data ?? [], isLoading, refetch, queryKey, date };
}

// ── Hook: useReceivingHistory ───────────────────────────────────────

export function useReceivingHistory(filters: {
  dateFrom?: string;
  dateTo?: string;
  supplierId?: string;
  searchItem?: string;
}) {
  const { currentOrg } = useOrg();
  const { isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryKey = ["receiving-history", orgId, filters];

  const { data, isLoading, refetch } = useQuery<any[]>({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) return [];

      let query = supabase
        .from("daily_compliance_logs")
        .select("*")
        .eq("org_id", orgId)
        .eq("log_type", "receiving")
        .order("log_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters.dateFrom) query = query.gte("log_date", filters.dateFrom);
      if (filters.dateTo) query = query.lte("log_date", filters.dateTo);
      if (filters.supplierId) query = query.eq("supplier_id", filters.supplierId);
      if (filters.searchItem) {
        query = query.ilike("notes->>item_name", `%${filters.searchItem}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !!(filters.dateFrom || filters.dateTo || filters.supplierId || filters.searchItem),
  });

  return { logs: data ?? [], isLoading, refetch };
}
