import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export type ValidationState = "idle" | "valid" | "invalid";

export interface ValidatedInputProps extends React.ComponentProps<"input"> {
  /** Explicit validation state. Overrides built-in required check when set. */
  validation?: ValidationState;
  /** Error message shown below input when invalid */
  errorMessage?: string;
  /** Hide feedback icons (border colour still applies) */
  hideIcons?: boolean;
  /** Custom validator — return true if valid, string for error message */
  validate?: (value: string) => boolean | string;
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ className, validation, errorMessage, hideIcons, validate, onChange, onBlur, ...props }, ref) => {
    const [touched, setTouched] = React.useState(false);
    const [internalValue, setInternalValue] = React.useState(
      (props.value ?? props.defaultValue ?? "") as string
    );
    const [customError, setCustomError] = React.useState<string | null>(null);

    // Sync internal value when controlled
    React.useEffect(() => {
      if (props.value !== undefined) setInternalValue(String(props.value));
    }, [props.value]);

    const computeState = React.useCallback(
      (val: string): ValidationState => {
        if (validation) return validation;
        if (!touched) return "idle";

        // Custom validator
        if (validate) {
          const result = validate(val);
          if (result === true) { setCustomError(null); return "valid"; }
          if (result === false) { setCustomError(null); return "invalid"; }
          setCustomError(result as string);
          return "invalid";
        }

        // Default: check required + non-empty, or number > 0
        if (props.required) {
          const trimmed = val.toString().trim();
          if (!trimmed) return "invalid";
          if (props.type === "number" && (isNaN(Number(trimmed)))) return "invalid";
        }

        if (val.toString().trim()) return "valid";
        return "idle";
      },
      [validation, touched, validate, props.required, props.type]
    );

    const state = computeState(internalValue);
    const displayError = errorMessage || customError;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      onBlur?.(e);
    };

    return (
      <div className="relative w-full">
        <Input
          ref={ref}
          className={cn(
            "pr-8 transition-colors",
            state === "valid" && "border-success focus-visible:ring-success/30",
            state === "invalid" && "border-destructive focus-visible:ring-destructive/30",
            className
          )}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {!hideIcons && state !== "idle" && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
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
ValidatedInput.displayName = "ValidatedInput";

export { ValidatedInput };
