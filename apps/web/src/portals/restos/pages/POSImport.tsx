import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

const supportedFormats = [
  { label: "Menu Items", desc: "name, category, price, description" },
  { label: "Staff", desc: "name, role, email, phone" },
  { label: "Ingredients", desc: "name, unit, cost, par_level, supplier" },
];

const importHistory = [
  { file: "menu_items_feb.csv", type: "Menu Items", rows: 48, status: "Success", date: "Feb 15, 2026" },
  { file: "ingredients_jan.csv", type: "Ingredients", rows: 124, status: "Success", date: "Jan 28, 2026" },
  { file: "staff_jan.csv", type: "Staff", rows: 22, status: "Partial", date: "Jan 20, 2026" },
];

export default function POSImport() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("Menu Items");
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "map" | "done">("upload");

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".csv")) { setFile(f); setStep("map"); }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setStep("map"); }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Import Data</h1>
        <p className="text-sm text-slate-400">CSV upload with column mapping</p>
      </div>

      {step === "upload" && (
        <>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-4 space-y-4">
              <div><p className="text-sm text-slate-300 mb-2">Import Type</p>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{supportedFormats.map(f => <SelectItem key={f.label} value={f.label}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Expected columns: {supportedFormats.find(f=>f.label===selectedFormat)?.desc}</p>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-white/10"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-300">Drop CSV file here or</p>
                <label className="cursor-pointer">
                  <span className="text-sm text-primary underline">browse files</span>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm text-white">Import History</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {importHistory.map((h) => (
                <div key={h.file} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="text-sm text-white">{h.file}</p>
                      <p className="text-xs text-slate-500">{h.type} · {h.rows} rows · {h.date}</p>
                    </div>
                  </div>
                  <Badge variant={h.status === "Success" ? "default" : "secondary"}
                    className={h.status === "Success" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}>
                    {h.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}

      {step === "map" && file && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader><CardTitle className="text-sm text-white">Column Mapping — {file.name}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-400">Map your CSV columns to the expected fields:</p>
            <div className="space-y-3">
              {(supportedFormats.find(f=>f.label===selectedFormat)?.desc.split(", ") || []).map((col) => (
                <div key={col} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 capitalize">{col.replace("_", " ")}</span>
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                  <Select defaultValue={col}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value={col}>{col}</SelectItem></SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-white/10 text-slate-300" onClick={() => { setFile(null); setStep("upload"); }}>Back</Button>
              <Button className="flex-1" onClick={() => setStep("done")}>Import</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Import Complete</h2>
            <p className="text-sm text-slate-400">{file?.name} imported successfully</p>
            <Button onClick={() => { setFile(null); setStep("upload"); }}>Import Another</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
