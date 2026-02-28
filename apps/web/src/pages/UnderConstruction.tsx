import { motion } from "framer-motion";
import { Construction, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const UnderConstruction = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
          className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-warning/10 mb-6"
        >
          <Construction className="w-12 h-12 text-warning" />
        </motion.div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Under Construction</h1>
        <p className="text-muted-foreground mb-8">
          This module is being built. Check back soon — it's going to be great.
        </p>
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Launcher
        </Button>
      </motion.div>
    </div>
  );
};

export default UnderConstruction;
