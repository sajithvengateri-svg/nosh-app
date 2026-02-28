import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, HelpCircle } from "lucide-react";
import chefLogo from "@/assets/chefos-logo-new.png";

/* ─── Types ─── */

interface HelpStep {
  step_number: number;
  title: string;
  instruction: string;
  tips?: string;
}

interface FAQArticle {
  id: string;
  title: string;
  module: string;
  tags: string[];
  steps: HelpStep[];
  sort_order: number;
}

/* ─── Tab / filter config ─── */

type TabKey =
  | "all"
  | "chefos"
  | "bevos"
  | "restos"
  | "labouros"
  | "moneyos"
  | "reservationos"
  | "overheados"
  | "growthos"
  | "clockos"
  | "supplyos"
  | "homecook"
  | "vendoros"
  | "foodsafety"
  | "general";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "chefos", label: "ChefOS" },
  { key: "bevos", label: "BevOS" },
  { key: "restos", label: "RestOS" },
  { key: "labouros", label: "LabourOS" },
  { key: "moneyos", label: "MoneyOS" },
  { key: "reservationos", label: "ReservationOS" },
  { key: "overheados", label: "OverheadOS" },
  { key: "growthos", label: "GrowthOS" },
  { key: "clockos", label: "ClockOS" },
  { key: "supplyos", label: "SupplyOS" },
  { key: "homecook", label: "Home Cook" },
  { key: "vendoros", label: "Vendor" },
  { key: "foodsafety", label: "Food Safety" },
  { key: "general", label: "General" },
];

const tabColors: Record<TabKey, string> = {
  all: "bg-primary text-primary-foreground",
  chefos: "bg-orange-600 text-white",
  bevos: "bg-purple-600 text-white",
  restos: "bg-blue-600 text-white",
  labouros: "bg-teal-600 text-white",
  moneyos: "bg-yellow-600 text-white",
  reservationos: "bg-pink-600 text-white",
  overheados: "bg-stone-600 text-white",
  growthos: "bg-lime-600 text-white",
  clockos: "bg-cyan-600 text-white",
  supplyos: "bg-amber-600 text-white",
  homecook: "bg-emerald-600 text-white",
  vendoros: "bg-indigo-600 text-white",
  foodsafety: "bg-red-600 text-white",
  general: "bg-slate-600 text-white",
};

const moduleBadgeColor: Record<string, string> = {
  chefos: "bg-orange-100 text-orange-800 border-orange-200",
  bevos: "bg-purple-100 text-purple-800 border-purple-200",
  restos: "bg-blue-100 text-blue-800 border-blue-200",
  labouros: "bg-teal-100 text-teal-800 border-teal-200",
  moneyos: "bg-yellow-100 text-yellow-800 border-yellow-200",
  reservationos: "bg-pink-100 text-pink-800 border-pink-200",
  overheados: "bg-stone-100 text-stone-800 border-stone-200",
  growthos: "bg-lime-100 text-lime-800 border-lime-200",
  clockos: "bg-cyan-100 text-cyan-800 border-cyan-200",
  supplyos: "bg-amber-100 text-amber-800 border-amber-200",
  homecook: "bg-emerald-100 text-emerald-800 border-emerald-200",
  vendoros: "bg-indigo-100 text-indigo-800 border-indigo-200",
  foodsafety: "bg-red-100 text-red-800 border-red-200",
  general: "bg-slate-100 text-slate-800 border-slate-200",
};

const moduleLabel: Record<string, string> = {
  chefos: "ChefOS",
  bevos: "BevOS",
  restos: "RestOS",
  labouros: "LabourOS",
  moneyos: "MoneyOS",
  reservationos: "ReservationOS",
  overheados: "OverheadOS",
  growthos: "GrowthOS",
  clockos: "ClockOS",
  supplyos: "SupplyOS",
  homecook: "Home Cook",
  vendoros: "Vendor",
  foodsafety: "Food Safety",
  general: "General",
};

/* ─── Helpers ─── */

