import type { WorkflowStep } from "../types";

export const RECIPE_LIFECYCLE_STEPS: WorkflowStep[] = [
  {
    id: "overview",
    type: "info_card",
    question: "Your Recipe Journey",
    subtitle:
      "Every recipe in Prep Mi follows a simple flow: discover, explore, shop, cook, share, and reflect. Let us walk you through it.",
    required: false,
  },
  {
    id: "discover",
    type: "info_card",
    question: "Discover in Feed",
    subtitle:
      "Your feed is personalised to you.\n\n-> Swipe right to save a recipe\n-> Swipe left to skip\n-> Tap a card to explore it",
    required: false,
  },
  {
    id: "recipe_detail",
    type: "info_card",
    question: "Recipe Details",
    subtitle:
      "See the hero image, stats, dietary info, and chef notes.\n\n-> Adjust servings with the stepper\n-> Bookmark to save for later\n-> Tap 'Let's Cook' when you're ready",
    required: false,
  },
  {
    id: "ingredients",
    type: "info_card",
    question: "Ingredients Check",
    subtitle:
      "See what you have, what you need, and what's missing.\n\n-> Green dots = in your pantry\n-> Check off items as you prep\n-> Tap 'Go Shopping' for anything missing",
    required: false,
  },
  {
    id: "shopping",
    type: "info_card",
    question: "Smart Shopping",
    subtitle:
      "Prep Mi groups your shopping list by vendor and finds the best deals.\n\n-> Shop tab shows vendor prices\n-> Run tab gives you a checklist\n-> Tap 'Start Cooking' when you're stocked up",
    required: false,
  },
  {
    id: "cook_mode",
    type: "info_card",
    question: "Cook Mode",
    subtitle:
      "Step-by-step cards guide you through the recipe.\n\n-> Swipe between steps\n-> Tap the timer ring to start/pause\n-> Check off instructions as you go\n-> Tap the grid icon to jump to any step",
    required: false,
  },
  {
    id: "share",
    type: "info_card",
    question: "Share Your Creation",
    subtitle:
      "After cooking, capture a photo and share a Prep Mi card.\n\n-> Choose square or story format\n-> Share to Instagram, WhatsApp, or save\n-> Copy the auto-generated caption",
    required: false,
  },
  {
    id: "reflect",
    type: "info_card",
    question: "Rate and Reflect",
    subtitle:
      "Rate the recipe and tell us if you'd cook it again.\n\n-> Star rating helps improve your feed\n-> Feedback tags refine recommendations\n-> The recipe enters a cooldown before resurfacing",
    required: false,
  },
];
