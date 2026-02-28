import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Star, Plus, Award, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useEmirateDetection } from "@/hooks/useEmirateDetection";
import { getDMGrade, getADFSAStars, formatAED, DM_GRADES, ADAFSA_STARS } from "@/lib/shared/gccConfig";
import { format, parseISO } from "date-fns";

interface InspectionGrade {
  id: string;
  inspection_date: string;
  grade_type: string;
  grade_value: string;
  score_percent: number | null;
  critical_violations: number;
  major_violations: number;
  minor_violations: number;
  fine_amount_aed: number;
  closure_ordered: boolean;
  inspector_name: string | null;
  notes: string | null;
}

export default function GCCInspectionGrades() {
  const orgId = useOrgId();
  const { emirate, config } = useEmirateDetection();
  const [grades, setGrades] = useState<InspectionGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form
  const [inspDate, setInspDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [inspector, setInspector] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [scorePercent, setScorePercent] = useState("");
  const [critCount, setCritCount] = useState("0");
  const [majorCount, setMajorCount] = useState("0");
  const [minorCount, setMinorCount] = useState("0");
  const [fineAmount, setFineAmount] = useState("0");
  const [closureOrdered, setClosureOrdered] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("gcc_inspection_grades" as any)
      .select("*")
      .eq("org_id", orgId)
      .order("inspection_date", { ascending: false })
      .then(({ data }) => {
        if (data) setGrades(data as any as InspectionGrade[]);
        setLoading(false);
      });
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId || !gradeValue) return;
    setSaving(true);

    const { error } = await supabase.from("gcc_inspection_grades" as any).insert({
      org_id: orgId,
      emirate,
      inspection_date: inspDate,
      inspector_name: inspector || null,
      grade_type: config.gradingSystem === "letter" ? "letter" : config.gradingSystem === "star" ? "star" : "pass_fail",
      grade_value: gradeValue,
      score_percent: scorePercent ? parseFloat(scorePercent) : null,
      critical_violations: parseInt(critCount) || 0,
      major_violations: parseInt(majorCount) || 0,
      minor_violations: parseInt(minorCount) || 0,
      fine_amount_aed: parseFloat(fineAmount) || 0,
      closure_ordered: closureOrdered,
      notes: notes || null,
    } as any);

    if (error) {
      toast.error("Failed to save inspection record");
    } else {
      toast.success("Inspection grade recorded");
      setShowAdd(false);
      resetForm();
      const { data } = await supabase
        .from("gcc_inspection_grades" as any)
        .select("*")
        .eq("org_id", orgId)
        .order("inspection_date", { ascending: false });
      if (data) setGrades(data as any as InspectionGrade[]);
    }
    setSaving(false);
  };

  const resetForm = () => {
    setInspDate(format(new Date(), "yyyy-MM-dd"));
    setInspector(""); setGradeValue(""); setScorePercent("");
    setCritCount("0"); setMajorCount("0"); setMinorCount("0");
    setFineAmount("0"); setClosureOrdered(false); setNotes("");
  };

  const latestGrade = grades[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold">Inspection Grades</h2>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="bg-emerald-700 hover:bg-emerald-700/90 text-white">
          <Plus className="w-4 h-4 mr-1" /> Record Inspection
        </Button>
      </div>

      {/* Current grade display */}
      {latestGrade && (
        <Card className="border-2" style={{
          borderColor: config.gradingSystem === "letter"
            ? getDMGrade(latestGrade.score_percent ?? 0).color
            : config.gradingSystem === "star"
            ? getADFSAStars(latestGrade.score_percent ?? 0).color
            : "#22c55e"
        }}>
          <CardContent className="py-6 text-center">
            {config.gradingSystem === "letter" ? (
              <>
                <div className="text-6xl font-black" style={{ color: getDMGrade(latestGrade.score_percent ?? 0).color }}>
                  {latestGrade.grade_value}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Dubai Municipality Grade — {getDMGrade(latestGrade.score_percent ?? 0).label}
                </p>
                {latestGrade.score_percent && (
                  <p className="text-xs text-muted-foreground">{latestGrade.score_percent}%</p>
                )}
              </>
            ) : config.gradingSystem === "star" ? (
              <>
                <div className="flex justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-8 h-8"
                      fill={i < parseInt(latestGrade.grade_value) ? "#f59e0b" : "transparent"}
                      stroke={i < parseInt(latestGrade.grade_value) ? "#f59e0b" : "#a1a1aa"}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  ADAFSA Rating — {getADFSAStars(latestGrade.score_percent ?? 0).label}
                </p>
              </>
            ) : (
              <div className="text-4xl font-black" style={{ color: latestGrade.grade_value === "pass" ? "#22c55e" : "#ef4444" }}>
                {latestGrade.grade_value.toUpperCase()}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Last inspected: {format(parseISO(latestGrade.inspection_date), "dd MMM yyyy")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading grades...</div>
      ) : grades.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No inspection records yet.</p>
            <p className="text-xs mt-1">Record your municipality inspection results here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-muted-foreground uppercase">Inspection History</h3>
          {grades.map((g) => (
            <Card key={g.id}>
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{format(parseISO(g.inspection_date), "dd MMM yyyy")}</p>
                  {g.inspector_name && <p className="text-xs text-muted-foreground">Inspector: {g.inspector_name}</p>}
                  <div className="flex gap-2 mt-1">
                    {g.critical_violations > 0 && <Badge variant="destructive" className="text-[10px]">{g.critical_violations} Critical</Badge>}
                    {g.major_violations > 0 && <Badge variant="secondary" className="text-[10px]">{g.major_violations} Major</Badge>}
                    {g.minor_violations > 0 && <Badge variant="outline" className="text-[10px]">{g.minor_violations} Minor</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black" style={{
                    color: config.gradingSystem === "letter"
                      ? getDMGrade(g.score_percent ?? 0).color
                      : config.gradingSystem === "star"
                      ? getADFSAStars(g.score_percent ?? 0).color
                      : (g.grade_value === "pass" ? "#22c55e" : "#ef4444")
                  }}>
                    {config.gradingSystem === "star" ? `${g.grade_value}★` : g.grade_value.toUpperCase()}
                  </div>
                  {g.fine_amount_aed > 0 && (
                    <p className="text-xs text-red-600 font-mono">{formatAED(g.fine_amount_aed)}</p>
                  )}
                  {g.closure_ordered && (
                    <Badge variant="destructive" className="text-[10px] mt-1">CLOSURE</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Record Inspection Result
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Inspection Date *</Label>
                <Input type="date" value={inspDate} onChange={(e) => setInspDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Inspector Name</Label>
                <Input value={inspector} onChange={(e) => setInspector(e.target.value)} placeholder="Name" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Grade *</Label>
                <Select value={gradeValue} onValueChange={setGradeValue}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {config.gradingSystem === "letter" ? (
                      DM_GRADES.map((g) => (
                        <SelectItem key={g.grade} value={g.grade}>{g.grade} — {g.label}</SelectItem>
                      ))
                    ) : config.gradingSystem === "star" ? (
                      ADAFSA_STARS.map((s) => (
                        <SelectItem key={s.stars} value={String(s.stars)}>{s.stars}★ — {s.label}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Score %</Label>
                <Input type="number" min="0" max="100" value={scorePercent} onChange={(e) => setScorePercent(e.target.value)} placeholder="e.g. 87" className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Critical</Label>
                <Input type="number" min="0" value={critCount} onChange={(e) => setCritCount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Major</Label>
                <Input type="number" min="0" value={majorCount} onChange={(e) => setMajorCount(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Minor</Label>
                <Input type="number" min="0" value={minorCount} onChange={(e) => setMinorCount(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fine Amount (AED)</Label>
                <Input type="number" min="0" value={fineAmount} onChange={(e) => setFineAmount(e.target.value)} className="mt-1" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={closureOrdered} onChange={(e) => setClosureOrdered(e.target.checked)} className="rounded" />
                  Closure Ordered
                </label>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Inspector notes, action items..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !gradeValue} className="bg-emerald-700 hover:bg-emerald-700/90 text-white">
              {saving ? "Saving…" : "Save Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
