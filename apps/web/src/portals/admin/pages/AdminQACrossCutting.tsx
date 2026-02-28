import { ChefHat } from "lucide-react";
import { QAChecklist, type QASection } from "../components/QAChecklist";

const sections: QASection[] = [
  {
    title: "1. Auth & Onboarding",
    subsections: [
      {
        title: "Landing & Login",
        items: [
          { id: "co-auth-1", label: "ChefOS landing page renders" },
          { id: "co-auth-2", label: "Login with valid credentials" },
          { id: "co-auth-3", label: "Sign up creates account + org" },
          { id: "co-auth-4", label: "Org selection with multiple venues" },
          { id: "co-auth-5", label: "Role-based redirect after login" },
          { id: "co-auth-6", label: "Logout clears session" },
        ],
      },
    ],
  },
  {
    title: "2. Dashboard & Portal Navigation",
    subsections: [
      {
        title: "Main Dashboard",
        items: [
          { id: "co-dash-1", label: "Dashboard loads after login" },
          { id: "co-dash-2", label: "All portal cards visible" },
          { id: "co-dash-3", label: "Section nav works" },
          { id: "co-dash-4", label: "Sidebar collapses/expands" },
        ],
      },
      {
        title: "Portal Cards",
        items: [
          { id: "co-dash-5", label: "Food Safety portal → food safety page" },
          { id: "co-dash-6", label: "Clock portal → clock page" },
          { id: "co-dash-7", label: "Supply portal → supply page" },
          { id: "co-dash-8", label: "Reservation portal → reservation page" },
          { id: "co-dash-9", label: "Labour portal → labour page" },
          { id: "co-dash-10", label: "Money portal → money page" },
          { id: "co-dash-11", label: "Growth portal → growth page" },
          { id: "co-dash-12", label: "Overhead portal → overhead page" },
        ],
      },
    ],
  },
  {
    title: "3. Food Safety (Pro/Restaurant)",
    subsections: [
      {
        title: "BCC Mode",
        items: [
          { id: "co-fs-1", label: "BCC dashboard loads with all tabs" },
          { id: "co-fs-2", label: "Burst cards work (13 cards)" },
          { id: "co-fs-3", label: "Receiving tab → BCCReceivingLog" },
          { id: "co-fs-4", label: "Cleaning tab → BCCCleaningLog" },
          { id: "co-fs-5", label: "Training register" },
          { id: "co-fs-6", label: "Equipment calibration" },
          { id: "co-fs-7", label: "Pest control log" },
          { id: "co-fs-8", label: "Corrective actions" },
          { id: "co-fs-9", label: "Supplier register" },
        ],
      },
      {
        title: "GCC Mode",
        items: [
          { id: "co-fs-10", label: "GCC dashboard loads (12 cards)" },
          { id: "co-fs-11", label: "Halal verification works" },
          { id: "co-fs-12", label: "Arabic labels shown" },
          { id: "co-fs-13", label: "GCC temp thresholds correct" },
          { id: "co-fs-14", label: "Staff medical tracker" },
        ],
      },
      {
        title: "Standard Mode",
        items: [
          { id: "co-fs-15", label: "Standard food safety tabs" },
          { id: "co-fs-16", label: "Receiving → BCCReceivingLog" },
          { id: "co-fs-17", label: "Cleaning → BCCCleaningLog" },
        ],
      },
    ],
  },
  {
    title: "4. Mobile App (Pro)",
    subsections: [
      {
        title: "Bottom Navigation",
        items: [
          { id: "co-mob-1", label: "All 5 tabs render" },
          { id: "co-mob-2", label: "Active tab highlighted" },
          { id: "co-mob-3", label: "Tab navigation works" },
        ],
      },
      {
        title: "Safety Hub",
        items: [
          { id: "co-mob-4", label: "3 quick action pills work" },
          { id: "co-mob-5", label: "4 hub cards navigate" },
          { id: "co-mob-6", label: "Critical alerts banner" },
        ],
      },
      {
        title: "Cleaning Dashboard",
        items: [
          { id: "co-mob-7", label: "Pro view: 3 tabs (Checklist/Monthly/Setup)" },
          { id: "co-mob-8", label: "Shift tabs + progress bar" },
          { id: "co-mob-9", label: "Complete tasks + camera photos" },
          { id: "co-mob-10", label: "Manager sign-off" },
          { id: "co-mob-11", label: "Auto-complete (no infinite loop)" },
        ],
      },
      {
        title: "Receiving Settings",
        items: [
          { id: "co-mob-12", label: "Settings page loads" },
          { id: "co-mob-13", label: "Add Category FAB + FormSheet" },
          { id: "co-mob-14", label: "Edit existing categories" },
          { id: "co-mob-15", label: "Seed defaults" },
        ],
      },
    ],
  },
  {
    title: "5. Clock & Rostering",
    subsections: [
      {
        title: "Time Clock",
        items: [
          { id: "co-clock-1", label: "Clock in/out page loads" },
          { id: "co-clock-2", label: "Photo capture on clock" },
          { id: "co-clock-3", label: "Timesheet view" },
          { id: "co-clock-4", label: "Shift history" },
        ],
      },
      {
        title: "Rostering",
        items: [
          { id: "co-clock-5", label: "Roster view loads" },
          { id: "co-clock-6", label: "Add/edit shifts" },
          { id: "co-clock-7", label: "Publish roster" },
        ],
      },
    ],
  },
  {
    title: "6. Supply & Inventory",
    subsections: [
      {
        title: "Supply Portal",
        items: [
          { id: "co-supply-1", label: "Suppliers page loads" },
          { id: "co-supply-2", label: "Add supplier" },
          { id: "co-supply-3", label: "Receiving/PO page loads" },
          { id: "co-supply-4", label: "Inventory page loads" },
          { id: "co-supply-5", label: "Order management" },
        ],
      },
    ],
  },
  {
    title: "7. Other Portals",
    subsections: [
      {
        title: "Portal Pages Load",
        items: [
          { id: "co-port-1", label: "Reservation portal loads" },
          { id: "co-port-2", label: "Labour portal loads" },
          { id: "co-port-3", label: "Money portal loads" },
          { id: "co-port-4", label: "Growth portal loads" },
          { id: "co-port-5", label: "Overhead portal loads" },
          { id: "co-port-6", label: "Quiet portal / audit loads" },
        ],
      },
    ],
  },
  {
    title: "8. Admin Portal",
    subsections: [
      {
        title: "Admin Pages",
        items: [
          { id: "co-admin-1", label: "Admin auth gate works" },
          { id: "co-admin-2", label: "All sidebar links navigate" },
          { id: "co-admin-3", label: "QA pages accessible" },
          { id: "co-admin-4", label: "Organizations page loads" },
          { id: "co-admin-5", label: "Release manager loads" },
          { id: "co-admin-6", label: "Settings page loads" },
        ],
      },
    ],
  },
  {
    title: "9. Error Handling & General",
    subsections: [
      {
        title: "Error Recovery",
        items: [
          { id: "co-err-1", label: "ErrorBoundary catches crashes" },
          { id: "co-err-2", label: "Try Again + Go Home buttons work" },
          { id: "co-err-3", label: "Sentry captures errors" },
        ],
      },
      {
        title: "General",
        items: [
          { id: "co-gen-1", label: "Responsive layout (mobile/tablet/desktop)" },
          { id: "co-gen-2", label: "Dark mode toggle" },
          { id: "co-gen-3", label: "Toast notifications" },
          { id: "co-gen-4", label: "Loading spinners" },
          { id: "co-gen-5", label: "Permission gates" },
          { id: "co-gen-6", label: "Multi-org switching" },
        ],
      },
    ],
  },
];

export default function AdminQACrossCutting() {
  return (
    <QAChecklist
      title="ChefOS QA"
      icon={<ChefHat className="w-8 h-8 text-indigo-600" />}
      sections={sections}
      storageKey="qa-chefos"
    />
  );
}
