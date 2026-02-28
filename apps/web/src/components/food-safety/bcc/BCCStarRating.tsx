import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface BCCStarRatingProps {
  rating: number; // 0–5
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const LABELS: Record<number, string> = {
  5: "Excellent",
  4: "Very Good",
  3: "Good",
  2: "Poor",
  1: "Poor",
  0: "Non-Compliant",
};

const SIZE_MAP = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-8 h-8" };

export default function BCCStarRating({ rating, size = "md", showLabel = true }: BCCStarRatingProps) {
  const stars = Math.max(0, Math.min(5, Math.round(rating)));
  const iconSize = SIZE_MAP[size];

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(iconSize, i < stars ? "fill-[#FFD700] text-[#FFD700]" : "text-muted-foreground/30")}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn("font-semibold", size === "lg" ? "text-lg" : "text-sm")}>
          {LABELS[stars] ?? ""}
        </span>
      )}
    </div>
  );
}
