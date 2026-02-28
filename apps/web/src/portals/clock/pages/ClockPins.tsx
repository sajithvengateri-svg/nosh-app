import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { KeyRound, RefreshCw, AlertCircle } from "lucide-react";

const ClockPins = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (!orgId) return;
    const load = async () => {
      const { data: emps } = await supabase.from("employee_profiles").select("user_id, classification").eq("org_id", orgId).eq("is_active", true);
      if (!emps) return;
      const userIds = emps.map((e: any) => e.user_id);
      const [profiles, pins] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
        supabase.from("employee_pins").select("user_id, is_temporary, failed_attempts, locked_until").eq("org_id", orgId),
      ]);
      setEmployees(emps.map((e: any) => ({
        ...e,
        full_name: profiles.data?.find((p: any) => p.user_id === e.user_id)?.full_name || "Unknown",
        pin: pins.data?.find((p: any) => p.user_id === e.user_id),
      })));
    };
    load();
  }, [orgId]);

  const generatePin = () => {
    let pin: string;
    do {
      pin = String(Math.floor(1000 + Math.random() * 9000));
    } while (/^(\d)\1{3}$/.test(pin) || /^(0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)$/.test(pin));
    return pin;
  };

  const resetPin = async (userId: string) => {
    if (!orgId) return;
    const newPin = generatePin();
    // In production, this would be hashed. For demo, store as-is.
    const { error } = await supabase.from("employee_pins").upsert({
      org_id: orgId,
      user_id: userId,
      pin_hash: newPin, // Demo: plain text. Production: bcrypt hash via edge function
      is_temporary: true,
      failed_attempts: 0,
      locked_until: null,
    }, { onConflict: "org_id,user_id" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "PIN Reset", description: `New temporary PIN: ${newPin}. Give this to the employee.` });
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><KeyRound className="w-6 h-6" /> PIN Management</h1>
        <p className="text-muted-foreground">Generate, reset, and manage employee clock-in PINs</p>
      </div>

      <div className="space-y-2">
        {employees.map((e) => (
          <Card key={e.user_id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{e.full_name}</p>
                <p className="text-xs text-muted-foreground">{e.classification}</p>
              </div>
              <div className="flex items-center gap-3">
                {e.pin ? (
                  <>
                    <Badge variant={e.pin.is_temporary ? "secondary" : "default"}>
                      {e.pin.is_temporary ? "Temporary" : "Active"}
                    </Badge>
                    {e.pin.failed_attempts > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {e.pin.failed_attempts} fails
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="outline">No PIN</Badge>
                )}
                <Button size="sm" variant="outline" onClick={() => resetPin(e.user_id)}>
                  <RefreshCw className="w-3 h-3 mr-1" /> {e.pin ? "Reset" : "Generate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClockPins;
