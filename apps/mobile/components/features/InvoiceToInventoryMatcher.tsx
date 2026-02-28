import { useState, useMemo, useCallback } from "react";
import { Modal, View, Text, Pressable, FlatList, SafeAreaView, ActivityIndicator } from "react-native";
import { X, Check, Plus, SkipForward, Search } from "lucide-react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "../../contexts/ThemeProvider";
import { useOrg } from "../../contexts/OrgProvider";
import { supabase } from "../../lib/supabase";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";

interface ExtractedItem { name: string; quantity?: string; unit?: string; price?: number; confidence?: number }

export interface MatchResult {
  extractedName: string;
  action: "matched" | "new" | "skipped";
  ingredientId?: string;
  ingredientName?: string;
}

interface Ingredient { id: string; name: string; category: string | null; unit: string | null }

interface InvoiceToInventoryMatcherProps {
  extractedItems: ExtractedItem[];
  onComplete: (results: MatchResult[]) => void;
  onClose: () => void;
}

function confidenceBadge(c?: number) {
  if (c == null) return null;
  const label = `${Math.round(c * 100)}%`;
  if (c > 0.8) return { variant: "success" as const, label };
  if (c >= 0.5) return { variant: "warning" as const, label };
  return { variant: "destructive" as const, label };
}

