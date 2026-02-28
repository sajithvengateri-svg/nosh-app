import { useState, useCallback } from "react";
import { useOrg } from "../contexts/OrgProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Benchmark {
  id: string;
  label: string;
  target: number;
  warning: number;
  critical: number;
  unit: string;
  category: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: "above" | "below";
  threshold: number;
  severity: "critical" | "warning" | "info";
  enabled: boolean;
  notifyEmail: boolean;
  notifyPush: boolean;
}

export const DEFAULT_BENCHMARKS: Benchmark[] = [
  { id: "food_cost", label: "Food Cost %", target: 30, warning: 33, critical: 36, unit: "%", category: "COGS" },
  { id: "bev_cost", label: "Beverage Cost %", target: 24, warning: 27, critical: 30, unit: "%", category: "COGS" },
  { id: "labour_pct", label: "Labour %", target: 30, warning: 33, critical: 36, unit: "%", category: "Labour" },
  { id: "prime_cost", label: "Prime Cost %", target: 65, warning: 70, critical: 75, unit: "%", category: "Overall" },
  { id: "net_profit", label: "Net Profit %", target: 10, warning: 7, critical: 4, unit: "%", category: "Overall" },
  { id: "rent_pct", label: "Rent % of Revenue", target: 8, warning: 10, critical: 13, unit: "%", category: "Overhead" },
  { id: "waste_pct", label: "Food Waste %", target: 3, warning: 4.5, critical: 6, unit: "%", category: "COGS" },
  { id: "overtime_hrs", label: "Overtime Hours/Week", target: 2, warning: 5, critical: 8, unit: "h", category: "Labour" },
];

export const DEFAULT_ALERTS: AlertRule[] = [
  { id: "1", name: "Food cost exceeds target", metric: "Food Cost %", condition: "above", threshold: 33, severity: "warning", enabled: true, notifyEmail: true, notifyPush: true },
  { id: "2", name: "Labour cost critical", metric: "Labour %", condition: "above", threshold: 36, severity: "critical", enabled: true, notifyEmail: true, notifyPush: true },
  { id: "3", name: "Net profit below floor", metric: "Net Profit %", condition: "below", threshold: 5, severity: "critical", enabled: true, notifyEmail: true, notifyPush: true },
  { id: "4", name: "Overtime creeping", metric: "Overtime Hours", condition: "above", threshold: 4, severity: "warning", enabled: true, notifyEmail: false, notifyPush: true },
  { id: "5", name: "Waste above target", metric: "Food Waste %", condition: "above", threshold: 4.5, severity: "warning", enabled: true, notifyEmail: false, notifyPush: true },
  { id: "6", name: "Cash variance detected", metric: "Cash Variance %", condition: "above", threshold: 2, severity: "critical", enabled: true, notifyEmail: true, notifyPush: true },
  { id: "7", name: "Revenue trending down", metric: "Revenue vs LW", condition: "below", threshold: -10, severity: "info", enabled: true, notifyEmail: false, notifyPush: false },
];

function storageKey(orgId: string, type: "benchmarks" | "alerts") {
  return `moneyos_${type}_${orgId}`;
}

export function useMoneySettings() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const { data: benchmarks = DEFAULT_BENCHMARKS } = useQuery<Benchmark[]>({
    queryKey: ["money-benchmarks", orgId],
    queryFn: async () => {
      if (!orgId) return DEFAULT_BENCHMARKS;
      const stored = await AsyncStorage.getItem(storageKey(orgId, "benchmarks"));
      return stored ? JSON.parse(stored) : DEFAULT_BENCHMARKS;
    },
    enabled: !!orgId,
  });

  const { data: alertRules = DEFAULT_ALERTS } = useQuery<AlertRule[]>({
    queryKey: ["money-alerts", orgId],
    queryFn: async () => {
      if (!orgId) return DEFAULT_ALERTS;
      const stored = await AsyncStorage.getItem(storageKey(orgId, "alerts"));
      return stored ? JSON.parse(stored) : DEFAULT_ALERTS;
    },
    enabled: !!orgId,
  });

  const saveBenchmarks = useMutation({
    mutationFn: async (updated: Benchmark[]) => {
      if (!orgId) return;
      await AsyncStorage.setItem(storageKey(orgId, "benchmarks"), JSON.stringify(updated));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-benchmarks", orgId] });
    },
  });

  const saveAlertRules = useMutation({
    mutationFn: async (updated: AlertRule[]) => {
      if (!orgId) return;
      await AsyncStorage.setItem(storageKey(orgId, "alerts"), JSON.stringify(updated));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-alerts", orgId] });
    },
  });

  const updateBenchmark = useCallback(
    (id: string, updates: Partial<Benchmark>) => {
      const updated = benchmarks.map((b) => (b.id === id ? { ...b, ...updates } : b));
      saveBenchmarks.mutate(updated);
    },
    [benchmarks, saveBenchmarks]
  );

  const toggleAlertRule = useCallback(
    (id: string) => {
      const updated = alertRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
      saveAlertRules.mutate(updated);
    },
    [alertRules, saveAlertRules]
  );

  const updateAlertRule = useCallback(
    (id: string, updates: Partial<AlertRule>) => {
      const updated = alertRules.map((r) => (r.id === id ? { ...r, ...updates } : r));
      saveAlertRules.mutate(updated);
    },
    [alertRules, saveAlertRules]
  );

  return {
    benchmarks,
    alertRules,
    updateBenchmark,
    toggleAlertRule,
    updateAlertRule,
    isSaving: saveBenchmarks.isPending || saveAlertRules.isPending,
  };
}
