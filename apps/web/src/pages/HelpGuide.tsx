import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, ChevronRight, ArrowLeft, Volume2, VolumeX, Home } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useHelpArticles, type HelpArticle } from "@/hooks/useHelpArticles";
import { HelpArticleViewer } from "@/components/help/HelpArticleViewer";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { isCompliance } from "@queitos/shared";

const moduleConfig: Record<string, { label: string; color: string; description: string }> = {
  chefos: { label: "ChefOS", color: "from-orange-500 to-amber-600", description: "Kitchen operations, recipes, prep, inventory & food safety" },
  bevos: { label: "BevOS", color: "from-purple-500 to-violet-600", description: "Bar operations, cellar, cocktails, draught & coffee programs" },
  restos: { label: "RestOS", color: "from-blue-500 to-indigo-600", description: "POS, KDS, tabs, menu admin & front-of-house operations" },
  reservationos: { label: "ReservationOS", color: "from-amber-500 to-yellow-600", description: "Diary, floor plans, guest CRM & function management" },
  labouros: { label: "LabourOS", color: "from-emerald-500 to-green-600", description: "Rostering, timesheets, payroll, compliance & people management" },
  clockos: { label: "ClockOS", color: "from-cyan-500 to-teal-600", description: "Time & attendance, clock in/out, induction & device management" },
  moneyos: { label: "MoneyOS", color: "from-rose-500 to-red-600", description: "Financial intelligence, P&L, reactor dashboard & simulations" },
  quietaudit: { label: "Quiet Audit", color: "from-slate-500 to-gray-600", description: "Silent scoring engine across all modules, recommendations & reports" },
  supplyos: { label: "SupplyOS", color: "from-teal-500 to-emerald-600", description: "Purchase orders, supplier management, receiving & price tracking" },
  overheados: { label: "OverheadOS", color: "from-slate-400 to-zinc-600", description: "Fixed costs, recurring expenses, assets & break-even analysis" },
  growthos: { label: "GrowthOS", color: "from-pink-500 to-rose-600", description: "Marketing campaigns, audience segments, calendar & analytics" },
  vendor: { label: "Vendor Portal", color: "from-indigo-500 to-blue-600", description: "Vendor pricing, orders, deals & marketplace insights" },
  admin: { label: "Control Centre", color: "from-gray-600 to-slate-700", description: "Platform administration, organizations, CRM & system settings" },
  homecook: { label: "Home Cook", color: "from-orange-400 to-red-500", description: "Personal kitchen companion — recipes, pantry, meal planning" },
  vendoros: { label: "VendorOS", color: "from-cyan-500 to-blue-600", description: "Vendor marketplace — products, orders, customer insights" },
  foodsafety: { label: "Food Safety", color: "from-green-500 to-emerald-600", description: "Compliance, temp logs, HACCP plans & audit preparation" },
};

const categories = [
  { value: "", label: "All" },
  { value: "getting-started", label: "Getting Started" },
  { value: "feature", label: "Features" },
  { value: "workflow", label: "Workflows" },
  { value: "troubleshooting", label: "Troubleshooting" },
];

// Modules relevant to EatSafe compliance users
const EATSAFE_MODULES = ["foodsafety", "chefos"];

export default function HelpGuide() {
  const { module } = useParams<{ module?: string }>();
  const { variant } = useFeatureGate();
  const isEatSafe = (() => { try { return isCompliance(variant as any); } catch { return false; } })();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [viewing, setViewing] = useState<HelpArticle | null>(null);

  const isAllModules = !module || module === "all";
  const config = module ? moduleConfig[module] : null;

  // Filter module chips for EatSafe users
  const visibleModules = useMemo(() => {
    if (isEatSafe) return Object.entries(moduleConfig).filter(([key]) => EATSAFE_MODULES.includes(key));
    return Object.entries(moduleConfig);
  }, [isEatSafe]);

  const { data: articles = [], isLoading } = useHelpArticles({
    module: isAllModules ? undefined : module,
    category: category || undefined,
    search: search || undefined,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/taste">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                {isAllModules
                  ? (isEatSafe ? "EatSafe Help Guide" : ".iT Platform Guide")
                  : `${config?.label || module} Guide`}
              </h1>
              {config && (
                <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
              )}
              {isAllModules && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEatSafe
                    ? "Food safety compliance documentation and guides"
                    : "Complete help documentation for the entire .iT ecosystem"}
                </p>
              )}
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search guides..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <Button
                key={c.value}
                variant={category === c.value ? "default" : "ghost"}
                size="sm"
                className="text-xs h-7 whitespace-nowrap flex-shrink-0"
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {/* Module chips for "all" view */}
          {isAllModules && (
            <div className="flex gap-1.5 overflow-x-auto mt-2 pb-1 scrollbar-none">
              {visibleModules.map(([key, val]) => (
                <Link key={key} to={`/help/${key}`}>
                  <Badge variant="outline" className="text-[10px] h-6 cursor-pointer hover:bg-accent/50 whitespace-nowrap">
                    {val.label}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Loading guides...</p>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No guides found</p>
            {search && <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {articles.map((article, idx) => (
              <motion.button
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => setViewing(article)}
                className="w-full text-left rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{article.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{article.subtitle}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {isAllModules && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          {moduleConfig[article.module]?.label || article.module}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px] h-5">{article.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {(article.steps as any[]).length} steps
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </main>

      {/* Article Viewer */}
      <AnimatePresence>
        {viewing && (
          <HelpArticleViewer
            title={viewing.title}
            steps={viewing.steps}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
