import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tag,
  Search,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  Eye,
  Building2,
} from "lucide-react";
import { format, isAfter, isBefore, parseISO } from "date-fns";

const AdminVendorDeals = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  const { data: deals, isLoading } = useQuery({
    queryKey: ["admin-vendor-deals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_deals")
        .select("*, vendor_profiles(business_name, contact_name, contact_email)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: dealStats } = useQuery({
    queryKey: ["admin-deal-stats"],
    queryFn: async () => {
      const now = new Date().toISOString().split("T")[0];
      
      const [
        { count: totalDeals },
        { count: activeDeals },
        { data: allDeals },
      ] = await Promise.all([
        supabase.from("vendor_deals").select("*", { count: "exact", head: true }),
        supabase
          .from("vendor_deals")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .lte("start_date", now)
          .gte("end_date", now),
        supabase.from("vendor_deals").select("discount_percent, discount_amount"),
      ]);

      const avgDiscount = allDeals?.length
        ? allDeals.reduce((sum, d) => sum + (d.discount_percent || 0), 0) / allDeals.length
        : 0;

      const totalSavings = allDeals?.reduce((sum, d) => sum + (d.discount_amount || 0), 0) || 0;

      return {
        total: totalDeals || 0,
        active: activeDeals || 0,
        avgDiscount: avgDiscount.toFixed(1),
        totalSavings,
      };
    },
  });

  const getDealStatus = (deal: any) => {
    const now = new Date();
    const start = parseISO(deal.start_date);
    const end = parseISO(deal.end_date);

    if (!deal.is_active) return { label: "Inactive", variant: "secondary" as const };
    if (isBefore(now, start)) return { label: "Scheduled", variant: "outline" as const };
    if (isAfter(now, end)) return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "default" as const };
  };

  const filteredDeals = deals?.filter(
    (deal) =>
      deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.vendor_profiles as any)?.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary" />
          Vendor Deals
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor and analyze vendor promotions across the platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Deals</p>
                  <p className="text-3xl font-bold">{dealStats?.total || 0}</p>
                </div>
                <Tag className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                  <p className="text-3xl font-bold text-green-500">{dealStats?.active || 0}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Discount</p>
                  <p className="text-3xl font-bold">{dealStats?.avgDiscount || 0}%</p>
                </div>
                <Percent className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Savings</p>
                  <p className="text-3xl font-bold">${dealStats?.totalSavings?.toFixed(0) || 0}</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search deals or vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vendor Deals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal Title</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals?.length ? (
                    filteredDeals.map((deal) => {
                      const status = getDealStatus(deal);
                      return (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium">{deal.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              {(deal.vendor_profiles as any)?.business_name || "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {deal.discount_percent ? (
                              <Badge variant="secondary">{deal.discount_percent}% off</Badge>
                            ) : deal.discount_amount ? (
                              <Badge variant="secondary">${deal.discount_amount} off</Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-3 h-3" />
                              {format(parseISO(deal.start_date), "MMM d")} -{" "}
                              {format(parseISO(deal.end_date), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDeal(deal)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No vendor deals found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deal Detail Dialog */}
      <Dialog open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDeal?.title}</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">
                    {(selectedDeal.vendor_profiles as any)?.business_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">
                    {(selectedDeal.vendor_profiles as any)?.contact_name}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{selectedDeal.description || "No description"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Discount</p>
                  <p className="font-medium text-lg text-green-500">
                    {selectedDeal.discount_percent
                      ? `${selectedDeal.discount_percent}%`
                      : `$${selectedDeal.discount_amount}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Min Order</p>
                  <p className="font-medium">
                    ${selectedDeal.min_order_value?.toFixed(2) || "0.00"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {format(parseISO(selectedDeal.start_date), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {format(parseISO(selectedDeal.end_date), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              {selectedDeal.applicable_categories?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Applicable Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDeal.applicable_categories.map((cat: string) => (
                      <Badge key={cat} variant="outline">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={getDealStatus(selectedDeal).variant}>
                  {getDealStatus(selectedDeal).label}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVendorDeals;
