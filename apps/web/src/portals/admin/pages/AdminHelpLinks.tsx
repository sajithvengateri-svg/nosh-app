import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Copy, ExternalLink, Check, Send } from "lucide-react";
import { toast } from "sonner";

const moduleLinks = [
  { key: "all", label: ".iT Platform (Master)", description: "Complete help guide for the entire ecosystem", color: "from-primary to-primary/70" },
  { key: "chefos", label: "ChefOS", description: "Kitchen operations, recipes, prep & food safety", color: "from-orange-500 to-amber-600" },
  { key: "bevos", label: "BevOS", description: "Bar, cellar, cocktails, draught & coffee", color: "from-purple-500 to-violet-600" },
  { key: "restos", label: "RestOS", description: "POS, KDS, tabs & front-of-house", color: "from-blue-500 to-indigo-600" },
  { key: "reservationos", label: "ReservationOS", description: "Bookings, floor plans & guest CRM", color: "from-amber-500 to-yellow-600" },
  { key: "labouros", label: "LabourOS", description: "Rostering, payroll & compliance", color: "from-emerald-500 to-green-600" },
  { key: "clockos", label: "ClockOS", description: "Time & attendance management", color: "from-cyan-500 to-teal-600" },
  { key: "moneyos", label: "MoneyOS", description: "Financial intelligence & P&L", color: "from-rose-500 to-red-600" },
  { key: "quietaudit", label: "Quiet Audit", description: "Silent scoring & audit engine", color: "from-slate-500 to-gray-600" },
  { key: "supplyos", label: "SupplyOS", description: "Procurement & supplier management", color: "from-teal-500 to-emerald-600" },
  { key: "overheados", label: "OverheadOS", description: "Fixed costs & break-even", color: "from-slate-400 to-zinc-600" },
  { key: "growthos", label: "GrowthOS", description: "Marketing campaigns & analytics", color: "from-pink-500 to-rose-600" },
  { key: "vendor", label: "Vendor Portal", description: "Vendor-facing marketplace tools", color: "from-indigo-500 to-blue-600" },
  { key: "admin", label: "Control Centre", description: "Platform admin & system settings", color: "from-gray-600 to-slate-700" },
];

export default function AdminHelpLinks() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const baseUrl = window.location.origin;

  const getHelpUrl = (key: string) => `${baseUrl}/help/${key}`;

  const copyLink = (key: string) => {
    navigator.clipboard.writeText(getHelpUrl(key));
    setCopiedKey(key);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openLink = (key: string) => {
    window.open(getHelpUrl(key), "_blank");
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Send className="w-6 h-6" /> Shareable Help Links
        </h1>
        <p className="text-sm text-muted-foreground">
          Copy and send module-specific help guide links to clients, staff, or prospects
        </p>
      </div>

      {/* Master link highlight */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground">.iT Platform — Master Guide</p>
                <p className="text-xs text-muted-foreground truncate">{getHelpUrl("all")}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => copyLink("all")}>
                {copiedKey === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => openLink("all")}>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual module links */}
      <div className="grid gap-2 sm:grid-cols-2">
        {moduleLinks.filter(m => m.key !== "all").map((mod) => (
          <Card key={mod.key}>
            <CardContent className="p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${mod.color} flex items-center justify-center flex-shrink-0`}>
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{mod.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{mod.description}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(mod.key)}>
                  {copiedKey === mod.key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openLink(mod.key)}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
