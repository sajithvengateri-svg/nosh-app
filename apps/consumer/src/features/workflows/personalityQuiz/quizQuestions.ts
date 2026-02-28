import type { WorkflowStep } from "../types";

export const PERSONALITY_QUIZ_STEPS: WorkflowStep[] = [
  {
    id: "quiz_intro",
    type: "info_card",
    question: "Build Your Nosh",
    subtitle:
      "Answer 10 quick scenarios and we'll figure out your cooking personality. There are no wrong answers!",
    required: false,
  },
  {
    id: "q1",
    type: "single_select",
    question: "It's Wednesday 5:45pm. What's your move?",
    options: [
      {
        label: "Check the meal plan — prepped since Sunday",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "That recipe I bookmarked looks good",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "10-minute pasta, done",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "Order in — I'll cook on Saturday",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q2",
    type: "single_select",
    question: "Your fridge is nearly empty. What do you do?",
    options: [
      {
        label: "This never happens — I have a system",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "Pop to the shop for a couple of things",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "Challenge accepted — fridge roulette",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "I'll do a big shop this weekend",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q3",
    type: "single_select",
    question: "A new recipe catches your eye. When do you try it?",
    options: [
      {
        label: "Schedule it for next week's plan",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "Tomorrow night — I'll pick up ingredients",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "Right now, with whatever I have",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "This Saturday — make a project of it",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q4",
    type: "single_select",
    question: "How do you feel about grocery shopping?",
    options: [
      {
        label: "I love it — with a detailed list, of course",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "Quick in-and-out, twice a week",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "Grab what looks good, figure it out later",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "One big Saturday shop and I'm sorted",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q5",
    type: "single_select",
    question: "Someone's coming for dinner tonight. Your reaction?",
    options: [
      {
        label: "Pull up the plan — I've got options",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "Great — I'll tweak tonight's recipe to serve more",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "Throw something together — it'll be an adventure",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "Can we do Saturday instead?",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q6",
    type: "single_select",
    question: "What's your relationship with leftovers?",
    options: [
      {
        label: "Planned — I batch cook specifically for them",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "Happy accident — lunch sorted tomorrow",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "What leftovers? I cook exactly what I need",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "Sunday's big cook feeds me half the week",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q7",
    type: "single_select",
    question: "Pick your ideal kitchen gadget:",
    options: [
      {
        label: "A smart meal planning whiteboard",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "A really good knife",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "An air fryer — speed is everything",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "A stand mixer for weekend projects",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q8",
    type: "single_select",
    question: "How many ingredients is too many?",
    options: [
      {
        label: "12+ is fine if the recipe is worth it",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "8-10 feels right for a good meal",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "More than 5 and I'm out",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "Depends — weeknight 6, weekend whatever",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q9",
    type: "single_select",
    question: "Your cooking playlist is:",
    options: [
      {
        label: "A curated Spotify playlist for the vibe",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "Whatever's on — I'm in the zone",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "No music — I'm racing the clock",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "Saturday kitchen soundtrack — podcasts + wine",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
  {
    id: "q10",
    type: "single_select",
    question: "What does 'sorted' mean to you?",
    options: [
      {
        label: "The whole week's meals are planned and prepped",
        value: "ocd_planner",
        personality: "ocd_planner",
        points: 3,
      },
      {
        label: "Tonight's dinner is handled, and tomorrow looks good",
        value: "humpday_nosher",
        personality: "humpday_nosher",
        points: 3,
      },
      {
        label: "Food's on the table in under 15 minutes",
        value: "thrill_seeker",
        personality: "thrill_seeker",
        points: 3,
      },
      {
        label: "I've got a plan for the weekend cook-up",
        value: "weekend_warrior",
        personality: "weekend_warrior",
        points: 3,
      },
    ],
    required: true,
  },
];
