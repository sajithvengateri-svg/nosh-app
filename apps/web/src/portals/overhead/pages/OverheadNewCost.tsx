import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, PenLine, Plug, Mail, Loader2, AlertTriangle,
  CheckCircle2, Zap, Flame, Wifi, Droplets, Sparkles, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  "Rent", "Utilities", "Insurance", "Merchant Fees", "Marketing",
  "Subscriptions", "Equipment", "Licenses", "Professional Services",
  "Depreciation", "Other",
];

const COST_TYPES = [
  { value: "FIXED", label: "Fixed" },
  { value: "VARIABLE", label: "Variable" },
  { value: "SEMI_VARIABLE", label: "Semi-variable" },
];

// --- Manual Entry Tab ---
const ManualTab = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Cost Details</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Input placeholder="e.g. Monthly electricity bill" />
          </div>
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Input placeholder="e.g. AGL Energy" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input type="number" step="0.01" min="0" placeholder="0.00" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cost Type</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {COST_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input placeholder="Any extra details" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button className="flex-1">Save Cost</Button>
          <Button variant="outline" onClick={() => navigate("/overhead/costs")}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Provider API Tab (stubbed) ---
const providerStubs = [
  { name: "Electricity", icon: Zap, status: "disconnected" as const, provider: "AGL / Origin / EnergyAustralia" },
  { name: "Gas", icon: Flame, status: "disconnected" as const, provider: "AGL / Origin" },
  { name: "Internet / Telco", icon: Wifi, status: "disconnected" as const, provider: "Telstra / Optus / TPG" },
  { name: "Water", icon: Droplets, status: "disconnected" as const, provider: "Sydney Water / SA Water" },
];

const ProviderTab = () => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center gap-2">
        <Plug className="w-4 h-4" /> Provider Connections
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Connect utility provider APIs to automatically import bills. Costs flow into your overhead tracker in real-time.
      </p>
      {providerStubs.map((p) => {
        const Icon = p.icon;
        return (
          <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.provider}</p>
            </div>
            <Badge variant="outline" className="text-xs text-muted-foreground">Coming Soon</Badge>
          </div>
        );
      })}
      <div className="p-3 rounded-lg border border-dashed border-muted-foreground/20 text-center">
        <Sparkles className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">
          Once connected, AI Deal Finder will automatically compare your usage against market rates
        </p>
      </div>
    </CardContent>
  </Card>
);

// --- Bill Paste Tab (AI Extraction) ---
interface ParsedBill {
  supplier_name: string;
  category: string;
  amount: number;
  date: string;
  due_date?: string;
  description: string;
  confidence: "high" | "medium" | "low";
  anomalies: string[];
}

