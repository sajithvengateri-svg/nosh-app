import { Settings2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAppSettings, type AppSettings } from "@/hooks/useAppSettings";

interface ToggleRow {
  key: keyof AppSettings;
  label: string;
  homeLabel?: string;
  description: string;
  homeDescription?: string;
}

const TODO_TOGGLES: ToggleRow[] = [
  {
    key: "todoKanbanEnabled",
    label: "Kanban Board",
    homeLabel: "Board View",
    description: "Drag & drop task board",
    homeDescription: "See your tasks as draggable cards",
  },
  {
    key: "todoDayCarouselEnabled",
    label: "Day Carousel",
    homeLabel: "Week Planner",
    description: "Mon–Sun navigation strip",
    homeDescription: "Plan your week at a glance",
  },
  {
    key: "todoProgressBarEnabled",
    label: "Progress Bar",
    homeLabel: "Progress Tracker",
    description: "Show completion progress",
    homeDescription: "Watch your progress grow ✨",
  },
  {
    key: "todoShoppingTabEnabled",
    label: "Shopping Tab",
    homeLabel: "Shopping List",
    description: "Separate shopping list tab",
    homeDescription: "Keep a handy shopping list",
  },
  {
    key: "todoChefOrdersEnabled",
    label: "Chef Orders Tab",
    homeLabel: "Family Requests",
    description: "Review incoming task requests",
    homeDescription: "See what others have asked for",
  },
  {
    key: "todoHandwriteEnabled",
    label: "Handwriting Input",
    homeLabel: "Scribble Notes",
    description: "Finger-write tasks with AI recognition",
    homeDescription: "Scribble tasks with your finger 🖊️",
  },
  {
    key: "todoScanEnabled",
    label: "Photo Scan",
    homeLabel: "Snap & Add",
    description: "Scan photos to extract tasks",
    homeDescription: "Take a photo of your list & we'll read it 📸",
  },
  {
    key: "todoTemplatesEnabled",
    label: "Templates",
    homeLabel: "Quick Templates",
    description: "Save & reuse task templates",
    homeDescription: "Save your favourite lists to reuse",
  },
  {
    key: "todoDelegateEnabled",
    label: "Task Delegation",
    homeLabel: "Share Tasks",
    description: "Send tasks to team members",
    homeDescription: "Send tasks to your helpers",
  },
  {
    key: "todoVoiceEnabled",
    label: "Voice Commands",
    homeLabel: "Voice Control",
    description: "Control the portal with your voice",
    homeDescription: "Talk to add tasks & navigate 🎙️",
  },
  {
    key: "todoWorkflowsEnabled",
    label: "Workflows",
    homeLabel: "Routines",
    description: "Recurring task automation",
    homeDescription: "Set up daily/weekly routines ⏰",
  },
  {
    key: "todoAiSuggestEnabled",
    label: "AI Suggest",
    homeLabel: "Ideas",
    description: "Smart task suggestions powered by AI",
    homeDescription: "Get smart task ideas 💡",
  },
  {
    key: "todoSearchEnabled",
    label: "Search",
    homeLabel: "Search",
    description: "Search tasks across all dates",
    homeDescription: "Find any task quickly 🔍",
  },
  {
    key: "todoArchiveEnabled",
    label: "Archive",
    homeLabel: "Filed Away",
    description: "Browse and restore archived tasks",
    homeDescription: "See your filed-away tasks 📁",
  },
  {
    key: "thoughtOfDayEnabled",
    label: "Thought of the Day",
    homeLabel: "Daily Spark",
    description: "Daily motivational message on dashboard",
    homeDescription: "A little daily inspiration ✨",
  },
];

interface TodoSettingsDrawerProps {
  isHomeCook?: boolean;
}

export const TodoSettingsDrawer = ({ isHomeCook = false }: TodoSettingsDrawerProps) => {
  const { settings, updateSettings } = useAppSettings();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[320px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {isHomeCook ? "Customise Your Todo ✨" : "Todo Settings"}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            {isHomeCook
              ? "Toggle the tools you want — keep it simple or go all-in!"
              : "Show or hide features to suit your workflow"}
          </p>
        </SheetHeader>
        <div className="mt-6 space-y-1">
          {TODO_TOGGLES.map((toggle) => (
            <label
              key={toggle.key}
              className="flex items-center justify-between py-3 px-1 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="space-y-0.5 pr-4">
                <p className="text-sm font-medium text-foreground">
                  {isHomeCook && toggle.homeLabel ? toggle.homeLabel : toggle.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isHomeCook && toggle.homeDescription ? toggle.homeDescription : toggle.description}
                </p>
              </div>
              <Switch
                checked={settings[toggle.key] as boolean}
                onCheckedChange={(checked) =>
                  updateSettings({ [toggle.key]: checked })
                }
              />
            </label>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              updateSettings({
                todoKanbanEnabled: true,
                todoShoppingTabEnabled: true,
                todoChefOrdersEnabled: true,
                todoHandwriteEnabled: true,
                todoScanEnabled: true,
                todoTemplatesEnabled: true,
                todoDelegateEnabled: true,
                todoDayCarouselEnabled: true,
                todoProgressBarEnabled: true,
                todoVoiceEnabled: false,
                todoVoiceMode: "push",
                todoWorkflowsEnabled: true,
                todoAiSuggestEnabled: true,
                todoSearchEnabled: true,
                todoArchiveEnabled: true,
                thoughtOfDayEnabled: true,
              })
            }
          >
            Reset all to default
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
