import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UserPlus, Briefcase, Building, Shield } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { useUpsertEmployeeProfile } from "@/lib/shared/queries/labourQueries";
import { toast } from "sonner";

const CLASSIFICATIONS = [
  "FB_INTRO", "FB_1", "FB_2", "FB_3", "FB_4", "FB_5",
  "K_INTRO", "K_1", "K_2", "K_3",
  "COOK_1", "COOK_2", "COOK_3", "COOK_4", "COOK_5",
];

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CASUAL"];
const PAY_TYPES = ["AWARD_HOURLY", "AWARD_ANNUALISED", "ABOVE_AWARD_SALARY"];
const AWARDS = ["MA000009", "MA000119"];
const SECTIONS = ["KITCHEN", "BAR", "FOH"];

const LabourEmployeeNew = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const upsert = useUpsertEmployeeProfile();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    user_id: crypto.randomUUID(),
    employment_type: "FULL_TIME",
    pay_type: "AWARD_HOURLY",
    classification: "COOK_1",
    award_code: "MA000009",
    annual_salary: "",
    agreed_hours_per_week: "38",
    start_date: new Date().toISOString().split("T")[0],
    section_tags: [] as string[],
    date_of_birth: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    bank_bsb: "",
    bank_account_number: "",
    bank_account_name: "",
    super_fund_name: "",
    super_fund_usi: "",
    super_member_number: "",
    supplies_own_tools: false,
    is_first_aid_officer: false,
    notes: "",
  });

  const update = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleSection = (s: string) => {
    setForm(prev => ({
      ...prev,
      section_tags: prev.section_tags.includes(s)
        ? prev.section_tags.filter(x => x !== s)
        : [...prev.section_tags, s],
    }));
  };

  const handleSubmit = () => {
    if (!orgId) return;
    upsert.mutate({
      org_id: orgId,
      user_id: form.user_id,
      employment_type: form.employment_type,
      pay_type: form.pay_type,
      classification: form.classification,
      award_code: form.award_code,
      annual_salary: form.annual_salary ? Number(form.annual_salary) : null,
      agreed_hours_per_week: Number(form.agreed_hours_per_week) || null,
      start_date: form.start_date,
      section_tags: form.section_tags,
      date_of_birth: form.date_of_birth || null,
      address: form.address || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      bank_bsb: form.bank_bsb || null,
      bank_account_number: form.bank_account_number || null,
      bank_account_name: form.bank_account_name || null,
      super_fund_name: form.super_fund_name || null,
      super_fund_usi: form.super_fund_usi || null,
      super_member_number: form.super_member_number || null,
      supplies_own_tools: form.supplies_own_tools,
      is_first_aid_officer: form.is_first_aid_officer,
      notes: form.notes || null,
    }, {
      onSuccess: () => {
        toast.success("Employee onboarded successfully");
        navigate("/labour/employees");
      },
      onError: (err: any) => toast.error(err.message || "Failed to onboard employee"),
    });
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/labour/employees")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Onboard Employee</h1>
          <p className="text-muted-foreground text-sm">Step {step} of 3</p>
        </div>
      </div>

      {/* Step 1: Employment Details */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Employment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={form.employment_type} onValueChange={v => update("employment_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pay Type</Label>
                <Select value={form.pay_type} onValueChange={v => update("pay_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAY_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Classification</Label>
                <Select value={form.classification} onValueChange={v => update("classification", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATIONS.map(c => <SelectItem key={c} value={c}>{c.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Award</Label>
                <Select value={form.award_code} onValueChange={v => update("award_code", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AWARDS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => update("start_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Agreed Hours/Week</Label>
                <Input type="number" value={form.agreed_hours_per_week} onChange={e => update("agreed_hours_per_week", e.target.value)} />
              </div>
            </div>

            {form.pay_type === "ABOVE_AWARD_SALARY" && (
              <div className="space-y-2">
                <Label>Annual Salary ($)</Label>
                <Input type="number" value={form.annual_salary} onChange={e => update("annual_salary", e.target.value)} placeholder="e.g. 65000" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Sections</Label>
              <div className="flex gap-2">
                {SECTIONS.map(s => (
                  <Button key={s} variant={form.section_tags.includes(s) ? "default" : "outline"} size="sm" onClick={() => toggleSection(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={form.supplies_own_tools} onCheckedChange={v => update("supplies_own_tools", v)} />
                <Label>Supplies own tools/knives</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_first_aid_officer} onCheckedChange={v => update("is_first_aid_officer", v)} />
                <Label>First Aid Officer</Label>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Next: Personal Details →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Personal Details */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.date_of_birth} onChange={e => update("date_of_birth", e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="Street, suburb, state, postcode" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emergency Contact Name</Label>
                <Input value={form.emergency_contact_name} onChange={e => update("emergency_contact_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Emergency Contact Phone</Label>
                <Input value={form.emergency_contact_phone} onChange={e => update("emergency_contact_phone", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} placeholder="Optional notes..." />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)}>Next: Bank & Super →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Bank & Super */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="w-4 h-4" /> Bank & Superannuation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>BSB</Label>
                <Input value={form.bank_bsb} onChange={e => update("bank_bsb", e.target.value)} placeholder="000-000" />
              </div>
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={form.bank_account_number} onChange={e => update("bank_account_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input value={form.bank_account_name} onChange={e => update("bank_account_name", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Super Fund Name</Label>
                <Input value={form.super_fund_name} onChange={e => update("super_fund_name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>USI</Label>
                <Input value={form.super_fund_usi} onChange={e => update("super_fund_usi", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Member Number</Label>
                <Input value={form.super_member_number} onChange={e => update("super_member_number", e.target.value)} />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={handleSubmit} disabled={upsert.isPending}>
                {upsert.isPending ? "Saving..." : "Onboard Employee"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LabourEmployeeNew;