const BillPasteTab = () => {
  const navigate = useNavigate();
  const [billText, setBillText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedBill | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleParse = async () => {
    if (billText.trim().length < 10) {
      toast.error("Please paste at least 10 characters of bill text");
      return;
    }
    setIsParsing(true);
    setParsed(null);
    setParseError(null);

    try {
      const { data, error } = await supabase.functions.invoke("parse-bill", {
        body: { billText: billText.trim().slice(0, 5000) },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Extraction failed");

      setParsed(data.data);
      if (data.data.anomalies?.length > 0) {
        toast.warning("Anomalies detected — please review flagged items", { duration: 5000 });
      } else {
        toast.success("Bill parsed successfully");
      }
    } catch (e: any) {
      console.error(e);
      setParseError(e.message || "Failed to parse bill");
      toast.error("Failed to parse bill");
    } finally {
      setIsParsing(false);
    }
  };

  const confidenceColor = (c: string) => {
    if (c === "high") return "text-emerald-500";
    if (c === "medium") return "text-amber-500";
    return "text-destructive";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4" /> Paste Bill / Invoice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy the text from a bill email or PDF and paste it below. AI will extract the key details automatically.
          </p>
          <Textarea
            value={billText}
            onChange={(e) => setBillText(e.target.value)}
            placeholder="Paste your bill text here...

e.g.
AGL Energy
Tax Invoice #INV-2026-0214
Account: 1234 5678
Billing Period: 01 Jan 2026 – 31 Jan 2026
Total Due: $920.45
Due Date: 15 Feb 2026"
            className="min-h-[180px] font-mono text-sm"
          />
          <Button onClick={handleParse} disabled={isParsing || billText.trim().length < 10} className="w-full gap-2">
            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isParsing ? "Parsing..." : "Extract with AI"}
          </Button>
          {parseError && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {parseError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Parsed Result */}
      {parsed && (
        <Card className={cn(parsed.anomalies.length > 0 && "border-amber-500/30")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Extracted Data
              </span>
              <Badge variant={parsed.confidence === "high" ? "default" : parsed.confidence === "medium" ? "secondary" : "destructive"} className="text-xs">
                {parsed.confidence} confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Anomaly Alerts */}
            {parsed.anomalies.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Manual Check Required
                </p>
                {parsed.anomalies.map((a, i) => (
                  <p key={i} className="text-xs text-amber-600 dark:text-amber-400 pl-6">• {a}</p>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input defaultValue={parsed.supplier_name} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select defaultValue={parsed.category}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" defaultValue={parsed.amount} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" defaultValue={parsed.date} />
              </div>
              {parsed.due_date && (
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" defaultValue={parsed.due_date} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input defaultValue={parsed.description} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1">Confirm & Save</Button>
              <Button variant="outline" onClick={() => { setParsed(null); setBillText(""); }}>
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// --- Camera Scan Tab ---
const CameraScanTab = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedBill | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large (max 10 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setParsed(null);
      setParseError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleParse = async () => {
    if (!preview) return;
    setIsParsing(true);
    setParsed(null);
    setParseError(null);
    try {
      const { data, error } = await supabase.functions.invoke("parse-bill", {
        body: { billImage: preview },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Extraction failed");
      setParsed(data.data);
      if (data.data.anomalies?.length > 0) {
        toast.warning("Anomalies detected — please review flagged items", { duration: 5000 });
      } else {
        toast.success("Bill parsed successfully");
      }
    } catch (e: any) {
      console.error(e);
      setParseError(e.message || "Failed to parse bill image");
      toast.error("Failed to parse bill image");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="w-4 h-4" /> Scan Bill
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Take a photo of your bill or upload an image. AI will extract the details automatically.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCapture}
          />
          {!preview ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 h-28 flex-col gap-2 border-dashed"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute("capture", "environment");
                    fileInputRef.current.click();
                  }
                }}
              >
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Take Photo</span>
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-28 flex-col gap-2 border-dashed"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute("capture");
                    fileInputRef.current.click();
                  }
                }}
              >
                <Mail className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload Image</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <img src={preview} alt="Bill preview" className="rounded-lg border border-border max-h-64 w-full object-contain bg-muted" />
              <div className="flex gap-3">
                <Button onClick={handleParse} disabled={isParsing} className="flex-1 gap-2">
                  {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isParsing ? "Parsing..." : "Extract with AI"}
                </Button>
                <Button variant="outline" onClick={() => { setPreview(null); setParsed(null); }}>
                  Retake
                </Button>
              </div>
            </div>
          )}
          {parseError && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {parseError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Parsed Result - reuse same layout */}
      {parsed && (
        <Card className={cn(parsed.anomalies.length > 0 && "border-amber-500/30")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Extracted Data
              </span>
              <Badge variant={parsed.confidence === "high" ? "default" : parsed.confidence === "medium" ? "secondary" : "destructive"} className="text-xs">
                {parsed.confidence} confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsed.anomalies.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Manual Check Required
                </p>
                {parsed.anomalies.map((a, i) => (
                  <p key={i} className="text-xs text-amber-600 dark:text-amber-400 pl-6">• {a}</p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input defaultValue={parsed.supplier_name} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select defaultValue={parsed.category}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" step="0.01" defaultValue={parsed.amount} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" defaultValue={parsed.date} />
              </div>
              {parsed.due_date && (
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" defaultValue={parsed.due_date} />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input defaultValue={parsed.description} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1">Confirm & Save</Button>
              <Button variant="outline" onClick={() => { setParsed(null); setPreview(null); }}>
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// --- Main Page ---
const OverheadNewCost = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/overhead/costs")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Cost Entry</h1>
          <p className="text-muted-foreground text-sm">Add overhead costs manually, via provider, scan, or paste a bill</p>
        </div>
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="manual" className="gap-2 text-xs sm:text-sm">
            <PenLine className="w-4 h-4 hidden sm:block" /> Manual
          </TabsTrigger>
          <TabsTrigger value="scan" className="gap-2 text-xs sm:text-sm">
            <Camera className="w-4 h-4 hidden sm:block" /> Scan
          </TabsTrigger>
          <TabsTrigger value="provider" className="gap-2 text-xs sm:text-sm">
            <Plug className="w-4 h-4 hidden sm:block" /> Provider
          </TabsTrigger>
          <TabsTrigger value="bill" className="gap-2 text-xs sm:text-sm">
            <Mail className="w-4 h-4 hidden sm:block" /> Paste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual"><ManualTab /></TabsContent>
        <TabsContent value="scan"><CameraScanTab /></TabsContent>
        <TabsContent value="provider"><ProviderTab /></TabsContent>
        <TabsContent value="bill"><BillPasteTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default OverheadNewCost;
