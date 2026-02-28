import { ChefHat, Package, ClipboardList, Receipt } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const linkActions = [
  { icon: Package, label: "View Costing", path: "/ingredients", color: "bg-accent" },
  { icon: ClipboardList, label: "Create Prep List", path: "/prep", color: "bg-primary" },
  { icon: Receipt, label: "Scan Invoice", path: "/invoices", color: "bg-primary" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  const handleNewRecipe = () => {
    navigate("/recipes/new");
  };

  return (
    <div className="card-elevated p-4 lg:p-5">
      <h2 className="section-header">Quick Actions</h2>
      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0 sm:pb-0 scrollbar-hide">
        {/* New Recipe - special handler */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleNewRecipe}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 active:bg-muted transition-colors snap-start shrink-0 w-[calc(33%-0.5rem)] sm:w-auto"
        >
          <div className="p-3 rounded-xl bg-primary text-primary-foreground">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-center whitespace-nowrap">New Recipe</span>
        </motion.button>

        {/* Link-based actions */}
        {linkActions.map((action) => (
          <motion.div key={action.label} whileTap={{ scale: 0.95 }} className="snap-start shrink-0 w-[calc(33%-0.5rem)] sm:w-auto">
            <Link
              to={action.path}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50 active:bg-muted transition-colors"
            >
              <div className={`p-3 rounded-xl ${action.color} text-primary-foreground`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-center whitespace-nowrap">{action.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
