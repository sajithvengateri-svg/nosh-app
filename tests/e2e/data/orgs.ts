export type StoreMode = "restaurant" | "cafe" | "bar" | "hotel" | "catering" | "home_cook";
export type Region = "au" | "india" | "gcc_dubai" | "gcc_abudhabi" | "gcc_sharjah" | "eatsafe_brisbane";
export type Variant = "chefos" | "homechef" | "india_fssai" | "gcc" | "eatsafe" | "vendor" | "admin";

export interface OrgRole {
  suffix: string;
  role: string;
}

export interface TestOrg {
  id: number;
  slug: string;
  name: string;
  storeMode: StoreMode;
  region: Region;
  variant: Variant;
  roles: OrgRole[];
  seedAction: string;
  venues?: number;
}

const fullTeam = (extra: OrgRole[] = []): OrgRole[] => [
  { suffix: "owner", role: "owner" },
  { suffix: "hc", role: "head_chef" },
  { suffix: "sc1", role: "sous_chef" },
  { suffix: "sc2", role: "sous_chef" },
  { suffix: "lc1", role: "line_chef" },
  { suffix: "lc2", role: "line_chef" },
  { suffix: "foh", role: "foh_admin" },
  { suffix: "kh", role: "kitchen_hand" },
  ...extra,
];

const hotelTeam: OrgRole[] = [
  { suffix: "owner", role: "owner" },
  { suffix: "hc1", role: "head_chef" },
  { suffix: "hc2", role: "head_chef" },
  { suffix: "sc1", role: "sous_chef" },
  { suffix: "sc2", role: "sous_chef" },
  { suffix: "sc3", role: "sous_chef" },
  { suffix: "foh1", role: "foh_admin" },
  { suffix: "foh2", role: "foh_admin" },
  { suffix: "kh1", role: "kitchen_hand" },
  { suffix: "kh2", role: "kitchen_hand" },
];

const cafeTeam: OrgRole[] = [
  { suffix: "owner", role: "owner" },
  { suffix: "hc", role: "head_chef" },
  { suffix: "lc1", role: "line_chef" },
  { suffix: "lc2", role: "line_chef" },
  { suffix: "kh", role: "kitchen_hand" },
];

const barTeam: OrgRole[] = [
  { suffix: "owner", role: "owner" },
  { suffix: "hc", role: "head_chef" },
  { suffix: "lc1", role: "line_chef" },
  { suffix: "lc2", role: "line_chef" },
  { suffix: "foh", role: "foh_admin" },
  { suffix: "sm", role: "shift_manager" },
];

const cateringTeam: OrgRole[] = [
  { suffix: "owner", role: "owner" },
  { suffix: "hc", role: "head_chef" },
  { suffix: "sc1", role: "sous_chef" },
  { suffix: "sc2", role: "sous_chef" },
  { suffix: "kh1", role: "kitchen_hand" },
  { suffix: "kh2", role: "kitchen_hand" },
  { suffix: "foh", role: "foh_admin" },
];

const soloOwner: OrgRole[] = [{ suffix: "owner", role: "owner" }];

const vendorTeam = (count: number): OrgRole[] => [
  { suffix: "admin", role: "vendor_admin" },
  ...Array.from({ length: count }, (_, i) => ({ suffix: `user${i + 1}`, role: "vendor_user" })),
];

