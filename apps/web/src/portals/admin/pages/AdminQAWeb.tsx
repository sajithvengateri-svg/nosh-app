import { Home } from "lucide-react";
import { QAChecklist, type QASection } from "../components/QAChecklist";

const sections: QASection[] = [
  {
    title: "1. Auth & Onboarding",
    subsections: [
      {
        title: "Landing & Login",
        items: [
          { id: "hc-auth-1", label: "Home Chef landing page renders" },
          { id: "hc-auth-2", label: "Login with valid credentials" },
          { id: "hc-auth-3", label: "Sign up creates account" },
          { id: "hc-auth-4", label: "Org selection / onboarding" },
          { id: "hc-auth-5", label: "Logout clears session" },
        ],
      },
    ],
  },
  {
    title: "2. Bottom Navigation (Mobile)",
    subsections: [
      {
        title: "Tab Bar",
        items: [
          { id: "hc-nav-1", label: "All bottom tabs render" },
          { id: "hc-nav-2", label: "Active tab highlighted" },
          { id: "hc-nav-3", label: "Home cook nav sections load (different from pro)" },
        ],
      },
    ],
  },
  {
    title: "3. Safety Hub — Home Cook View",
    subsections: [
      {
        title: "Quick Actions",
        items: [
          { id: "hc-hub-1", label: "Temp pill → temp grid" },
          { id: "hc-hub-2", label: "Receiving pill → receiving page" },
          { id: "hc-hub-3", label: "Cleaning pill → cleaning page" },
        ],
      },
      {
        title: "Hub Cards",
        items: [
          { id: "hc-hub-4", label: "Food Safety card navigates" },
          { id: "hc-hub-5", label: "Other hub cards load" },
        ],
      },
    ],
  },
  {
    title: "4. Cleaning — Home Cook View",
    subsections: [
      {
        title: "Tabs",
        items: [
          { id: "hc-cl-1", label: "2 tabs: Cleaning / Chemicals" },
          { id: "hc-cl-2", label: "Cleaning tab → HomeCleaningChecklist" },
          { id: "hc-cl-3", label: "Chemicals tab → ChemicalGrid" },
          { id: "hc-cl-4", label: "No crash on page load" },
        ],
      },
      {
        title: "HomeCleaningChecklist",
        items: [
          { id: "hc-cl-5", label: "Checklist items render" },
          { id: "hc-cl-6", label: "Toggle items on/off" },
          { id: "hc-cl-7", label: "Progress updates" },
        ],
      },
      {
        title: "ChemicalGrid",
        items: [
          { id: "hc-cl-8", label: "Chemical list renders" },
          { id: "hc-cl-9", label: "Chemical details visible" },
          { id: "hc-cl-10", label: "Add chemical (if applicable)" },
        ],
      },
    ],
  },
  {
    title: "5. Temperature",
    subsections: [
      {
        title: "Temp Logging",
        items: [
          { id: "hc-tmp-1", label: "Temp grid page loads" },
          { id: "hc-tmp-2", label: "Log temperature entry" },
          { id: "hc-tmp-3", label: "Pass/fail coloring" },
        ],
      },
    ],
  },
  {
    title: "6. Recipes & Menu (if applicable)",
    subsections: [
      {
        title: "Recipe Management",
        items: [
          { id: "hc-recipe-1", label: "Recipe list loads" },
          { id: "hc-recipe-2", label: "Add new recipe" },
          { id: "hc-recipe-3", label: "Edit existing recipe" },
          { id: "hc-recipe-4", label: "Recipe photos" },
          { id: "hc-recipe-5", label: "Ingredient list" },
          { id: "hc-recipe-6", label: "Costing / pricing" },
        ],
      },
    ],
  },
  {
    title: "7. Web Dashboard — Home Chef",
    subsections: [
      {
        title: "Dashboard",
        items: [
          { id: "hc-web-1", label: "Home Chef dashboard loads" },
          { id: "hc-web-2", label: "Portal cards visible" },
          { id: "hc-web-3", label: "Navigation works" },
        ],
      },
      {
        title: "Food Safety (Web)",
        items: [
          { id: "hc-web-4", label: "Food Safety page loads in home cook mode" },
          { id: "hc-web-5", label: "Appropriate tabs shown for home cook" },
          { id: "hc-web-6", label: "Temperature tab works" },
        ],
      },
    ],
  },
  {
    title: "8. General & Error Handling",
    subsections: [
      {
        title: "General",
        items: [
          { id: "hc-gen-1", label: "Pull to refresh on all pages" },
          { id: "hc-gen-2", label: "Loading states show skeletons" },
          { id: "hc-gen-3", label: "Empty states have actions" },
          { id: "hc-gen-4", label: "Error boundary catches crashes" },
          { id: "hc-gen-5", label: "Go Home button works" },
        ],
      },
    ],
  },
];

export default function AdminQAWeb() {
  return (
    <QAChecklist
      title="Home Chef QA"
      icon={<Home className="w-8 h-8 text-amber-600" />}
      sections={sections}
      storageKey="qa-home-chef"
    />
  );
}
