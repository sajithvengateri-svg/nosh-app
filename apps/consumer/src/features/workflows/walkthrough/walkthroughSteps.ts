import type { WorkflowStep } from "../types";

export const WALKTHROUGH_STEPS: WorkflowStep[] = [
  {
    id: "welcome",
    type: "info_card",
    question: "Welcome to Prep Mi",
    subtitle: "Your AI cooking companion that learns how you cook. Let us show you around — it'll take 30 seconds.",
    required: false,
  },
  {
    id: "feed",
    type: "info_card",
    question: "Your Feed",
    subtitle: "Swipe through recipe cards tailored to you.\n\n→ Swipe right to save a recipe\n→ Swipe left to skip\n→ Tap a recipe card to start cooking",
    required: false,
  },
  {
    id: "companion",
    type: "info_card",
    question: "Meet Your Companion",
    subtitle: "The floating bubble is your AI cooking assistant.\n\n→ Tap for a smart suggestion\n→ Double-tap to type a message\n→ Long-press for the quick menu",
    required: false,
  },
  {
    id: "quick_menu",
    type: "info_card",
    question: "Quick Menu",
    subtitle: "Long-press the companion bubble to access everything:\n\n• Shopping List\n• Kitchen & Pantry\n• Meal Planning\n• Wine Cellar & Bar\n• Settings & more",
    required: false,
  },
  {
    id: "nosh_dna",
    type: "info_card",
    question: "Your Prep DNA",
    subtitle: "Prep Mi learns your cooking personality over time. The more you cook, the smarter your feed gets.\n\nTake the personality quiz to kickstart your DNA profile.",
    required: false,
  },
  {
    id: "meal_plan",
    type: "info_card",
    question: "Plan Your Week",
    subtitle: "Drag recipes into your weekly meal plan. Prep Mi auto-generates a shopping list based on what's already in your kitchen.",
    required: false,
  },
  {
    id: "cook_mode",
    type: "info_card",
    question: "Cook Mode",
    subtitle: "Tap any recipe to enter full-screen cook mode.\n\nSwipe through step-by-step cards with timers, tips, and technique guides. Hands-free.",
    required: false,
  },
  {
    id: "done",
    type: "info_card",
    question: "You're all set!",
    subtitle: "Start exploring your feed, or long-press the companion bubble to dive into any feature.\n\nHappy cooking! 🍳",
    required: false,
  },
];
