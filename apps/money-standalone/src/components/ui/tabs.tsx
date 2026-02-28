import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsContextValue {
  value: string;
  onChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue>({ value: "", onChange: () => {} });

function Tabs({ defaultValue, value, onValueChange, children, className, ...props }: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value ?? internal;
  const onChange = onValueChange ?? setInternal;

  return (
    <TabsContext.Provider value={{ value: current, onChange }}>
      <div className={className} {...props}>{children}</div>
    </TabsContext.Provider>
  );
}

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground", className)}
      {...props}
    />
  ),
);
TabsList.displayName = "TabsList";

function TabsTrigger({ value, className, children, ...props }: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(TabsContext);
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.onChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
        isActive ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className, children, ...props }: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;

  return (
    <div role="tabpanel" className={cn("mt-2", className)} {...props}>
      {children}
    </div>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
