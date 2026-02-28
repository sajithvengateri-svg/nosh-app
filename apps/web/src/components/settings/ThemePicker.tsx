import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemeOption = "light" | "dark" | "system" | "pink-onion" | "rainbow" | "ocean" | "terminal" | "lavender";

interface ThemePickerProps {
  value: ThemeOption;
  onChange: (theme: ThemeOption) => void;
}

const THEMES: { id: ThemeOption; label: string; colors: string[]; desc: string }[] = [
  { id: "light", label: "Kitchen", colors: ["hsl(30,25%,97%)", "hsl(25,85%,45%)", "hsl(145,25%,40%)"], desc: "Warm copper & cream" },
  { id: "dark", label: "Kitchen Dark", colors: ["hsl(25,25%,8%)", "hsl(30,75%,55%)", "hsl(145,30%,50%)"], desc: "Dark warm tones" },
  { id: "system", label: "System", colors: ["hsl(0,0%,95%)", "hsl(0,0%,50%)", "hsl(0,0%,20%)"], desc: "Match device" },
  { id: "pink-onion", label: "Pink Onion", colors: ["hsl(340,15%,97%)", "hsl(340,70%,55%)", "hsl(25,60%,50%)"], desc: "Warm pinks & rose" },
  { id: "rainbow", label: "Rainbow", colors: ["hsl(280,20%,98%)", "hsl(280,65%,55%)", "hsl(160,60%,45%)"], desc: "Vibrant multi-color" },
  { id: "ocean", label: "Ocean Blue", colors: ["hsl(210,30%,97%)", "hsl(210,70%,50%)", "hsl(180,50%,45%)"], desc: "Cool blues & teal" },
  { id: "terminal", label: "Terminal", colors: ["hsl(120,10%,5%)", "hsl(120,80%,55%)", "hsl(120,60%,40%)"], desc: "Hacker green-on-black" },
  { id: "lavender", label: "Lavender", colors: ["hsl(270,25%,97%)", "hsl(270,55%,60%)", "hsl(270,40%,45%)"], desc: "Soft calming purple" },
];

const ThemePicker = ({ value, onChange }: ThemePickerProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {THEMES.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
            value === t.id
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border hover:border-primary/30 hover:bg-muted/50"
          )}
        >
          {value === t.id && (
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
          <div className="flex gap-1.5">
            {t.colors.map((c, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border border-black/10"
                style={{ background: c }}
              />
            ))}
          </div>
          <span className="text-xs font-medium">{t.label}</span>
          <span className="text-[10px] text-muted-foreground leading-tight text-center">{t.desc}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemePicker;
