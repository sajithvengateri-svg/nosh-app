import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  Bell,
  Save,
  ShieldAlert,
  PackageSearch,
  TrendingDown,
  ToggleLeft,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAppSettings, AppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";

const feedbackToggles: {
  key: keyof AppSettings;
  label: string;
  description: string;
  icon: React.ReactNode;
  group: "input" | "alerts";
}[] = [
  {
    key: "inputValidationFeedback",
    label: "Input Validation Feedback",
    description: "Show green ✓ / red ✗ icons and border colours on form inputs",
    icon: <CheckCircle2 className="w-4 h-4" />,
    group: "input",
  },
  {
    key: "saveButtonFeedback",
    label: "Save Button Status",
    description: "Show inline Saved / Failed indicator next to save buttons",
    icon: <Save className="w-4 h-4" />,
    group: "input",
  },
  {
    key: "warningBadges",
    label: "Warning Badges",
    description: "Display warning badges on items needing attention",
    icon: <AlertTriangle className="w-4 h-4" />,
    group: "alerts",
  },
  {
    key: "unmatchedIngredientAlerts",
    label: "Unmatched Ingredient Alerts",
    description: "Highlight ingredients not yet in your database during recipe import",
    icon: <PackageSearch className="w-4 h-4" />,
    group: "alerts",
  },
  {
    key: "stockLevelWarnings",
    label: "Stock Level Warnings",
    description: "Show alerts when inventory drops below par levels",
    icon: <ShieldAlert className="w-4 h-4" />,
    group: "alerts",
  },
  {
    key: "costVarianceAlerts",
    label: "Cost Variance Alerts",
    description: "Notify when food cost exceeds target thresholds",
    icon: <TrendingDown className="w-4 h-4" />,
    group: "alerts",
  },
];

const UIFeedbackSettings = () => {
  const { settings, updateSettings } = useAppSettings();

  const handleChange = (key: keyof AppSettings, value: boolean) => {
    updateSettings({ [key]: value });
    toast.success(`${value ? "Enabled" : "Disabled"} ${feedbackToggles.find(t => t.key === key)?.label}`);
  };

  const allEnabled = feedbackToggles.every(t => settings[t.key] === true);
  const allDisabled = feedbackToggles.every(t => settings[t.key] === false);
  const enabledCount = feedbackToggles.filter(t => settings[t.key] === true).length;

  const toggleAll = (enabled: boolean) => {
    const updates: Partial<AppSettings> = {};
    feedbackToggles.forEach(t => { (updates as any)[t.key] = enabled; });
    updateSettings(updates);
    toast.success(enabled ? "All feedback enabled" : "All feedback disabled");
  };

  const inputGroup = feedbackToggles.filter(t => t.group === "input");
  const alertGroup = feedbackToggles.filter(t => t.group === "alerts");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Master Toggle */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">UI Feedback & Alerts</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {enabledCount} of {feedbackToggles.length} feedback features active
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAll(true)}
                disabled={allEnabled}
              >
                All On
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAll(false)}
                disabled={allDisabled}
              >
                All Off
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="w-5 h-5" />
            Input & Save Feedback
          </CardTitle>
          <CardDescription>
            Visual cues on form fields and save actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {inputGroup.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="text-muted-foreground mt-0.5">{toggle.icon}</div>
                <div>
                  <Label>{toggle.label}</Label>
                  <p className="text-sm text-muted-foreground">{toggle.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[toggle.key] as boolean}
                onCheckedChange={(v) => handleChange(toggle.key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Alerts & Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-5 h-5" />
            Alerts & Warnings
          </CardTitle>
          <CardDescription>
            Badges, warnings, and proactive notifications across the app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {alertGroup.map((toggle) => (
            <div key={toggle.key} className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="text-muted-foreground mt-0.5">{toggle.icon}</div>
                <div>
                  <Label>{toggle.label}</Label>
                  <p className="text-sm text-muted-foreground">{toggle.description}</p>
                </div>
              </div>
              <Switch
                checked={settings[toggle.key] as boolean}
                onCheckedChange={(v) => handleChange(toggle.key, v)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="text-center text-sm text-muted-foreground">
        <p>{enabledCount} of {feedbackToggles.length} feedback features enabled</p>
      </div>
    </motion.div>
  );
};

export default UIFeedbackSettings;
