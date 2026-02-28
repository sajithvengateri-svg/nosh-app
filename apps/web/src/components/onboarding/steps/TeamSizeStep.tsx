import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface TeamSizeStepProps {
  teamSize: number;
  setTeamSize: (size: number) => void;
}

const TEAM_OPTIONS = [
  { label: "Just me", value: 1 },
  { label: "2–5", value: 5 },
  { label: "6–15", value: 15 },
  { label: "16+", value: 20 },
];

const TeamSizeStep = ({ teamSize, setTeamSize }: TeamSizeStepProps) => (
  <div className="space-y-6 text-center">
    <div>
      <h2 className="text-xl font-bold">How big is your team?</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Approximate number of chefs across all venues
      </p>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto">
      {TEAM_OPTIONS.map((opt) => (
        <Card
          key={opt.value}
          className={`cursor-pointer transition-all ${
            teamSize === opt.value
              ? "border-primary bg-primary/5 ring-2 ring-primary/20"
              : "hover:border-primary/30"
          }`}
          onClick={() => setTeamSize(opt.value)}
        >
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">{opt.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default TeamSizeStep;
