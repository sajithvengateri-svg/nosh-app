import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Loader2, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import type { MenuItem } from "@/types/menu";

interface MenuAIRecommendationsProps {
  menuItems: MenuItem[];
  menuName: string;
}

const MenuAIRecommendations = ({ menuItems, menuName }: MenuAIRecommendationsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (menuItems.length === 0) {
      toast.error("Add menu items first to get recommendations");
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-menu", {
        body: { menuItems, menuName },
      });

      if (error) throw error;

      setRecommendations(data.recommendations);
    } catch (error) {
      console.error("Failed to get recommendations:", error);
      toast.error("Failed to analyze menu. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = () => {
    setRecommendations(null);
    fetchRecommendations();
  };

  return (
    <>
      <Button
        onClick={fetchRecommendations}
        variant="outline"
        className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        AI Recommendations
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lightbulb className="w-5 h-5 text-primary" />
                </div>
                Menu Optimization Insights
              </DialogTitle>
              {recommendations && !isLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refresh}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered analysis of "{menuName}" with {menuItems.length} items
            </p>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-16 gap-4"
                >
                  <div className="relative">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <Sparkles className="w-4 h-4 text-primary absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Analyzing your menu...</p>
                    <p className="text-sm text-muted-foreground">
                      Evaluating profitability, pricing, and item performance
                    </p>
                  </div>
                </motion.div>
              ) : recommendations ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-sm dark:prose-invert max-w-none py-4"
                >
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-xl font-bold text-foreground mb-3 mt-4 first:mt-0">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-lg font-semibold text-foreground mb-2 mt-4 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-base font-medium text-foreground mb-2 mt-3">
                          {children}
                        </h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="space-y-2 my-2">{children}</ul>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start gap-2 text-sm">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                          <span>{children}</span>
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-primary">
                          {children}
                        </strong>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm text-muted-foreground mb-3">
                          {children}
                        </p>
                      ),
                    }}
                  >
                    {recommendations}
                  </ReactMarkdown>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MenuAIRecommendations;
