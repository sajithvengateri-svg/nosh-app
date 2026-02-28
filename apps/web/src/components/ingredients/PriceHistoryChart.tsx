import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PriceHistoryChartProps {
  ingredientId: string;
  ingredientName: string;
  currentPrice: number;
  unit: string;
}

interface PricePoint {
  date: string;
  price: number;
  displayDate: string;
}

const PriceHistoryChart = ({ ingredientId, ingredientName, currentPrice, unit }: PriceHistoryChartProps) => {
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      const { data: history, error } = await supabase
        .from("ingredient_price_history")
        .select("new_price, created_at")
        .eq("ingredient_id", ingredientId)
        .order("created_at", { ascending: true });

      if (!error && history) {
        const points: PricePoint[] = history.map((h) => ({
          date: h.created_at,
          price: Number(h.new_price),
          displayDate: format(new Date(h.created_at), "dd MMM"),
        }));
        
        // Add current price as latest point
        points.push({
          date: new Date().toISOString(),
          price: currentPrice,
          displayDate: "Now",
        });
        
        setData(points);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [open, ingredientId, currentPrice]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="top">
        <h4 className="text-sm font-semibold mb-1">{ingredientName}</h4>
        <p className="text-xs text-muted-foreground mb-3">Price per {unit} over time</p>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : data.length <= 1 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No price changes recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data}>
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                width={45}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
                labelFormatter={(label) => label}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default PriceHistoryChart;