export const TEST_ORGS: TestOrg[] = [
  // ── AU / ChefOS ──────────────────────────────────────
  { id: 1,  slug: "urban-bistro",          name: "Urban Bistro",              storeMode: "restaurant", region: "au",              variant: "chefos",     roles: fullTeam(),                              seedAction: "seed_chiccit_full" },
  { id: 2,  slug: "grand-hotel-kitchen",   name: "Grand Hotel Kitchen",       storeMode: "hotel",      region: "au",              variant: "chefos",     roles: hotelTeam,                               seedAction: "seed_chiccit_full" },
  { id: 3,  slug: "sunrise-cafe",          name: "Sunrise Cafe",              storeMode: "cafe",       region: "au",              variant: "chefos",     roles: cafeTeam,                                seedAction: "seed_chiccit_full" },
  { id: 4,  slug: "cocktail-lounge",       name: "Cocktail Lounge",           storeMode: "bar",        region: "au",              variant: "chefos",     roles: barTeam,                                 seedAction: "seed_chiccit_full" },
  { id: 5,  slug: "events-plus-catering",  name: "Events Plus Catering",      storeMode: "catering",   region: "au",              variant: "chefos",     roles: cateringTeam,                            seedAction: "seed_chiccit_full" },

  // ── AU / HomeChef (10 solo home cooks) ───────────────
  ...Array.from({ length: 10 }, (_, i) => ({
    id: 6 + i,
    slug: `home-cook-au-${i + 1}`,
    name: `Home Cook AU ${i + 1}`,
    storeMode: "home_cook" as StoreMode,
    region: "au" as Region,
    variant: "homechef" as Variant,
    roles: soloOwner,
    seedAction: "seed_home_cook",
  })),

  // ── India / FSSAI ────────────────────────────────────
  { id: 16, slug: "masala-kitchen",         name: "Masala Kitchen",            storeMode: "restaurant", region: "india",           variant: "india_fssai", roles: fullTeam(),                              seedAction: "seed_chiccit_full" },
  { id: 17, slug: "spice-route-hotel",      name: "Spice Route Hotel",         storeMode: "hotel",      region: "india",           variant: "india_fssai", roles: hotelTeam,                               seedAction: "seed_chiccit_full" },
  { id: 18, slug: "chai-corner",            name: "Chai Corner",               storeMode: "cafe",       region: "india",           variant: "india_fssai", roles: cafeTeam,                                seedAction: "seed_chiccit_full" },
  { id: 19, slug: "delhi-darbar",           name: "Delhi Darbar",              storeMode: "restaurant", region: "india",           variant: "india_fssai", roles: [...fullTeam().slice(0, 5), { suffix: "foh", role: "foh_admin" }], seedAction: "seed_chiccit_full" },
  { id: 20, slug: "mumbai-street-kitchen",  name: "Mumbai Street Kitchen",     storeMode: "cafe",       region: "india",           variant: "india_fssai", roles: [{ suffix: "owner", role: "owner" }, { suffix: "hc", role: "head_chef" }, { suffix: "lc", role: "line_chef" }, { suffix: "kh", role: "kitchen_hand" }], seedAction: "seed_chiccit_full" },
  { id: 21, slug: "home-cook-india-1",      name: "Home Cook India 1",         storeMode: "home_cook",  region: "india",           variant: "homechef",    roles: soloOwner,                               seedAction: "seed_home_cook" },
  { id: 22, slug: "home-cook-india-2",      name: "Home Cook India 2",         storeMode: "home_cook",  region: "india",           variant: "homechef",    roles: soloOwner,                               seedAction: "seed_home_cook" },

  // ── GCC / UAE ────────────────────────────────────────
  { id: 23, slug: "dubai-marina-restaurant", name: "Dubai Marina Restaurant",  storeMode: "restaurant", region: "gcc_dubai",       variant: "gcc",         roles: fullTeam(),                              seedAction: "seed_chiccit_full" },
  { id: 24, slug: "abudhabi-grand-hotel",    name: "Abu Dhabi Grand Hotel",    storeMode: "hotel",      region: "gcc_abudhabi",    variant: "gcc",         roles: hotelTeam,                               seedAction: "seed_chiccit_full" },
  { id: 25, slug: "sharjah-cafe",            name: "Sharjah Cafe",             storeMode: "cafe",       region: "gcc_sharjah",     variant: "gcc",         roles: cafeTeam,                                seedAction: "seed_chiccit_full" },
  { id: 26, slug: "desert-rose-catering",    name: "Desert Rose Catering",     storeMode: "catering",   region: "gcc_dubai",       variant: "gcc",         roles: cateringTeam,                            seedAction: "seed_chiccit_full" },
  { id: 27, slug: "jbr-beach-bar",           name: "JBR Beach Bar",            storeMode: "bar",        region: "gcc_dubai",       variant: "gcc",         roles: barTeam,                                 seedAction: "seed_chiccit_full" },
  { id: 28, slug: "gulf-kitchen-home",       name: "Gulf Kitchen Home",        storeMode: "home_cook",  region: "gcc_dubai",       variant: "homechef",    roles: soloOwner,                               seedAction: "seed_home_cook" },

  // ── AU / EatSafe Brisbane ────────────────────────────
  { id: 29, slug: "brisbane-safety-first",   name: "Brisbane Safety First",    storeMode: "restaurant", region: "eatsafe_brisbane", variant: "eatsafe",    roles: [...fullTeam().slice(0, 5), { suffix: "foh", role: "foh_admin" }], seedAction: "seed_chiccit_full" },
  { id: 30, slug: "eatsafe-cafe",            name: "EatSafe Cafe",             storeMode: "cafe",       region: "eatsafe_brisbane", variant: "eatsafe",    roles: [{ suffix: "owner", role: "owner" }, { suffix: "hc", role: "head_chef" }, { suffix: "lc", role: "line_chef" }, { suffix: "kh", role: "kitchen_hand" }], seedAction: "seed_chiccit_full" },

  // ── Vendors ──────────────────────────────────────────
  { id: 31, slug: "fresh-produce-co",        name: "FreshProduce Co",          storeMode: "restaurant", region: "au",              variant: "vendor",      roles: vendorTeam(2),                           seedAction: "seed_vendor" },
  { id: 32, slug: "meat-supply-ltd",         name: "MeatSupply Ltd",           storeMode: "restaurant", region: "au",              variant: "vendor",      roles: vendorTeam(2),                           seedAction: "seed_vendor" },
  { id: 33, slug: "wine-wholesale",          name: "WineWholesale",            storeMode: "restaurant", region: "au",              variant: "vendor",      roles: vendorTeam(1),                           seedAction: "seed_vendor" },

  // ── Admin ────────────────────────────────────────────
  { id: 34, slug: "queitos-hq",              name: "Queitos HQ",              storeMode: "restaurant", region: "au",              variant: "admin",       roles: [{ suffix: "admin1", role: "admin" }, { suffix: "admin2", role: "admin" }, { suffix: "admin3", role: "admin" }], seedAction: "seed_admin" },

  // ── Edge Cases ───────────────────────────────────────
  { id: 35, slug: "test-empty-restaurant",   name: "Test Empty Restaurant",    storeMode: "restaurant", region: "au",              variant: "chefos",     roles: soloOwner,                               seedAction: "none" },
  { id: 36, slug: "test-large-restaurant",   name: "Test Large Restaurant",    storeMode: "restaurant", region: "au",              variant: "chefos",     roles: [
    { suffix: "owner", role: "owner" },
    { suffix: "hc1", role: "head_chef" }, { suffix: "hc2", role: "head_chef" },
    { suffix: "sc1", role: "sous_chef" }, { suffix: "sc2", role: "sous_chef" }, { suffix: "sc3", role: "sous_chef" }, { suffix: "sc4", role: "sous_chef" },
    { suffix: "lc1", role: "line_chef" }, { suffix: "lc2", role: "line_chef" }, { suffix: "lc3", role: "line_chef" }, { suffix: "lc4", role: "line_chef" },
    { suffix: "foh1", role: "foh_admin" }, { suffix: "foh2", role: "foh_admin" },
    { suffix: "kh1", role: "kitchen_hand" }, { suffix: "kh2", role: "kitchen_hand" },
  ], seedAction: "seed_chiccit_full" },
  { id: 37, slug: "multi-venue-hotel",       name: "Multi-Venue Hotel Group",  storeMode: "hotel",      region: "au",              variant: "chefos",     roles: [
    { suffix: "owner", role: "owner" },
    { suffix: "hc1", role: "head_chef" }, { suffix: "hc2", role: "head_chef" }, { suffix: "hc3", role: "head_chef" },
    { suffix: "sc1", role: "sous_chef" }, { suffix: "sc2", role: "sous_chef" }, { suffix: "sc3", role: "sous_chef" }, { suffix: "sc4", role: "sous_chef" },
    { suffix: "kh1", role: "kitchen_hand" }, { suffix: "kh2", role: "kitchen_hand" }, { suffix: "kh3", role: "kitchen_hand" }, { suffix: "kh4", role: "kitchen_hand" },
  ], venues: 3, seedAction: "seed_chiccit_full" },
  { id: 38, slug: "test-bar-empty",          name: "Test Bar No Data",         storeMode: "bar",        region: "au",              variant: "chefos",     roles: [{ suffix: "owner", role: "owner" }, { suffix: "hc", role: "head_chef" }], seedAction: "none" },
  { id: 39, slug: "catering-co-india",       name: "Catering Co India",        storeMode: "catering",   region: "india",           variant: "india_fssai", roles: [{ suffix: "owner", role: "owner" }, { suffix: "hc", role: "head_chef" }, { suffix: "sc1", role: "sous_chef" }, { suffix: "sc2", role: "sous_chef" }, { suffix: "lc", role: "line_chef" }, { suffix: "kh", role: "kitchen_hand" }], seedAction: "seed_chiccit_full" },
  { id: 40, slug: "tiny-home-cook",          name: "Tiny Home Cook",           storeMode: "home_cook",  region: "au",              variant: "homechef",    roles: soloOwner,                               seedAction: "seed_home_cook" },
];

