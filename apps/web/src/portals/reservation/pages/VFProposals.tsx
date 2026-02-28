import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  FileText,
  Users,
  CalendarDays,
  DollarSign,
  Copy,
  ClipboardCheck,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProposalClient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
}

interface ProposalFunction {
  id: string;
  function_name: string | null;
  client_id: string | null;
  res_function_clients: ProposalClient | null;
}

interface Proposal {
  id: string;
  status: string;
  created_at: string;
  share_token: string | null;
  event_date: string | null;
  party_size: number | null;
  subtotal: number | null;
  total: number | null;
  hero_headline: string | null;
  cover_message: string | null;
  expires_at: string | null;
  org_id: string;
  res_functions: ProposalFunction | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { className: string; label: string }> = {
  sent: {
    className: "bg-vf-gold/10 text-vf-gold border-vf-gold/30",
    label: "Sent",
  },
  accepted: {
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    label: "Accepted",
  },
  draft: {
    className: "bg-slate-500/10 text-slate-600 border-slate-200",
    label: "Draft",
  },
};

function getStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      className: "bg-slate-500/10 text-slate-600 border-slate-200",
      label: status.charAt(0).toUpperCase() + status.slice(1),
    }
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function getClientDisplay(proposal: Proposal): {
  name: string;
  company: string | null;
} {
  const client = proposal.res_functions?.res_function_clients;
  if (!client) {
    return { name: "No client", company: null };
  }
  const parts = [client.first_name, client.last_name].filter(Boolean);
  return {
    name: parts.length > 0 ? parts.join(" ") : client.email || "No client",
    company: client.company_name || null,
  };
}

// ---------------------------------------------------------------------------
// Component: VFProposals
// ---------------------------------------------------------------------------

const VFProposals: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();

  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Query: Proposals
  // -------------------------------------------------------------------------

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ["res_function_proposals", orgId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("res_function_proposals" as any)
        .select(
          `id, status, created_at, share_token, event_date, party_size, subtotal, total, hero_headline, cover_message, expires_at, org_id,
           res_functions(id, function_name, client_id, res_function_clients(id, first_name, last_name, email, company_name))`
        )
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false }) as any);
      if (error) throw error;
      return (data ?? []) as Proposal[];
    },
    enabled: !!orgId,
  });

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleCopyShareLink = async (
    e: React.MouseEvent,
    proposal: Proposal
  ) => {
    e.stopPropagation();
    if (!proposal.share_token) return;

    const shareUrl = `${window.location.origin}/proposal/${proposal.share_token}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(proposal.id);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!orgId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select an organization to view proposals.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-vf-gold mx-auto" />
          <p className="text-sm text-vf-navy/60">Loading proposals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vf-cream">
      <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6 pb-28">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-vf-navy flex items-center justify-center">
              <FileText className="w-5 h-5 text-vf-gold" />
            </div>
            <h1 className="text-2xl font-bold text-vf-navy font-display">
              Proposals
            </h1>
          </div>
          <Button
            className="bg-vf-gold hover:bg-vf-gold/90 text-white"
            onClick={() =>
              navigate("/reservation/functions/proposals/new")
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Button>
        </div>

        {/* Empty State */}
        {proposals.length === 0 ? (
          <Card className="border-vf-navy/10 bg-white">
            <CardContent className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-vf-navy/5 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-vf-navy/30" />
              </div>
              <h3 className="text-lg font-semibold text-vf-navy font-display">
                No proposals yet
              </h3>
              <p className="text-sm text-vf-navy/50 max-w-sm mx-auto">
                No proposals yet. Create your first proposal.
              </p>
              <Button
                className="bg-vf-gold hover:bg-vf-gold/90 text-white mt-2"
                onClick={() =>
                  navigate("/reservation/functions/proposals/new")
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Proposals Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.map((proposal) => {
              const statusCfg = getStatusConfig(proposal.status);
              const client = getClientDisplay(proposal);

              return (
                <Card
                  key={proposal.id}
                  className="border-vf-navy/10 bg-white hover:border-vf-navy/30 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() =>
                    navigate(
                      `/reservation/functions/proposals/${proposal.id}`
                    )
                  }
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Status badge */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusCfg.className}`}
                      >
                        {statusCfg.label}
                      </Badge>
                      {proposal.share_token && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-vf-navy/40 hover:text-vf-gold"
                          onClick={(e) =>
                            handleCopyShareLink(e, proposal)
                          }
                          title="Copy share link"
                        >
                          {copiedId === proposal.id ? (
                            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Hero headline as card title */}
                    <h3 className="font-semibold text-vf-navy text-sm leading-tight line-clamp-2 font-display">
                      {proposal.hero_headline || "Untitled Proposal"}
                    </h3>

                    {/* Client name + company */}
                    <div className="text-xs text-vf-navy/60">
                      <span className="font-medium text-vf-navy/80">
                        {client.name}
                      </span>
                      {client.company && (
                        <span className="ml-1 text-vf-navy/40">
                          - {client.company}
                        </span>
                      )}
                    </div>

                    {/* Event date + party size */}
                    <div className="flex items-center gap-3 text-xs text-vf-navy/50">
                      {proposal.event_date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {format(
                            parseISO(proposal.event_date),
                            "d MMM yyyy"
                          )}
                        </span>
                      )}
                      {proposal.party_size != null && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {proposal.party_size} guests
                        </span>
                      )}
                    </div>

                    {/* Total amount */}
                    {proposal.total != null && proposal.total > 0 && (
                      <div className="flex items-center gap-1 text-sm font-semibold text-vf-navy">
                        <DollarSign className="w-3.5 h-3.5 text-vf-gold" />
                        {formatCurrency(proposal.total)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VFProposals;
