import { motion } from "framer-motion";
import { ArrowLeft, Construction } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface StubDashboardProps {
  name: string;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
}

const StubDashboard = ({ name, subtitle, gradient, icon }: StubDashboardProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-6`}>
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{name}</h1>
        <p className="text-muted-foreground mb-4">{subtitle}</p>
        <div className="flex items-center justify-center gap-2 mb-8">
          <Construction className="w-4 h-4 text-yellow-500" />
          <span className="text-sm text-muted-foreground font-medium">In Development</span>
        </div>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Launcher
        </Button>
      </motion.div>
    </div>
  );
};

export default StubDashboard;
