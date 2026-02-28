import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { Thermometer, Plus, X, ShieldCheck } from "lucide-react-native";
import { Input } from "../ui/Input";
import { useTheme } from "../../contexts/ThemeProvider";

export interface CCPLocal {
  step_type: "prep" | "cook" | "hold" | "serve";
  target_temp: number | null;
  description: string;
}

interface CCPTimelineProps {
  ccps: CCPLocal[];
  onChange: (ccps: CCPLocal[]) => void;
}

const PHASES: { key: CCPLocal["step_type"]; label: string }[] = [
  { key: "prep", label: "Prep" },
  { key: "cook", label: "Cook" },
  { key: "hold", label: "Hold" },
  { key: "serve", label: "Serve" },
];

export function CCPTimeline({ ccps, onChange }: CCPTimelineProps) {
  const { colors } = useTheme();

  const addCCP = () => {
    onChange([
      ...ccps,
      { step_type: "cook", target_temp: null, description: "" },
    ]);
  };

  const removeCCP = (idx: number) => {
    onChange(ccps.filter((_, i) => i !== idx));
  };

  const updateCCP = (idx: number, updates: Partial<CCPLocal>) => {
    const updated = ccps.map((ccp, i) =>
      i === idx ? { ...ccp, ...updates } : ccp
    );
    onChange(updated);
  };

  // Count CCPs per phase for dot rendering
  const ccpsByPhase = PHASES.map((phase) => ({
    ...phase,
    items: ccps.filter((c) => c.step_type === phase.key),
  }));

  return (
    <View style={{ gap: 12 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={16} color={colors.accent} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: colors.textSecondary,
            }}
          >
            Critical Control Points ({ccps.length})
          </Text>
        </View>
      </View>

      {/* Danger zone band */}
      <View
        style={{
          backgroundColor: colors.destructiveBg,
          borderRadius: 8,
          padding: 8,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Thermometer size={14} color={colors.destructive} strokeWidth={1.5} />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.destructive,
          }}
        >
          Danger Zone: 5-60°C
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary, flex: 1 }}>
          Food must pass through this range quickly
        </Text>
      </View>

      {/* Timeline bar */}
      <View style={{ gap: 6 }}>
        <View
          style={{
            flexDirection: "row",
            height: 36,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {ccpsByPhase.map((phase, pIdx) => (
            <View
              key={phase.key}
              style={{
                flex: 1,
                backgroundColor:
                  pIdx === 0
                    ? colors.accentBg
                    : pIdx === 1
                      ? colors.warningBg
                      : pIdx === 2
                        ? colors.destructiveBg
                        : colors.successBg,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color:
                    pIdx === 0
                      ? colors.accent
                      : pIdx === 1
                        ? colors.warning
                        : pIdx === 2
                          ? colors.destructive
                          : colors.success,
                }}
              >
                {phase.label}
              </Text>
              {/* CCP dots */}
              {phase.items.map((_, dotIdx) => (
                <View
                  key={dotIdx}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor:
                      pIdx === 0
                        ? colors.accent
                        : pIdx === 1
                          ? colors.warning
                          : pIdx === 2
                            ? colors.destructive
                            : colors.success,
                  }}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Phase labels with arrows */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {PHASES.map((phase, pIdx) => (
            <View
              key={phase.key}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: colors.textSecondary,
                  fontWeight: "500",
                }}
              >
                {phase.label}
              </Text>
              {pIdx < PHASES.length - 1 && (
                <Text
                  style={{
                    fontSize: 10,
                    color: colors.border,
                    marginLeft: 4,
                  }}
                >
                  {"\u2192"}
                </Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* CCP items list */}
      {ccps.map((ccp, idx) => (
        <View
          key={idx}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            padding: 12,
            gap: 8,
            borderLeftWidth: 3,
            borderLeftColor:
              ccp.step_type === "prep"
                ? colors.accent
                : ccp.step_type === "cook"
                  ? colors.warning
                  : ccp.step_type === "hold"
                    ? colors.destructive
                    : colors.success,
          }}
        >
          {/* Top row: step type selector + delete */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                gap: 4,
              }}
            >
              {PHASES.map((phase) => (
                <Pressable
                  key={phase.key}
                  onPress={() => updateCCP(idx, { step_type: phase.key })}
                  style={{
                    flex: 1,
                    paddingVertical: 6,
                    borderRadius: 6,
                    alignItems: "center",
                    backgroundColor:
                      ccp.step_type === phase.key
                        ? colors.accent
                        : colors.background,
                    borderWidth: 1,
                    borderColor:
                      ccp.step_type === phase.key
                        ? colors.accent
                        : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color:
                        ccp.step_type === phase.key
                          ? "#FFFFFF"
                          : colors.textSecondary,
                    }}
                  >
                    {phase.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => removeCCP(idx)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.destructiveBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} color={colors.destructive} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Temperature + description row */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <View style={{ width: 100 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginBottom: 4,
                }}
              >
                <Thermometer
                  size={12}
                  color={colors.textSecondary}
                  strokeWidth={1.5}
                />
                <Text
                  style={{
                    fontSize: 11,
                    color: colors.textSecondary,
                    fontWeight: "500",
                  }}
                >
                  Temp
                </Text>
              </View>
              <Input
                value={ccp.target_temp !== null ? String(ccp.target_temp) : ""}
                onChangeText={(t) =>
                  updateCCP(idx, {
                    target_temp: t ? Number(t) : null,
                  })
                }
                placeholder="°C"
                keyboardType="numeric"
                containerStyle={{ marginBottom: 0 }}
              />
              {ccp.target_temp !== null && (
                <Text
                  style={{
                    fontSize: 11,
                    color:
                      ccp.target_temp > 5 && ccp.target_temp < 60
                        ? colors.destructive
                        : colors.success,
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  {ccp.target_temp}°C
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontWeight: "500",
                  marginBottom: 4,
                }}
              >
                Description
              </Text>
              <Input
                value={ccp.description}
                onChangeText={(t) => updateCCP(idx, { description: t })}
                placeholder="e.g. Core temp must reach 75°C"
                multiline
                numberOfLines={2}
                style={{ minHeight: 44, textAlignVertical: "top" }}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          </View>
        </View>
      ))}

      {/* Empty state */}
      {ccps.length === 0 && (
        <View
          style={{
            alignItems: "center",
            padding: 20,
            backgroundColor: colors.surface,
            borderRadius: 10,
          }}
        >
          <ShieldCheck
            size={24}
            color={colors.textSecondary}
            strokeWidth={1.5}
          />
          <Text
            style={{
              fontSize: 13,
              color: colors.textSecondary,
              marginTop: 8,
            }}
          >
            No critical control points yet.
          </Text>
        </View>
      )}

      {/* Add CCP button */}
      <Pressable
        onPress={addCCP}
        style={{
          flexDirection: "row",
          backgroundColor: colors.accent,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <Plus size={16} color="#FFFFFF" strokeWidth={2} />
        <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
          Add CCP
        </Text>
      </Pressable>
    </View>
  );
}
