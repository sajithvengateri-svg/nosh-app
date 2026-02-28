import { ChefHat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrgDetailsStepProps {
  orgName: string;
  setOrgName: (name: string) => void;
}

const OrgDetailsStep = ({ orgName, setOrgName }: OrgDetailsStepProps) => (
  <div className="space-y-6 text-center">
    <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
      <ChefHat className="w-10 h-10 text-primary" />
    </div>
    <div>
      <h2 className="text-2xl font-bold">Welcome, Chef!</h2>
      <p className="text-muted-foreground mt-2">
        Let's set up your kitchen in under a minute. This helps us tailor ChefOS to your operation.
      </p>
    </div>
    <div className="max-w-sm mx-auto">
      <Label htmlFor="org-name">Organisation Name</Label>
      <Input
        id="org-name"
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        placeholder="e.g. Marco's Bistro Group"
        className="mt-2 text-center text-lg"
        autoFocus
      />
    </div>
  </div>
);

export default OrgDetailsStep;
