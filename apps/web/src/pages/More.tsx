import { motion } from "framer-motion";
import { 
  Shield,
  GraduationCap,
  Receipt,
  Settings,
  ChevronRight,
  Thermometer,
  FileText,
  Users,
  Bell,
  HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";

const menuItems = [
  { 
    icon: Shield, 
    label: "Food Safety Logs", 
    description: "Temperature logs and HACCP compliance",
    path: "/food-safety",
    color: "bg-warning/10 text-warning"
  },
  { 
    icon: FileText, 
    label: "Master Logs", 
    description: "Complaints, incidents & operational logs",
    path: "/logs",
    color: "bg-destructive/10 text-destructive"
  },
  { 
    icon: GraduationCap, 
    label: "Training", 
    description: "Staff training and certifications",
    path: "/training",
    color: "bg-accent/10 text-accent"
  },
  { 
    icon: Receipt, 
    label: "Invoices", 
    description: "Scan and manage invoices",
    path: "/invoices",
    color: "bg-primary/10 text-primary"
  },
  { 
    icon: Thermometer, 
    label: "Equipment Temps", 
    description: "Monitor refrigeration units",
    path: "/equipment",
    color: "bg-success/10 text-success"
  },
  { 
    icon: FileText, 
    label: "Reports", 
    description: "Analytics and cost reports",
    path: "/reports",
    color: "bg-copper-light/30 text-copper"
  },
  { 
    icon: Users, 
    label: "Team", 
    description: "Manage staff and schedules",
    path: "/team",
    color: "bg-sage-light text-sage"
  },
];

const settingsItems = [
  { icon: Settings, label: "App Settings", path: "/settings" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

const More = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title font-display">More</h1>
          <p className="page-subtitle">Additional tools and settings</p>
        </motion.div>

        {/* Main Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated overflow-hidden"
        >
          <div className="divide-y divide-border">
            {menuItems.map((item, index) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className={`p-3 rounded-xl ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="section-header">Settings</h2>
          <div className="card-elevated overflow-hidden">
            <div className="divide-y divide-border">
              {settingsItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-muted">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="flex-1 font-medium text-foreground">{item.label}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6"
        >
          <p className="text-sm text-muted-foreground">ChefFlow v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">Kitchen Management System</p>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default More;