function isGeneralArticle(article: FAQArticle): boolean {
  return (
    article.module === "chefos" &&
    Array.isArray(article.tags) &&
    article.tags.some((t) => t.toLowerCase() === "general")
  );
}

function getDisplayModule(article: FAQArticle): string {
  if (isGeneralArticle(article)) return "general";
  return article.module;
}

function matchesTab(article: FAQArticle, tab: TabKey): boolean {
  if (tab === "all") return true;
  if (tab === "general") return isGeneralArticle(article);
  if (tab === "chefos") return article.module === "chefos" && !isGeneralArticle(article);
  // All other app tabs: match by module name
  return article.module === tab;
}

function getFirstStepAnswer(steps: HelpStep[]): string {
  if (!Array.isArray(steps) || steps.length === 0) return "No answer available.";
  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);
  return sorted[0].instruction || "No answer available.";
}

function getFirstStepTips(steps: HelpStep[]): string | undefined {
  if (!Array.isArray(steps) || steps.length === 0) return undefined;
  const sorted = [...steps].sort((a, b) => a.step_number - b.step_number);
  return sorted[0].tips || undefined;
}

/* ─── Data hook ─── */

function useFAQArticles() {
  return useQuery({
    queryKey: ["faq-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_articles")
        .select("id, title, module, tags, steps, sort_order")
        .eq("category", "faq")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as FAQArticle[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/* ─── Component ─── */

export default function FAQPage() {
  useSEO(SEO["/faq"]);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");

  const { data: articles = [], isLoading } = useFAQArticles();

  /* Filter articles by tab + search */
  const filtered = articles.filter((article) => {
    if (!matchesTab(article, activeTab)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const answer = getFirstStepAnswer(article.steps);
      const matchesSearch =
        article.title.toLowerCase().includes(q) ||
        answer.toLowerCase().includes(q) ||
        (Array.isArray(article.tags) && article.tags.some((t) => t.toLowerCase().includes(q)));
      if (!matchesSearch) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ===== Header ===== */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex items-center gap-3 mb-1">
            <Link to="/" className="flex-shrink-0">
              <img src={chefLogo} alt="ChefOS" className="h-9 w-auto" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                Frequently Asked Questions
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Find quick answers to common questions about ChefOS and all our apps.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Main ===== */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Tab filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all " +
                  (isActive
                    ? tabColors[tab.key]
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground")
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground mt-4">Loading FAQs...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No questions found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {search.trim()
                ? `No results match "${search}". Try a different search term or change the filter.`
                : "There are no FAQs available for the selected category yet."}
            </p>
            {(search.trim() || activeTab !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveTab("all");
                }}
                className="mt-4 text-sm text-primary hover:underline font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* FAQ Accordion */}
        {!isLoading && filtered.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Showing {filtered.length} {filtered.length === 1 ? "question" : "questions"}
              {activeTab !== "all" && (
                <> in <span className="font-medium">{tabs.find((t) => t.key === activeTab)?.label}</span></>
              )}
            </p>

            <Accordion type="single" collapsible className="w-full">
              {filtered.map((article) => {
                const displayModule = getDisplayModule(article);
                const answer = getFirstStepAnswer(article.steps);
                const tips = getFirstStepTips(article.steps);

                return (
                  <AccordionItem key={article.id} value={article.id}>
                    <AccordionTrigger className="text-left hover:no-underline py-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground leading-relaxed">
                          {article.title}
                        </span>
                        {activeTab === "all" && (
                          <Badge
                            variant="outline"
                            className={
                              "ml-2 text-[10px] h-5 align-middle " +
                              (moduleBadgeColor[displayModule] || "")
                            }
                          >
                            {moduleLabel[displayModule] || displayModule}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pb-2">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {answer}
                        </p>
                        {tips && (
                          <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
                              Tip
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                              {tips}
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border bg-muted/30 mt-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={chefLogo} alt="ChefOS" className="h-6 w-auto opacity-70" />
              <span className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} ChefOS. All rights reserved.
              </span>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link
                to="/terms"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                to="/privacy"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
