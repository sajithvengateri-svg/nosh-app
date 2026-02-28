import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OverheadBreakeven = () => (
  <div className="p-4 lg:p-6 space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Break-Even Tracker</h1>
      <p className="text-muted-foreground text-sm">Track progress toward monthly break-even</p>
    </div>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5" /> Break-Even Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">Break-even tracker coming in next phase.</p>
      </CardContent>
    </Card>
  </div>
);

export default OverheadBreakeven;
