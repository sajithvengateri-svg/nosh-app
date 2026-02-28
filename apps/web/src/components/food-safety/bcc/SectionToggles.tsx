import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BCC_SECTIONS } from "@/hooks/useBCCCompliance";
import { LayoutGrid } from "lucide-react";

interface SectionTogglesProps {
  toggles: Record<string, boolean>;
  onChange: (key: string, enabled: boolean) => void;
  compact?: boolean;
}

export default function SectionToggles({ toggles, onChange, compact }: SectionTogglesProps) {
  const content = (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {BCC_SECTIONS.map((s) => (
        <div key={s.key} className="flex items-center justify-between">
          <Label className="cursor-pointer">{s.label}</Label>
          <Switch
            checked={toggles[s.key] ?? s.defaultOn}
            onCheckedChange={(v) => onChange(s.key, v)}
          />
        </div>
      ))}
    </div>
  );

  if (compact) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5" />
          BCC Section Toggles
        </CardTitle>
        <CardDescription>Enable or disable individual compliance sections</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
