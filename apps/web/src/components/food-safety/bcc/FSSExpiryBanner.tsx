import { AlertTriangle, ShieldAlert } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface FSSExpiryBannerProps {
  expiryDate: string | null;
}

export default function FSSExpiryBanner({ expiryDate }: FSSExpiryBannerProps) {
  if (!expiryDate) return null;

  const days = differenceInDays(parseISO(expiryDate), new Date());

  if (days > 90) return null;

  const isExpired = days <= 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
        isExpired
          ? "bg-destructive/15 text-destructive border border-destructive/30"
          : "bg-warning/15 text-warning border border-warning/30"
      }`}
    >
      {isExpired ? <ShieldAlert className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
      <span>
        {isExpired
          ? "Your Food Safety Supervisor certificate has expired. Update required before next audit."
          : `FSS certificate expires in ${days} day${days === 1 ? "" : "s"}. Renew soon to maintain compliance.`}
      </span>
    </div>
  );
}
