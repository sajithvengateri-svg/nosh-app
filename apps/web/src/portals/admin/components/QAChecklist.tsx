import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  MessageSquare,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

export interface QAItem {
  id: string;
  label: string;
  expected?: string;
}

export interface QASubsection {
  title: string;
  items: QAItem[];
}

export interface QASection {
  title: string;
  subsections: QASubsection[];
}

interface CheckState {
  checked: Record<string, boolean>;
  notes: Record<string, string>;
}

interface Props {
  title: string;
  icon: React.ReactNode;
  sections: QASection[];
  storageKey: string;
}

// ── Helpers ───────────────────────────────────────────────────────────

function getProgressColor(pct: number) {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getProgressTextColor(pct: number) {
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 50) return "text-amber-600";
  return "text-red-600";
}

// ── Component ─────────────────────────────────────────────────────────

export function QAChecklist({ title, icon, sections, storageKey }: Props) {
  const [state, setState] = useState<CheckState>({ checked: {}, notes: {} });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>({});

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, [storageKey]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state, storageKey]);

  // All item IDs
  const allItems = useMemo(() => {
    const items: QAItem[] = [];
    sections.forEach((s) => s.subsections.forEach((ss) => items.push(...ss.items)));
    return items;
  }, [sections]);

  const totalCount = allItems.length;
  const checkedCount = allItems.filter((i) => state.checked[i.id]).length;
  const overallPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const toggleCheck = (id: string) => {
    setState((prev) => ({
      ...prev,
      checked: { ...prev.checked, [id]: !prev.checked[id] },
    }));
  };

  const setNote = (id: string, note: string) => {
    setState((prev) => ({
      ...prev,
      notes: { ...prev.notes, [id]: note },
    }));
  };

  const resetAll = () => {
    setState({ checked: {}, notes: {} });
    localStorage.removeItem(storageKey);
  };

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleNoteField = (id: string) => {
    setShowNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Section stats
  const getSectionStats = (section: QASection) => {
    let total = 0;
    let done = 0;
    section.subsections.forEach((ss) => {
      ss.items.forEach((item) => {
        total++;
        if (state.checked[item.id]) done++;
      });
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            {icon}
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">
            {checkedCount} of {totalCount} tests completed
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Overall percentage */}
          <div className="text-right">
            <div className={`text-4xl font-bold ${getProgressTextColor(overallPct)}`}>
              {overallPct}%
            </div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all checkboxes and notes for this page. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetAll}>Reset All</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getProgressColor(overallPct)}`}
          initial={{ width: 0 }}
          animate={{ width: `${overallPct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Sections */}
      {sections.map((section, si) => {
        const stats = getSectionStats(section);
        const sectionKey = `s-${si}`;
        const isCollapsed = collapsed[sectionKey];

        return (
          <motion.div
            key={sectionKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.05 }}
          >
            <Card>
              <CardHeader
                className="cursor-pointer select-none"
                onClick={() => toggleCollapse(sectionKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${getProgressTextColor(stats.pct)}`}>
                      {stats.done}/{stats.total}
                    </span>
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${getProgressColor(stats.pct)}`}
                        style={{ width: `${stats.pct}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold w-10 text-right ${getProgressTextColor(stats.pct)}`}>
                      {stats.pct}%
                    </span>
                  </div>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="space-y-6 pt-0">
                  {section.subsections.map((sub, ssi) => (
                    <div key={`${sectionKey}-${ssi}`}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        {sub.title}
                      </h3>
                      <div className="space-y-1">
                        {sub.items.map((item) => {
                          const isChecked = !!state.checked[item.id];
                          const noteVisible = !!showNotes[item.id];
                          const hasNote = !!state.notes[item.id]?.trim();

                          return (
                            <div key={item.id}>
                              <div
                                className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-colors ${
                                  isChecked
                                    ? "bg-emerald-50 dark:bg-emerald-950/20"
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleCheck(item.id)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <span
                                    className={`text-sm ${
                                      isChecked
                                        ? "line-through text-muted-foreground"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                  {item.expected && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      — {item.expected}
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => toggleNoteField(item.id)}
                                  className={`p-1 rounded hover:bg-muted ${
                                    hasNote ? "text-blue-500" : "text-muted-foreground/40"
                                  }`}
                                  title="Add note"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {noteVisible && (
                                <div className="ml-9 mb-2">
                                  <Input
                                    placeholder="Add a note..."
                                    value={state.notes[item.id] || ""}
                                    onChange={(e) => setNote(item.id, e.target.value)}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
