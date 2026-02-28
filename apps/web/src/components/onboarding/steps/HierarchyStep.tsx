import { Card, CardContent } from "@/components/ui/card";

interface HierarchyStepProps {
  roleStructure: string;
  setRoleStructure: (structure: string) => void;
}

const HIERARCHY_OPTIONS = [
  {
    value: "flat",
    label: "Flat — Everyone's equal",
    desc: "Small team, everyone does everything",
    icon: "👨‍🍳",
  },
  {
    value: "sections",
    label: "Section-based",
    desc: "Larder, Grill, Pastry — with section leaders",
    icon: "🏗️",
  },
  {
    value: "brigade",
    label: "Full Brigade",
    desc: "Executive Chef → Sous → CDP → Commis",
    icon: "⭐",
  },
];

const HierarchyStep = ({ roleStructure, setRoleStructure }: HierarchyStepProps) => (
  <div className="space-y-6 text-center">
    <div>
      <h2 className="text-xl font-bold">Kitchen Hierarchy</h2>
      <p className="text-sm text-muted-foreground mt-1">
        How is your kitchen organised?
      </p>
    </div>
    <div className="grid gap-3 max-w-md mx-auto">
      {HIERARCHY_OPTIONS.map((opt) => (
        <Card
          key={opt.value}
          className={`cursor-pointer transition-all text-left ${
            roleStructure === opt.value
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "hover:border-primary/30"
          }`}
          onClick={() => setRoleStructure(opt.value)}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <span className="text-2xl">{opt.icon}</span>
            <div>
              <p className="font-medium">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default HierarchyStep;
