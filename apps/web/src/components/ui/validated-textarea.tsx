import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export type ValidationState = "idle" | "valid" | "invalid";

export interface ValidatedTextareaProps extends React.ComponentProps<"textarea"> {
  validation?: ValidationState;
  errorMessage?: string;
  validate?: (value: string) => boolean | string;
}

const ValidatedTextarea = React.forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ className, validation, errorMessage, validate, onChange, onBlur, ...props }, ref) => {
    const [touched, setTouched] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(
      (props.value ?? props.defaultValue ?? "") as string
    );
    const [customError, setCustomError] = React.useState<string | null>(null);

    React.useEffect(() => {
      if (props.value !== undefined) setInternalValue(String(props.value));
    }, [props.value]);

    const computeState = React.useCallback(
      (val: string): ValidationState => {
        if (validation) return validation;
        if (!touched) return "idle";
        if (validate) {
          const result = validate(val);
          if (result === true) { setCustomError(null); return "valid"; }
          if (result === false) { setCustomError(null); return "invalid"; }
          setCustomError(result as string);
          return "invalid";
        }
        if (props.required && !val.trim()) return "invalid";
        if (val.trim()) return "valid";
        return "idle";
      },
      [validation, touched, validate, props.required]
    );

    const state = computeState(internalValue);
    const displayError = errorMessage || customError;

    return (
      <div className="relative w-full">
        <Textarea
          ref={ref}
          className={cn(
            "pr-8 transition-colors",
            state === "valid" && "border-success focus-visible:ring-success/30",
            state === "invalid" && "border-destructive focus-visible:ring-destructive/30",
            className
          )}
          onChange={(e) => { setInternalValue(e.target.value); onChange?.(e); }}
          onBlur={(e) => { setTouched(true); onBlur?.(e); }}
          {...props}
        />
        {state !== "idle" && (
          <div className="absolute right-2 top-3 pointer-events-none">
            {state === "valid" && <Check className="w-4 h-4 text-success" />}
            {state === "invalid" && <X className="w-4 h-4 text-destructive" />}
          </div>
        )}
        {state === "invalid" && displayError && (
          <p className="text-xs text-destructive mt-1">{displayError}</p>
        )}
      </div>
    );
  }
);
ValidatedTextarea.displayName = "ValidatedTextarea";

export { ValidatedTextarea };
