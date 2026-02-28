import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  VARIANT_REGISTRY,
  REGIONS,
  type VariantEntry,
} from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
import { ChefHat, Home, Shield, Download, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/* ─── Country code mapping (ISO 3166-1 alpha-2 → registry region) ─── */
const COUNTRY_TO_REGION: Record<string, string> = {
  AU: "au",
  IN: "in",
  AE: "uae",
  GB: "uk",
  SG: "sg",
  US: "us",
};

const REGION_LABELS: Record<string, string> = {
  au: "Australia",
  in: "India",
  uae: "UAE",
  uk: "United Kingdom",
  sg: "Singapore",
  us: "United States",
};

/* ─── Stream icon + color mapping ─── */
const STREAM_META: Record<string, { icon: typeof ChefHat; label: string; description: string }> = {
  chefos: { icon: ChefHat, label: "ChefOS Pro", description: "Professional kitchen management" },
  homechef: { icon: Home, label: "HomeChef", description: "Your home kitchen, organised" },
  eatsafe: { icon: Shield, label: "EatSafe", description: "Food safety compliance" },
};

/* ─── Group variants by region ─── */
function getVariantsByRegion(): Record<string, { key: AppVariant; entry: VariantEntry }[]> {
  const grouped: Record<string, { key: AppVariant; entry: VariantEntry }[]> = {};
  for (const [key, entry] of Object.entries(VARIANT_REGISTRY)) {
    const region = entry.region;
    if (!grouped[region]) grouped[region] = [];
    grouped[region].push({ key: key as AppVariant, entry });
  }
  return grouped;
}

/* ─── Get variants for a specific region ─── */
function getVariantsForRegion(region: string): { key: AppVariant; entry: VariantEntry }[] {
  return Object.entries(VARIANT_REGISTRY)
    .filter(([, entry]) => entry.region === region)
    .map(([key, entry]) => ({ key: key as AppVariant, entry }));
}

/* ─── Variant card ─── */
function VariantCard({ variantKey, entry }: { variantKey: AppVariant; entry: VariantEntry }) {
  const streamMeta = STREAM_META[entry.stream] || STREAM_META.chefos;
  const Icon = streamMeta.icon;
  const signupUrl = `/auth?app=${variantKey}`;

  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: entry.brand.accent + "15" }}
          >
            <Icon className="w-6 h-6" style={{ color: entry.brand.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-lg">{entry.brand.name}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{entry.brand.tagline}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild className="flex-1" style={{ backgroundColor: entry.brand.accent }}>
            <Link to={signupUrl}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Get Started
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Region picker ─── */
function RegionPicker({
  onSelect,
  currentRegion,
}: {
  onSelect: (region: string) => void;
  currentRegion: string | null;
}) {
  const regions = Object.keys(REGION_LABELS);
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {regions.map((r) => (
        <button
          key={r}
          onClick={() => onSelect(r)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            currentRegion === r
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {REGION_LABELS[r]}
        </button>
      ))}
    </div>
  );
}

/* ─── Main page ─── */
export default function DownloadPage() {
  const [searchParams] = useSearchParams();
  const appParam = searchParams.get("app");
  const [detectedRegion, setDetectedRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  // If ?app= param specifies a specific variant, show just that one
  const specificVariant = appParam && (VARIANT_REGISTRY as Record<string, VariantEntry>)[appParam]
    ? { key: appParam as AppVariant, entry: (VARIANT_REGISTRY as Record<string, VariantEntry>)[appParam] }
    : null;

  // Detect country via Vercel geo header (serverless function)
  useEffect(() => {
    if (specificVariant) {
      setGeoLoading(false);
      return;
    }
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data) => {
        const region = COUNTRY_TO_REGION[data.country] || null;
        setDetectedRegion(region);
        setSelectedRegion(region);
      })
      .catch(() => {
        setDetectedRegion(null);
        setSelectedRegion("au"); // fallback
      })
      .finally(() => setGeoLoading(false));
  }, [!!specificVariant]);

  const activeRegion = selectedRegion;
  const variants = activeRegion ? getVariantsForRegion(activeRegion) : [];

  // Group variants by stream for display
  const streamOrder = ["chefos", "homechef", "eatsafe"];
  const grouped = streamOrder
    .map((stream) => ({
      stream,
      variants: variants.filter((v) => v.entry.stream === stream),
    }))
    .filter((g) => g.variants.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-primary" />
            <span className="font-bold text-lg text-foreground">ChefOS</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Specific variant mode */}
        {specificVariant ? (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                Get {specificVariant.entry.brand.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                {specificVariant.entry.brand.tagline}
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <VariantCard variantKey={specificVariant.key} entry={specificVariant.entry} />
            </div>
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={() => window.location.href = "/download"}>
                <Globe className="w-4 h-4 mr-2" />
                View all apps
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium">
                <Download className="w-4 h-4" />
                Download
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Choose Your App
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                Professional kitchen management, home cooking, or food safety compliance — we've got you covered.
              </p>
            </div>

            {/* Region picker */}
            <div className="space-y-3">
              <div className="text-center">
                {detectedRegion && (
                  <p className="text-sm text-muted-foreground mb-3">
                    Detected: <span className="font-medium text-foreground">{REGION_LABELS[detectedRegion]}</span>
                  </p>
                )}
                <RegionPicker onSelect={setSelectedRegion} currentRegion={activeRegion} />
              </div>
            </div>

            {/* Loading */}
            {geoLoading && (
              <div className="text-center py-8">
                <div className="animate-pulse text-muted-foreground">Detecting your region...</div>
              </div>
            )}

            {/* Variant cards grouped by stream */}
            {!geoLoading && grouped.map(({ stream, variants: streamVariants }) => {
              const meta = STREAM_META[stream];
              return (
                <div key={stream} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <meta.icon className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-lg font-bold text-foreground">{meta.label}</h2>
                    <span className="text-sm text-muted-foreground">— {meta.description}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {streamVariants.map((v) => (
                      <VariantCard key={v.key} variantKey={v.key} entry={v.entry} />
                    ))}
                  </div>
                </div>
              );
            })}

            {!geoLoading && grouped.length === 0 && activeRegion && (
              <div className="text-center py-8 text-muted-foreground">
                No apps available for this region yet.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} ChefOS</span>
          <div className="flex gap-4">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
