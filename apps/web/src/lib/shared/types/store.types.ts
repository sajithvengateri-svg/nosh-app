// TODO: Implement Store types
export interface Store {
  id: string;
  name: string;
  mode: StoreMode;
  settings: StoreSettings;
}

export type StoreMode = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'catering' | 'home_cook';

export interface StoreSettings {
  currency: string;
  timezone: string;
  taxRate: number;
  defaultGPTarget: number;
}
