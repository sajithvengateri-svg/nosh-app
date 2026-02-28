import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const REVIEW_CATEGORIES = ["Punctuality", "Teamwork", "Technical Skill", "Hygiene & Safety", "Initiative", "Communication"];
const UNIFORM_ITEMS = ["Apron (x2)", "Chef Jacket", "Kitchen Pants", "Non-slip Shoes", "Knife Set", "Thermometer", "Name Badge"];

const PeopleSettings = () => (
  <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
    <div>
      <h1 className="text-2xl font-bold text-foreground">People Settings</h1>
      <p className="text-sm text-muted-foreground">Configure HR module defaults</p>
    </div>

    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Review Scoring Categories</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {REVIEW_CATEGORIES.map(c => (
          <div key={c} className="flex items-center gap-3">
            <Checkbox defaultChecked id={c} />
            <Label htmlFor={c} className="text-sm">{c}</Label>
          </div>
        ))}
        <p className="text-xs text-muted-foreground mt-2">Customise which categories appear in performance reviews.</p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Default Review Frequency</CardTitle></CardHeader>
      <CardContent>
        <Select defaultValue="12">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Every 3 months</SelectItem>
            <SelectItem value="6">Every 6 months</SelectItem>
            <SelectItem value="12">Annually</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Uniform & Tools Inventory</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {UNIFORM_ITEMS.map(item => (
          <div key={item} className="flex items-center justify-between py-1 border-b border-border last:border-0">
            <span className="text-sm text-foreground">{item}</span>
            <Input type="number" defaultValue={10} className="w-20 h-8 text-sm" />
          </div>
        ))}
        <p className="text-xs text-muted-foreground mt-2">Stock quantities for onboarding issuance.</p>
      </CardContent>
    </Card>
  </div>
);

export default PeopleSettings;
