import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import KitchenSectionsManager from "@/components/operations/KitchenSectionsManager";
import { useAuth } from "@/contexts/AuthContext";

const KitchenSections = () => {
  const { canEdit } = useAuth();
  const hasEditPermission = canEdit("calendar");

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Kitchen Sections</h1>
            <p className="page-subtitle">Manage your kitchen areas and track section costs</p>
          </div>
        </motion.div>

        {/* Kitchen Sections Manager */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <KitchenSectionsManager hasEditPermission={hasEditPermission} />
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default KitchenSections;