// Compute total users
export const TOTAL_USERS = TEST_ORGS.reduce((sum, org) => sum + org.roles.length, 0);

// Email pattern
export const testEmail = (orgSlug: string, roleSuffix: string) =>
  `test-${orgSlug}-${roleSuffix}@chefos-test.dev`;

// Default password for all test users
export const TEST_PASSWORD = "TestChef2026!";

// Helper: get all users flat
export interface TestUser {
  email: string;
  password: string;
  orgSlug: string;
  orgName: string;
  role: string;
  storeMode: StoreMode;
  region: Region;
  variant: Variant;
}

export function getAllTestUsers(): TestUser[] {
  return TEST_ORGS.flatMap((org) =>
    org.roles.map((r) => ({
      email: testEmail(org.slug, r.suffix),
      password: TEST_PASSWORD,
      orgSlug: org.slug,
      orgName: org.name,
      role: r.role,
      storeMode: org.storeMode,
      region: org.region,
      variant: org.variant,
    }))
  );
}

// Helper: get a specific user by org slug and role
export function getUser(orgSlug: string, roleSuffix: string): TestUser {
  const org = TEST_ORGS.find((o) => o.slug === orgSlug)!;
  const roleEntry = org.roles.find((r) => r.suffix === roleSuffix)!;
  return {
    email: testEmail(org.slug, roleSuffix),
    password: TEST_PASSWORD,
    orgSlug: org.slug,
    orgName: org.name,
    role: roleEntry.role,
    storeMode: org.storeMode,
    region: org.region,
    variant: org.variant,
  };
}
