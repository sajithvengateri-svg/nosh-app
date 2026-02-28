import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "pending" | "processing" | "complete" | "failed";
  documentType?: string;
  confidence?: number;
  extractedFields?: number;
}

const DOC_TYPES = [
  { label: "Xero / MYOB P&L", value: "XERO_PL", icon: "📊" },
  { label: "Payslip", value: "PAYSLIP", icon: "💰" },
  { label: "Roster", value: "ROSTER", icon: "📅" },
  { label: "Bank Statement", value: "BANK_STATEMENT", icon: "🏦" },
  { label: "Supplier Invoice", value: "SUPPLIER_INVOICE", icon: "🧾" },
  { label: "BAS Statement", value: "BAS", icon: "📋" },
  { label: "Lease Agreement", value: "LEASE", icon: "🏠" },
];

const QuietDocumentUpload = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      status: "pending" as const,
      documentType: detectDocType(f.name),
    }));
    setFiles(prev => [...prev, ...newFiles]);

    // Simulate processing
    newFiles.forEach(file => {
      setTimeout(() => {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: "processing" } : f));
      }, 500);
      setTimeout(() => {
        setFiles(prev => prev.map(f => f.id === file.id ? {
          ...f, status: "complete", confidence: 0.85 + Math.random() * 0.12, extractedFields: 8 + Math.floor(Math.random() * 12),
        } : f));
      }, 2000 + Math.random() * 2000);
    });
  }, []);

  const detectDocType = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes("xero") || lower.includes("myob") || lower.includes("p&l") || lower.includes("pnl")) return "XERO_PL";
    if (lower.includes("payslip") || lower.includes("pay")) return "PAYSLIP";
    if (lower.includes("roster") || lower.includes("schedule")) return "ROSTER";
    if (lower.includes("bank") || lower.includes("statement")) return "BANK_STATEMENT";
    if (lower.includes("invoice")) return "SUPPLIER_INVOICE";
    if (lower.includes("bas")) return "BAS";
    if (lower.includes("lease")) return "LEASE";
    return "OTHER";
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));
  const completedCount = files.filter(f => f.status === "complete").length;
  const processingCount = files.filter(f => f.status === "processing").length;

  return (
    <div className="p-3 lg:p-5 space-y-4 max-w-[900px] mx-auto">
      <div>
        <h1 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
          <Upload className="w-5 h-5 text-indigo-500" /> Document Upload
        </h1>
        <p className="text-xs text-muted-foreground">Upload financial documents for AI-powered data extraction</p>
      </div>

      {/* Supported Doc Types */}
      <div className="flex gap-2 flex-wrap">
        {DOC_TYPES.map(dt => (
          <Badge key={dt.value} variant="outline" className="text-[10px] gap-1">
            {dt.icon} {dt.label}
          </Badge>
        ))}
      </div>

      {/* Drop Zone */}
      <Card className={cn("border-2 border-dashed transition-colors cursor-pointer",
        dragOver ? "border-indigo-500 bg-indigo-500/5" : "border-border hover:border-muted-foreground"
      )}>
        <CardContent className="p-8 text-center"
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onClick={() => {
            const input = document.createElement("input");
            input.type = "file"; input.multiple = true;
            input.accept = ".pdf,.csv,.xlsx,.xls,.jpg,.png,.jpeg";
            input.onchange = () => input.files && addFiles(input.files);
            input.click();
          }}
        >
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, CSV, Excel, Images · Max 20MB per file</p>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Uploaded Files ({completedCount}/{files.length} processed)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/50 bg-muted/30">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[8px] h-4 px-1">{file.documentType}</Badge>
                    <span className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)}KB</span>
                    {file.confidence && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1 text-emerald-500">{(file.confidence * 100).toFixed(0)}% confidence</Badge>
                    )}
                    {file.extractedFields && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1">{file.extractedFields} fields</Badge>
                    )}
                  </div>
                </div>
                {file.status === "processing" && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                {file.status === "complete" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {file.status === "failed" && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(file.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {completedCount > 0 && processingCount === 0 && (
        <div className="flex gap-2">
          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={() => {
            toast.success("Documents merged with audit data");
            navigate("/quiet/report");
          }}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Merge & Generate Score
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuietDocumentUpload;
