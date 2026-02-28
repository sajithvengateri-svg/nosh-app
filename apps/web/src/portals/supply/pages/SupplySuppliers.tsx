import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Building2, Phone, Mail, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Supplier {
  id: string; name: string; contact: string; email: string; phone: string;
  address: string; categories: string[]; terms: string; spend: number; status: string;
}

const demoSuppliers: Supplier[] = [
  { id: "s1", name: "Fresh Produce Co", contact: "Sarah Chen", email: "sarah@freshproduce.com.au", phone: "03 9555 1234", address: "12 Market Lane, Melbourne VIC", categories: ["Vegetables", "Fruit", "Herbs"], terms: "Net 14", spend: 5400, status: "Active" },
  { id: "s2", name: "Premium Meats", contact: "Mike Torres", email: "mike@premiummeats.com.au", phone: "03 9555 5678", address: "88 Butcher St, Footscray VIC", categories: ["Beef", "Pork", "Poultry"], terms: "Net 7", spend: 8200, status: "Active" },
  { id: "s3", name: "Dairy Direct", contact: "Emma Walsh", email: "emma@dairydirect.com.au", phone: "03 9555 9012", address: "5 Cream Ave, Warrnambool VIC", categories: ["Dairy", "Eggs"], terms: "COD", spend: 3200, status: "Active" },
  { id: "s4", name: "Seafood Market", contact: "James Lee", email: "james@seafoodmarket.com.au", phone: "03 9555 3456", address: "South Wharf, Melbourne VIC", categories: ["Fish", "Shellfish"], terms: "Net 7", spend: 4100, status: "Active" },
  { id: "s5", name: "Baker's Supply", contact: "Anna Rossi", email: "anna@bakerssupply.com.au", phone: "03 9555 7890", address: "22 Flour Rd, Brunswick VIC", categories: ["Flour", "Sugar", "Yeast"], terms: "Net 30", spend: 2100, status: "Active" },
  { id: "s6", name: "Mediterranean Imports", contact: "Costa Papadopoulos", email: "costa@medimports.com.au", phone: "03 9555 2345", address: "Lygon St, Carlton VIC", categories: ["Oils", "Olives", "Spices"], terms: "Net 14", spend: 1450, status: "Review" },
];

const priceHistory = [
  { month: "Sep", avg: 102 }, { month: "Oct", avg: 104 }, { month: "Nov", avg: 103 },
  { month: "Dec", avg: 107 }, { month: "Jan", avg: 108 }, { month: "Feb", avg: 112 },
];

export default function SupplySuppliers() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Supplier | null>(null);

  const filtered = demoSuppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.categories.some((c) => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground text-sm">Directory & spend analysis</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Supplier</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Business Name</Label><Input placeholder="Supplier name" /></div>
              <div><Label>Contact Person</Label><Input placeholder="Full name" /></div>
              <div><Label>Email</Label><Input type="email" placeholder="email@supplier.com" /></div>
              <div><Label>Phone</Label><Input placeholder="Phone number" /></div>
              <div><Label>Address</Label><Input placeholder="Business address" /></div>
              <Button className="w-full">Save Supplier</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search suppliers or categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <Card key={s.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => setSelected(s)}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.contact}</p>
                  </div>
                </div>
                <Badge variant={s.status === "Active" ? "default" : "secondary"}>{s.status}</Badge>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {s.email}</div>
                <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</div>
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.address}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {s.categories.map((c) => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Terms: {s.terms}</span>
                <span className="text-sm font-semibold text-foreground">${s.spend.toLocaleString()} MTD</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Contact:</span> {selected.contact}</div>
                <div><span className="text-muted-foreground">Terms:</span> {selected.terms}</div>
                <div><span className="text-muted-foreground">MTD Spend:</span> ${selected.spend.toLocaleString()}</div>
                <div><span className="text-muted-foreground">Status:</span> {selected.status}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Price Index (6 months)</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={priceHistory}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="avg" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
