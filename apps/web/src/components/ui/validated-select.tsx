import * as React from "react";
import { Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ValidationState = "idle" | "valid" | "invalid";

export interface ValidatedSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  validation?: ValidationState;
  errorMessage?: string;
  required?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
  triggerClassName?: string;
  id?: string;
}

const ValidatedSelect = ({ value, onValueChange, validation, errorMessage, required, placeholder, options, className, triggerClassName, id }: ValidatedSelectProps) => {
  const [touched, setTouched] = React.useState(false);

  const state: ValidationState = React.useMemo(() => {
    if (validation) return validation;
    if (!touched) return "idle";
    if (required && !value) return "invalid";
    if (value) return "valid";
    return "idle";
  }, [validation, touched, required, value]);

  return (
    <div className={cn("relative w-full", className)}>
      <Select
        value={value}
        onValueChange={(v) => {
          setTouched(true);
          onValueChange?.(v);
        }}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "transition-colors",
            state === "valid" && "border-success focus:ring-success/30",
            state === "invalid" && "border-destructive focus:ring-destructive/30",
            triggerClassName
          )}
          onBlur={() => setTouched(true)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {state !== "idle" && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
          {state === "valid" && <Check className="w-3.5 h-3.5 text-success" />}
          {state === "invalid" && <X className="w-3.5 h-3.5 text-destructive" />}
        </div>
      )}
      {state === "invalid" && errorMessage && (
        <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export { ValidatedSelect };
