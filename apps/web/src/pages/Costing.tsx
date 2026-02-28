import AppLayout from "@/components/layout/AppLayout";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";
import FoodCostCalculator from "@/components/costing/FoodCostCalculator";
import { useState } from "react";

const Costing = () => {
  // Always show the calculator on this page
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="page-title font-display flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Food Cost Calculator
          </h1>
          <p className="page-subtitle">Quick cost calculations for your dishes</p>
        </motion.div>
        <FoodCostCalculator isOpen={true} onClose={() => {}} embedded />
      </div>
    </AppLayout>
  );
};

export default Costing;
