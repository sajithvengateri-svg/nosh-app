import { useState } from "react";
import { ClipboardList, Check, ChevronRight, User, Building, FileText, Shirt, Shield, GraduationCap, Plus, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrg } from "@/contexts/OrgContext";
import { useOnboardingChecklists, useUpdateChecklist } from "@/lib/shared/queries/peopleQueries";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CHECKLIST_TYPES = [
  { key: "PERSONAL_DETAILS", label: "Personal Details", icon: User, desc: "Name, DOB, address, emergency contacts" },
  { key: "BANK_SUPER", label: "Bank & Super", icon: Building, desc: "Bank account, superannuation fund" },
  { key: "DOCUMENTS", label: "Documents", icon: FileText, desc: "ID, visa, tax declaration" },
  { key: "UNIFORM_TOOLS", label: "Uniform & Tools", icon: Shirt, desc: "Aprons, knives, equipment" },
  { key: "IDENTITY_CHECK", label: "Identity Verification", icon: Shield, desc: "Manager verifies identity/visa" },
  { key: "INDUCTION", label: "Induction", icon: GraduationCap, desc: "Training modules & orientation" },
];

const UNIFORM_ITEMS = ["Apron (x2)", "Chef Jacket", "Kitchen Pants", "Non-slip Shoes", "Knife Set", "Thermometer", "First Aid Cert"];
const SECTIONS = ["KITCHEN", "BAR", "FOH", "MANAGEMENT"];

