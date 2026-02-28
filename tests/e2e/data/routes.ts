/**
 * Complete route map for every portal in Queitos/ChefOS.
 * Used by the navigation crawler and per-portal nav tests.
 */

export interface PortalRoute {
  path: string;
  label: string;
  requiresData?: boolean; // needs seed data to render meaningfully
  paramExample?: string;  // example param value for dynamic routes
}

export interface Portal {
  name: string;
  basePath: string;
  requiredRole: string;
  routes: PortalRoute[];
}

export const PORTALS: Portal[] = [
  // ── Chef Portal ──────────────────────────────────────
  {
    name: "Chef",
    basePath: "/",
    requiredRole: "owner",
    routes: [
      { path: "/dashboard", label: "Dashboard" },
      { path: "/recipes", label: "Recipes" },
      { path: "/ingredients", label: "Ingredients" },
      { path: "/master-yield", label: "Master Yield" },
      { path: "/costing", label: "Costing" },
      { path: "/inventory", label: "Inventory" },
      { path: "/prep", label: "Prep Lists" },
      { path: "/kitchen", label: "Kitchen" },
      { path: "/todo", label: "Todo Command" },
      { path: "/production", label: "Production" },
      { path: "/marketplace", label: "Marketplace" },
      { path: "/menu-engineering", label: "Menu Engineering" },
      { path: "/roster", label: "Roster" },
      { path: "/allergens", label: "Allergens" },
      { path: "/food-safety", label: "Food Safety" },
      { path: "/training", label: "Training" },
      { path: "/invoices", label: "Invoices" },
      { path: "/cheatsheets", label: "Cheatsheets" },
      { path: "/calendar", label: "Calendar" },
      { path: "/kitchen-sections", label: "Kitchen Sections" },
      { path: "/equipment", label: "Equipment" },
      { path: "/team", label: "Team" },
      { path: "/settings", label: "Settings" },
      { path: "/waste-log", label: "Waste Log" },
      { path: "/logs", label: "Logs" },
      { path: "/feedback", label: "Feedback" },
      { path: "/housekeeping", label: "Housekeeping" },
      { path: "/referral", label: "Referral" },
      { path: "/more", label: "More" },
    ],
  },

  // ── BevOS ────────────────────────────────────────────
  {
    name: "BevOS",
    basePath: "/bev",
    requiredRole: "owner",
    routes: [
      { path: "/bev/dashboard", label: "Bev Dashboard" },
      { path: "/bev/cellar", label: "Cellar" },
      { path: "/bev/wine", label: "Wine Intelligence" },
      { path: "/bev/draught", label: "Draught Manager" },
      { path: "/bev/cocktails", label: "Cocktails" },
      { path: "/bev/coffee", label: "Coffee" },
      { path: "/bev/pours", label: "Pours" },
      { path: "/bev/bar-prep", label: "Bar Prep" },
      { path: "/bev/stocktake", label: "Stocktake" },
      { path: "/bev/coravin", label: "Coravin" },
      { path: "/bev/flash-cards", label: "Flash Cards" },
      { path: "/bev/ai", label: "BevAI" },
      { path: "/bev/costing", label: "Bev Costing" },
      { path: "/bev/team", label: "Bev Team" },
      { path: "/bev/invoices", label: "Bev Invoices" },
      { path: "/bev/equipment", label: "Bev Equipment" },
      { path: "/bev/production", label: "Bev Production" },
      { path: "/bev/calendar", label: "Bev Calendar" },
      { path: "/bev/training", label: "Bev Training" },
      { path: "/bev/compliance", label: "Bev Compliance" },
      { path: "/bev/marketplace", label: "Bev Marketplace" },
      { path: "/bev/engineering", label: "Bev Engineering" },
      { path: "/bev/stations", label: "Bar Stations" },
      { path: "/bev/waste-log", label: "Bev Waste Log" },
      { path: "/bev/settings", label: "Bev Settings" },
    ],
  },

  // ── ClockOS ──────────────────────────────────────────
  {
    name: "ClockOS",
    basePath: "/clock",
    requiredRole: "owner",
    routes: [
      { path: "/clock", label: "Clock In/Out" },
      { path: "/clock/dashboard", label: "Clock Dashboard" },
      { path: "/clock/timesheets", label: "Timesheets" },
      { path: "/clock/override", label: "Time Override" },
      { path: "/clock/induction", label: "Induction" },
      { path: "/clock/onboarding", label: "Onboarding" },
      { path: "/clock/employees", label: "Employees" },
      { path: "/clock/devices", label: "Devices" },
      { path: "/clock/pins", label: "PIN Management" },
      { path: "/clock/settings", label: "Clock Settings" },
    ],
  },

  // ── LabourOS / PeopleOS ──────────────────────────────
  {
    name: "LabourOS",
    basePath: "/labour",
    requiredRole: "owner",
    routes: [
      { path: "/labour/dashboard", label: "Labour Dashboard" },
      { path: "/labour/roster", label: "Labour Roster" },
      { path: "/labour/timesheets", label: "Labour Timesheets" },
      { path: "/labour/leave", label: "Leave" },
      { path: "/labour/payroll", label: "Payroll" },
      { path: "/labour/employees", label: "Employees" },
      { path: "/labour/compliance", label: "Labour Compliance" },
      { path: "/labour/compliance/certs", label: "Certifications" },
      { path: "/labour/settings", label: "Labour Settings" },
      { path: "/labour/people", label: "PeopleOS Dashboard" },
      { path: "/labour/people/recruitment", label: "Recruitment" },
      { path: "/labour/people/directory", label: "Directory" },
      { path: "/labour/people/onboarding", label: "PeopleOS Onboarding" },
      { path: "/labour/people/reviews", label: "Reviews" },
      { path: "/labour/people/warnings", label: "Warnings" },
      { path: "/labour/people/settings", label: "PeopleOS Settings" },
    ],
  },

  // ── SupplyOS ─────────────────────────────────────────
  {
    name: "SupplyOS",
    basePath: "/supply",
    requiredRole: "owner",
    routes: [
      { path: "/supply/dashboard", label: "Supply Dashboard" },
      { path: "/supply/orders", label: "Purchase Orders" },
      { path: "/supply/suppliers", label: "Suppliers" },
      { path: "/supply/receiving", label: "Receiving" },
      { path: "/supply/price-watch", label: "Price Watch" },
      { path: "/supply/settings", label: "Supply Settings" },
    ],
  },

  // ── GrowthOS ─────────────────────────────────────────
  {
    name: "GrowthOS",
    basePath: "/growth",
    requiredRole: "owner",
    routes: [
      { path: "/growth/dashboard", label: "Growth Dashboard" },
      { path: "/growth/campaigns", label: "Campaigns" },
      { path: "/growth/calendar", label: "Campaign Calendar" },
      { path: "/growth/segments", label: "Segments" },
      { path: "/growth/analytics", label: "Growth Analytics" },
      { path: "/growth/settings", label: "Growth Settings" },
    ],
  },

  // ── MoneyOS ──────────────────────────────────────────
  {
    name: "MoneyOS",
    basePath: "/money",
    requiredRole: "owner",
    routes: [
      { path: "/money/dashboard", label: "Money Dashboard" },
      { path: "/money/reactor", label: "Reactor" },
      { path: "/money/pnl", label: "P&L" },
      { path: "/money/trends", label: "Trends" },
      { path: "/money/benchmarks", label: "Benchmarks" },
      { path: "/money/simulator", label: "Simulator" },
      { path: "/money/solutions", label: "Solutions" },
      { path: "/money/audit", label: "Money Audit" },
      { path: "/money/forensic", label: "Forensic" },
      { path: "/money/portfolio", label: "Portfolio" },
      { path: "/money/settings", label: "Money Settings" },
    ],
  },

  // ── QuietAudit ───────────────────────────────────────
  {
    name: "QuietAudit",
    basePath: "/quiet",
    requiredRole: "owner",
    routes: [
      { path: "/quiet/dashboard", label: "Quiet Dashboard" },
      { path: "/quiet/recommendations", label: "Recommendations" },
      { path: "/quiet/history", label: "History" },
      { path: "/quiet/report", label: "Score Report" },
      { path: "/quiet/external/new", label: "External Intake" },
      { path: "/quiet/external/upload", label: "Document Upload" },
      { path: "/quiet/simulation", label: "Simulation" },
      { path: "/quiet/findings", label: "Findings" },
      { path: "/quiet/settings", label: "Quiet Settings" },
    ],
  },

  // ── OverheadOS ───────────────────────────────────────
  {
    name: "OverheadOS",
    basePath: "/overhead",
    requiredRole: "owner",
    routes: [
      { path: "/overhead/dashboard", label: "Overhead Dashboard" },
      { path: "/overhead/costs", label: "Costs" },
      { path: "/overhead/costs/new", label: "Add Cost" },
      { path: "/overhead/recurring", label: "Recurring" },
      { path: "/overhead/assets", label: "Assets" },
      { path: "/overhead/alerts", label: "Alerts" },
      { path: "/overhead/benchmarks", label: "Overhead Benchmarks" },
      { path: "/overhead/breakeven", label: "Breakeven" },
      { path: "/overhead/settings", label: "Overhead Settings" },
    ],
  },

  // ── ReservationOS / VenueFlow ────────────────────────
  {
    name: "ReservationOS",
    basePath: "/reservation",
    requiredRole: "owner",
    routes: [
      { path: "/reservation/dashboard", label: "Res Dashboard" },
      { path: "/reservation/diary", label: "Diary" },
      { path: "/reservation/floor", label: "Floor Plan" },
      { path: "/reservation/reservations", label: "Reservations" },
      { path: "/reservation/reservations/new", label: "New Reservation" },
      { path: "/reservation/waitlist", label: "Waitlist" },
      { path: "/reservation/shows", label: "Shows" },
      { path: "/reservation/guests", label: "Guests" },
      { path: "/reservation/functions", label: "Functions" },
      { path: "/reservation/functions/new", label: "New Function" },
      { path: "/reservation/functions/crm", label: "Function CRM" },
      { path: "/reservation/functions/spaces", label: "Venue Spaces" },
      { path: "/reservation/forecast", label: "Forecast" },
      { path: "/reservation/settings", label: "Res Settings" },
      { path: "/reservation/widget", label: "Booking Widget" },
      { path: "/reservation/function-widget", label: "Function Widget" },
      { path: "/reservation/reports/generate", label: "Report Generator" },
      { path: "/reservation/reports/efficiency", label: "Efficiency Audit" },
      { path: "/reservation/help", label: "Res Help" },
      { path: "/reservation/training", label: "Res Training" },
      { path: "/reservation/voice-agent", label: "Voice Agent" },
      // VenueFlow sub-routes
      { path: "/reservation/venueflow/dashboard", label: "VF Dashboard" },
      { path: "/reservation/venueflow/pipeline", label: "VF Pipeline" },
      { path: "/reservation/venueflow/calendar", label: "VF Calendar" },
      { path: "/reservation/venueflow/menus", label: "VF Menus" },
      { path: "/reservation/venueflow/beverages", label: "VF Beverages" },
      { path: "/reservation/venueflow/proposals", label: "VF Proposals" },
      { path: "/reservation/venueflow/leads", label: "VF Leads" },
      { path: "/reservation/venueflow/referrals", label: "VF Referrals" },
      { path: "/reservation/venueflow/reactivation", label: "VF Reactivation" },
      { path: "/reservation/venueflow/analytics", label: "VF Analytics" },
      { path: "/reservation/venueflow/csv-import", label: "VF CSV Import" },
      { path: "/reservation/venueflow/automations", label: "VF Automations" },
      { path: "/reservation/venueflow/integrations", label: "VF Integrations" },
      { path: "/reservation/venueflow/reports", label: "VF Reports" },
    ],
  },

  // ── RestOS / POS ─────────────────────────────────────
  {
    name: "RestOS",
    basePath: "/pos",
    requiredRole: "owner",
    routes: [
      { path: "/pos", label: "Order Screen" },
      { path: "/pos/kds", label: "KDS" },
      { path: "/pos/tabs", label: "Tabs" },
      { path: "/pos/functions", label: "POS Functions" },
      { path: "/pos/daily-close", label: "Daily Close" },
      { path: "/pos/waste", label: "POS Waste" },
      { path: "/pos/compliance", label: "POS Compliance" },
      { path: "/pos/audit", label: "POS Audit" },
      { path: "/pos/analytics", label: "POS Analytics" },
      { path: "/pos/admin/menu", label: "Menu Admin" },
      { path: "/pos/admin/staff", label: "Staff Admin" },
      { path: "/pos/admin/store", label: "Store Settings" },
      { path: "/pos/admin/import", label: "Import Data" },
    ],
  },

  // ── Vendor Portal ────────────────────────────────────
  {
    name: "Vendor",
    basePath: "/vendor",
    requiredRole: "vendor_admin",
    routes: [
      { path: "/vendor/dashboard", label: "Vendor Dashboard" },
      { path: "/vendor/insights", label: "Vendor Insights" },
      { path: "/vendor/pricing", label: "Vendor Pricing" },
      { path: "/vendor/orders", label: "Vendor Orders" },
      { path: "/vendor/deals", label: "Vendor Deals" },
      { path: "/vendor/messages", label: "Vendor Messages" },
      { path: "/vendor/settings", label: "Vendor Settings" },
    ],
  },

  // ── Admin Portal ─────────────────────────────────────
  {
    name: "Admin",
    basePath: "/admin",
    requiredRole: "admin",
    routes: [
      { path: "/admin", label: "Admin Dashboard" },
      { path: "/admin/vendor-deals", label: "Vendor Deals" },
      { path: "/admin/crm", label: "CRM" },
      { path: "/admin/ideas", label: "Ideas" },
      { path: "/admin/analytics", label: "Admin Analytics" },
      { path: "/admin/marketing", label: "Marketing" },
      { path: "/admin/testing", label: "Testing" },
      { path: "/admin/seed", label: "Seed Data" },
      { path: "/admin/releases", label: "Releases" },
      { path: "/admin/organizations", label: "Organizations" },
      { path: "/admin/email-templates", label: "Email Templates" },
      { path: "/admin/beta", label: "Beta Tracking" },
      { path: "/admin/help", label: "Help Center" },
      { path: "/admin/help-links", label: "Help Links" },
      { path: "/admin/app-launch", label: "App Launch" },
      { path: "/admin/landing-page", label: "Landing Page" },
      { path: "/admin/home-chef-landing", label: "HomeChef Landing" },
      { path: "/admin/vendor-landing", label: "Vendor Landing" },
      { path: "/admin/food-safety-landing", label: "Food Safety Landing" },
      { path: "/admin/india-chefos-landing", label: "India Landing" },
      { path: "/admin/system", label: "System" },
      { path: "/admin/settings", label: "Admin Settings" },
      { path: "/admin/sales", label: "Sales Dashboard" },
      { path: "/admin/sales/crm", label: "Sales CRM" },
      { path: "/admin/sales/plans", label: "Plans" },
      { path: "/admin/sales/settings", label: "Sales Settings" },
      { path: "/admin/sales/analytics", label: "Sales Analytics" },
      { path: "/admin/sales/referrals", label: "Sales Referrals" },
      { path: "/admin/sales/leads", label: "Sales Leads" },
    ],
  },

  // ── Games / Mastery ──────────────────────────────────
  {
    name: "Games",
    basePath: "/games",
    requiredRole: "owner",
    routes: [
      { path: "/games", label: "Game Hub" },
      { path: "/games/gauntlet", label: "Gauntlet" },
      { path: "/games/edge", label: "Edge" },
      { path: "/games/onion-blitz", label: "Onion Blitz" },
      { path: "/games/alley-cat", label: "Alley Cat" },
      { path: "/games/leaderboard", label: "Leaderboard" },
      { path: "/games/profile", label: "Player Profile" },
    ],
  },
];

// Public routes (no auth required)
export const PUBLIC_ROUTES: PortalRoute[] = [
  { path: "/", label: "ChefOS Landing" },
  { path: "/home-cook", label: "HomeChef Landing" },
  { path: "/chefos-india", label: "India FSSAI Landing" },
  { path: "/chefos-gcc", label: "GCC Landing" },
  { path: "/food-safety", label: "Food Safety Landing" },
  { path: "/vendor-landing", label: "Vendor Landing" },
  { path: "/launch", label: "Portal Selector" },
  { path: "/auth", label: "Auth Page" },
  { path: "/reset-password", label: "Password Reset" },
  { path: "/faq", label: "FAQ" },
  { path: "/terms", label: "Terms" },
  { path: "/privacy", label: "Privacy" },
  { path: "/help", label: "Help Center" },
];

// Total route count
export const TOTAL_ROUTES = PORTALS.reduce((sum, p) => sum + p.routes.length, 0) + PUBLIC_ROUTES.length;
