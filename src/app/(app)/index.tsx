import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Snapshot = Tables<"driver_snapshots">;
type Shift = Tables<"shifts">;

const GOAL_KEY = "@driveros:daily_goal";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, gap: 4 }}>
      <Text style={{ color: "#94a3b8", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "bold" }}>{value}</Text>
      {sub ? <Text style={{ color: "#64748b", fontSize: 11 }}>{sub}</Text> : null}
    </View>
  );
}

interface PeriodStats { earnings: number; expenses: number; netProfit: number; km: number; }

export default function DashboardScreen() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [weekStats, setWeekStats] = useState<PeriodStats | null>(null);
  const [monthStats, setMonthStats] = useState<PeriodStats | null>(null);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // Week start (Monday)
      const day = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));
      weekStart.setHours(0, 0, 0, 0);

      // Month start
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const [{ data: snap }, { data: shift }, { data: weekSnaps }, { data: monthSnaps }, goal] = await Promise.all([
        supabase.from("driver_snapshots").select("*").eq("user_id", user.id).eq("snapshot_date", today).maybeSingle(),
        supabase.from("shifts").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("driver_snapshots").select("total_earnings,total_expenses,net_profit,total_km")
          .eq("user_id", user.id).gte("snapshot_date", weekStart.toISOString().split("T")[0]).lte("snapshot_date", today),
        supabase.from("driver_snapshots").select("total_earnings,total_expenses,net_profit,total_km")
          .eq("user_id", user.id).gte("snapshot_date", monthStart).lte("snapshot_date", today),
        AsyncStorage.getItem(GOAL_KEY),
      ]);

      setSnapshot(snap ?? null);
      setActiveShift(shift ?? null);

      const agg = (rows: Snapshot[] | null): PeriodStats => ({
        earnings: (rows ?? []).reduce((s, r) => s + (r.total_earnings ?? 0), 0),
        expenses: (rows ?? []).reduce((s, r) => s + (r.total_expenses ?? 0), 0),
        netProfit: (rows ?? []).reduce((s, r) => s + (r.net_profit ?? 0), 0),
        km: (rows ?? []).reduce((s, r) => s + (r.total_km ?? 0), 0),
      });

      setWeekStats(agg(weekSnaps as Snapshot[] | null));
      setMonthStats(agg(monthSnaps as Snapshot[] | null));
      setDailyGoal(goal ? parseFloat(goal) : null);
    } catch (e) {
      console.error("[dashboard] exception", e);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  const todayEarnings = snapshot?.total_earnings ?? 0;
  const goalProgress = dailyGoal && dailyGoal > 0 ? Math.min(1, todayEarnings / dailyGoal) : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {activeShift && (
        <View style={{ backgroundColor: "#1d4ed8", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={{ fontSize: 24 }}>🚗</Text>
          <View>
            <Text style={{ color: "#bfdbfe", fontSize: 12 }}>Turno ativo desde</Text>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
              {new Date(activeShift.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>
      )}

      {/* Daily goal progress */}
      {goalProgress !== null && (
        <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>🎯 META DO DIA</Text>
            <Text style={{ color: goalProgress >= 1 ? "#22c55e" : "#f8fafc", fontSize: 12, fontWeight: "600" }}>
              {fmt(todayEarnings)} / {fmt(dailyGoal!)}
            </Text>
          </View>
          <View style={{ height: 8, backgroundColor: "#334155", borderRadius: 4, overflow: "hidden" }}>
            <View style={{ width: `${(goalProgress * 100).toFixed(0)}%` as unknown as number, height: 8,
              backgroundColor: goalProgress >= 1 ? "#22c55e" : "#3b82f6", borderRadius: 4 }} />
          </View>
          <Text style={{ color: goalProgress >= 1 ? "#22c55e" : "#64748b", fontSize: 11 }}>
            {goalProgress >= 1 ? "✓ Meta atingida!" : `${(goalProgress * 100).toFixed(0)}% concluído`}
          </Text>
        </View>
      )}

      <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>HOJE</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard label="Ganhos" value={snapshot ? fmt(snapshot.total_earnings) : "R$ 0,00"} />
        <StatCard label="Despesas" value={snapshot ? fmt(snapshot.total_expenses) : "R$ 0,00"} />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          label="Lucro líquido"
          value={snapshot ? fmt(snapshot.net_profit) : "R$ 0,00"}
          sub={snapshot && snapshot.total_earnings > 0
            ? `${((snapshot.net_profit / snapshot.total_earnings) * 100).toFixed(0)}% margem`
            : undefined}
        />
        <StatCard label="Quilômetros" value={snapshot ? `${snapshot.total_km.toFixed(0)} km` : "0 km"} />
      </View>

      {!snapshot && (
        <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
          <Text style={{ fontSize: 32 }}>📊</Text>
          <Text style={{ color: "#94a3b8", textAlign: "center" }}>
            Nenhum dado registrado hoje.{"\n"}Inicie um turno para começar.
          </Text>
        </View>
      )}

      {/* Weekly stats */}
      {weekStats && weekStats.earnings > 0 && (
        <>
          <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 4 }}>ESTA SEMANA</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatCard label="Ganhos" value={fmt(weekStats.earnings)} />
            <StatCard label="Lucro" value={fmt(weekStats.netProfit)}
              sub={weekStats.earnings > 0 ? `${((weekStats.netProfit / weekStats.earnings) * 100).toFixed(0)}% margem` : undefined} />
          </View>
          {weekStats.km > 0 && (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <StatCard label="Km rodados" value={`${weekStats.km.toFixed(0)} km`} />
              <StatCard label="Ganho/km"
                value={weekStats.km > 0 ? `R$ ${(weekStats.earnings / weekStats.km).toFixed(2)}` : "—"} />
            </View>
          )}
        </>
      )}

      {/* Monthly stats */}
      {monthStats && monthStats.earnings > 0 && (
        <>
          <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 4 }}>ESTE MÊS</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <StatCard label="Ganhos" value={fmt(monthStats.earnings)} />
            <StatCard label="Lucro" value={fmt(monthStats.netProfit)}
              sub={monthStats.earnings > 0 ? `${((monthStats.netProfit / monthStats.earnings) * 100).toFixed(0)}% margem` : undefined} />
          </View>
          {monthStats.km > 0 && (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <StatCard label="Km rodados" value={`${monthStats.km.toFixed(0)} km`} />
              <StatCard label="Ganho/km"
                value={monthStats.km > 0 ? `R$ ${(monthStats.earnings / monthStats.km).toFixed(2)}` : "—"} />
            </View>
          )}
        </>
      )}

      <Pressable
        onPress={() => router.push("/(app)/history")}
        style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}
      >
        <Text style={{ color: "#f8fafc", fontWeight: "600" }}>📋 Histórico de turnos</Text>
        <Text style={{ color: "#94a3b8" }}>→</Text>
      </Pressable>
    </ScrollView>
  );
}
