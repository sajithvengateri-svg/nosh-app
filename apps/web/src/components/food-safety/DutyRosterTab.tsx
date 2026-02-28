import { useState } from "react";
import { Users, Sun, Moon, Calendar as CalendarIcon, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useFoodSafetyDuties } from "@/hooks/useFoodSafetyDuties";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DutyRosterTab = () => {
  const { isHeadChef } = useAuth();
  const { teamMembers, loading, resolveDuty, assignDuty, getDefaultDuties } = useFoodSafetyDuties();
  const [overrideDate, setOverrideDate] = useState<Date | undefined>(undefined);

  const todayAM = resolveDuty("am");
  const todayPM = resolveDuty("pm");
  const defaults = getDefaultDuties();

  const handleAssignDefault = async (shift: "am" | "pm", userId: string) => {
    await assignDuty(shift, userId, null);
    toast.success(`Default ${shift.toUpperCase()} duty assigned`);
  };

  const handleAssignOverride = async (shift: "am" | "pm", userId: string) => {
    if (!overrideDate) return;
    await assignDuty(shift, userId, format(overrideDate, "yyyy-MM-dd"));
    toast.success(`${shift.toUpperCase()} duty assigned for ${format(overrideDate, "d MMM")}`);
  };

  const initials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const DutyCard = ({ label, icon, duty }: { label: string; icon: React.ReactNode; duty: ReturnType<typeof resolveDuty> }) => (
    <Card className={cn("border", duty.user_id ? "border-primary/20" : "border-dashed border-muted-foreground/30")}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-primary/10">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {duty.user_id ? (
            <div className="flex items-center gap-2 mt-1">
              <Avatar className="h-7 w-7">
                <AvatarImage src={duty.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary/10">{initials(duty.full_name)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-foreground truncate">{duty.full_name}</span>
              {duty.isDefault && <Badge variant="secondary" className="text-[10px]">Default</Badge>}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
              <UserX className="w-4 h-4" />
              <span className="text-sm">Unassigned</span>
            </div>
          )}
        </div>
        {duty.user_id && <UserCheck className="w-5 h-5 text-primary shrink-0" />}
      </CardContent>
    </Card>
  );

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading roster...</div>;

  return (
    <div className="space-y-6">
      {/* Today's Assignments */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Today's Food Safety Duty
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DutyCard label="AM Shift" icon={<Sun className="w-5 h-5 text-amber-500" />} duty={todayAM} />
          <DutyCard label="PM Shift" icon={<Moon className="w-5 h-5 text-indigo-400" />} duty={todayPM} />
        </div>
      </div>

      {/* Default Roster Management */}
      {isHeadChef && (
        <div>
          <h3 className="text-base font-semibold mb-3">Default Roster</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set recurring defaults — these apply every day unless overridden.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["am", "pm"] as const).map(shift => {
              const defaultDuty = defaults.find(d => d.shift === shift);
              return (
                <div key={shift} className="card-elevated p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {shift === "am" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                    <span className="font-medium">{shift.toUpperCase()} Default</span>
                  </div>
                  <Select
                    value={defaultDuty?.user_id || ""}
                    onValueChange={(v) => handleAssignDefault(shift, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.full_name} ({m.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Override */}
      {isHeadChef && (
        <div>
          <h3 className="text-base font-semibold mb-3">Date Override</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Assign a different chef for a specific date.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <CalendarIcon className="w-4 h-4" />
                  {overrideDate ? format(overrideDate, "d MMM yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={overrideDate} onSelect={setOverrideDate} />
              </PopoverContent>
            </Popover>
          </div>

          {overrideDate && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {(["am", "pm"] as const).map(shift => {
                const resolved = resolveDuty(shift, format(overrideDate, "yyyy-MM-dd"));
                return (
                  <div key={shift} className="card-elevated p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {shift === "am" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                      <span className="font-medium">{shift.toUpperCase()} — {format(overrideDate, "d MMM")}</span>
                      {resolved.user_id && !resolved.isDefault && (
                        <Badge variant="outline" className="text-[10px]">Override</Badge>
                      )}
                    </div>
                    <Select
                      value={resolved.user_id || ""}
                      onValueChange={(v) => handleAssignOverride(shift, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map(m => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DutyRosterTab;
