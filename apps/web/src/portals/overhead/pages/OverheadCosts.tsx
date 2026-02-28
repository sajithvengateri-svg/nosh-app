import { useNavigate } from "react-router-dom";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OverheadCosts = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cost Entries</h1>
          <p className="text-muted-foreground text-sm">Track all overhead cost entries</p>
        </div>
        <Button onClick={() => navigate("/overhead/costs/new")} className="gap-2">
          <Plus className="w-4 h-4" /> Add Cost
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="w-5 h-5" /> Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No cost entries yet. Add your first overhead cost to get started.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverheadCosts;
