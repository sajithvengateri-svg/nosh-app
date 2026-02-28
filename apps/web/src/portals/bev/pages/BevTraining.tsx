import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BevInductionTracker from "../components/BevInductionTracker";

const modules = [
  { title: "Spirits Knowledge", desc: "Spirit categories, production methods, key brands" },
  { title: "Wine Service", desc: "Tasting, temperature, glassware, decanting" },
  { title: "Cocktail Technique", desc: "Shaking, stirring, muddling, layering" },
  { title: "Coffee Program", desc: "Extraction, milk texturing, latte art" },
  { title: "Bar Hygiene", desc: "Glass washing, line cleaning, food safety" },
];

const BevTraining = () => (
  <div className="p-6 space-y-6">
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold font-display text-foreground">Bar Training</h1>
      <p className="text-sm text-muted-foreground">Induction, training modules, and study materials</p>
    </motion.div>

    <BevInductionTracker />

    <h2 className="text-lg font-semibold text-foreground">Training Modules</h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {modules.map((m) => (
        <Card key={m.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <p className="font-medium text-foreground">{m.title}</p>
            </div>
            <p className="text-xs text-muted-foreground">{m.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default BevTraining;
