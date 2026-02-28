import { useState } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../ui/Badge";
import {
  Globe,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  X,
  Sparkles,
  ExternalLink,
} from "lucide-react-native";

interface SupplierDetailPanelProps {
  supplier: any;
  visible: boolean;
  onClose: () => void;
}

export function SupplierDetailPanel({ supplier, visible, onClose }: SupplierDetailPanelProps) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [enriching, setEnriching] = useState(false);

  const enrichMutation = useMutation({
    mutationFn: async () => {
      setEnriching(true);
      const { data, error } = await supabase.functions.invoke("enrich-supplier", {
        body: { supplier_name: supplier?.supplier_name, location: supplier?.location },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async (data: any) => {
      const updates: Record<string, any> = {};
      if (data.phone) updates.contact_phone = data.phone;
      if (data.email) updates.contact_email = data.email;
      if (data.abn) updates.abn = data.abn;
      if (data.website) updates.website = data.website;
      if (data.ordering_url) updates.ordering_url = data.ordering_url;
      if (data.social_links) updates.social_links = data.social_links;
      if (data.delivery_days) updates.delivery_days = data.delivery_days;
      if (data.minimum_order) updates.minimum_order = data.minimum_order;
      if (data.payment_terms) updates.payment_terms = data.payment_terms;
      if (data.description) updates.notes = data.description;

      if (Object.keys(updates).length > 0) {
        await supabase.from("bcc_supplier_register").update(updates).eq("id", supplier.id);
      }
      queryClient.invalidateQueries({ queryKey: ["bcc-supplier-register"] });
      setEnriching(false);
      Alert.alert("Enriched", "Supplier data has been updated.");
    },
    onError: (e: Error) => {
      setEnriching(false);
      Alert.alert("Enrichment Failed", e.message);
    },
  });

  if (!supplier) return null;

  const openURL = (url: string) => {
    if (url) Linking.openURL(url.startsWith("http") ? url : `https://${url}`);
  };

  const deliveryDays: string[] = supplier.delivery_days || [];
  const social = supplier.social_links || {};

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) =>
    value ? (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
        {icon}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>{label}</Text>
          <Text style={{ fontSize: 14, color: colors.text }}>{value}</Text>
        </View>
      </View>
    ) : null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, flex: 1 }} numberOfLines={1}>
            {supplier.supplier_name}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <X size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
          {/* Status badge */}
          <Badge variant={supplier.is_approved ? "success" : "destructive"}>
            {supplier.is_approved ? "Approved" : "Unapproved"}
          </Badge>

          {/* Business info */}
          <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 8 }}>Business Info</Text>
            <Row icon={<DollarSign size={16} color={colors.textMuted} />} label="ABN" value={supplier.abn} />
            <Row icon={<Phone size={16} color={colors.textMuted} />} label="Phone" value={supplier.contact_phone} />
            <Row icon={<Mail size={16} color={colors.textMuted} />} label="Email" value={supplier.contact_email} />
            {supplier.contact_name && (
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Contact: {supplier.contact_name}</Text>
            )}
          </View>

          {/* Links */}
          {(supplier.website || supplier.ordering_url || social.instagram || social.facebook) && (
            <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Links</Text>
              {supplier.website && (
                <TouchableOpacity onPress={() => openURL(supplier.website)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Globe size={16} color={colors.accent} />
                  <Text style={{ fontSize: 14, color: colors.accent, flex: 1 }} numberOfLines={1}>{supplier.website}</Text>
                  <ExternalLink size={14} color={colors.textMuted} />
                </TouchableOpacity>
              )}
              {supplier.ordering_url && (
                <TouchableOpacity onPress={() => openURL(supplier.ordering_url)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <ExternalLink size={16} color={colors.accent} />
                  <Text style={{ fontSize: 14, color: colors.accent }}>Order Online</Text>
                </TouchableOpacity>
              )}
              {social.instagram && (
                <TouchableOpacity onPress={() => openURL(social.instagram)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Instagram size={16} color="#E1306C" />
                  <Text style={{ fontSize: 14, color: colors.accent }}>Instagram</Text>
                </TouchableOpacity>
              )}
              {social.facebook && (
                <TouchableOpacity onPress={() => openURL(social.facebook)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Facebook size={16} color="#1877F2" />
                  <Text style={{ fontSize: 14, color: colors.accent }}>Facebook</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Delivery days */}
          {deliveryDays.length > 0 && (
            <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Calendar size={16} color={colors.textMuted} />
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Delivery Days</Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {deliveryDays.map((d: string) => (
                  <Badge key={d} variant="secondary">{d}</Badge>
                ))}
              </View>
            </View>
          )}

          {/* Order terms */}
          {(supplier.minimum_order || supplier.payment_terms) && (
            <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 6 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>Order Terms</Text>
              {supplier.minimum_order && (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Min Order: ${supplier.minimum_order}</Text>
              )}
              {supplier.payment_terms && (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Payment: {supplier.payment_terms}</Text>
              )}
            </View>
          )}

          {/* Notes */}
          {supplier.notes && (
            <View style={{ backgroundColor: colors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 }}>Notes</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>{supplier.notes}</Text>
            </View>
          )}

          {/* Auto-Enrich button */}
          <TouchableOpacity
            onPress={() => enrichMutation.mutate()}
            disabled={enriching}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 12,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: enriching ? 0.6 : 1,
            }}
          >
            {enriching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Sparkles size={18} color="#fff" />
            )}
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
              {enriching ? "Enriching..." : "Auto-Enrich with AI"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}
