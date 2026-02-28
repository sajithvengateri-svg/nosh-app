import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Plus, Trash2, Calculator } from "lucide-react";

interface SettingsRow {
  id: string;
  plan_tier: string;
  reward_type: string;
  reward_value_percent: number;
  reward_value_credit: number;
  referred_reward_value_percent: number;
  referred_reward_value_credit: number;
  milestone_thresholds: any[];
  reward_cap: number | null;
  qualification_event: string;
  active: boolean;
}

const AdminReferralSettings = () => {
  const [settings, setSettings] = useState<SettingsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("referral_settings").select("*").order("plan_tier");
      setSettings((data || []) as any);
      setLoading(false);
    };
    fetch();
  }, []);

  const updateField = (id: string, field: string, value: any) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const updateMilestone = (settingId: string, idx: number, field: string, value: number) => {
    setSettings(prev => prev.map(s => {
      if (s.id !== settingId) return s;
      const milestones = [...(s.milestone_thresholds || [])];
      milestones[idx] = { ...milestones[idx], [field]: value };
      return { ...s, milestone_thresholds: milestones };
    }));
  };

  const addMilestone = (settingId: string) => {
    setSettings(prev => prev.map(s => {
      if (s.id !== settingId) return s;
      return { ...s, milestone_thresholds: [...(s.milestone_thresholds || []), { threshold: 0, bonus: 0 }] };
    }));
  };

  const removeMilestone = (settingId: string, idx: number) => {
    setSettings(prev => prev.map(s => {
      if (s.id !== settingId) return s;
      const milestones = [...(s.milestone_thresholds || [])];
      milestones.splice(idx, 1);
      return { ...s, milestone_thresholds: milestones };
    }));
  };

  const handleSave = async (setting: SettingsRow) => {
    setSaving(true);
    const { error } = await supabase.from("referral_settings").update({
      reward_type: setting.reward_type,
      reward_value_percent: setting.reward_value_percent,
      reward_value_credit: setting.reward_value_credit,
      referred_reward_value_percent: setting.referred_reward_value_percent,
      referred_reward_value_credit: setting.referred_reward_value_credit,
      milestone_thresholds: setting.milestone_thresholds,
      reward_cap: setting.reward_cap,
      qualification_event: setting.qualification_event,
      active: setting.active,
      updated_at: new Date().toISOString(),
    }).eq("id", setting.id);
    setSaving(false);
    if (error) toast.error("Failed to save");
    else toast.success(`${setting.plan_tier} settings saved`);
  };

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referral Settings</h1>
        <p className="text-sm text-muted-foreground">Configure rewards per plan tier.</p>
      </div>

      <Tabs defaultValue={settings[0]?.plan_tier || "home_cook"}>
        <TabsList>
          {settings.map(s => (
            <TabsTrigger key={s.id} value={s.plan_tier} className="capitalize">{s.plan_tier.replace(/_/g, " ")}</TabsTrigger>
          ))}
        </TabsList>

        {settings.map(s => (
          <TabsContent key={s.id} value={s.plan_tier} className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Program Active</Label>
                  <Switch checked={s.active} onCheckedChange={v => updateField(s.id, "active", v)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Reward Type</Label>
                    <Select value={s.reward_type} onValueChange={v => updateField(s.id, "reward_type", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percentage</SelectItem>
                        <SelectItem value="credit">Fixed Credit</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Qualification Event</Label>
                    <Select value={s.qualification_event} onValueChange={v => updateField(s.id, "qualification_event", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="first_paid_invoice">First Paid Invoice</SelectItem>
                        <SelectItem value="trial_start">Trial Start</SelectItem>
                        <SelectItem value="sign_up">Sign Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label>Referrer %</Label>
                    <Input type="number" value={s.reward_value_percent} onChange={e => updateField(s.id, "reward_value_percent", Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Referrer Credit $</Label>
                    <Input type="number" value={s.reward_value_credit} onChange={e => updateField(s.id, "reward_value_credit", Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Referred %</Label>
                    <Input type="number" value={s.referred_reward_value_percent} onChange={e => updateField(s.id, "referred_reward_value_percent", Number(e.target.value))} />
                  </div>
                  <div>
                    <Label>Referred Credit $</Label>
                    <Input type="number" value={s.referred_reward_value_credit} onChange={e => updateField(s.id, "referred_reward_value_credit", Number(e.target.value))} />
                  </div>
                </div>

                <div>
                  <Label>Reward Cap ($/month)</Label>
                  <Input type="number" value={s.reward_cap || ""} onChange={e => updateField(s.id, "reward_cap", e.target.value ? Number(e.target.value) : null)} placeholder="No cap" className="max-w-xs" />
                </div>

                {/* Milestones */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Milestone Bonuses</Label>
                    <Button size="sm" variant="outline" onClick={() => addMilestone(s.id)}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                  </div>
                  {(s.milestone_thresholds || []).map((m: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input type="number" placeholder="Referrals" value={m.threshold} onChange={e => updateMilestone(s.id, i, "threshold", Number(e.target.value))} className="w-32" />
                      <span className="text-sm text-muted-foreground">referrals →</span>
                      <Input type="number" placeholder="Bonus $" value={m.bonus} onChange={e => updateMilestone(s.id, i, "bonus", Number(e.target.value))} className="w-32" />
                      <Button size="icon" variant="ghost" onClick={() => removeMilestone(s.id, i)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                </div>

                {/* Margin Calculator */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Margin Impact</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cost per referral</p>
                        <p className="font-bold text-foreground">${(Number(s.reward_value_credit) + Number(s.referred_reward_value_credit)).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Est. CPA</p>
                        <p className="font-bold text-foreground">${((Number(s.reward_value_credit) + Number(s.referred_reward_value_credit)) * 3).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Break-even subs</p>
                        <p className="font-bold text-foreground">{s.reward_value_credit > 0 ? Math.ceil(100 / Number(s.reward_value_credit)) : "∞"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={() => handleSave(s)} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" /> Save {s.plan_tier.replace(/_/g, " ")} Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminReferralSettings;
