import { useState, useEffect } from "react";
import { Sparkles, X, Check, Clock, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useUpdateConsent } from "@/hooks/useUpdateConsent";
import { format } from "date-fns";

const WhatsNewBanner = () => {
  const {
    essentialUpdates,
    optionalUpdates,
    teasers,
    isSnoozed,
    acceptUpdates,
    snoozeUpdates,
    isLoading,
  } = useUpdateConsent();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [essentialDismissed, setEssentialDismissed] = useState(false);

  // Auto-dismiss the essential info bar after 6 seconds
  useEffect(() => {
    if (essentialUpdates.length > 0) {
      const timer = setTimeout(() => setEssentialDismissed(true), 6000);
      return () => clearTimeout(timer);
    }
  }, [essentialUpdates.length]);

  if (isLoading) return null;

  const hasEssential = essentialUpdates.length > 0 && !essentialDismissed;
  const hasOptional = optionalUpdates.length > 0 && !isSnoozed;
  const hasTeasers = teasers.length > 0;

  // Nothing to show at all
  if (!hasEssential && !hasOptional && !hasTeasers) return null;
  // Only teasers remain but no banner-worthy updates — don't show top bar
  if (!hasEssential && !hasOptional) return null;

  const handleApplyUpdates = () => {
    acceptUpdates();
    setSheetOpen(false);
  };

  const handleSnooze = () => {
    snoozeUpdates();
  };

  const essentialNames = essentialUpdates.map((u) => u.module_name).join(", ");

  return (
    <AnimatePresence>
      {/* ── Essential update info bar ─────────────────────────────────── */}
      {hasEssential && (
        <motion.div
          key="essential-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-green-500/15 backdrop-blur border-b border-green-500/30 px-4 py-2 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <Check className="w-4 h-4" />
            <span>Essential update applied &mdash; {essentialNames}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-700 dark:text-green-400"
            onClick={() => setEssentialDismissed(true)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </motion.div>
      )}

      {/* ── Optional update prompt bar ────────────────────────────────── */}
      {hasOptional && (
        <motion.div
          key="optional-bar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-accent/80 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between"
        >
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <div className="flex items-center gap-3">
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span>
                    {optionalUpdates.length} new feature{optionalUpdates.length > 1 ? "s" : ""} available
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    What's New
                  </Badge>
                </button>
              </SheetTrigger>

              <SheetTrigger asChild>
                <Button variant="default" size="sm" className="h-7 text-xs">
                  View & Update
                </Button>
              </SheetTrigger>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={handleSnooze}
              >
                <Clock className="w-3 h-3 mr-1" />
                Later
              </Button>
            </div>

            {/* ── Sheet content ──────────────────────────────────────── */}
            <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  What's New
                </SheetTitle>
              </SheetHeader>

              {/* New Updates section */}
              <div className="mt-4 space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  New Updates
                </h3>

                {optionalUpdates.map((release) => (
                  <div
                    key={release.id}
                    className="border border-border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">
                        {release.module_name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {release.version_tag && (
                          <Badge variant="outline" className="text-xs">
                            {release.version_tag}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {release.released_at
                            ? format(new Date(release.released_at), "MMM d, yyyy")
                            : "Just now"}
                        </span>
                      </div>
                    </div>
                    {release.description && (
                      <p className="text-sm text-muted-foreground">
                        {release.description}
                      </p>
                    )}
                    {release.release_notes && (
                      <p className="text-sm text-foreground/80 bg-muted/50 rounded p-2">
                        {release.release_notes}
                      </p>
                    )}
                  </div>
                ))}

                <Button
                  className="w-full mt-2"
                  onClick={handleApplyUpdates}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Apply Updates
                </Button>
              </div>

              {/* Coming Soon section */}
              {hasTeasers && (
                <div className="mt-6 space-y-4 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    <Rocket className="w-4 h-4" />
                    Coming Soon
                  </h3>

                  {teasers.map((teaser) => (
                    <div
                      key={teaser.id}
                      className="border border-dashed border-border rounded-lg p-4 space-y-2 opacity-80"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">
                          {teaser.module_name}
                        </h4>
                        <div className="flex items-center gap-2">
                          {teaser.version_tag && (
                            <Badge variant="outline" className="text-xs">
                              {teaser.version_tag}
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-xs bg-purple-500/15 text-purple-700 dark:text-purple-400"
                          >
                            Coming soon
                          </Badge>
                        </div>
                      </div>
                      {teaser.description && (
                        <p className="text-sm text-muted-foreground">
                          {teaser.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsNewBanner;
