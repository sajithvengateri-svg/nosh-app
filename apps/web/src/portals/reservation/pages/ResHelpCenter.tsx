import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  X,
  ChevronRight,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Building2,
  Settings2,
  CalendarCheck,
  TrendingUp,
  Users,
  Globe,
  Cog,
  GitBranchPlus,
} from "lucide-react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import {
  HELP_SECTIONS,
  FAQS,
  type HelpSection,
  type HelpArticle,
  type HelpContentBlock,
  type FAQ,
} from "../data/helpDocsData";

// ---------------------------------------------------------------------------
// Icon mapping — keys correspond to the `icon` field on each HelpSection
// ---------------------------------------------------------------------------
const SECTION_ICONS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  Building2,
  Settings2,
  CalendarCheck,
  TrendingUp,
  Users,
  Globe,
  Cog,
  GitBranchPlus,
  HelpCircle,
};

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
interface SearchResult {
  article: HelpArticle;
  sectionTitle: string;
  score: number;
}

function searchHelp(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  for (const section of HELP_SECTIONS) {
    for (const article of section.articles) {
      let score = 0;
      if (article.title.toLowerCase().includes(q)) score += 10;
      if (article.summary.toLowerCase().includes(q)) score += 5;
      if (article.keywords.some((k) => k.toLowerCase().includes(q))) score += 8;
      for (const block of article.content) {
        if (block.content.toLowerCase().includes(q)) score += 2;
        if (block.items?.some((i) => i.toLowerCase().includes(q))) score += 2;
      }
      if (score > 0) {
        results.push({ article, sectionTitle: section.title, score });
      }
    }
  }

  // Also search FAQs
  for (const faq of FAQS) {
    if (
      faq.question.toLowerCase().includes(q) ||
      faq.answer.toLowerCase().includes(q)
    ) {
      results.push({
        article: {
          id: `faq-${faq.question.slice(0, 20)}`,
          title: faq.question,
          summary: faq.answer,
          category: "faq",
          content: [{ type: "paragraph", content: faq.answer }],
          relatedArticles: [],
          keywords: [],
        } as HelpArticle,
        sectionTitle: "FAQ",
        score: faq.question.toLowerCase().includes(q) ? 10 : 5,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CATEGORY_TABS = [
  { value: "all", label: "All" },
  { value: "getting-started", label: "Getting Started" },
  { value: "workflows", label: "Workflows" },
  { value: "features", label: "Features" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "faq", label: "FAQ" },
];

function findArticleById(
  id: string
): { article: HelpArticle; sectionTitle: string } | null {
  for (const section of HELP_SECTIONS) {
    const found = section.articles.find((a) => a.id === id);
    if (found) return { article: found, sectionTitle: section.title };
  }
  return null;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "\u2026";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const ResHelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<{
    article: HelpArticle;
    sectionTitle: string;
  } | null>(null);

  // Derived -------------------------------------------------------------------
  const isSearching = searchQuery.trim().length >= 2;

  const searchResults = useMemo(
    () => (isSearching ? searchHelp(searchQuery) : []),
    [searchQuery, isSearching]
  );

  const filteredSections = useMemo(() => {
    if (activeTab === "all" || activeTab === "faq") return HELP_SECTIONS;
    return HELP_SECTIONS.map((section) => ({
      ...section,
      articles: section.articles.filter((a) => a.category === activeTab),
    })).filter((s) => s.articles.length > 0);
  }, [activeTab]);

  // Handlers ------------------------------------------------------------------
  const handleToggleSection = useCallback((sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  }, []);

  const handleOpenArticle = useCallback(
    (article: HelpArticle, sectionTitle: string) => {
      setActiveArticle({ article, sectionTitle });
    },
    []
  );

  const handleCloseArticle = useCallback(() => {
    setActiveArticle(null);
  }, []);

  const handleRelatedArticle = useCallback((id: string) => {
    const result = findArticleById(id);
    if (result) setActiveArticle(result);
  }, []);

  // Block renderer ------------------------------------------------------------
  const renderBlock = (block: HelpContentBlock, index: number) => {
    switch (block.type) {
      case "heading":
        return (
          <h3
            key={index}
            className="text-lg font-semibold text-foreground mt-6 mb-2"
          >
            {block.content}
          </h3>
        );
      case "paragraph":
        return (
          <p
            key={index}
            className="text-sm text-muted-foreground leading-relaxed mb-3"
          >
            {block.content}
          </p>
        );
      case "steps":
        return (
          <div key={index} className="space-y-2 mb-4">
            <p className="text-sm font-medium text-foreground">
              {block.content}
            </p>
            {block.items?.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        );
      case "tip":
        return (
          <div
            key={index}
            className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">Tip</span>
            </div>
            <p className="text-xs text-muted-foreground">{block.content}</p>
          </div>
        );
      case "warning":
        return (
          <div
            key={index}
            className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Warning
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{block.content}</p>
          </div>
        );
      case "table":
        return (
          <p
            key={index}
            className="text-sm text-muted-foreground mb-3 whitespace-pre-line"
          >
            {block.content}
          </p>
        );
      default:
        return null;
    }
  };

  // Sub-renders ---------------------------------------------------------------
  const renderSectionGrid = () => (
    <div className="grid gap-4 md:grid-cols-2">
      {filteredSections.map((section) => {
        const IconComp =
          SECTION_ICONS[section.icon as string] ?? BookOpen;
        const isExpanded = expandedSection === section.id;

        return (
          <Card
            key={section.id}
            className="transition-shadow hover:shadow-md"
          >
            <CardContent className="p-4 space-y-3">
              {/* Section header */}
              <button
                type="button"
                className="flex items-start gap-3 w-full text-left"
                onClick={() => handleToggleSection(section.id)}
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <IconComp className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {section.title}
                    </h3>
                    <Badge variant="secondary" className="text-[10px] px-1.5">
                      {section.articles.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {section.description}
                  </p>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 mt-1 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>

              {/* Expanded article list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 border-t space-y-1">
                      {section.articles.map((article) => (
                        <button
                          key={article.id}
                          type="button"
                          className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                          onClick={() =>
                            handleOpenArticle(article, section.title)
                          }
                        >
                          <BookOpen className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                          <span className="text-xs text-foreground truncate">
                            {article.title}
                          </span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderFaqAccordion = () => (
    <Accordion type="single" collapsible className="space-y-2">
      {FAQS.map((faq, idx) => (
        <AccordionItem
          key={idx}
          value={`faq-${idx}`}
          className="border rounded-lg px-4"
        >
          <AccordionTrigger className="text-sm text-left hover:no-underline">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span>{faq.question}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground leading-relaxed pl-6">
              {faq.answer}
            </p>
            {faq.category && (
              <div className="pl-6 mt-2">
                <Badge variant="outline" className="text-[10px]">
                  {faq.category}
                </Badge>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <div className="text-center py-12 space-y-2">
          <Search className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm text-muted-foreground">
            No results found for &ldquo;{searchQuery}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground/70">
            Try different keywords or browse the categories above.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground mb-3">
          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}{" "}
          for &ldquo;{searchQuery}&rdquo;
        </p>
        {searchResults.map((result) => (
          <button
            key={result.article.id}
            type="button"
            className="flex items-start gap-3 w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
            onClick={() =>
              handleOpenArticle(result.article, result.sectionTitle)
            }
          >
            <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-foreground truncate">
                  {result.article.title}
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5">
                  {result.sectionTitle}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {truncate(result.article.summary, 160)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    );
  };

  const renderArticleViewer = () => {
    if (!activeArticle) return null;

    const { article, sectionTitle } = activeArticle;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            <span className="truncate">{sectionTitle}</span>
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-medium text-foreground truncate">
              {article.title}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={handleCloseArticle}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
            {/* Title + category badge */}
            <div>
              <Badge variant="outline" className="text-[10px] mb-2">
                {article.category}
              </Badge>
              <h2 className="text-xl font-bold text-foreground">
                {article.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {article.summary}
              </p>
            </div>

            {/* Content blocks */}
            <div>{article.content.map(renderBlock)}</div>

            {/* Related articles */}
            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <div className="pt-4 border-t mt-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Related Articles
                </h4>
                <div className="space-y-1">
                  {article.relatedArticles.map((relId) => {
                    const rel = findArticleById(relId);
                    if (!rel) return null;
                    return (
                      <button
                        key={relId}
                        type="button"
                        className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group"
                        onClick={() => handleRelatedArticle(relId)}
                      >
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                        <span className="text-xs text-foreground truncate">
                          {rel.article.title}
                        </span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Main render ---------------------------------------------------------------
  return (
    <>
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find answers and learn how to use ResOS
          </p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search articles, FAQs, and more..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>

        {/* Content area */}
        {isSearching ? (
          renderSearchResults()
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="flex flex-wrap h-auto gap-1">
              {CATEGORY_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="text-xs"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* All / category tabs share the section grid */}
            {CATEGORY_TABS.filter((t) => t.value !== "faq").map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {renderSectionGrid()}
              </TabsContent>
            ))}

            {/* FAQ tab */}
            <TabsContent value="faq">{renderFaqAccordion()}</TabsContent>
          </Tabs>
        )}
      </div>

      {/* Article viewer overlay */}
      <AnimatePresence>{activeArticle && renderArticleViewer()}</AnimatePresence>
    </>
  );
};

export default ResHelpCenter;
