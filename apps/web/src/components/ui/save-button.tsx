import * as React from "react";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SaveButtonProps extends ButtonProps {
  /** Current save status — controls inline indicator */
  status?: SaveStatus;
  /** Text to show in each state */
  labels?: { idle?: string; saving?: string; saved?: string; error?: string };
  /** Auto-reset to idle after success (ms). 0 = no reset. Default 2500 */
  resetDelay?: number;
  /** Callback when status resets to idle */
  onStatusReset?: () => void;
}

const defaultLabels = {
  idle: "Save",
  saving: "Saving…",
  saved: "Saved",
  error: "Failed",
};

const SaveButton = React.forwardRef<HTMLButtonElement, SaveButtonProps>(
  ({ className, status = "idle", labels, resetDelay = 2500, onStatusReset, children, disabled, ...props }, ref) => {
    const mergedLabels = { ...defaultLabels, ...labels };

    React.useEffect(() => {
      if ((status === "saved" || status === "error") && resetDelay > 0) {
        const timer = setTimeout(() => onStatusReset?.(), resetDelay);
        return () => clearTimeout(timer);
      }
    }, [status, resetDelay, onStatusReset]);

    const icon =
      status === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> :
      status === "saved" ? <Check className="w-4 h-4" /> :
      status === "error" ? <X className="w-4 h-4" /> :
      null;

    const label =
      children && status === "idle"
        ? children
        : mergedLabels[status];

    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all",
          status === "saved" && "bg-success text-success-foreground hover:bg-success/90",
          status === "error" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          className
        )}
        disabled={disabled || status === "saving"}
        {...props}
      >
        {icon}
        {label}
      </Button>
    );
  }
);
SaveButton.displayName = "SaveButton";

export { SaveButton };
