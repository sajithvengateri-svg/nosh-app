import { useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Clock,
  Users,
  Sparkles,
  UserPlus,
  Sun,
  Moon,
  Coffee,
  Plus,
  Crown,
  Armchair,
} from "lucide-react";
import { format, parse } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useServicePeriod } from "../hooks/useServicePeriod";

interface ServiceCalendarPaneProps {
  selectedDate: string; // yyyy-MM-dd
  onDateSelect: (date: string) => void;
  servicePeriod: string; // 'all' | 'breakfast' | 'lunch' | 'dinner'
  onServicePeriodChange: (period: string) => void;
  stats: {
    totalCovers: number;
    confirmedCount: number;
    seatedCount: number;
    availableTables: number;
    waitlistCount: number;
    vipCount: number;
  };
  pendingAuditCount: number;
  onAuditClick: () => void;
  onWalkInClick: () => void;
  onNewBookingClick: () => void;
  // Zone waiter assignment (optional)
  zones?: Array<{ id: string; zone: string; label: string }>;
  waiters?: Array<{ id: string; display_name: string }>;
  zoneWaiterMap?: Record<string, { staffId: string; staffName: string }>;
  onZoneWaiterChange?: (zone: string, staff: { staffId: string; staffName: string }) => void;
}

const ServiceCalendarPane = ({
  selectedDate,
  onDateSelect,
  servicePeriod,
  onServicePeriodChange,
  stats,
  pendingAuditCount,
  onAuditClick,
  onWalkInClick,
  onNewBookingClick,
  zones,
  waiters,
  zoneWaiterMap,
  onZoneWaiterChange,
}: ServiceCalendarPaneProps) => {
  const { servicePeriods: dynamicPeriods, getCurrentServicePeriod: getDynamicCurrentPeriod } = useServicePeriod();

  const servicePeriods = useMemo(() => [
    { key: "all", label: "All", icon: null },
    ...dynamicPeriods.map((p) => ({
      key: p.key,
      label: p.label,
      icon: p.key.toLowerCase().includes("breakfast") ? Coffee
        : p.key.toLowerCase().includes("lunch") ? Sun
        : p.key.toLowerCase().includes("dinner") ? Moon
        : Moon,
    })),
  ], [dynamicPeriods]);

  function getCurrentServicePeriod(): string {
    return getDynamicCurrentPeriod() ?? "all";
  }

  const selectedDateObj = useMemo(
    () => parse(selectedDate, "yyyy-MM-dd", new Date()),
    [selectedDate]
  );

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(format(date, "yyyy-MM-dd"));
    }
  };

  const handleNowClick = () => {
    onDateSelect(format(new Date(), "yyyy-MM-dd"));
    onServicePeriodChange(getCurrentServicePeriod());
  };

  const statsGrid = [
    { label: "Covers", value: stats.totalCovers, icon: CalendarCheck },
    { label: "Confirmed", value: stats.confirmedCount, icon: CalendarCheck },
    { label: "Seated", value: stats.seatedCount, icon: Users },
    { label: "Tables Free", value: stats.availableTables, icon: Armchair },
    { label: "Waitlist", value: stats.waitlistCount, icon: Clock },
    { label: "VIPs", value: stats.vipCount, icon: Crown },
  ];

  return (
    <aside className="w-[280px] h-full bg-card border-r flex flex-col overflow-y-auto">
      <div className="p-3 space-y-4">
        {/* Compact Calendar */}
        <div>
          <Calendar
            mode="single"
            selected={selectedDateObj}
            onSelect={handleCalendarSelect}
            className="rounded-md border"
          />
        </div>

        {/* "Now" Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleNowClick}
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          Now
        </Button>

        {/* Service Period Pills */}
        <div className="flex gap-1">
          {servicePeriods.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              size="sm"
              variant={servicePeriod === key ? "default" : "outline"}
              className={cn(
                "flex-1 h-8 px-1.5 text-xs",
                servicePeriod !== key && "text-muted-foreground"
              )}
              onClick={() => onServicePeriodChange(key)}
            >
              {Icon && <Icon className="w-3 h-3 mr-1 flex-shrink-0" />}
              <span className="truncate">{label}</span>
            </Button>
          ))}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          {statsGrid.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="rounded-lg border bg-muted/40 p-2 flex flex-col items-center justify-center"
            >
              <Icon className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
              <span className="text-lg font-bold leading-tight">{value}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onAuditClick}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Pre-Service Audit
            {pendingAuditCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-[10px] h-5 px-1.5">
                {pendingAuditCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onWalkInClick}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Walk-In
          </Button>

          <Button
            variant="default"
            className="w-full justify-start"
            onClick={onNewBookingClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Zone Waiter Assignment */}
        {zones && zones.length > 0 && waiters && waiters.length > 0 && onZoneWaiterChange && (
          <div className="border-t pt-3 mt-2">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Zone Waiters
            </h4>
            <div className="space-y-1.5">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate">{zone.label}</span>
                  <Select
                    value={zoneWaiterMap?.[zone.zone]?.staffId ?? ""}
                    onValueChange={(staffId) => {
                      const staff = waiters.find((w) => w.id === staffId);
                      if (staff) {
                        onZoneWaiterChange(zone.zone, { staffId: staff.id, staffName: staff.display_name });
                      }
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-7 text-xs">
                      <SelectValue placeholder="Assign..." />
                    </SelectTrigger>
                    <SelectContent>
                      {waiters.map((w) => (
                        <SelectItem key={w.id} value={w.id} className="text-xs">
                          {w.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ServiceCalendarPane;
