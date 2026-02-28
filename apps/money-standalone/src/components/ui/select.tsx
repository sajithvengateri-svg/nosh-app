import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue>({ value: "", onChange: () => {}, open: false, setOpen: () => {} });

function Select({ value, defaultValue, onValueChange, children }: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const current = value ?? internal;
  const onChange = onValueChange ?? setInternal;

  return (
    <SelectContext.Provider value={{ value: current, onChange, open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </SelectContext.Provider>
  );
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => ctx.setOpen(!ctx.open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  },
);
SelectTrigger.displayName = "SelectTrigger";

function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = React.useContext(SelectContext);
  return <span>{ctx.value || placeholder || ""}</span>;
}

function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(SelectContext);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!ctx.open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) ctx.setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctx.open]);

  if (!ctx.open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className,
      )}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(SelectContext);
  return (
    <div
      onClick={() => { ctx.onChange(value); ctx.setOpen(false); }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        ctx.value === value && "bg-accent text-accent-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
