// Link Registry — single source of truth for all public/landing page URLs
// When you add a new landing page, add it here and it auto-propagates to:
//   - AdminDomainLinks page (all domain variants)
//   - Future: sitemap generation, SEO config

export interface PageLink {
  label: string;
  path: string;
  /** "landing" = public marketing page, "app" = authenticated page, "admin" = admin page */
  type: "landing" | "app" | "admin";
  /** Priority for sitemap (0.0–1.0). Omit for non-sitemap pages. */
  sitemapPriority?: number;
  /** Sitemap changefreq */
  sitemapFreq?: "daily" | "weekly" | "monthly" | "yearly";
}

export const PAGE_LINKS: PageLink[] = [
  // ── Landing Pages ──
  { label: "Home", path: "/", type: "landing", sitemapPriority: 1.0, sitemapFreq: "weekly" },
  { label: "Home Cook", path: "/home-cook", type: "landing", sitemapPriority: 0.8, sitemapFreq: "monthly" },
  { label: "Vendor Landing", path: "/vendor-landing", type: "landing", sitemapPriority: 0.8, sitemapFreq: "monthly" },
  { label: "Food Safety", path: "/food-safety", type: "landing", sitemapPriority: 0.8, sitemapFreq: "monthly" },
  { label: "India ChefOS", path: "/chefos-india", type: "landing", sitemapPriority: 0.8, sitemapFreq: "monthly" },
  { label: "GCC ChefOS", path: "/chefos-gcc", type: "landing", sitemapPriority: 0.8, sitemapFreq: "monthly" },
  { label: "India Home Cook", path: "/home-cook-india", type: "landing", sitemapPriority: 0.7, sitemapFreq: "monthly" },
  { label: "India Food Safety", path: "/food-safety-india", type: "landing", sitemapPriority: 0.7, sitemapFreq: "monthly" },
  { label: "GCC Home Cook", path: "/home-cook-gcc", type: "landing", sitemapPriority: 0.7, sitemapFreq: "monthly" },
  { label: "GCC Food Safety", path: "/food-safety-gcc", type: "landing", sitemapPriority: 0.7, sitemapFreq: "monthly" },
  { label: "MoneyOS Landing", path: "/money-landing", type: "landing", sitemapPriority: 0.7, sitemapFreq: "monthly" },
  { label: "Taste", path: "/taste", type: "landing", sitemapPriority: 0.6, sitemapFreq: "monthly" },
  { label: "FAQ", path: "/faq", type: "landing", sitemapPriority: 0.6, sitemapFreq: "monthly" },
  { label: "Terms", path: "/terms", type: "landing", sitemapPriority: 0.3, sitemapFreq: "yearly" },
  { label: "Privacy", path: "/privacy", type: "landing", sitemapPriority: 0.3, sitemapFreq: "yearly" },

  // ── App Pages (authenticated) ──
  { label: "Auth / Login", path: "/auth", type: "app" },
  { label: "Dashboard", path: "/dashboard", type: "app" },
  { label: "Portal Select", path: "/launch", type: "app" },

  // ── Admin ──
  { label: "Admin", path: "/admin", type: "admin" },
  { label: "Admin Auth", path: "/admin/auth", type: "admin" },
];

export const DOMAINS = [
  { key: "ai", label: "chefos.ai", base: "https://chefos.ai", badge: "Primary" as const, color: "bg-green-500" },
  { key: "comau", label: "chefos.com.au", base: "https://chefos.com.au", badge: "Secondary" as const, color: "bg-blue-500" },
  { key: "vercel", label: "queitos.vercel.app", base: "https://queitos.vercel.app", badge: "Dev" as const, color: "bg-orange-500" },
];

export const EXTERNAL_SERVICES = [
  { label: "Supabase Dashboard", url: "https://supabase.com/dashboard/project/gmvfjgkzbpjimmzxcniv" },
  { label: "Vercel Project", url: "https://vercel.com/sajithvengateri-svgs-projects/queitos" },
  { label: "Google OAuth Console", url: "https://console.cloud.google.com/apis/credentials" },
  { label: "Apple Developer", url: "https://developer.apple.com/account/resources/identifiers/list/serviceId" },
];

/** Get links by type */
export function getLinksByType(type: PageLink["type"]): PageLink[] {
  return PAGE_LINKS.filter((l) => l.type === type);
}

/** Build full URL for a path on a given domain */
export function buildUrl(domainBase: string, path: string): string {
  return path === "/" ? domainBase : `${domainBase}${path}`;
}
