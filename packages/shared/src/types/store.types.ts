export interface Store {
  id: string;
  name: string;
  mode: StoreMode;
  settings: StoreSettings;
}

export type StoreMode = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'catering' | 'home_cook';

export type AppVariant =
  // Australia (originals + state-based)
  | 'chefos' | 'homechef' | 'eatsafe_brisbane'
  | 'eatsafe_sydney' | 'eatsafe_melbourne' | 'eatsafe_perth'
  | 'eatsafe_adelaide' | 'eatsafe_hobart' | 'eatsafe_canberra' | 'eatsafe_darwin'
  | 'eatsafe_au'
  // India
  | 'india_fssai' | 'chefos_in' | 'homechef_in'
  // UAE
  | 'gcc_uae' | 'chefos_uae' | 'homechef_uae'
  // UK
  | 'eatsafe_london' | 'chefos_uk' | 'homechef_uk'
  // Singapore
  | 'eatsafe_sg' | 'chefos_sg' | 'homechef_sg'
  // US
  | 'eatsafe_ny' | 'chefos_us' | 'homechef_us'
  // Vendor
  | 'vendor';

export type ComplianceFramework =
  | 'bcc' | 'fssai' | 'none' | 'dm' | 'adafsa' | 'sm_sharjah' | 'fsa' | 'sfa' | 'fda'
  | 'nsw_fa' | 'vic_dh' | 'sa_health' | 'wa_doh' | 'tas_doh' | 'act_health' | 'nt_doh';

/** UAE Emirate — determined by venue postcode */
export type UAEEmirate = 'dubai' | 'abu_dhabi' | 'sharjah';

/** Australian State/Territory — determined by venue postcode */
export type AUState = 'nsw' | 'vic' | 'qld' | 'sa' | 'wa' | 'tas' | 'act' | 'nt';

export interface StoreSettings {
  currency: string;
  timezone: string;
  taxRate: number;
  defaultGPTarget: number;
}
