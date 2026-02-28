import { useState } from "react";
import { BETA_MODE } from "@/lib/devMode";
import { AlertTriangle, X } from "lucide-react";

const BetaBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (!BETA_MODE || dismissed) return null;

  return (
    <div className="relative bg-amber-500 text-white px-4 py-2 text-center text-sm font-medium z-[9999] flex items-center justify-center gap-2">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        <strong className="font-bold tracking-wide">BETA</strong>
        {" — "}
        This is a beta version. Features may change. Data may be reset during this period.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-amber-600 rounded transition-colors"
        aria-label="Dismiss beta banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default BetaBanner;
