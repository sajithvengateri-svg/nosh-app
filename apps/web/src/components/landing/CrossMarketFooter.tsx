import { useNavigate } from "react-router-dom";
import { ChefHat, Heart, Shield, ArrowRight } from "lucide-react";

type Region = "au" | "india" | "gcc";
type Product = "chefos" | "homecook" | "foodsafety";

interface CrossMarketFooterProps {
  region: Region;
  current: Product;
}

const REGION_ROUTES: Record<Region, Record<Product, string>> = {
  au:    { chefos: "/",              homecook: "/home-cook",       foodsafety: "/food-safety" },
  india: { chefos: "/chefos-india",  homecook: "/home-cook-india", foodsafety: "/food-safety-india" },
  gcc:   { chefos: "/chefos-gcc",    homecook: "/home-cook-gcc",   foodsafety: "/food-safety-gcc" },
};

const PRODUCTS: { key: Product; label: string; tagline: string; icon: typeof ChefHat; accent: string; bg: string }[] = [
  { key: "chefos",     label: "ChefOS Pro",   tagline: "Full kitchen operating system",  icon: ChefHat, accent: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40" },
  { key: "homecook",   label: "HomeCook",     tagline: "Your home kitchen companion",    icon: Heart,   accent: "text-pink-500",    bg: "bg-pink-500/10 border-pink-500/20 hover:border-pink-500/40" },
  { key: "foodsafety", label: "Food Safety",  tagline: "Compliance & food safety",       icon: Shield,  accent: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40" },
];

const REGION_LABELS: Record<Region, string> = {
  au: "Australia",
  india: "India",
  gcc: "GCC",
};

const CrossMarketFooter = ({ region, current }: CrossMarketFooterProps) => {
  const navigate = useNavigate();
  const routes = REGION_ROUTES[region];

  return (
    <section className="py-12 px-6 border-t bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest text-center mb-6">
          Explore ChefOS · {REGION_LABELS[region]}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRODUCTS.map((p) => {
            const isCurrent = p.key === current;
            return (
              <button
                key={p.key}
                onClick={() => !isCurrent && navigate(routes[p.key])}
                disabled={isCurrent}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group ${
                  isCurrent
                    ? "bg-foreground/5 border-foreground/10 cursor-default"
                    : `${p.bg} cursor-pointer`
                }`}
              >
                <p.icon className={`w-5 h-5 flex-shrink-0 ${isCurrent ? "text-foreground/30" : p.accent}`} />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold block ${isCurrent ? "text-foreground/40" : "text-foreground"}`}>
                    {p.label}
                    {isCurrent && <span className="text-xs font-normal ml-1.5 text-muted-foreground">(You're here)</span>}
                  </span>
                  <span className="text-xs text-muted-foreground truncate block">{p.tagline}</span>
                </div>
                {!isCurrent && (
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-foreground/60 flex-shrink-0 transition-colors" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CrossMarketFooter;
