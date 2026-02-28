import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
}

function POSPlaceholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Construction className="h-12 w-12 text-rose-400 mb-4" />
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="text-sm text-slate-400 mt-2 max-w-md">{description}</p>
    </div>
  );
}

// Kept — handled by ReservationOS integration
export const FunctionsScreen = () => <POSPlaceholder title="Functions & Events" description="Calendar, packages, and deposits — coming in Step 14." />;
export const FunctionDetail = () => <POSPlaceholder title="Function Detail" description="Booking detail and package builder — coming in Step 14." />;
