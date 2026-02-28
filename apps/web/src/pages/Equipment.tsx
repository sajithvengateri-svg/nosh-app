import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus,
  Wrench,
  Phone,
  Mail,
  Edit,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Package,
  Scan
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AssetLabelScanner } from "@/components/equipment/AssetLabelScanner";

interface TechContact {
  name: string;
  phone: string;
  email: string;
}

interface EquipmentItem {
  id: string;
  name: string;
  model: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  location: string;
  status: string | null;
  maintenance_schedule: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  tech_contacts: TechContact[];
  notes: string | null;
}

const statusOptions = [
  { value: "operational", label: "Operational", color: "bg-success/10 text-success" },
  { value: "needs_maintenance", label: "Needs Maintenance", color: "bg-warning/10 text-warning" },
  { value: "out_of_service", label: "Out of Service", color: "bg-destructive/10 text-destructive" },
  { value: "retired", label: "Retired", color: "bg-muted text-muted-foreground" },
];

const Equipment = () => {
  const { canEdit } = useAuth();
  const { currentOrg } = useOrg();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(null);
  const [deletingEquipment, setDeletingEquipment] = useState<EquipmentItem | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    model: "",
    serial_number: "",
    manufacturer: "",
    purchase_date: "",
    warranty_expiry: "",
    location: "Kitchen",
    status: "operational",
    maintenance_schedule: "",
    next_maintenance: "",
    notes: "",
    tech_contacts: [] as TechContact[],
  });

  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "" });

  const hasEditPermission = canEdit("equipment");

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching equipment:", error);
      toast.error("Failed to load equipment");
    } else {
      const formattedData = (data || []).map(item => ({
        ...item,
        tech_contacts: (Array.isArray(item.tech_contacts) ? item.tech_contacts : []) as unknown as TechContact[],
      }));
      setEquipment(formattedData);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Equipment name is required");
      return;
    }

    const payload = {
      name: formData.name,
      model: formData.model || null,
      serial_number: formData.serial_number || null,
      manufacturer: formData.manufacturer || null,
      purchase_date: formData.purchase_date || null,
      warranty_expiry: formData.warranty_expiry || null,
      location: formData.location,
      status: formData.status,
      maintenance_schedule: formData.maintenance_schedule || null,
      next_maintenance: formData.next_maintenance || null,
      notes: formData.notes || null,
      tech_contacts: JSON.parse(JSON.stringify(formData.tech_contacts)),
    };

    if (editingEquipment) {
      const { error } = await supabase
        .from("equipment")
        .update(payload)
        .eq("id", editingEquipment.id);

      if (error) {
        toast.error("Failed to update equipment");
        console.error(error);
        return;
      }
      toast.success("Equipment updated");
    } else {
      const { error } = await supabase.from("equipment").insert({ ...payload, org_id: currentOrg?.id });

      if (error) {
        toast.error("Failed to add equipment");
        console.error(error);
        return;
      }
      toast.success("Equipment added");
    }

    resetForm();
    fetchEquipment();
  };

  const handleDelete = async () => {
    if (!deletingEquipment) return;

    const { error } = await supabase
      .from("equipment")
      .delete()
      .eq("id", deletingEquipment.id);

    if (error) {
      toast.error("Failed to delete equipment");
      console.error(error);
      return;
    }

    toast.success("Equipment deleted");
    setDeleteDialogOpen(false);
    setDeletingEquipment(null);
    if (selectedEquipment?.id === deletingEquipment.id) {
      setSelectedEquipment(null);
    }
    fetchEquipment();
  };

  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) return;
    setFormData({
      ...formData,
      tech_contacts: [...formData.tech_contacts, newContact],
    });
    setNewContact({ name: "", phone: "", email: "" });
  };

  const removeContact = (index: number) => {
    setFormData({
      ...formData,
      tech_contacts: formData.tech_contacts.filter((_, i) => i !== index),
    });
  };

  const openEditDialog = (item: EquipmentItem) => {
    setEditingEquipment(item);
    setFormData({
      name: item.name,
      model: item.model || "",
      serial_number: item.serial_number || "",
      manufacturer: item.manufacturer || "",
      purchase_date: item.purchase_date || "",
      warranty_expiry: item.warranty_expiry || "",
      location: item.location,
      status: item.status || "operational",
      maintenance_schedule: item.maintenance_schedule || "",
      next_maintenance: item.next_maintenance || "",
      notes: item.notes || "",
      tech_contacts: item.tech_contacts,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingEquipment(null);
    setFormData({
      name: "",
      model: "",
      serial_number: "",
      manufacturer: "",
      purchase_date: "",
      warranty_expiry: "",
      location: "Kitchen",
      status: "operational",
      maintenance_schedule: "",
      next_maintenance: "",
      notes: "",
      tech_contacts: [],
    });
    setNewContact({ name: "", phone: "", email: "" });
  };

  const handleScanData = (data: {
    name?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    manufacture_date?: string;
    warranty_info?: string;
    notes?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      name: data.name || prev.name,
      manufacturer: data.manufacturer || prev.manufacturer,
      model: data.model || prev.model,
      serial_number: data.serial_number || prev.serial_number,
      notes: [prev.notes, data.notes, data.warranty_info].filter(Boolean).join("\n"),
    }));
    setDialogOpen(true);
    toast.success("Scanned data applied to form");
  };

  const needsAttentionCount = equipment.filter(
    e => e.status === "needs_maintenance" || e.status === "out_of_service"
  ).length;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Equipment</h1>
            <p className="page-subtitle">Manage kitchen equipment and maintenance</p>
          </div>
          {hasEditPermission && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <Scan className="w-4 h-4 mr-2" />
                Scan Label
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </div>
          )}
        </motion.div>

        {/* Alert */}
        {needsAttentionCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated p-4 border-l-4 border-l-warning"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-semibold">{needsAttentionCount} items need attention</p>
                <p className="text-sm text-muted-foreground">Equipment requires maintenance or is out of service</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Equipment Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Equipment List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1 space-y-3"
            >
              {equipment.map((item, index) => {
                const statusInfo = statusOptions.find(s => s.value === item.status);
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => setSelectedEquipment(item)}
                    className={cn(
                      "card-interactive p-4 cursor-pointer",
                      selectedEquipment?.id === item.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Wrench className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.location}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        statusInfo?.color
                      )}>
                        {statusInfo?.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}

              {equipment.length === 0 && (
                <div className="card-elevated p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No equipment added</p>
                  {hasEditPermission && (
                    <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Equipment
                    </Button>
                  )}
                </div>
              )}
            </motion.div>

            {/* Equipment Details */}
            <div className="lg:col-span-2">
              {selectedEquipment ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-elevated"
                >
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedEquipment.name}</h2>
                      <p className="text-muted-foreground">{selectedEquipment.manufacturer} {selectedEquipment.model}</p>
                    </div>
                    {hasEditPermission && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedEquipment)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setDeletingEquipment(selectedEquipment);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <Tabs defaultValue="details" className="p-6">
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                      <TabsTrigger value="contacts">Tech Contacts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-4 mt-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Serial Number</p>
                          <p className="font-medium">{selectedEquipment.serial_number || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{selectedEquipment.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Purchase Date</p>
                          <p className="font-medium">
                            {selectedEquipment.purchase_date 
                              ? format(new Date(selectedEquipment.purchase_date), "MMM d, yyyy")
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                          <p className="font-medium">
                            {selectedEquipment.warranty_expiry 
                              ? format(new Date(selectedEquipment.warranty_expiry), "MMM d, yyyy")
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                      {selectedEquipment.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="font-medium">{selectedEquipment.notes}</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="maintenance" className="space-y-4 mt-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Schedule</p>
                          <p className="font-medium">{selectedEquipment.maintenance_schedule || "Not set"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Last Maintenance</p>
                          <p className="font-medium">
                            {selectedEquipment.last_maintenance 
                              ? format(new Date(selectedEquipment.last_maintenance), "MMM d, yyyy")
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Next Maintenance</p>
                          <p className="font-medium">
                            {selectedEquipment.next_maintenance 
                              ? format(new Date(selectedEquipment.next_maintenance), "MMM d, yyyy")
                              : "Not scheduled"}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="contacts" className="space-y-4 mt-4">
                      {selectedEquipment.tech_contacts.length === 0 ? (
                        <p className="text-muted-foreground">No technician contacts added</p>
                      ) : (
                        <div className="space-y-3">
                          {selectedEquipment.tech_contacts.map((contact, i) => (
                            <div key={i} className="p-4 rounded-lg bg-muted/50">
                              <p className="font-semibold">{contact.name}</p>
                              <div className="flex flex-wrap gap-4 mt-2">
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                  <Phone className="w-4 h-4" />
                                  {contact.phone}
                                </a>
                                {contact.email && (
                                  <a
                                    href={`mailto:${contact.email}`}
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                  >
                                    <Mail className="w-4 h-4" />
                                    {contact.email}
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </motion.div>
              ) : (
                <div className="card-elevated p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Select equipment to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={resetForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEquipment ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Equipment Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Combi Oven"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., Rational"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g., SCC 61"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial">Serial Number</Label>
                  <Input
                    id="serial"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    placeholder="e.g., SN123456"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Main Kitchen"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase">Purchase Date</Label>
                  <Input
                    id="purchase"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warranty">Warranty Expiry</Label>
                  <Input
                    id="warranty"
                    type="date"
                    value={formData.warranty_expiry}
                    onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule">Maintenance Schedule</Label>
                  <Input
                    id="schedule"
                    value={formData.maintenance_schedule}
                    onChange={(e) => setFormData({ ...formData, maintenance_schedule: e.target.value })}
                    placeholder="e.g., Every 3 months"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="next">Next Maintenance</Label>
                  <Input
                    id="next"
                    type="date"
                    value={formData.next_maintenance}
                    onChange={(e) => setFormData({ ...formData, next_maintenance: e.target.value })}
                  />
                </div>
              </div>

              {/* Tech Contacts */}
              <div className="space-y-2">
                <Label>Technician Contacts</Label>
                <div className="space-y-2">
                  {formData.tech_contacts.map((contact, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <span className="flex-1">{contact.name} - {contact.phone}</span>
                      <button
                        type="button"
                        onClick={() => removeContact(i)}
                        className="p-1 rounded hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                  <Input
                    placeholder="Phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  />
                  <Button type="button" variant="outline" onClick={addContact}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingEquipment ? "Save Changes" : "Add Equipment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Equipment</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{deletingEquipment?.name}"? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Asset Label Scanner */}
        <AssetLabelScanner
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onDataExtracted={handleScanData}
        />
      </div>
    </AppLayout>
  );
};

export default Equipment;
