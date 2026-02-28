"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import {
  fetchAuditSuggestions,
  updateAuditSuggestion,
} from "@/lib/shared/queries/resQueries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  Check,
  X,
  Loader2,
  Cake,
  AlertTriangle,
  Star,
  Gift,
  ChefHat,
  ArrowUpRight,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuditSuggestion {
  id: string;
  reservation_id: string;
  type: string;
  title: string;
  description: string;
  action_text: string;
  status: "pending" | "approved" | "declined";
  approved_by?: string | null;
  approved_at?: string | null;
}

interface PreServiceAuditPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string; // yyyy-MM-dd
  servicePeriod: string; // 'lunch' | 'dinner' | 'breakfast'
  reservations: any[]; // for context in generating audit
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  BIRTHDAY_SURPRISE: Cake,
  VIP_UPGRADE: Star,
  ALLERGEN_ALERT: AlertTriangle,
  REGULAR_WELCOME: Users,
  AMUSE_BOUCHE: ChefHat,
  TABLE_OPTIMIZATION: ArrowUpRight,
  OCCASION_TOUCH: Gift,
};

function getTypeIcon(type: string) {
  return TYPE_ICON_MAP[type] ?? Sparkles;
}

const servicePeriodLabel: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function PreServiceAuditPanel({
  open,
  onOpenChange,
  date,
  servicePeriod,
  reservations,
}: PreServiceAuditPanelProps) {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();

  // ---- Fetch existing suggestions ----------------------------------------

  const queryKey = ["audit_suggestions", currentOrg?.id, date, servicePeriod];

  const {
    data: suggestions = [],
    isLoading,
    isError,
  } = useQuery<AuditSuggestion[]>({
    queryKey,
    queryFn: () =>
      fetchAuditSuggestions({
        orgId: currentOrg!.id,
        date,
        servicePeriod,
      }),
    enabled: open && !!currentOrg?.id,
  });

  // ---- Generate mutation --------------------------------------------------

  const generateMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "res-pre-service-audit",
        {
          body: { orgId: currentOrg!.id, date, servicePeriod },
        },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["audit_suggestions"] });
      toast.success("Audit suggestions generated!");
    },
    onError: () => toast.error("Failed to generate audit"),
  });

  // ---- Approve / Decline mutations ----------------------------------------

  const approveMut = useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return updateAuditSuggestion(id, {
        status: "approved",
        approved_by: user?.id ?? null,
        approved_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Suggestion approved");
    },
    onError: () => toast.error("Failed to approve suggestion"),
  });

  const declineMut = useMutation({
    mutationFn: async (id: string) => {
      return updateAuditSuggestion(id, { status: "declined" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("Suggestion declined");
    },
    onError: () => toast.error("Failed to decline suggestion"),
  });

  // ---- Approve All --------------------------------------------------------

  const approveAllMut = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const pending = suggestions.filter((s) => s.status === "pending");
      await Promise.all(
        pending.map((s) =>
          updateAuditSuggestion(s.id, {
            status: "approved",
            approved_by: user?.id ?? null,
            approved_at: new Date().toISOString(),
          }),
        ),
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("All pending suggestions approved!");
    },
    onError: () => toast.error("Failed to approve all suggestions"),
  });

  // ---- Derived data -------------------------------------------------------

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let declined = 0;
    for (const s of suggestions) {
      if (s.status === "pending") pending++;
      else if (s.status === "approved") approved++;
      else if (s.status === "declined") declined++;
    }
    return { pending, approved, declined };
  }, [suggestions]);

  const grouped = useMemo(() => {
    const map = new Map<string, AuditSuggestion[]>();
    for (const s of suggestions) {
      const key = s.reservation_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [suggestions]);

  // ---- Render -------------------------------------------------------------

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] max-w-full overflow-y-auto p-0">
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 border-b bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Pre-Service Audit
            </SheetTitle>
          </div>

          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{date}</span>
            <Badge variant="secondary" className="text-xs capitalize">
              {servicePeriodLabel[servicePeriod] ?? servicePeriod}
            </Badge>
          </div>

          {/* Counts + Approve All */}
          {suggestions.length > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline">{counts.pending} pending</Badge>
                <Badge className="border-green-200 bg-green-50 text-green-700">
                  {counts.approved} approved
                </Badge>
                <Badge variant="secondary">{counts.declined} declined</Badge>
              </div>

              {counts.pending > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  disabled={approveAllMut.isPending}
                  onClick={() => approveAllMut.mutate()}
                >
                  {approveAllMut.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  Approve All
                </Button>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        <div className="px-6 py-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Loading suggestions...
              </p>
            </div>
          )}

          {/* Error state */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <p className="mt-3 text-sm text-muted-foreground">
                Failed to load audit suggestions.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && suggestions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No suggestions yet
              </p>
              <p className="mt-1 max-w-[280px] text-xs text-muted-foreground/70">
                Generate an AI-powered pre-service audit to surface
                opportunities and alerts for tonight's reservations.
              </p>
              <Button
                className="mt-6 gap-2"
                onClick={() => generateMut.mutate()}
                disabled={generateMut.isPending}
              >
                {generateMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Audit
              </Button>
            </div>
          )}

          {/* Suggestion cards grouped by reservation */}
          {!isLoading && !isError && suggestions.length > 0 && (
            <div className="space-y-6">
              {Array.from(grouped.entries()).map(
                ([reservationId, items], groupIdx) => {
                  // Look up guest name from reservations prop if available
                  const reservation = reservations.find(
                    (r) => r.id === reservationId,
                  );
                  const guestLabel = reservation?.guest_name
                    ? reservation.guest_name
                    : `Reservation ${reservationId.slice(0, 8)}`;

                  return (
                    <div key={reservationId}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {guestLabel}
                      </p>

                      <div className="space-y-2">
                        {items.map((suggestion, idx) => {
                          const Icon = getTypeIcon(suggestion.type);
                          const isApproved = suggestion.status === "approved";
                          const isDeclined = suggestion.status === "declined";
                          const isPending = suggestion.status === "pending";

                          return (
                            <motion.div
                              key={suggestion.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: groupIdx * 0.08 + idx * 0.05,
                                duration: 0.3,
                                ease: "easeOut",
                              }}
                            >
                              <Card
                                className={`transition-colors ${
                                  isApproved
                                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30"
                                    : isDeclined
                                      ? "border-muted bg-muted/30 opacity-60"
                                      : ""
                                }`}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    {/* Type icon */}
                                    <div
                                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                        isApproved
                                          ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                                          : isDeclined
                                            ? "bg-muted text-muted-foreground"
                                            : "bg-primary/10 text-primary"
                                      }`}
                                    >
                                      <Icon className="h-4 w-4" />
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className={`text-sm font-semibold leading-tight ${
                                          isDeclined
                                            ? "text-muted-foreground line-through"
                                            : ""
                                        }`}
                                      >
                                        {suggestion.title}
                                      </p>
                                      <p
                                        className={`mt-1 text-xs leading-relaxed ${
                                          isDeclined
                                            ? "text-muted-foreground/60 line-through"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        {suggestion.description}
                                      </p>
                                      {suggestion.action_text && (
                                        <p
                                          className={`mt-1.5 text-xs font-medium ${
                                            isApproved
                                              ? "text-green-700 dark:text-green-400"
                                              : isDeclined
                                                ? "text-muted-foreground/50 line-through"
                                                : "text-primary"
                                          }`}
                                        >
                                          {suggestion.action_text}
                                        </p>
                                      )}

                                      {/* Status badges for resolved suggestions */}
                                      {isApproved && (
                                        <Badge
                                          variant="secondary"
                                          className="mt-2 border-green-200 bg-green-100 text-xs text-green-700 dark:border-green-800 dark:bg-green-900 dark:text-green-300"
                                        >
                                          <Check className="mr-1 h-3 w-3" />
                                          Approved
                                        </Badge>
                                      )}
                                      {isDeclined && (
                                        <Badge
                                          variant="secondary"
                                          className="mt-2 text-xs"
                                        >
                                          <X className="mr-1 h-3 w-3" />
                                          Declined
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Action buttons — only for pending */}
                                    {isPending && (
                                      <div className="flex shrink-0 gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900"
                                          disabled={approveMut.isPending}
                                          onClick={() =>
                                            approveMut.mutate(suggestion.id)
                                          }
                                        >
                                          <Check className="h-4 w-4" />
                                          <span className="sr-only">
                                            Approve
                                          </span>
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 text-muted-foreground hover:bg-muted"
                                          disabled={declineMut.isPending}
                                          onClick={() =>
                                            declineMut.mutate(suggestion.id)
                                          }
                                        >
                                          <X className="h-4 w-4" />
                                          <span className="sr-only">
                                            Decline
                                          </span>
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )}

              {/* Regenerate button at the bottom */}
              <div className="flex justify-center pb-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => generateMut.mutate()}
                  disabled={generateMut.isPending}
                >
                  {generateMut.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Regenerate Audit
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default PreServiceAuditPanel;