export function InvoiceToInventoryMatcher({ extractedItems, onComplete, onClose }: InvoiceToInventoryMatcherProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const [results, setResults] = useState<Map<number, MatchResult>>(new Map());
  const [matchingIndex, setMatchingIndex] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");

  const { data: ingredients = [], isLoading } = useQuery<Ingredient[]>({
    queryKey: ["ingredients", orgId, "matcher"],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("ingredients").select("id, name, category, unit").eq("org_id", orgId).order("name");
      if (error) throw error;
      return (data as Ingredient[]) || [];
    },
    enabled: !!orgId,
  });

  const createIngredient = useMutation({
    mutationFn: async (item: ExtractedItem) => {
      const { data, error } = await supabase.from("ingredients")
        .insert({ name: item.name.trim(), unit: item.unit || "each", category: "Other", cost_per_unit: item.price ?? 0, org_id: orgId })
        .select("id, name").single();
      if (error) throw error;
      return data as { id: string; name: string };
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ingredients"] }); },
  });

  const filtered = useMemo(() => {
    if (!searchText.trim()) return ingredients;
    const q = searchText.toLowerCase();
    return ingredients.filter((i) => i.name.toLowerCase().includes(q));
  }, [searchText, ingredients]);

  const setResult = useCallback((idx: number, r: MatchResult) => {
    setResults((prev) => new Map(prev).set(idx, r));
  }, []);

  const handleMatch = useCallback((idx: number, ing: Ingredient) => {
    setResult(idx, { extractedName: extractedItems[idx].name, action: "matched", ingredientId: ing.id, ingredientName: ing.name });
    setMatchingIndex(null);
    setSearchText("");
  }, [extractedItems, setResult]);

  const handleAddNew = useCallback(async (idx: number) => {
    try {
      const created = await createIngredient.mutateAsync(extractedItems[idx]);
      setResult(idx, { extractedName: extractedItems[idx].name, action: "new", ingredientId: created.id, ingredientName: created.name });
    } catch { /* handled by react-query */ }
  }, [extractedItems, createIngredient, setResult]);

  const handleSkip = useCallback((idx: number) => {
    setResult(idx, { extractedName: extractedItems[idx].name, action: "skipped" });
  }, [extractedItems, setResult]);

  const handleDone = useCallback(() => {
    onComplete(extractedItems.map((item, idx) => results.get(idx) ?? { extractedName: item.name, action: "skipped" }));
  }, [extractedItems, results, onComplete]);

  const counts = useMemo(() => {
    let matched = 0, added = 0, skipped = 0;
    results.forEach((r) => { if (r.action === "matched") matched++; else if (r.action === "new") added++; else skipped++; });
    return { matched, added, skipped, total: extractedItems.length };
  }, [results, extractedItems.length]);

  const allResolved = results.size === extractedItems.length;

  const undoResult = useCallback((idx: number) => {
    setResults((prev) => { const next = new Map(prev); next.delete(idx); return next; });
  }, []);

  const actionColor = (action: "matched" | "new" | "skipped") =>
    action === "matched" ? colors.success : action === "new" ? colors.accent : colors.textSecondary;

  const actionBg = (action: "matched" | "new" | "skipped") =>
    action === "matched" ? colors.successBg : action === "new" ? colors.accentBg : colors.surface;

  const actionLabel = (r: MatchResult) =>
    r.action === "matched" ? `Matched: ${r.ingredientName}` : r.action === "new" ? `Created: ${r.ingredientName}` : "Skipped";

  const renderItem = useCallback(({ item, index }: { item: ExtractedItem; index: number }) => {
    const result = results.get(index);
    const badge = confidenceBadge(item.confidence);
    const isMatching = matchingIndex === index;
    const detail = [item.quantity, item.unit, item.price != null ? `$${item.price.toFixed(2)}` : null].filter(Boolean).join(" \u00B7 ");

    return (
      <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: result ? colors.successBg : colors.cardBorder, padding: 14, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{detail || "No details"}</Text>
          </View>
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        </View>

        {result ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: actionBg(result.action), borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Check size={14} color={actionColor(result.action)} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: "500", color: actionColor(result.action), flex: 1 }}>{actionLabel(result)}</Text>
            <Pressable onPress={() => undoResult(index)} hitSlop={8}>
              <X size={14} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => { setMatchingIndex(isMatching ? null : index); setSearchText(""); }}
                style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: isMatching ? colors.accent : colors.accentBg, opacity: pressed ? 0.7 : 1 })}>
                <Search size={14} color={isMatching ? "#FFF" : colors.accent} strokeWidth={1.5} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: isMatching ? "#FFF" : colors.accent }}>Match</Text>
              </Pressable>
              <Pressable onPress={() => handleAddNew(index)} disabled={createIngredient.isPending}
                style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.successBg, opacity: pressed || createIngredient.isPending ? 0.7 : 1 })}>
                <Plus size={14} color={colors.success} strokeWidth={1.5} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.success }}>Add New</Text>
              </Pressable>
              <Pressable onPress={() => handleSkip(index)}
                style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 })}>
                <SkipForward size={14} color={colors.textSecondary} strokeWidth={1.5} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>Skip</Text>
              </Pressable>
            </View>
            {isMatching && (
              <View style={{ gap: 8 }}>
                <Input placeholder="Search ingredients..." value={searchText} onChangeText={setSearchText} containerStyle={{ marginBottom: 0 }} />
                <View style={{ maxHeight: 160, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: "hidden" }}>
                  <FlatList
                    data={filtered.slice(0, 20)}
                    keyExtractor={(ing) => ing.id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item: ing }) => (
                      <Pressable onPress={() => handleMatch(index, ing)}
                        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: pressed ? colors.accentBg : "transparent" })}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }}>{ing.name}</Text>
                          {(ing.category || ing.unit) && (
                            <Text style={{ fontSize: 11, color: colors.textSecondary }}>{[ing.category, ing.unit].filter(Boolean).join(" \u00B7 ")}</Text>
                          )}
                        </View>
                      </Pressable>
                    )}
                    ListEmptyComponent={
                      <View style={{ padding: 14, alignItems: "center" }}>
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>No ingredients found</Text>
                      </View>
                    }
                  />
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  }, [results, matchingIndex, searchText, colors, filtered, handleMatch, handleAddNew, handleSkip, createIngredient.isPending, undoResult]);

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 36 }} />
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>Match Invoice Items</Text>
          <Pressable onPress={onClose} hitSlop={8}
            style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
            <X size={20} color={colors.textSecondary} strokeWidth={1.5} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList data={extractedItems} keyExtractor={(_, idx) => String(idx)} renderItem={renderItem}
            contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }} keyboardShouldPersistTaps="handled" />
        )}

        <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34, gap: 10 }}>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}>
            <Badge variant="success">{`${counts.matched} matched`}</Badge>
            <Badge variant="default">{`${counts.added} new`}</Badge>
            <Badge variant="secondary">{`${counts.skipped} skipped`}</Badge>
          </View>
          <Pressable onPress={handleDone} disabled={!allResolved}
            style={({ pressed }) => ({ backgroundColor: allResolved ? colors.accent : colors.border, borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: pressed ? 0.85 : 1 })}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
              {allResolved ? "Done" : `${counts.total - results.size} remaining`}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
