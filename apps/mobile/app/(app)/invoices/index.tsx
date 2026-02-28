import { useState, useMemo } from "react";
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Badge } from "../../../components/ui/Badge";
import { TabBar } from "../../../components/ui/Tabs";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import { FAB } from "../../../components/ui/FAB";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Input } from "../../../components/ui/Input";
import { DatePicker } from "../../../components/ui/DatePicker";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { ScanLine, FileText } from "lucide-react-native";

interface Invoice {
  id: string;
  supplier_name: string | null;
  invoice_number: string | null;
  date: string | null;
  total: number | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_BADGES: Record<string, "default" | "success" | "warning" | "secondary"> = {
  pending: "warning", approved: "default", paid: "success", disputed: "secondary",
};

export default function Invoices() {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");

  const { data: invoices, isLoading, refetch, isRefetching } = useQuery<Invoice[]>({
    queryKey: ["invoices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("invoices").select("*").eq("org_id", orgId).order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Invoice[]) || [];
    },
    enabled: !!orgId,
  });

  const filtered = useMemo(() => {
    if (!invoices) return [];
    if (tab === "all") return invoices;
    return invoices.filter((i) => i.status === tab);
  }, [invoices, tab]);

  const [showForm, setShowForm] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [invNumber, setInvNumber] = useState("");
  const [invDate, setInvDate] = useState(new Date());
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!supplier.trim()) throw new Error("Supplier required");
      const { error } = await supabase.from("invoices").insert({
        supplier_name: supplier.trim(), invoice_number: invNumber.trim() || null,
        date: invDate.toISOString().split("T")[0], total: total ? Number(total) : null,
        status: "pending", notes: notes.trim() || null, org_id: orgId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowForm(false); setSupplier(""); setInvNumber(""); setTotal(""); setNotes("");
      Alert.alert("Created", "Invoice added");
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const totalPending = invoices?.filter((i) => i.status === "pending").reduce((s, i) => s + (i.total || 0), 0) || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader
        title="Invoices"
        rightAction={
          <Pressable onPress={() => router.push("/(app)/invoices/scan")} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <ScanLine size={16} color={colors.accent} strokeWidth={1.5} />
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>Scan</Text>
          </Pressable>
        }
      />

      {totalPending > 0 && (
        <View style={{ backgroundColor: colors.warningBg, margin: 16, marginBottom: 0, borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.warning }}>Pending: ${totalPending.toFixed(2)}</Text>
        </View>
      )}

      <TabBar
        tabs={[{ key: "all", label: "All" }, { key: "pending", label: "Pending" }, { key: "approved", label: "Approved" }, { key: "paid", label: "Paid" }]}
        activeTab={tab} onTabChange={setTab} style={{ marginHorizontal: 16, marginVertical: 12 }}
      />

      {isLoading ? (
        <View style={{ padding: 16, gap: 10 }}><SkeletonCard /><SkeletonCard /></View>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<FileText size={40} color={colors.textMuted} strokeWidth={1.5} />} title="No invoices" description="Scan or manually add invoices" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.supplier_name || "Unknown"}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                    {item.invoice_number && <Text style={{ fontSize: 12, color: colors.textMuted }}>#{item.invoice_number}</Text>}
                    {item.date && <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.date}</Text>}
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  {item.total != null && <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>${item.total.toFixed(2)}</Text>}
                  <Badge variant={STATUS_BADGES[item.status] || "secondary"}>{item.status}</Badge>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <FAB onPress={() => { setSupplier(""); setInvNumber(""); setInvDate(new Date()); setTotal(""); setNotes(""); setShowForm(true); }} />

      <FormSheet visible={showForm} onClose={() => setShowForm(false)} onSave={() => createInvoice.mutate()} title="New Invoice" saving={createInvoice.isPending}>
        <Input label="Supplier" value={supplier} onChangeText={setSupplier} placeholder="Supplier name" />
        <Input label="Invoice #" value={invNumber} onChangeText={setInvNumber} placeholder="INV-001" />
        <DatePicker label="Date" value={invDate} onChange={setInvDate} mode="date" />
        <Input label="Total ($)" value={total} onChangeText={setTotal} placeholder="0.00" keyboardType="decimal-pad" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Notes..." multiline />
      </FormSheet>
    </SafeAreaView>
  );
}
