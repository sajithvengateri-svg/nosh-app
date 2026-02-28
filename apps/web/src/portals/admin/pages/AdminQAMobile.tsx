import { Shield } from "lucide-react";
import { QAChecklist, type QASection } from "../components/QAChecklist";

const sections: QASection[] = [
  {
    title: "1. Auth & Onboarding",
    subsections: [
      {
        title: "Landing & Login",
        items: [
          { id: "fs-auth-1", label: "Food Safety landing page renders" },
          { id: "fs-auth-2", label: "Login with valid credentials → dashboard" },
          { id: "fs-auth-3", label: "Login with invalid credentials → error" },
          { id: "fs-auth-4", label: "Sign up creates account" },
          { id: "fs-auth-5", label: "Forgot password flow" },
          { id: "fs-auth-6", label: "Logout clears session" },
          { id: "fs-auth-7", label: "Org selection works" },
        ],
      },
    ],
  },
  {
    title: "2. Safety Hub (Mobile)",
    subsections: [
      {
        title: "Quick Action Pills",
        items: [
          { id: "fs-hub-1", label: "Temp pill → /(app)/temp-grid", expected: "Green, Thermometer" },
          { id: "fs-hub-2", label: "Receiving pill → /(app)/food-safety/receiving", expected: "Amber, Store" },
          { id: "fs-hub-3", label: "Cleaning pill → /(app)/food-safety/cleaning-bcc", expected: "Blue, SprayCan" },
        ],
      },
      {
        title: "Hub Cards",
        items: [
          { id: "fs-hub-4", label: "Food Safety card → /(app)/food-safety" },
          { id: "fs-hub-5", label: "Audit card → /(app)/audit" },
          { id: "fs-hub-6", label: "Docs card → /(app)/food-safety-docs" },
          { id: "fs-hub-7", label: "Cleaning card → /(app)/cleaning-management" },
        ],
      },
      {
        title: "Alerts & Data",
        items: [
          { id: "fs-hub-8", label: "Critical alerts banner when alerts > 0" },
          { id: "fs-hub-9", label: "Pull to refresh reloads data" },
          { id: "fs-hub-10", label: "Counts update: temp, cleaning, receiving" },
        ],
      },
    ],
  },
  {
    title: "3. Food Safety Index (Mobile)",
    subsections: [
      {
        title: "Compliance & Workflow",
        items: [
          { id: "fs-idx-1", label: "Framework label shows (BCC / GCC)" },
          { id: "fs-idx-2", label: "Green Shield badge when active" },
          { id: "fs-idx-3", label: "Compliance score pill" },
          { id: "fs-idx-4", label: "Workflow bar: 4 steps render" },
          { id: "fs-idx-5", label: "Action button navigates correctly" },
        ],
      },
      {
        title: "Function List",
        items: [
          { id: "fs-idx-6", label: "All enabled tabs with icons + log badges" },
          { id: "fs-idx-7", label: "Tap tab → navigates to correct route" },
          { id: "fs-idx-8", label: "Reorder modal works + save persists" },
          { id: "fs-idx-9", label: "Section gating hides disabled tabs" },
        ],
      },
    ],
  },
  {
    title: "4. Cleaning (Mobile)",
    subsections: [
      {
        title: "Page Load",
        items: [
          { id: "fs-cl-1", label: "Page loads without crash (no infinite loop)" },
          { id: "fs-cl-2", label: "Pro view: Checklist / Monthly / Setup tabs" },
        ],
      },
      {
        title: "Shift Tabs & Progress",
        items: [
          { id: "fs-cl-3", label: "Auto-detect shift by time of day" },
          { id: "fs-cl-4", label: "Opening / Midday / Closing tabs filter tasks" },
          { id: "fs-cl-5", label: "Progress bar: X/Y completed, correct width" },
          { id: "fs-cl-6", label: "Auto-tick badge (Sparkles) shows count" },
        ],
      },
      {
        title: "Tasks",
        items: [
          { id: "fs-cl-7", label: "Outstanding: name, area, time, frequency, PPM badge" },
          { id: "fs-cl-8", label: "Tap circle → completes task" },
          { id: "fs-cl-9", label: "Camera → photo upload → complete with photo" },
          { id: "fs-cl-10", label: "Completed: strikethrough, auto/manual label" },
          { id: "fs-cl-11", label: "All done: green checkmark message" },
        ],
      },
      {
        title: "Sign-Off & Empty States",
        items: [
          { id: "fs-cl-12", label: "Sign-off button: head chef only" },
          { id: "fs-cl-13", label: "Sign-off → success alert with count" },
          { id: "fs-cl-14", label: "No tasks → 'Load Default Tasks' button" },
          { id: "fs-cl-15", label: "No shift tasks → 'No tasks for this shift'" },
        ],
      },
    ],
  },
  {
    title: "5. Receiving (Mobile)",
    subsections: [
      {
        title: "Settings — Categories",
        items: [
          { id: "fs-rv-1", label: "Non-head-chef: 'Head Chef Access Only'" },
          { id: "fs-rv-2", label: "Empty state: 'Seed Defaults' button" },
          { id: "fs-rv-3", label: "8 default categories after seed" },
          { id: "fs-rv-4", label: "Category labels correct (Dairy, Dry Goods)" },
          { id: "fs-rv-5", label: "Temp badge shows range" },
        ],
      },
      {
        title: "Settings — Toggles & Edit",
        items: [
          { id: "fs-rv-6", label: "'Requires temp check' toggle" },
          { id: "fs-rv-7", label: "'AI quality check' toggle" },
          { id: "fs-rv-8", label: "'Edit Range' → Min/Max inputs + Save/Cancel" },
          { id: "fs-rv-9", label: "Save updates badge immediately" },
        ],
      },
      {
        title: "Settings — Add Category (NEW)",
        items: [
          { id: "fs-rv-10", label: "FAB visible at bottom-right" },
          { id: "fs-rv-11", label: "Tap FAB → 'Add Category' FormSheet" },
          { id: "fs-rv-12", label: "Category Name input" },
          { id: "fs-rv-13", label: "Temp check switch (default ON) → shows/hides Min/Max" },
          { id: "fs-rv-14", label: "AI quality switch (default OFF)" },
          { id: "fs-rv-15", label: "Empty name → error, Duplicate → error" },
          { id: "fs-rv-16", label: "Save → new category in list" },
          { id: "fs-rv-17", label: "Name: 'Hot Sauces' → 'hot_sauces' → 'Hot Sauces'" },
        ],
      },
      {
        title: "Receiving Page",
        items: [
          { id: "fs-rv-18", label: "Receiving page loads" },
          { id: "fs-rv-19", label: "ReceivingGrid renders" },
        ],
      },
    ],
  },
  {
    title: "6. BCC Dashboard (Web)",
    subsections: [
      {
        title: "Tabs",
        items: [
          { id: "fs-bcc-1", label: "All tabs visible" },
          { id: "fs-bcc-2", label: "Receiving tab → BCCReceivingLog" },
          { id: "fs-bcc-3", label: "Cleaning tab → BCCCleaningLog" },
          { id: "fs-bcc-4", label: "URL ?tab=receiving works" },
        ],
      },
      {
        title: "Burst Card Navigation",
        items: [
          { id: "fs-bcc-5", label: "Receiving card → Receiving tab (not dialog)" },
          { id: "fs-bcc-6", label: "Kitchen Clean card → Cleaning tab (not dialog)" },
          { id: "fs-bcc-7", label: "Other cards open inline dialog" },
        ],
      },
      {
        title: "Burst — Temp Thresholds",
        items: [
          { id: "fs-bcc-8", label: "Fridge: ≤5 pass, ≤8 warning, >8 fail" },
          { id: "fs-bcc-9", label: "Freezer: ≤-18 pass, ≤-15 warning" },
          { id: "fs-bcc-10", label: "Cooking: ≥75 pass, ≥60 warning" },
        ],
      },
      {
        title: "Receiving Log (Web)",
        items: [
          { id: "fs-bcc-11", label: "'Log Delivery' button + dialog" },
          { id: "fs-bcc-12", label: "Manual / Scan / Email modes" },
          { id: "fs-bcc-13", label: "AI invoice extraction" },
          { id: "fs-bcc-14", label: "Items: name, qty, temp, condition, camera" },
          { id: "fs-bcc-15", label: "Checklist: 4 checkboxes" },
          { id: "fs-bcc-16", label: "Save → log appears in table" },
        ],
      },
      {
        title: "Cleaning Log (Web)",
        items: [
          { id: "fs-bcc-17", label: "'Log Clean' button + dialog" },
          { id: "fs-bcc-18", label: "Location input + Action select (8 options)" },
          { id: "fs-bcc-19", label: "AI Verify (optional)" },
          { id: "fs-bcc-20", label: "Save → log appears in table" },
        ],
      },
    ],
  },
  {
    title: "7. GCC Dashboard (Web)",
    subsections: [
      {
        title: "GCC-Specific",
        items: [
          { id: "fs-gcc-1", label: "Receiving + Cleaning tabs render" },
          { id: "fs-gcc-2", label: "Kitchen Clean burst → Cleaning tab" },
          { id: "fs-gcc-3", label: "Arabic labels in dialog" },
          { id: "fs-gcc-4", label: "Halal cards with verification" },
          { id: "fs-gcc-5", label: "Hot holding ≥60°C pass" },
          { id: "fs-gcc-6", label: "Cooking ≥74°C pass" },
          { id: "fs-gcc-7", label: "Dual write: gcc_compliance_logs + daily_compliance_logs" },
        ],
      },
    ],
  },
  {
    title: "8. Other Food Safety Pages (Mobile)",
    subsections: [
      {
        title: "All Pages Load",
        items: [
          { id: "fs-pages-1", label: "Temperature grid + setup" },
          { id: "fs-pages-2", label: "Training register" },
          { id: "fs-pages-3", label: "Pest control" },
          { id: "fs-pages-4", label: "Equipment calibration" },
          { id: "fs-pages-5", label: "Grease trap + Hood cleaning" },
          { id: "fs-pages-6", label: "Chemical safety + HACCP" },
          { id: "fs-pages-7", label: "Staff health + Cooking/Cooling/Reheating logs" },
          { id: "fs-pages-8", label: "Display monitoring + Transport log" },
          { id: "fs-pages-9", label: "Handwash + Sanitiser checks" },
          { id: "fs-pages-10", label: "Supplier register" },
        ],
      },
    ],
  },
  {
    title: "9. Error Boundary & Cross-Cutting",
    subsections: [
      {
        title: "Error Recovery",
        items: [
          { id: "fs-err-1", label: "Crash → 'Something went wrong' (not white page)" },
          { id: "fs-err-2", label: "'Try Again' re-renders, 'Go Home' → tabs" },
          { id: "fs-err-3", label: "Sentry captures errors" },
        ],
      },
      {
        title: "Data Integrity",
        items: [
          { id: "fs-data-1", label: "Receiving logs: log_type = 'receiving'" },
          { id: "fs-data-2", label: "Cleaning logs: log_type = 'cleaning'" },
          { id: "fs-data-3", label: "Categories: unique (org_id, product_category)" },
          { id: "fs-data-4", label: "Temps stored as numeric, nulls as null" },
        ],
      },
      {
        title: "Permissions",
        items: [
          { id: "fs-perm-1", label: "Receiving Settings: head_chef only" },
          { id: "fs-perm-2", label: "Sign-off: head_chef only" },
          { id: "fs-perm-3", label: "Logging: any food-safety editor" },
        ],
      },
    ],
  },
];

export default function AdminQAMobile() {
  return (
    <QAChecklist
      title="Food Safety QA"
      icon={<Shield className="w-8 h-8 text-emerald-600" />}
      sections={sections}
      storageKey="qa-food-safety"
    />
  );
}