const PeopleOnboarding = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: checklists, refetch } = useOnboardingChecklists(orgId);
  const updateChecklist = useUpdateChecklist();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [sendingDocPack, setSendingDocPack] = useState<string | null>(null);

  // New employee form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newSection, setNewSection] = useState("KITCHEN");
  const [newClassification, setNewClassification] = useState("LEVEL_1");
  const [newEmploymentType, setNewEmploymentType] = useState("FULL_TIME");
  const [newStartDate, setNewStartDate] = useState("");

  // Step form state
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  // Fetch profiles for display names
  const [profileNames, setProfileNames] = useState<Record<string, string>>({});

  const byUser = (checklists ?? []).reduce((acc: Record<string, any[]>, c: any) => {
    (acc[c.user_id] = acc[c.user_id] || []).push(c);
    return acc;
  }, {});

  // Fetch names for users we haven't loaded yet
  const loadNames = async () => {
    const userIds = Object.keys(byUser).filter(uid => !profileNames[uid]);
    if (!userIds.length) return;
    const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
    if (data) {
      const names: Record<string, string> = { ...profileNames };
      data.forEach(p => { names[p.user_id] = p.full_name || p.user_id.slice(0, 8); });
      setProfileNames(names);
    }
  };
  if (Object.keys(byUser).length && Object.keys(byUser).some(uid => !profileNames[uid])) {
    loadNames();
  }

  const userEntries = Object.entries(byUser);
  const selectedChecklists = selectedUser ? byUser[selectedUser] ?? [] : [];
  const activeChecklist = selectedChecklists.find((c: any) => c.checklist_type === activeStep);

  // Create new employee
  const handleCreateEmployee = async () => {
    if (!orgId || !newName.trim()) return;
    setCreating(true);
    try {
      const userId = crypto.randomUUID();

      // Create profile
      const { error: profErr } = await supabase.from("profiles").insert({
        user_id: userId,
        full_name: newName.trim(),
        email: newEmail.trim() || null,
      });
      if (profErr) throw profErr;

      // Create employee_profiles
      const { error: empErr } = await supabase.from("employee_profiles").insert({
        org_id: orgId,
        user_id: userId,
        employment_type: newEmploymentType,
        pay_type: "AWARD_HOURLY",
        classification: newClassification,
        section_tags: [newSection],
        start_date: newStartDate || new Date().toISOString().split("T")[0],
        is_active: true,
      });
      if (empErr) throw empErr;

      // Create 6 onboarding checklists
      const rows = CHECKLIST_TYPES.map(ct => ({
        org_id: orgId,
        user_id: userId,
        checklist_type: ct.key,
        status: "PENDING",
      }));
      const { error: clErr } = await supabase.from("onboarding_checklists").insert(rows);
      if (clErr) throw clErr;

      // Send welcome email (non-blocking)
      if (newEmail.trim()) {
        supabase.functions.invoke("send-onboarding-email", {
          body: {
            type: "welcome",
            employee_name: newName.trim(),
            employee_email: newEmail.trim(),
            org_name: currentOrg?.name,
            section: newSection,
            start_date: newStartDate,
          },
        }).catch(() => {});
      }

      toast.success(`${newName.trim()} added — onboarding started`);
      setAddDialogOpen(false);
      setNewName(""); setNewEmail(""); setNewSection("KITCHEN"); setNewStartDate("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create employee");
    } finally {
      setCreating(false);
    }
  };

  // Complete step with data persistence
  const completeStep = async (checklistId: string) => {
    try {
      const stepData: Record<string, any> = {};

      if (activeStep === "PERSONAL_DETAILS") {
        Object.assign(stepData, { full_name: formData.full_name, dob: formData.dob, address: formData.address, emergency_name: formData.emergency_name, emergency_phone: formData.emergency_phone });
        // Update employee_profiles too
        if (selectedUser) {
          await supabase.from("employee_profiles").update({
            date_of_birth: formData.dob || null,
            address: formData.address || null,
            emergency_contact_name: formData.emergency_name || null,
            emergency_contact_phone: formData.emergency_phone || null,
          }).eq("user_id", selectedUser).eq("org_id", orgId!);
        }
      } else if (activeStep === "BANK_SUPER") {
        Object.assign(stepData, { bsb: formData.bsb, account_number: formData.account_number, account_name: formData.account_name, super_fund: formData.super_fund, member_number: formData.member_number, usi: formData.usi });
        if (selectedUser) {
          await supabase.from("employee_profiles").update({
            bank_bsb: formData.bsb || null,
            bank_account_number: formData.account_number || null,
            bank_account_name: formData.account_name || null,
            super_fund_name: formData.super_fund || null,
            super_member_number: formData.member_number || null,
            super_fund_usi: formData.usi || null,
          }).eq("user_id", selectedUser).eq("org_id", orgId!);
        }
      } else if (activeStep === "UNIFORM_TOOLS") {
        stepData.issued_items = checkedItems;
      } else if (activeStep === "IDENTITY_CHECK") {
        stepData.verified = checkedItems.includes("id_verified");
      } else if (activeStep === "INDUCTION") {
        stepData.completed_modules = checkedItems;
      }

      await updateChecklist.mutateAsync({
        id: checklistId,
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
        data: stepData,
      });

      toast.success("Step completed");
      setActiveStep(null);
      setFormData({});
      setCheckedItems([]);

      // Check if all 6 steps done -> auto-activate
      await refetch();
      const updatedChecklists = byUser[selectedUser!];
      const allDone = updatedChecklists?.every((c: any) => c.status === "COMPLETED" || c.id === checklistId);
      if (allDone && selectedUser && orgId) {
        await supabase.from("employee_profiles").update({ is_active: true }).eq("user_id", selectedUser).eq("org_id", orgId);
        // Log lifecycle event
        try {
          await supabase.from("employee_lifecycle").insert({
            org_id: orgId,
            user_id: selectedUser,
            event_type: "ONBOARDED",
            event_date: new Date().toISOString().split("T")[0],
            description: "Onboarding completed — employee is now active",
          });
        } catch { /* non-blocking */ }
        toast.success("🎉 Onboarding complete — employee is now active!");
      }
    } catch { toast.error("Failed to update"); }
  };

  // Send document pack
  const handleSendDocPack = async (userId: string) => {
    setSendingDocPack(userId);
    try {
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("user_id", userId).single();
      if (!profile?.email) { toast.error("No email on file"); return; }

      await supabase.functions.invoke("send-onboarding-email", {
        body: {
          type: "document_pack",
          employee_name: profile.full_name,
          employee_email: profile.email,
          org_name: currentOrg?.name,
        },
      });
      toast.success("Document pack sent");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSendingDocPack(null);
    }
  };

  const toggleItem = (item: string) => {
    setCheckedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  // ===== STEP FORM VIEW =====
  if (selectedUser && activeStep) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => { setActiveStep(null); setFormData({}); setCheckedItems([]); }}>← Back to steps</Button>
        <h2 className="text-xl font-bold text-foreground">{CHECKLIST_TYPES.find(c => c.key === activeStep)?.label}</h2>
        <Card>
          <CardContent className="pt-4 space-y-4">
            {activeStep === "PERSONAL_DETAILS" && <>
              <div><Label>Full Name</Label><Input value={formData.full_name || ""} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} placeholder="John Smith" /></div>
              <div><Label>Date of Birth</Label><Input type="date" value={formData.dob || ""} onChange={e => setFormData(p => ({ ...p, dob: e.target.value }))} /></div>
              <div><Label>Address</Label><Input value={formData.address || ""} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Melbourne VIC 3000" /></div>
              <div><Label>Emergency Contact Name</Label><Input value={formData.emergency_name || ""} onChange={e => setFormData(p => ({ ...p, emergency_name: e.target.value }))} /></div>
              <div><Label>Emergency Contact Phone</Label><Input value={formData.emergency_phone || ""} onChange={e => setFormData(p => ({ ...p, emergency_phone: e.target.value }))} /></div>
            </>}
            {activeStep === "BANK_SUPER" && <>
              <div><Label>BSB</Label><Input value={formData.bsb || ""} onChange={e => setFormData(p => ({ ...p, bsb: e.target.value }))} placeholder="000-000" /></div>
              <div><Label>Account Number</Label><Input value={formData.account_number || ""} onChange={e => setFormData(p => ({ ...p, account_number: e.target.value }))} /></div>
              <div><Label>Account Name</Label><Input value={formData.account_name || ""} onChange={e => setFormData(p => ({ ...p, account_name: e.target.value }))} /></div>
              <div><Label>Super Fund Name</Label><Input value={formData.super_fund || ""} onChange={e => setFormData(p => ({ ...p, super_fund: e.target.value }))} /></div>
              <div><Label>Member Number</Label><Input value={formData.member_number || ""} onChange={e => setFormData(p => ({ ...p, member_number: e.target.value }))} /></div>
              <div><Label>USI</Label><Input value={formData.usi || ""} onChange={e => setFormData(p => ({ ...p, usi: e.target.value }))} /></div>
            </>}
            {activeStep === "DOCUMENTS" && <>
              <p className="text-sm text-muted-foreground">Upload identity documents, visa, and tax declaration.</p>
              <div><Label>Document Type</Label><Input placeholder="e.g. Passport, Visa, TFN Declaration" /></div>
              <div><Label>File</Label><Input type="file" /></div>
            </>}
            {activeStep === "UNIFORM_TOOLS" && <div className="space-y-3">
              {UNIFORM_ITEMS.map(item => (
                <div key={item} className="flex items-center gap-3">
                  <Checkbox id={item} checked={checkedItems.includes(item)} onCheckedChange={() => toggleItem(item)} />
                  <Label htmlFor={item} className="text-sm">{item}</Label>
                </div>
              ))}
            </div>}
            {activeStep === "IDENTITY_CHECK" && <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Manager confirms identity documents have been sighted and verified.</p>
              <div className="flex items-center gap-3">
                <Checkbox id="id_verified" checked={checkedItems.includes("id_verified")} onCheckedChange={() => toggleItem("id_verified")} />
                <Label htmlFor="id_verified">I confirm identity has been verified</Label>
              </div>
            </div>}
            {activeStep === "INDUCTION" && <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Complete all required induction modules before starting work.</p>
              {["WHS Orientation", "Food Safety Basics", "Kitchen Tour", "Equipment Training", "Team Introduction"].map(m => (
                <div key={m} className="flex items-center gap-3">
                  <Checkbox id={m} checked={checkedItems.includes(m)} onCheckedChange={() => toggleItem(m)} />
                  <Label htmlFor={m} className="text-sm">{m}</Label>
                </div>
              ))}
            </div>}
            {activeChecklist && (
              <Button className="w-full" onClick={() => completeStep(activeChecklist.id)} disabled={updateChecklist.isPending}>
                <Check className="w-4 h-4 mr-2" />Mark Complete
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== STEP LIST VIEW =====
  if (selectedUser) {
    const doneCount = selectedChecklists.filter((c: any) => c.status === "COMPLETED").length;
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>← Back</Button>
          <Button variant="outline" size="sm" onClick={() => handleSendDocPack(selectedUser)} disabled={sendingDocPack === selectedUser}>
            <Send className="w-4 h-4 mr-2" />{sendingDocPack === selectedUser ? "Sending…" : "Send Doc Pack"}
          </Button>
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{profileNames[selectedUser] || "Employee"} — Onboarding</h2>
          <Progress value={(doneCount / 6) * 100} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-1">{doneCount}/6 completed</p>
        </div>
        <div className="space-y-3">
          {CHECKLIST_TYPES.map(ct => {
            const cl = selectedChecklists.find((c: any) => c.checklist_type === ct.key);
            const done = cl?.status === "COMPLETED";
            return (
              <Card key={ct.key} className={`cursor-pointer transition-colors ${done ? "opacity-60" : "hover:bg-muted/50"}`} onClick={() => !done && setActiveStep(ct.key)}>
                <CardContent className="pt-4 flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${done ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                    {done ? <Check className="w-5 h-5" /> : <ct.icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1"><p className="text-sm font-medium text-foreground">{ct.label}</p><p className="text-xs text-muted-foreground">{ct.desc}</p></div>
                  {!done && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== HUB VIEW =====
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Onboarding Hub</h1><p className="text-sm text-muted-foreground">Employees currently being onboarded</p></div>
        <Button onClick={() => setAddDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />New Employee</Button>
      </div>

      {userEntries.length > 0 ? (
        <div className="space-y-3">
          {userEntries.map(([uid, items]) => {
            const done = items.filter((i: any) => i.status === "COMPLETED").length;
            return (
              <Card key={uid} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSelectedUser(uid)}>
                <CardContent className="pt-4 flex items-center gap-4">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{profileNames[uid] || uid.slice(0, 8) + "…"}</p>
                    <Progress value={(done / 6) * 100} className="h-1.5 mt-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={done === 6 ? "default" : "secondary"}>{done}/6</Badge>
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={e => { e.stopPropagation(); handleSendDocPack(uid); }} disabled={sendingDocPack === uid}>
                      <Send className="w-3 h-3" />
                    </Button>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><CardContent className="pt-8 pb-8 text-center">
          <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No active onboarding. Click "New Employee" to start.</p>
        </CardContent></Card>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Full Name *</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Smith" /></div>
            <div><Label>Email</Label><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@example.com" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Section</Label>
                <Select value={newSection} onValueChange={setNewSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select value={newEmploymentType} onValueChange={setNewEmploymentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CASUAL">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Classification</Label>
                <Select value={newClassification} onValueChange={setNewClassification}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["LEVEL_1","LEVEL_2","LEVEL_3","LEVEL_4","LEVEL_5","LEVEL_6"].map(l => <SelectItem key={l} value={l}>{l.replace("_"," ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEmployee} disabled={creating || !newName.trim()}>{creating ? "Creating…" : "Add & Start Onboarding"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeopleOnboarding;
