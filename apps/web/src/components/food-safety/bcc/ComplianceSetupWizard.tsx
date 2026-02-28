import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, ChevronRight, ChevronLeft, Check, FileText, Users, LayoutGrid, Building2 } from "lucide-react";
import { toast } from "sonner";
import SectionToggles from "./SectionToggles";
import { BCC_SECTIONS } from "@/hooks/useBCCCompliance";
import type { ComplianceProfile, FoodSafetySupervisor } from "@/hooks/useBCCCompliance";
import { addYears, format } from "date-fns";

interface Props {
  onComplete: () => void;
  upsertProfile: (data: Partial<ComplianceProfile>) => Promise<void>;
  upsertSupervisor: (data: Partial<FoodSafetySupervisor>) => Promise<void>;
  bulkSetSectionToggles: (toggles: Record<string, boolean>) => Promise<void>;
  isHomeCook?: boolean;
}

const STEPS = [
  { label: "Licence", icon: FileText },
  { label: "Category", icon: Building2 },
  { label: "FSS", icon: Users },
  { label: "Program", icon: Shield },
  { label: "Sections", icon: LayoutGrid },
];

export default function ComplianceSetupWizard({ onComplete, upsertProfile, upsertSupervisor, bulkSetSectionToggles, isHomeCook }: Props) {
  const [step, setStep] = useState(0);

  // Step 1 — Licence
  const [licenceNumber, setLicenceNumber] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("");
  const [licenceDisplayed, setLicenceDisplayed] = useState(false);

  // Step 2 — Category
  const [category, setCategory] = useState<"category_1" | "category_2">("category_1");

  // Step 3 — FSS
  const [fssName, setFssName] = useState("");
  const [fssCertNumber, setFssCertNumber] = useState("");
  const [fssCertDate, setFssCertDate] = useState("");
  const [fssNotifiedCouncil, setFssNotifiedCouncil] = useState(false);

  // Step 4 — Program
  const [hasFSP, setHasFSP] = useState(false);
  const [auditorName, setAuditorName] = useState("");

  // Step 5 — Sections
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    BCC_SECTIONS.forEach((s) => {
      map[s.key] = isHomeCook ? (s.homeCookDefault ?? s.defaultOn) : s.defaultOn;
    });
    return map;
  });

  const fssExpiry = fssCertDate ? format(addYears(new Date(fssCertDate), 5), "yyyy-MM-dd") : "";

  const handleFinish = async () => {
    try {
      await upsertProfile({
        bcc_licence_number: licenceNumber || null,
        licence_expiry: licenceExpiry || null,
        licence_displayed: licenceDisplayed,
        business_category: category,
        food_safety_program_accredited: hasFSP,
        food_safety_program_auditor: auditorName || null,
      });

      if (fssName.trim()) {
        await upsertSupervisor({
          name: fssName,
          certificate_number: fssCertNumber || null,
          certificate_date: fssCertDate || null,
          certificate_expiry: fssExpiry || null,
          notified_council: fssNotifiedCouncil,
          is_primary: true,
        });
      }

      await bulkSetSectionToggles(toggles);
      toast.success("BCC Eat Safe compliance profile created!");
      onComplete();
    } catch {
      toast.error("Failed to save compliance profile");
    }
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <Card className="max-w-2xl mx-auto border-[#000080]/20">
      <CardHeader className="bg-[#000080] text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          BCC Eat Safe — Compliance Setup
        </CardTitle>
        <CardDescription className="text-white/70">
          Step {step + 1} of {STEPS.length}: {STEPS[step].label}
        </CardDescription>
        {/* Step indicator */}
        <div className="flex gap-1 mt-3">
          {STEPS.map((s, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#FFD700]" : "bg-white/20"}`} />
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6 min-h-[320px]">
        {/* Step 1: Licence */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label>BCC Food Business Licence Number</Label>
              <Input value={licenceNumber} onChange={(e) => setLicenceNumber(e.target.value)} placeholder="e.g. FBL-12345" className="mt-1" />
            </div>
            <div>
              <Label>Licence Expiry Date</Label>
              <Input type="date" value={licenceExpiry} onChange={(e) => setLicenceExpiry(e.target.value)} className="mt-1" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Licence Displayed Prominently?</Label>
                <p className="text-sm text-muted-foreground">Required under A1 — must be visible to customers</p>
              </div>
              <Switch checked={licenceDisplayed} onCheckedChange={setLicenceDisplayed} />
            </div>
          </div>
        )}

        {/* Step 2: Category */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select your business category under FSANZ Standard 3.2.2A</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {([
                { value: "category_1" as const, title: "Category 1", desc: "Full evidence tool required. Includes daily prescribed activity logs, corrective actions, and cleaning records." },
                { value: "category_2" as const, title: "Category 2", desc: "FSS + food handler training only. No daily evidence tool required, but recommended." },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    category === opt.value
                      ? "border-[#000080] bg-[#000080]/5"
                      : "border-border hover:border-[#000080]/40"
                  }`}
                >
                  <p className="font-semibold flex items-center gap-2">
                    {category === opt.value && <Check className="w-4 h-4 text-[#000080]" />}
                    {opt.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: FSS */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Food Safety Supervisor Name</Label>
              <Input value={fssName} onChange={(e) => setFssName(e.target.value)} placeholder="Full name" className="mt-1" />
            </div>
            <div>
              <Label>RTO Certificate Number</Label>
              <Input value={fssCertNumber} onChange={(e) => setFssCertNumber(e.target.value)} placeholder="Certificate #" className="mt-1" />
            </div>
            <div>
              <Label>Certificate Date</Label>
              <Input type="date" value={fssCertDate} onChange={(e) => setFssCertDate(e.target.value)} className="mt-1" />
            </div>
            {fssExpiry && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm">
                  <span className="font-medium">Auto-calculated expiry:</span>{" "}
                  <Badge variant="outline">{format(new Date(fssExpiry), "dd MMM yyyy")}</Badge>
                  <span className="text-muted-foreground ml-1">(5 years from cert date)</span>
                </p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <Label>Notified to Council?</Label>
                <p className="text-sm text-muted-foreground">Required under A7</p>
              </div>
              <Switch checked={fssNotifiedCouncil} onCheckedChange={setFssNotifiedCouncil} />
            </div>
          </div>
        )}

        {/* Step 4: Program */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Accredited Food Safety Program?</Label>
                <p className="text-sm text-muted-foreground">Required for some business types (A9)</p>
              </div>
              <Switch checked={hasFSP} onCheckedChange={setHasFSP} />
            </div>
            {hasFSP && (
              <div>
                <Label>Auditor Name</Label>
                <Input value={auditorName} onChange={(e) => setAuditorName(e.target.value)} placeholder="Auditing body / person" className="mt-1" />
              </div>
            )}
          </div>
        )}

        {/* Step 5: Section Toggles */}
        {step === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose which BCC compliance sections apply to your operation. You can change these any time.</p>
            <Separator />
            <SectionToggles
              toggles={toggles}
              onChange={(key, val) => setToggles((prev) => ({ ...prev, [key]: val }))}
              compact
            />
          </div>
        )}
      </CardContent>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 pb-6">
        <Button variant="outline" onClick={prev} disabled={step === 0}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="bg-[#000080] hover:bg-[#000080]/90 text-white">
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleFinish} className="bg-[#000080] hover:bg-[#000080]/90 text-white">
            <Check className="w-4 h-4 mr-1" /> Complete Setup
          </Button>
        )}
      </div>
    </Card>
  );
}
