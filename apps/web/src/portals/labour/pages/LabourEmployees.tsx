import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrg } from "@/contexts/OrgContext";
import { useEmployeeProfiles } from "@/lib/shared/queries/labourQueries";
import { Badge } from "@/components/ui/badge";

const LabourEmployees = () => {
  const { currentOrg } = useOrg();
  const { data: employees, isLoading } = useEmployeeProfiles(currentOrg?.id);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground text-sm">Manage staff profiles and classifications</p>
        </div>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !employees?.length ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No employees onboarded yet. Add your first employee to get started.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {employees.map(emp => (
            <Card key={emp.id}>
              <CardContent className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{emp.user_id}</p>
                  <p className="text-xs text-muted-foreground">{emp.classification} • {emp.employment_type}</p>
                </div>
                <Badge variant={emp.pay_type === 'ABOVE_AWARD_SALARY' ? 'default' : 'secondary'}>{emp.pay_type.replace(/_/g, ' ')}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabourEmployees;
