import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Shield, Key } from "lucide-react";

interface StaffMember {
  id: string; name: string; role: string; pinSet: boolean; active: boolean;
}

const demoStaff: StaffMember[] = [
  { id: "s1", name: "Emma Davis", role: "Admin", pinSet: true, active: true },
  { id: "s2", name: "Tom Wilson", role: "Manager", pinSet: true, active: true },
  { id: "s3", name: "Sophie Chen", role: "Supervisor", pinSet: true, active: true },
  { id: "s4", name: "Ryan Mitchell", role: "Cashier", pinSet: true, active: true },
  { id: "s5", name: "Jack Brown", role: "Cashier", pinSet: false, active: true },
  { id: "s6", name: "Mei Tanaka", role: "Cashier", pinSet: true, active: false },
];

const roleColors: Record<string, string> = {
  Admin: "bg-red-500/20 text-red-400",
  Manager: "bg-purple-500/20 text-purple-400",
  Supervisor: "bg-blue-500/20 text-blue-400",
  Cashier: "bg-slate-500/20 text-slate-400",
};

const permissions = [
  { action: "Process Orders", Cashier: true, Supervisor: true, Manager: true, Admin: true },
  { action: "Apply Discounts", Cashier: false, Supervisor: true, Manager: true, Admin: true },
  { action: "Void Orders", Cashier: false, Supervisor: false, Manager: true, Admin: true },
  { action: "Process Refunds", Cashier: false, Supervisor: false, Manager: true, Admin: true },
  { action: "Open Cash Drawer", Cashier: false, Supervisor: false, Manager: true, Admin: true },
  { action: "View Reports", Cashier: false, Supervisor: true, Manager: true, Admin: true },
  { action: "Manage Staff", Cashier: false, Supervisor: false, Manager: false, Admin: true },
  { action: "Change Settings", Cashier: false, Supervisor: false, Manager: false, Admin: true },
];

export default function POSStaffAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">POS Staff Admin</h1>
          <p className="text-sm text-slate-400">Roles, PINs, and permissions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add POS Staff</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input placeholder="Full name" /></div>
              <div><Label>Role</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>PIN (4 digits)</Label><Input type="password" maxLength={4} placeholder="••••" /></div>
              <Button className="w-full">Add Staff</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff List */}
      <div className="space-y-2">
        {demoStaff.map((s) => (
          <Card key={s.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className={roleColors[s.role] || ""} variant="secondary">{s.role}</Badge>
                    {!s.active && <Badge variant="outline" className="text-slate-500 border-slate-600">Inactive</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {s.pinSet ? (
                  <Badge variant="outline" className="text-emerald-400 border-emerald-500/30"><Key className="w-3 h-3 mr-1" /> PIN Set</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/30"><Key className="w-3 h-3 mr-1" /> No PIN</Badge>
                )}
                <Button variant="ghost" size="sm" className="text-slate-400">Reset PIN</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="text-sm text-white flex items-center gap-2"><Shield className="w-4 h-4" /> Permission Matrix</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-slate-400 font-medium">Action</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Cashier</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Supervisor</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Manager</th>
                  <th className="text-center py-2 text-slate-400 font-medium">Admin</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p.action} className="border-b border-white/5">
                    <td className="py-2 text-white">{p.action}</td>
                    {(["Cashier", "Supervisor", "Manager", "Admin"] as const).map((role) => (
                      <td key={role} className="text-center py-2">
                        {p[role] ? <span className="text-emerald-400">✓</span> : <span className="text-slate-600">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
