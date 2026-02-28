import { 
  ChefHat, Package, FileText, Wrench, Users, 
  Upload, ArrowRight 
} from "lucide-react";

const WALKTHROUGH_ITEMS = [
  {
    icon: ChefHat,
    title: "Add Recipes",
    desc: "Create recipes manually or import from PDF/photo",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Upload,
    title: "Import in Bulk",
    desc: "Upload spreadsheets or scan existing recipe cards",
    color: "text-accent-foreground",
    bg: "bg-accent/30",
  },
  {
    icon: Package,
    title: "Add Ingredients",
    desc: "Build your ingredient library with costs & suppliers",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Scan Invoices",
    desc: "Snap a photo of invoices to auto-update prices",
    color: "text-accent-foreground",
    bg: "bg-accent/30",
  },
  {
    icon: Wrench,
    title: "Log Equipment",
    desc: "Track maintenance schedules & warranties",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Users,
    title: "Invite Your Team",
    desc: "Add chefs with role-based access & permissions",
    color: "text-accent-foreground",
    bg: "bg-accent/30",
  },
];

const WalkthroughStep = () => (
  <div className="space-y-5">
    <div className="text-center">
      <h2 className="text-xl font-bold">You're all set! Here's what to do next</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Follow these steps from your dashboard to get the most out of ChefOS.
      </p>
    </div>
    <div className="grid gap-2.5 max-h-[280px] overflow-y-auto pr-1">
      {WALKTHROUGH_ITEMS.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
          </div>
        );
      })}
    </div>
  </div>
);

export default WalkthroughStep;
