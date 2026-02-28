import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shift, StaffRole } from "@/types/menu";
import { AlertTriangle } from "lucide-react";

interface ShiftEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  staffList: { id: string; name: string; role: StaffRole }[];
  onSave: (shift: Partial<Shift> & { id?: string }) => void;
  onDelete?: (shiftId: string) => void;
  isNew?: boolean;
  selectedDate: Date;
}

const roles: { value: StaffRole; label: string }[] = [
  { value: 'head-chef', label: 'Head Chef' },
  { value: 'sous-chef', label: 'Sous Chef' },
  { value: 'line-cook', label: 'Line Cook' },
  { value: 'prep-cook', label: 'Prep Cook' },
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'server', label: 'Server' },
  { value: 'manager', label: 'Manager' },
];

const stations = ['Exec', 'Hot', 'Grill', 'Sauté', 'Prep', 'Pastry', 'Cold', 'Dish', 'FOH'];

const statuses: { value: Shift['status']; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function ShiftEditDialog({
  open,
  onOpenChange,
  shift,
  staffList,
  onSave,
  onDelete,
  isNew = false,
  selectedDate,
}: ShiftEditDialogProps) {
  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    role: 'line-cook' as StaffRole,
    startTime: '09:00',
    endTime: '17:00',
    station: '',
    status: 'scheduled' as Shift['status'],
  });

  useEffect(() => {
    if (shift) {
      setFormData({
        staffId: shift.staffId,
        staffName: shift.staffName,
        role: shift.role,
        startTime: shift.startTime,
        endTime: shift.endTime,
        station: shift.station || '',
        status: shift.status,
      });
    } else {
      setFormData({
        staffId: '',
        staffName: '',
        role: 'line-cook',
        startTime: '09:00',
        endTime: '17:00',
        station: '',
        status: 'scheduled',
      });
    }
  }, [shift, open]);

  const handleStaffChange = (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId);
    if (staff) {
      setFormData(prev => ({
        ...prev,
        staffId: staff.id,
        staffName: staff.name,
        role: staff.role,
      }));
    }
  };

  const handleSave = () => {
    const shiftData: Partial<Shift> & { id?: string } = {
      id: shift?.id,
      staffId: formData.staffId,
      staffName: formData.staffName,
      role: formData.role,
      startTime: formData.startTime,
      endTime: formData.endTime,
      station: formData.station,
      status: formData.status,
      date: selectedDate,
      isOverride: true,
    };
    onSave(shiftData);
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (shift && onDelete) {
      onDelete(shift.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNew ? 'Add Override Shift' : 'Edit Shift Override'}
            <AlertTriangle className="w-4 h-4 text-warning" />
          </DialogTitle>
        </DialogHeader>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm text-warning">
          This override will supersede the rostering system. Changes are logged for audit.
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Staff Member</Label>
            <Select value={formData.staffId} onValueChange={handleStaffChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffList.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value: StaffRole) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Station</Label>
            <Select 
              value={formData.station} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, station: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map(station => (
                  <SelectItem key={station} value={station}>
                    {station}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: Shift['status']) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {!isNew && onDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              Remove Shift
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.staffId}>
              {isNew ? 'Add Shift' : 'Save Override'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
