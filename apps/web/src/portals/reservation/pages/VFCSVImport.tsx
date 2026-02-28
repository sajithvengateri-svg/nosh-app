import React, { useState, useCallback } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2,
  Download, Shield, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedContact {
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone: string;
}

interface ImportResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: number;
}

function parseCSV(text: string): ParsedContact[] {
  const lines = text.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  const emailIdx = headers.findIndex(h => h === "email" || h === "e-mail");
  const fnIdx = headers.findIndex(h => h === "first_name" || h === "firstname" || h === "first name");
  const lnIdx = headers.findIndex(h => h === "last_name" || h === "lastname" || h === "last name");
  const compIdx = headers.findIndex(h => h === "company_name" || h === "company" || h === "organisation");
  const phoneIdx = headers.findIndex(h => h === "phone" || h === "mobile" || h === "tel");

  if (emailIdx === -1) return [];

  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/^["']|["']$/g, ""));
    return {
      email: (cols[emailIdx] || "").toLowerCase().trim(),
      first_name: cols[fnIdx] || "",
      last_name: cols[lnIdx] || "",
      company_name: cols[compIdx] || "",
      phone: cols[phoneIdx] || "",
    };
  }).filter(c => c.email && c.email.includes("@"));
}

const VFCSVImport = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setProgress(0);
    const text = await f.text();
    const contacts = parseCSV(text);
    setParsed(contacts);
    if (contacts.length === 0) {
      toast.error("No valid contacts found. Ensure CSV has an 'email' column header.");
    }
  }, []);

  const handleImport = async () => {
    if (!orgId || parsed.length === 0) return;
    setImporting(true);
    setProgress(0);

    let imported = 0;
    let duplicates = 0;
    let errors = 0;
    const batchSize = 50;

    for (let i = 0; i < parsed.length; i += batchSize) {
      const batch = parsed.slice(i, i + batchSize);
      const records = batch.map(c => ({
        org_id: orgId,
        contact_name: [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email,
        company_name: c.company_name || null,
        email: c.email,
        phone: c.phone || null,
        pipeline_stage: "COMPLETED",
        lead_source: "DIRECT",
        do_not_contact: false,
        source: "csv_import",
      }));

      const { data, error } = await supabase
        .from("res_function_clients")
        .upsert(records as any, { onConflict: "org_id,email", ignoreDuplicates: true })
        .select("id");

      if (error) {
        errors += batch.length;
      } else {
        imported += data?.length || 0;
        duplicates += batch.length - (data?.length || 0);
      }
      setProgress(Math.round(((i + batch.length) / parsed.length) * 100));
    }

    setResult({ total: parsed.length, imported, duplicates, errors });
    setImporting(false);
    qc.invalidateQueries({ queryKey: ["res_function_clients"] });
    toast.success(`Imported ${imported} contacts`);
  };

  const downloadTemplate = () => {
    const csv = "email,first_name,last_name,company_name,phone\njohn@example.com,John,Smith,Smith Corp,+61412345678\njane@example.com,Jane,Doe,Doe Events,+61498765432";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2 text-vf-charcoal">
          <Upload className="w-6 h-6 text-vf-gold" /> Import Contacts
        </h1>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" /> CSV Template
        </Button>
      </div>

      <Alert className="border-vf-gold/20 bg-vf-gold/5">
        <Shield className="w-4 h-4 text-vf-gold" />
        <AlertDescription className="text-sm">
          <strong>Data Safety:</strong> Imported contacts are marked as existing customers.
          The lead generation engine will automatically exclude them from cold outreach campaigns.
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <Card className="border-vf-gold/10">
        <CardContent className="p-6">
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-vf-gold/20 rounded-xl p-8 cursor-pointer hover:border-vf-gold/40 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-vf-gold/40 mb-3" />
            <p className="font-medium text-vf-charcoal">
              {file ? file.name : "Drop CSV file here or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Required columns: email. Optional: first_name, last_name, company_name, phone
            </p>
            <input type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          </label>
        </CardContent>
      </Card>

      {/* Preview */}
      {parsed.length > 0 && !result && (
        <Card className="border-vf-gold/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-vf-gold" />
              Preview ({parsed.length} contacts found)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.slice(0, 20).map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm">{c.email}</TableCell>
                      <TableCell className="text-sm">{[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                      <TableCell className="text-sm">{c.company_name || "—"}</TableCell>
                      <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {parsed.length > 20 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Showing first 20 of {parsed.length} contacts
              </p>
            )}

            {importing && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">Importing... {progress}%</p>
              </div>
            )}

            <Button
              className="w-full mt-4 bg-vf-gold hover:bg-vf-gold-light text-vf-navy font-medium"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" /> Import {parsed.length} Contacts</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className="border-vf-gold/10">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-vf-sage">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="font-medium text-lg">Import Complete</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-vf-sage/10">
                <p className="text-2xl font-bold text-vf-sage">{result.imported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10">
                <p className="text-2xl font-bold text-amber-600">{result.duplicates}</p>
                <p className="text-xs text-muted-foreground">Duplicates</p>
              </div>
              {result.errors > 0 && (
                <div className="text-center p-3 rounded-lg bg-vf-rose/10">
                  <p className="text-2xl font-bold text-vf-rose">{result.errors}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setFile(null); setParsed([]); setResult(null); }}>
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VFCSVImport;
