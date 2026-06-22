import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";
import { DriverOSLogo } from "../../components/DriverOSLogo";

type Snapshot  = Tables<"driver_snapshots">;
type Shift     = Tables<"shifts">;
type Refueling = Tables<"refuelings">;
type Expense   = Tables<"vehicle_expenses">;

const GOAL_KEY         = "@driveros:daily_goal";
const WEEKLY_GOAL_KEY  = "@driveros:weekly_goal";
const MONTHLY_GOAL_KEY = "@driveros:monthly_goal";
const DEBT_KEY         = "@driveros:min_debt";
const DEBT_DATE_KEY    = "@driveros:min_debt_date";

const EXPENSE_CAT_LABEL: Record<string, string> = {
  ipva: "IPVA", insurance: "Seguro", licensing: "Licenciamento",
  financing: "Financiamento", rent: "Aluguel", maintenance: "Manutenção",
  fuel: "Combustível", other: "Outros",
};
const FREQ_DAYS: Record<string, number> = {
  daily: 1, weekly: 7, monthly: 30, quarterly: 91, yearly: 365,
};

interface PeriodStats { earnings: number; expenses: number; netProfit: number; km: number; }

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function Card({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 14, padding: 16, gap: 3,
      borderWidth: 1, borderColor: "#243044" }}>
      <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600", letterSpacing: 0.4 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: accent ?? "#f8fafc", fontSize: 20, fontWeight: "800" }}>{value}</Text>
      {sub ? <Text style={{ color: "#475569", fontSize: 11 }}>{sub}</Text> : null}
    </View>
  );
}

