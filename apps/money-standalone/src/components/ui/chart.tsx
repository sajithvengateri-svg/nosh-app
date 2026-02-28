import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

interface ChartConfig {
  [key: string]: { label: string; color: string; icon?: React.ComponentType };
}

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextValue>({ config: {} });

export function useChart() {
  return React.useContext(ChartContext);
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
}

export function ChartContainer({ config, children, className, ...props }: ChartContainerProps) {
  const cssVars = Object.entries(config).reduce<Record<string, string>>((acc, [key, val]) => {
    acc[`--color-${key}`] = val.color;
    return acc;
  }, {});

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} style={cssVars as React.CSSProperties} {...props}>
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export function ChartTooltip(props: React.ComponentProps<typeof Tooltip>) {
  return <Tooltip {...props} />;
}

export function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-md">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium text-foreground">
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
