import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { Input } from "../../ui/Input";
import { Badge } from "../../ui/Badge";
import { UserPlus, Send, Users, Check } from "lucide-react-native";

interface OnboardingTeamInviteProps {
  onComplete: () => void;
}

export function OnboardingTeamInvite({ onComplete }: OnboardingTeamInviteProps) {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { user, isDevBypass } = useAuth();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const [emails, setEmails] = useState<string[]>([""]);
  const [sent, setSent] = useState<string[]>([]);

  // Fetch existing invites
  const { data: existingInvites } = useQuery({
    queryKey: ["team-invites", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) return [];
      const { data } = await supabase
        .from("team_invites")
        .select("email, status")
        .eq("org_id", orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch existing members
  const { data: members } = useQuery({
    queryKey: ["team-members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      if (isDevBypass) return [];
      const { data } = await supabase
        .from("org_memberships")
        .select("user_id, profiles(full_name, email)")
        .eq("org_id", orgId)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!orgId,
  });

  const addEmailRow = () => setEmails((prev) => [...prev, ""]);

  const updateEmail = (idx: number, value: string) => {
    setEmails((prev) => prev.map((e, i) => (i === idx ? value : e)));
  };

  const removeEmail = (idx: number) => {
    setEmails((prev) => prev.filter((_, i) => i !== idx));
  };

  // Send invites
  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user) throw new Error("Not ready");
      const validEmails = emails
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes("@"));

      if (validEmails.length === 0) throw new Error("Enter at least one valid email");

      for (const email of validEmails) {
        const token = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        if (!isDevBypass) {
          const { error } = await supabase.from("team_invites").insert({
            email,
            org_id: orgId,
            token,
            role: "commis",
            status: "pending",
          });
          if (error) throw error;

          // Fire and forget the email
          supabase.functions.invoke("send-invite-email", {
            body: { email, token, org_name: currentOrg?.name || "Your Kitchen" },
          }).catch((err) => console.warn("Invite email failed:", err));
        }
      }

      return validEmails;
    },
    onSuccess: (validEmails) => {
      setSent((prev) => [...prev, ...validEmails]);
      setEmails([""]);
      queryClient.invalidateQueries({ queryKey: ["team-invites", orgId] });
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const allSent = sent.length + (existingInvites?.length ?? 0);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Existing team */}
      {(members?.length ?? 0) > 1 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#10B981" + "15",
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <Users size={16} color="#10B981" strokeWidth={2} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#10B981" }}>
            {members!.length} team member{members!.length !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {/* Sent invites */}
      {allSent > 0 && (
        <View
          style={{
            backgroundColor: colors.accentBg,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            gap: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>
            Invites Sent
          </Text>
          {sent.map((email, i) => (
            <View key={`sent-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Check size={12} color={colors.accent} strokeWidth={2} />
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{email}</Text>
            </View>
          ))}
          {existingInvites?.map((inv: any, i: number) => (
            <View key={`existing-${i}`} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Check size={12} color={colors.accent} strokeWidth={2} />
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{inv.email}</Text>
              <Badge variant="secondary">{inv.status}</Badge>
            </View>
          ))}
        </View>
      )}

      {/* Email inputs */}
      <Text
        style={{
          fontSize: 15,
          fontWeight: "700",
          color: colors.text,
          marginBottom: 12,
        }}
      >
        Invite Your Team
      </Text>
      <Text
        style={{
          fontSize: 13,
          color: colors.textMuted,
          marginBottom: 16,
          lineHeight: 18,
        }}
      >
        Enter email addresses for your kitchen staff. They'll receive an invite with food safety walkthroughs on temperature logging, receiving, cleaning SOPs, and more.
      </Text>

      {emails.map((email, idx) => (
        <View key={idx} style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Input
              value={email}
              onChangeText={(v) => updateEmail(idx, v)}
              placeholder="staff@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {emails.length > 1 && (
            <Pressable
              onPress={() => removeEmail(idx)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
              }}
            >
              <Text style={{ fontSize: 18, color: colors.textMuted }}>{"\u2715"}</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Pressable
        onPress={addEmailRow}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 8,
          marginBottom: 16,
        }}
      >
        <UserPlus size={14} color={colors.accent} strokeWidth={2} />
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>
          Add another
        </Text>
      </Pressable>

      {/* Send button */}
      <Pressable
        onPress={() => inviteMutation.mutate()}
        disabled={inviteMutation.isPending || !emails.some((e) => e.trim().includes("@"))}
        style={{
          backgroundColor: colors.accent,
          borderRadius: 12,
          paddingVertical: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: inviteMutation.isPending || !emails.some((e) => e.trim().includes("@")) ? 0.5 : 1,
        }}
      >
        {inviteMutation.isPending ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Send size={16} color="#FFF" strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFF" }}>
              Send Invites
            </Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}