function GoalBar({ icon, label, current, target, color = "#3b82f6" }:
  { icon: string; label: string; current: number; target: number; color?: string }) {
  const pct  = Math.min(1, target > 0 ? current / target : 0);
  const done = pct >= 1;
  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "700" }}>{icon} {label}</Text>
        <Text style={{ color: done ? "#22c55e" : "#f8fafc", fontSize: 11, fontWeight: "700" }}>
          {fmt(current)} <Text style={{ color: "#475569" }}>/ {fmt(target)}</Text>
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: "#1e3a5f", borderRadius: 3, overflow: "hidden" }}>
        <View style={{ width: `${(pct * 100).toFixed(1)}%` as unknown as number,
          height: 6, backgroundColor: done ? "#22c55e" : color, borderRadius: 3 }} />
      </View>
      <Text style={{ color: done ? "#22c55e" : "#475569", fontSize: 10 }}>
        {done ? "✓ Meta atingida!" : `${(pct * 100).toFixed(0)}% — faltam ${fmt(target - current)}`}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [userName, setUserName]       = useState("");
  const [snapshot, setSnapshot]       = useState<Snapshot | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [weekStats, setWeekStats]     = useState<PeriodStats | null>(null);
  const [monthStats, setMonthStats]   = useState<PeriodStats | null>(null);
  const [dailyGoal, setDailyGoal]     = useState<number | null>(null);
  const [weeklyGoal, setWeeklyGoal]   = useState<number | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState<number | null>(null);
  const [avgKmL, setAvgKmL]           = useState<number | null>(null);
  const [vehicleExpenses, setVehicleExpenses] = useState<Expense[]>([]);
  const [minBase, setMinBase]         = useState(0);
  const [minDebt, setMinDebt]         = useState(0);
  const [expensesExpanded, setExpensesExpanded] = useState(false);
  const [todayTripsEarnings, setTodayTripsEarnings] = useState(0);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now          = new Date();
      const today        = now.toISOString().split("T")[0];
      const dow          = now.getDay();
      const weekStart    = new Date(now);
      weekStart.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow));
      weekStart.setHours(0, 0, 0, 0);
      const weekStr  = weekStart.toISOString().split("T")[0];
      const monthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const [
        { data: snap }, { data: shift },
        { data: wSnaps }, { data: mSnaps },
        { data: prof }, { data: veh },
        dG, wG, mG,
      ] = await Promise.all([
        supabase.from("driver_snapshots").select("*").eq("user_id", user.id).eq("snapshot_date", today).maybeSingle(),
        supabase.from("shifts").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("driver_snapshots").select("total_earnings,total_expenses,net_profit,total_km")
          .eq("user_id", user.id).gte("snapshot_date", weekStr).lte("snapshot_date", today),
        supabase.from("driver_snapshots").select("total_earnings,total_expenses,net_profit,total_km")
          .eq("user_id", user.id).gte("snapshot_date", monthStr).lte("snapshot_date", today),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("vehicles").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle(),
        AsyncStorage.getItem(GOAL_KEY),
        AsyncStorage.getItem(WEEKLY_GOAL_KEY),
        AsyncStorage.getItem(MONTHLY_GOAL_KEY),
      ]);

      setSnapshot(snap ?? null);
      setActiveShift(shift ?? null);
      setUserName((prof as { full_name?: string } | null)?.full_name?.split(" ")[0] ?? "");

      const { data: trips } = await supabase.from("trips")
        .select("fare_amount")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("started_at", today)
        .lt("started_at", new Date(now.getTime() + 86400000).toISOString().split("T")[0]);
      setTodayTripsEarnings((trips ?? []).reduce((s: number, t: { fare_amount: number | null }) => s + (t.fare_amount ?? 0), 0));

      const agg = (rows: Snapshot[] | null): PeriodStats => ({
        earnings:  (rows ?? []).reduce((s: number, r: Snapshot) => s + (r.total_earnings ?? 0), 0),
        expenses:  (rows ?? []).reduce((s: number, r: Snapshot) => s + (r.total_expenses ?? 0), 0),
        netProfit: (rows ?? []).reduce((s: number, r: Snapshot) => s + (r.net_profit ?? 0), 0),
        km:        (rows ?? []).reduce((s: number, r: Snapshot) => s + (r.total_km ?? 0), 0),
      });
      setWeekStats(agg(wSnaps as Snapshot[] | null));
      setMonthStats(agg(mSnaps as Snapshot[] | null));
      setDailyGoal(dG   ? parseFloat(dG)   : null);
      setWeeklyGoal(wG  ? parseFloat(wG)   : null);
      setMonthlyGoal(mG ? parseFloat(mG)   : null);

      const vid = (veh as { id: string } | null)?.id;
      if (vid) {
        const [{ data: refs }, { data: exps }, { data: recentKm }, { data: recentFuel }] = await Promise.all([
          supabase.from("refuelings").select("km_per_liter")
            .eq("vehicle_id", vid).not("km_per_liter", "is", null)
            .order("created_at", { ascending: false }).limit(5),
          supabase.from("vehicle_expenses").select("*").eq("vehicle_id", vid),
          supabase.from("driver_snapshots").select("total_km").eq("user_id", user.id)
            .gte("snapshot_date", new Date(now.getTime() - 14 * 86400000).toISOString().split("T")[0])
            .gt("total_km", 0),
          supabase.from("refuelings").select("total_cost,liters")
            .eq("vehicle_id", vid).order("created_at", { ascending: false }).limit(5),
        ]);

        const vals = ((refs ?? []) as Refueling[]).map(r => r.km_per_liter!).filter(v => v > 0);
        const kpl  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        setAvgKmL(kpl > 0 ? kpl : null);

        const expList = (exps ?? []) as Expense[];
        setVehicleExpenses(expList);

        const kmRows   = (recentKm ?? []) as Snapshot[];
        const avgKmDay = kmRows.length ? kmRows.reduce((s, r) => s + (r.total_km ?? 0), 0) / kmRows.length : 0;
        const fuelRows = (recentFuel ?? []) as { total_cost: number; liters: number }[];
        const avgPPL   = fuelRows.length ? fuelRows.reduce((s, r) => s + r.total_cost / r.liters, 0) / fuelRows.length : 0;

        const baseFromExp = expList.reduce((s, e) => s + (e.installment_amount ?? e.amount) / (FREQ_DAYS[e.frequency] ?? 30), 0);
        const fuelPerDay  = kpl > 0 && avgPPL > 0 && avgKmDay > 0 ? avgKmDay * (avgPPL / kpl) : 0;
        const base        = baseFromExp + fuelPerDay;

        const [storedDebt, debtDate] = await Promise.all([
          AsyncStorage.getItem(DEBT_KEY),
          AsyncStorage.getItem(DEBT_DATE_KEY),
        ]);
        let debt = parseFloat(storedDebt ?? "0") || 0;
        if (debtDate !== today) {
          const yd = new Date(now); yd.setDate(yd.getDate() - 1);
          const yds = yd.toISOString().split("T")[0];
          const { data: ydSnap } = await supabase.from("driver_snapshots")
            .select("total_earnings").eq("user_id", user.id).eq("snapshot_date", yds).maybeSingle();
          const ydE    = (ydSnap as { total_earnings: number } | null)?.total_earnings ?? 0;
          const needed = base + debt;
          debt = ydE < needed ? debt + (needed - ydE) : 0;
          await Promise.all([
            AsyncStorage.setItem(DEBT_KEY, debt.toFixed(2)),
            AsyncStorage.setItem(DEBT_DATE_KEY, today),
          ]);
        }
        setMinBase(base);
        setMinDebt(debt);
      }
    } catch (e) { console.error("[dashboard]", e); }
    finally { setLoading(false); setRefreshing(false); }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  const todayE = Math.max(snapshot?.total_earnings ?? 0, todayTripsEarnings);
  const todayX = snapshot?.total_expenses ?? 0;
  const todayN = todayE - todayX;
  const todayK = Math.max(snapshot?.total_km ?? 0, 0);
  const shiftSince = activeShift
    ? new Date(activeShift.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const shiftDuration = activeShift ? (() => {
    const mins = Math.floor((Date.now() - new Date(activeShift.started_at).getTime()) / 60000);
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  })() : null;

  const nowDate = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
    >
      {/* ── Header ── */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
        <DriverOSLogo size="sm" />
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "700" }}>
            {userName ? `Olá, ${userName} 👋` : "Bem-vindo 👋"}
          </Text>
          <Text style={{ color: "#475569", fontSize: 11 }}>{nowDate}</Text>
        </View>
      </View>

      {/* ── Active Shift ── */}
      {activeShift ? (
        <Pressable onPress={() => router.push("/(app)/shift")}
          style={{ backgroundColor: "#1d4ed8", borderRadius: 14, padding: 16, gap: 8,
            borderWidth: 1, borderColor: "#3b82f6" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ade80" }} />
            <Text style={{ color: "#bfdbfe", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>TURNO ATIVO</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <View>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Desde {shiftSince}</Text>
              <Text style={{ color: "#93c5fd", fontSize: 12 }}>{shiftDuration} em andamento</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#4ade80", fontWeight: "800", fontSize: 17 }}>{fmt(todayE)}</Text>
              <Text style={{ color: "#93c5fd", fontSize: 11 }}>ganhos hoje</Text>
            </View>
          </View>
          <Text style={{ color: "#60a5fa", fontSize: 12, textAlign: "right" }}>Ir para turno →</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push("/(app)/shift")}
          style={{ backgroundColor: "#1e293b", borderRadius: 14, padding: 16, flexDirection: "row",
            justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#334155" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 22 }}>🚗</Text>
            <View>
              <Text style={{ color: "#f8fafc", fontWeight: "700" }}>Nenhum turno ativo</Text>
              <Text style={{ color: "#475569", fontSize: 12 }}>Toque para iniciar</Text>
            </View>
          </View>
          <Text style={{ color: "#3b82f6", fontWeight: "700" }}>Iniciar →</Text>
        </Pressable>
      )}

      {/* ── Goals ── */}
      {(dailyGoal || weeklyGoal || monthlyGoal) ? (
        <View style={{ backgroundColor: "#1e293b", borderRadius: 14, padding: 16, gap: 12,
          borderWidth: 1, borderColor: "#243044" }}>
          <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>METAS</Text>
          {dailyGoal   ? <GoalBar icon="🎯" label="Diária"  current={todayE}               target={dailyGoal}   color="#3b82f6" /> : null}
          {weeklyGoal  ? <GoalBar icon="📅" label="Semanal" current={weekStats?.earnings ?? 0} target={weeklyGoal}  color="#8b5cf6" /> : null}
          {monthlyGoal ? <GoalBar icon="📆" label="Mensal"  current={monthStats?.earnings ?? 0} target={monthlyGoal} color="#f59e0b" /> : null}
        </View>
      ) : null}

      {(minBase > 0 || vehicleExpenses.length > 0) && ((() => {
        const baseOnly = vehicleExpenses.reduce((s: number, e: Expense) => s + (e.installment_amount ?? e.amount) / (FREQ_DAYS[e.frequency] ?? 30), 0);
        const effectiveBase = minBase > 0 ? minBase : baseOnly;
        const minToday = effectiveBase + minDebt;
        const pct  = Math.min(1, minToday > 0 ? todayE / minToday : 0);
        const done = pct >= 1;
        return (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 14, padding: 16, gap: 8,
            borderWidth: 1, borderColor: done ? "#14532d" : "#422006" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: done ? "#22c55e" : "#f59e0b", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
                ⚡ MÍNIMO PARA COBRIR CONTAS
              </Text>
              <Text style={{ color: done ? "#22c55e" : "#f8fafc", fontSize: 11, fontWeight: "700" }}>
                {fmt(todayE)} <Text style={{ color: "#475569" }}>/ {fmt(minToday)}</Text>
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: "#1e3a5f", borderRadius: 3, overflow: "hidden" }}>
              <View style={{ width: `${(pct * 100).toFixed(1)}%` as unknown as number,
                height: 6, backgroundColor: done ? "#22c55e" : "#f59e0b", borderRadius: 3 }} />
            </View>
            <Text style={{ color: done ? "#22c55e" : "#64748b", fontSize: 10 }}>
              {done ? "✓ Contas do dia cobertas!" :
               minDebt > 0 ? `Base ${fmt(effectiveBase)} + acum. ${fmt(minDebt)} — faltam ${fmt(minToday - todayE)}` :
               minBase === 0 && vehicleExpenses.length > 0 ?
                 `${(pct * 100).toFixed(0)}% — faltam ${fmt(minToday - todayE)} (adicione abastecimento para incluir combustível)` :
                 `${(pct * 100).toFixed(0)}% — faltam ${fmt(minToday - todayE)}`}
            </Text>
          </View>
        );
      })())}

      {/* ── Today ── */}
      <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>HOJE</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Card label="Ganhos" value={fmt(todayE)} accent="#22c55e" />
        <Pressable onPress={() => setExpensesExpanded(v => !v)}
          style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 14, padding: 16, gap: 3,
            borderWidth: 1, borderColor: "#243044" }}>
          <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600", letterSpacing: 0.4 }}>
            DESPESAS {expensesExpanded ? "▲" : "▼"}
          </Text>
          <Text style={{ color: "#ef4444", fontSize: 20, fontWeight: "800" }}>{fmt(todayX)}</Text>
          <Text style={{ color: "#334155", fontSize: 10 }}>toque para detalhar</Text>
        </Pressable>
      </View>
      {expensesExpanded && (
        <View style={{ backgroundColor: "#1e293b", borderRadius: 14, padding: 16, gap: 8,
          borderWidth: 1, borderColor: "#243044" }}>
          <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>
            DESPESAS RECORRENTES DO VEÍCULO
          </Text>
          {vehicleExpenses.length === 0 ? (
            <Text style={{ color: "#475569", fontSize: 13, textAlign: "center", paddingVertical: 8 }}>
              📭 Nenhuma despesa cadastrada para este veículo.{"\n"}Toque em 💸 Despesa para adicionar.
            </Text>
          ) : (
            <>
              {Object.entries(
                vehicleExpenses.reduce((acc: Record<string, number>, e) => {
                  acc[e.category] = (acc[e.category] ?? 0) + (e.installment_amount ?? e.amount);
                  return acc;
                }, {})
              ).map(([cat, val]) => (
                <View key={cat} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#94a3b8", fontSize: 13 }}>{EXPENSE_CAT_LABEL[cat] ?? cat}</Text>
                  <Text style={{ color: "#f8fafc", fontSize: 13, fontWeight: "600" }}>{fmt(val as number)}</Text>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: "#334155", marginVertical: 2 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700" }}>Total mensal est.</Text>
                <Text style={{ color: "#ef4444", fontSize: 13, fontWeight: "800" }}>
                  {fmt(vehicleExpenses.reduce((s, e) => s + (e.installment_amount ?? e.amount) / (FREQ_DAYS[e.frequency] ?? 30) * 30, 0))}
                </Text>
              </View>
            </>
          )}
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Card label="Lucro líquido" value={fmt(todayN)}
          accent={todayN >= 0 ? "#f8fafc" : "#ef4444"}
          sub={todayE > 0 ? `${((todayN / todayE) * 100).toFixed(0)}% margem` : undefined} />
        <Card label="Km rodados" value={`${todayK.toFixed(0)} km`}
          sub={todayK > 0 && todayE > 0 ? `R$ ${(todayE / todayK).toFixed(2)}/km` : undefined} />
      </View>

      {!snapshot && (
        <View style={{ alignItems: "center", paddingVertical: 16, gap: 6 }}>
          <Text style={{ fontSize: 28 }}>📊</Text>
          <Text style={{ color: "#475569", textAlign: "center", fontSize: 13 }}>
            Nenhum turno encerrado hoje.{"\n"}Inicie um turno para começar a registrar.
          </Text>
        </View>
      )}

      {/* ── Km/L ── */}
      {avgKmL !== null && (
        <View style={{ backgroundColor: "#1e293b", borderRadius: 14, padding: 14, flexDirection: "row",
          alignItems: "center", gap: 14, borderWidth: 1, borderColor: "#243044" }}>
          <Text style={{ fontSize: 28 }}>⛽</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>EFICIÊNCIA DO VEÍCULO</Text>
            <Text style={{ color: "#f59e0b", fontSize: 22, fontWeight: "800" }}>{avgKmL.toFixed(1)} km/L</Text>
            <Text style={{ color: "#475569", fontSize: 11 }}>Média das últimas 5 abastecidas</Text>
          </View>
          {todayK > 0 && avgKmL > 0 && (
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#94a3b8", fontSize: 10 }}>Consumo estimado</Text>
              <Text style={{ color: "#f8fafc", fontWeight: "700", fontSize: 14 }}>{(todayK / avgKmL).toFixed(1)} L</Text>
              <Text style={{ color: "#64748b", fontSize: 10 }}>no turno de hoje</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Week ── */}
      {weekStats && weekStats.earnings > 0 && (<>
        <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>ESTA SEMANA</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Card label="Ganhos" value={fmt(weekStats.earnings)} accent="#22c55e" />
          <Card label="Lucro"  value={fmt(weekStats.netProfit)}
            sub={weekStats.earnings > 0 ? `${((weekStats.netProfit / weekStats.earnings) * 100).toFixed(0)}% margem` : undefined} />
        </View>
        {weekStats.km > 0 && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Card label="Km rodados" value={`${weekStats.km.toFixed(0)} km`} />
            <Card label="Ganho/km"   value={`R$ ${(weekStats.earnings / weekStats.km).toFixed(2)}`} />
          </View>
        )}
      </>)}

      {/* ── Month ── */}
      {monthStats && monthStats.earnings > 0 && (<>
        <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>ESTE MÊS</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Card label="Ganhos" value={fmt(monthStats.earnings)} accent="#22c55e" />
          <Card label="Lucro"  value={fmt(monthStats.netProfit)}
            sub={monthStats.earnings > 0 ? `${((monthStats.netProfit / monthStats.earnings) * 100).toFixed(0)}% margem` : undefined} />
        </View>
        {monthStats.km > 0 && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Card label="Km rodados" value={`${monthStats.km.toFixed(0)} km`} />
            <Card label="Ganho/km"   value={`R$ ${(monthStats.earnings / monthStats.km).toFixed(2)}`} />
          </View>
        )}
      </>)}

      {/* ── Quick Actions ── */}
      <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", letterSpacing: 1 }}>AÇÕES RÁPIDAS</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable onPress={() => router.push("/(app)/refueling-add")}
          style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center",
            gap: 4, borderWidth: 1, borderColor: "#334155" }}>
          <Text style={{ fontSize: 20 }}>⛽</Text>
          <Text style={{ color: "#f59e0b", fontSize: 12, fontWeight: "700" }}>Abastecer</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(app)/expense-add")}
          style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center",
            gap: 4, borderWidth: 1, borderColor: "#334155" }}>
          <Text style={{ fontSize: 20 }}>💸</Text>
          <Text style={{ color: "#3b82f6", fontSize: 12, fontWeight: "700" }}>Despesa</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(app)/maintenance-add")}
          style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center",
            gap: 4, borderWidth: 1, borderColor: "#334155" }}>
          <Text style={{ fontSize: 20 }}>🔧</Text>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700" }}>Manutenção</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(app)/trip-add")}
          style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center",
            gap: 4, borderWidth: 1, borderColor: "#334155" }}>
          <Text style={{ fontSize: 20 }}>📝</Text>
          <Text style={{ color: "#22c55e", fontSize: 12, fontWeight: "700" }}>Corrida</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push("/(app)/history")}
        style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row",
          justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#334155" }}>
        <Text style={{ color: "#f8fafc", fontWeight: "700" }}>📋 Histórico de turnos</Text>
        <Text style={{ color: "#3b82f6" }}>→</Text>
      </Pressable>
    </ScrollView>
  );
}
