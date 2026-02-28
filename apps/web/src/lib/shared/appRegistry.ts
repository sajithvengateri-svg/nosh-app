// App Registry — pure TypeScript config for all .iT OS ecosystem apps
// No JSX, no web APIs — safe for React Native

export type AppCategory = 'ops' | 'backoffice' | 'intelligence' | 'platform';

export interface AppEntry {
  key: string;
  name: string;
  subtitle: string;
  category: AppCategory;
  iconName: string; // lucide icon name as string
  gradient: string; // tailwind gradient classes
  persona: string; // dev-login persona key
  entryRoute: string;
  featureSlug: string;
  rnReady: boolean;
  independent: boolean; // has its own layout/sidebar
  modes?: string[]; // if set, only show in these store modes; undefined = all modes
}

export const APP_REGISTRY: AppEntry[] = [
  {
    key: 'chef',
    name: 'ChefOS',
    subtitle: 'Kitchen operations',
    category: 'ops',
    iconName: 'ChefHat',
    gradient: 'from-orange-500 to-amber-500',
    persona: 'chef',
    entryRoute: '/dashboard',
    featureSlug: 'chef-dashboard',
    rnReady: true,
    independent: false,
  },
  {
    key: 'bevos',
    name: 'BevOS',
    subtitle: 'Bar & beverage management',
    category: 'ops',
    iconName: 'Wine',
    gradient: 'from-purple-500 to-fuchsia-500',
    persona: 'bevos',
    entryRoute: '/bev/dashboard',
    featureSlug: 'bev-dashboard',
    rnReady: true,
    independent: true,
  },
  {
    key: 'posos',
    name: 'RestOS',
    subtitle: 'Point-of-sale & service',
    category: 'ops',
    iconName: 'Monitor',
    gradient: 'from-rose-500 to-pink-500',
    persona: 'posos',
    entryRoute: '/pos',
    featureSlug: 'pos-dashboard',
    rnReady: true,
    independent: true,
  },
  {
    key: 'reservation',
    name: 'Res OS',
    subtitle: 'Bookings & table management',
    category: 'ops',
    iconName: 'CalendarCheck',
    gradient: 'from-teal-500 to-cyan-500',
    persona: 'reservation',
    entryRoute: '/reservation/dashboard',
    featureSlug: 'reservation-dashboard',
    rnReady: false,
    independent: true,
  },
  {
    key: 'labour',
    name: 'LabourOS',
    subtitle: 'Workforce & scheduling',
    category: 'backoffice',
    iconName: 'Users',
    gradient: 'from-sky-500 to-blue-500',
    persona: 'labour',
    entryRoute: '/labour/dashboard',
    featureSlug: 'labour-dashboard',
    rnReady: false,
    independent: true,
  },
  {
    key: 'supply',
    name: 'SupplyOS',
    subtitle: 'Procurement & suppliers',
    category: 'backoffice',
    iconName: 'Truck',
    gradient: 'from-emerald-500 to-green-500',
    persona: 'supply',
    entryRoute: '/supply/dashboard',
    featureSlug: 'supply-dashboard',
    rnReady: false,
    independent: true,
  },
  {
    key: 'growth',
    name: 'GrowthOS',
    subtitle: 'CRM & marketing',
    category: 'backoffice',
    iconName: 'TrendingUp',
    gradient: 'from-yellow-500 to-orange-500',
    persona: 'growth',
    entryRoute: '/growth/dashboard',
    featureSlug: 'growth-dashboard',
    rnReady: false,
    independent: true,
  },
  {
    key: 'money',
    name: 'MoneyOS',
    subtitle: 'Intelligence, simulation & audit',
    category: 'intelligence',
    iconName: 'DollarSign',
    gradient: 'from-lime-500 to-emerald-500',
    persona: 'money',
    entryRoute: '/money/reactor',
    featureSlug: 'money-reactor',
    rnReady: true,
    independent: true,
  },
  {
    key: 'overhead',
    name: 'Overhead OS',
    subtitle: 'Cost control & overheads',
    category: 'backoffice',
    iconName: 'PieChart',
    gradient: 'from-amber-500 to-yellow-600',
    persona: 'overhead',
    entryRoute: '/overhead/dashboard',
    featureSlug: 'overhead-dashboard',
    rnReady: false,
    independent: true,
  },
  {
    key: 'quiet',
    name: 'Quiet OS',
    subtitle: 'AI-powered intelligence hub',
    category: 'intelligence',
    iconName: 'Brain',
    gradient: 'from-indigo-500 to-violet-500',
    persona: 'quiet',
    entryRoute: '/quiet/dashboard',
    featureSlug: 'quiet-dashboard',
    rnReady: false,
    independent: true,
  },
  {
    key: 'vendor',
    name: 'Vendor Portal',
    subtitle: 'Supplier tools',
    category: 'platform',
    iconName: 'Store',
    gradient: 'from-blue-500 to-cyan-500',
    persona: 'vendor',
    entryRoute: '/vendor/dashboard',
    featureSlug: 'vendor-dashboard',
    rnReady: false,
    independent: true,
  },
  {
    key: 'admin',
    name: 'Control Centre',
    subtitle: 'Admin & CRM',
    category: 'platform',
    iconName: 'Shield',
    gradient: 'from-slate-600 to-slate-800',
    persona: 'admin',
    entryRoute: '/admin',
    featureSlug: 'admin-dashboard',
    rnReady: false,
    independent: true,
  },
];

export const CATEGORY_LABELS: Record<AppCategory, string> = {
  ops: 'Operations',
  backoffice: 'Back Office',
  intelligence: 'Intelligence',
  platform: 'Platform',
};

export function getAppsByCategory(category: AppCategory): AppEntry[] {
  return APP_REGISTRY.filter(app => app.category === category);
}

export function getAppByKey(key: string): AppEntry | undefined {
  return APP_REGISTRY.find(app => app.key === key);
}
