// Australian postcode → suburb name + coordinates
// Extracted from AdminHeatmap.tsx for shared use across web + mobile

export interface PostcodeGeo {
  name: string;
  lat: number;
  lng: number;
}

// Brisbane / SE QLD — primary vendor market
export const AU_POSTCODES: Record<string, PostcodeGeo> = {
  "4000": { name: "Brisbane CBD", lat: -27.4698, lng: 153.0251 },
  "4005": { name: "New Farm", lat: -27.4500, lng: 153.0530 },
  "4006": { name: "Fortitude Valley", lat: -27.4590, lng: 153.0350 },
  "4007": { name: "Hamilton", lat: -27.4350, lng: 153.0590 },
  "4010": { name: "Albion", lat: -27.4290, lng: 153.0420 },
  "4011": { name: "Clayfield", lat: -27.4200, lng: 153.0360 },
  "4012": { name: "Nundah", lat: -27.4010, lng: 153.0320 },
  "4017": { name: "Sandgate", lat: -27.3520, lng: 153.0780 },
  "4030": { name: "Windsor", lat: -27.4560, lng: 153.0160 },
  "4031": { name: "Lutwyche", lat: -27.4370, lng: 153.0020 },
  "4032": { name: "Kedron", lat: -27.4190, lng: 153.0070 },
  "4034": { name: "Aspley", lat: -27.3940, lng: 153.0130 },
  "4051": { name: "Alderley", lat: -27.4270, lng: 152.9730 },
  "4053": { name: "Everton Park", lat: -27.4070, lng: 152.9800 },
  "4059": { name: "Kelvin Grove", lat: -27.4550, lng: 152.9970 },
  "4060": { name: "Ashgrove", lat: -27.4470, lng: 152.9620 },
  "4064": { name: "Milton", lat: -27.4720, lng: 152.9890 },
  "4066": { name: "Toowong", lat: -27.4770, lng: 152.9650 },
  "4067": { name: "St Lucia", lat: -27.4880, lng: 152.9790 },
  "4068": { name: "Indooroopilly", lat: -27.4950, lng: 152.9580 },
  "4072": { name: "Taringa", lat: -27.4900, lng: 152.9470 },
  "4101": { name: "South Brisbane", lat: -27.4820, lng: 153.0200 },
  "4102": { name: "Woolloongabba", lat: -27.4930, lng: 153.0430 },
  "4103": { name: "Annerley", lat: -27.5090, lng: 153.0360 },
  "4104": { name: "Fairfield", lat: -27.4970, lng: 153.0170 },
  "4105": { name: "Moorooka", lat: -27.5120, lng: 153.0090 },
  "4109": { name: "Sunnybank", lat: -27.5630, lng: 153.0580 },
  "4120": { name: "Stones Corner", lat: -27.5020, lng: 153.0510 },
  "4121": { name: "Holland Park", lat: -27.4970, lng: 153.0530 },
  "4151": { name: "Coorparoo", lat: -27.4820, lng: 153.0490 },
  "4152": { name: "Camp Hill", lat: -27.4980, lng: 153.0770 },
  "4169": { name: "Kangaroo Point", lat: -27.4880, lng: 153.0330 },
  "4170": { name: "Morningside", lat: -27.4650, lng: 153.0780 },
  "4171": { name: "Balmoral", lat: -27.4730, lng: 153.0640 },
};

// Ingredient demand category filter options
export const DEMAND_CATEGORIES = [
  { key: "all", label: "All", color: "#a1a1aa" },
  { key: "Meat", label: "Meat", color: "#ef4444" },
  { key: "Seafood", label: "Seafood", color: "#3b82f6" },
  { key: "Produce", label: "Produce", color: "#22c55e" },
  { key: "Dairy", label: "Dairy", color: "#eab308" },
  { key: "Bakery", label: "Bakery", color: "#ec4899" },
  { key: "Pantry", label: "Pantry", color: "#f97316" },
  { key: "Dry Goods", label: "Dry Goods", color: "#d97706" },
] as const;

// Category → hex colour for map markers and badges
export const CATEGORY_COLORS: Record<string, string> = {
  Meat: "#ef4444",
  Seafood: "#3b82f6",
  Produce: "#22c55e",
  Dairy: "#eab308",
  Bakery: "#ec4899",
  Pantry: "#f97316",
  "Dry Goods": "#d97706",
  Beverages: "#06b6d4",
};
