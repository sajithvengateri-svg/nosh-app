import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Lightbulb } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

const STORAGE_KEY = "chefos_page_guides_seen";

interface PageGuide {
  path: string;
  title: string;
  tips: string[];
}

const PAGE_GUIDES: PageGuide[] = [
  { path: "/recipes", title: "Welcome to Recipes", tips: ["Create recipes manually, paste text, or snap a photo", "Each recipe auto-calculates food cost from ingredients", "Add photos and assign to kitchen sections"] },
  { path: "/ingredients", title: "Welcome to Ingredients", tips: ["Add your full pantry with costs and suppliers", "Prices update automatically when you scan invoices", "Set par levels to get low-stock alerts"] },
  { path: "/prep", title: "Welcome to Prep Lists", tips: ["Section chefs set nightly prep for the next day", "Templates save time for recurring prep items", "Stock counts archive daily under each section"] },
  { path: "/kitchen-sections", title: "Welcome to Kitchen Sections", tips: ["Create sections like Hot, Cold, Pastry, Garde Manger", "Assign team members and section leaders", "Each section gets its own prep lists and budgets"] },
  { path: "/team", title: "Welcome to Team", tips: ["Invite chefs via email or share a link", "Assign roles: Head Chef, Sous Chef, Section Leader, Line Chef", "Manage permissions for each module"] },
  { path: "/invoices", title: "Welcome to Invoices", tips: ["Snap a photo of any supplier invoice", "AI extracts items and updates ingredient prices", "Archive all invoices for easy reference"] },
  { path: "/inventory", title: "Welcome to Inventory", tips: ["Track food stock, equipment, and cleaning supplies", "Equipment tab for plates, cutlery, smallwares", "Cleaning tab for chemicals and PPE"] },
  { path: "/menu-engineering", title: "Welcome to Menu Engineering", tips: ["Upload or build your menu and link recipes", "See food cost % and contribution margin per dish", "Identify Stars, Puzzles, Plowhorses, and Dogs"] },
  { path: "/production", title: "Welcome to Production", tips: ["Log yield tests for butchery, fish, and batch cooking", "Scale recipes for different batch sizes", "Track waste and actual vs theoretical yields"] },
  { path: "/food-safety", title: "Welcome to Food Safety", tips: ["Set up Critical Control Points (CCPs) for each recipe", "Log daily temperatures for fridges and hot holding", "AI can verify cleaning photos against reference images"] },
];

const PageGuideCard = () => {
  const location = useLocation();
  const { settings } = useAppSettings();
  const [visible, setVisible] = useState(false);
  const [currentGuide, setCurrentGuide] = useState<PageGuide | null>(null);

  useEffect(() => {
    if (!settings.inductionEnabled) return;

    const seen: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const guide = PAGE_GUIDES.find(g => location.pathname.startsWith(g.path));

    if (guide && !seen.includes(guide.path)) {
      setCurrentGuide(guide);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [location.pathname, settings.inductionEnabled]);

  const dismiss = () => {
    if (!currentGuide) return;
    const seen: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    seen.push(currentGuide.path);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && currentGuide && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-8 lg:bottom-8 lg:w-96 z-50"
        >
          <div className="bg-card border border-border rounded-xl shadow-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-sm">{currentGuide.title}</h3>
              </div>
              <button onClick={dismiss} className="p-1 hover:bg-muted rounded">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <ul className="space-y-1.5 mb-3">
              {currentGuide.tips.map((tip, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" onClick={dismiss} className="w-full">
              Got it
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageGuideCard;
