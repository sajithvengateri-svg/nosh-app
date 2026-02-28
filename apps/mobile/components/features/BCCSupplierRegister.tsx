import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import { FormSheet } from "../ui/FormSheet";
import { EmptyState } from "../ui/EmptyState";
import { FAB } from "../ui/FAB";
import { SkeletonCard } from "../ui/Skeleton";
import { SupplierDetailPanel } from "./SupplierDetailPanel";
import { ApprovedSupplierSeed } from "./ApprovedSupplierSeed";
import { Sparkles, Download } from "lucide-react-native";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCSupplierRegister() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  // ── Detail/Seed state ──────────────────────────────────────
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showSeed, setShowSeed] = useState(false);

  // ── Search state ────────────────────────────────────────────
  const [search, setSearch] = useState("");

  // ── Form state ──────────────────────────────────────────────
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [abn, setAbn] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [deliverySchedule, setDeliverySchedule] = useState("");
  const [products, setProducts] = useState("");
  const [isApproved, setIsApproved] = useState(true);
  const [notes, setNotes] = useState("");

  // ── Query ───────────────────────────────────────────────────
  const {
    data: suppliers,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["bcc-supplier-register", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("bcc_supplier_register")
        .select("*")
        .eq("org_id", orgId)
        .order("supplier_name", { ascending: true });
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!orgId,
  });

  // ── Filtered suppliers ──────────────────────────────────────
  const filtered = useMemo(() => {
    if (!suppliers) return [];
    if (!search.trim()) return suppliers;
    const term = search.trim().toLowerCase();
    return suppliers.filter((s: any) =>
      s.supplier_name?.toLowerCase().includes(term)
    );
  }, [suppliers, search]);

  // ── Mutation ────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org selected");
      if (!name.trim()) throw new Error("Supplier name is required");

      const { error } = await supabase.from("bcc_supplier_register").insert({
        org_id: orgId,
        supplier_name: name.trim(),
        abn: abn.trim() || null,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        delivery_schedule: deliverySchedule.trim() || null,
        products_supplied: products.trim() || null,
        is_approved: isApproved,
        notes: notes.trim() || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["bcc-supplier-register", orgId],
      });
      resetForm();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const resetForm = useCallback(() => {
    setSheetOpen(false);
    setName("");
    setAbn("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setDeliverySchedule("");
    setProducts("");
    setIsApproved(true);
    setNotes("");
  }, []);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Missing", "Please enter a supplier name");
      return;
    }
    saveMutation.mutate();
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.text }}>
            Supplier Register
          </Text>
          <Pressable
            onPress={() => setShowSeed(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.accentBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
          >
            <Download size={14} color={colors.accent} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>Import</Text>
          </Pressable>
        </View>

        {/* Search */}
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChangeText={setSearch}
        />

        <View style={{ height: 12 }} />

        {/* Loading */}
        {isLoading && (
          <View style={{ gap: 12 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}

        {/* Empty */}
        {!isLoading && (!suppliers || suppliers.length === 0) && (
          <EmptyState
            icon="📦"
            title="No Suppliers"
            description="Add your approved suppliers to maintain a compliance-grade register for BCC audits."
            actionLabel="Add First Supplier"
            onAction={() => setSheetOpen(true)}
          />
        )}

        {/* No search results */}
        {!isLoading &&
          suppliers &&
          suppliers.length > 0 &&
          filtered.length === 0 && (
            <Text
              style={{
                fontSize: 14,
                color: colors.textMuted,
                textAlign: "center",
                marginTop: 24,
              }}
            >
              No suppliers match "{search}"
            </Text>
          )}

        {/* Supplier list */}
        {!isLoading &&
          filtered.length > 0 &&
          filtered.map((supplier: any) => {
            const productTags = supplier.products_supplied
              ? supplier.products_supplied
                  .split(",")
                  .map((p: string) => p.trim())
                  .filter(Boolean)
              : [];

            return (
              <Pressable
                key={supplier.id}
                onPress={() => setSelectedSupplier(supplier)}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: 12,
                  gap: 8,
                }}
              >
                {/* Top row: name + approved badge */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "700",
                      color: colors.text,
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {supplier.supplier_name}
                  </Text>
                  <Badge
                    variant={supplier.is_approved ? "success" : "destructive"}
                  >
                    {supplier.is_approved ? "Approved" : "Unapproved"}
                  </Badge>
                </View>

                {/* ABN */}
                {supplier.abn ? (
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    ABN: {supplier.abn}
                  </Text>
                ) : null}

                {/* Delivery schedule */}
                {supplier.delivery_schedule ? (
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                    Delivery: {supplier.delivery_schedule}
                  </Text>
                ) : null}

                {/* Product tags */}
                {productTags.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {productTags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </View>
                )}

                {/* Contact info */}
                {(supplier.contact_name ||
                  supplier.contact_phone ||
                  supplier.contact_email) && (
                  <View
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: 10,
                      padding: 10,
                      gap: 2,
                    }}
                  >
                    {supplier.contact_name ? (
                      <Text
                        style={{ fontSize: 13, color: colors.textSecondary }}
                      >
                        {supplier.contact_name}
                      </Text>
                    ) : null}
                    {supplier.contact_phone ? (
                      <Text style={{ fontSize: 13, color: colors.textMuted }}>
                        {supplier.contact_phone}
                      </Text>
                    ) : null}
                    {supplier.contact_email ? (
                      <Text style={{ fontSize: 13, color: colors.textMuted }}>
                        {supplier.contact_email}
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* Notes */}
                {supplier.notes ? (
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      fontStyle: "italic",
                    }}
                  >
                    {supplier.notes}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
      </ScrollView>

      {/* FAB */}
      <FAB onPress={() => setSheetOpen(true)} />

      {/* Form Sheet */}
      <FormSheet
        visible={sheetOpen}
        onClose={resetForm}
        onSave={handleSave}
        title="Add Supplier"
        saving={saveMutation.isPending}
      >
        {/* Supplier name */}
        <Input
          label="Supplier Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bidvest, PFD Foods"
        />

        {/* ABN */}
        <Input
          label="ABN"
          value={abn}
          onChangeText={setAbn}
          placeholder="Australian Business Number"
        />

        {/* Contact name */}
        <Input
          label="Contact Name"
          value={contactName}
          onChangeText={setContactName}
          placeholder="Primary contact person"
        />

        {/* Contact phone */}
        <Input
          label="Contact Phone"
          value={contactPhone}
          onChangeText={setContactPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
        />

        {/* Contact email */}
        <Input
          label="Contact Email"
          value={contactEmail}
          onChangeText={setContactEmail}
          placeholder="Email address"
        />

        {/* Delivery schedule */}
        <Input
          label="Delivery Schedule"
          value={deliverySchedule}
          onChangeText={setDeliverySchedule}
          placeholder="e.g. Mon/Wed/Fri, Daily"
        />

        {/* Products supplied */}
        <Input
          label="Products Supplied"
          value={products}
          onChangeText={setProducts}
          placeholder="Comma separated, e.g. Dairy, Meat, Produce"
        />

        {/* Approved switch */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 8,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            Approved supplier?
          </Text>
          <Switch
            value={isApproved}
            onValueChange={setIsApproved}
            trackColor={{
              false: colors.destructiveBg,
              true: colors.successBg,
            }}
            thumbColor={isApproved ? colors.success : colors.destructive}
          />
        </View>

        {/* Notes */}
        <Input
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />
      </FormSheet>

      {/* Supplier Detail Panel */}
      <SupplierDetailPanel
        supplier={selectedSupplier}
        visible={!!selectedSupplier}
        onClose={() => setSelectedSupplier(null)}
      />

      {/* Import Common Suppliers */}
      <ApprovedSupplierSeed
        visible={showSeed}
        onClose={() => setShowSeed(false)}
      />
    </View>
  );
}
