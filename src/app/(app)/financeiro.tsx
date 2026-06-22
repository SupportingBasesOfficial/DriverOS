import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Refueling = Tables<"refuelings">;
type Maintenance = Tables<"maintenances">;
type Expense = Tables<"vehicle_expenses">;
type Tab = "refuelings" | "maintenances" | "expenses";
type Period = "month" | "prev" | "all";

function getRange(period: Period): { start: string; end: string } | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      end: now.toISOString(),
    };
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
    end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString(),
  };
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "month", label: "Este mês" },
  { value: "prev", label: "Mês anterior" },
  { value: "all", label: "Tudo" },
];

const MAINTENANCE_LABEL: Record<Tables<"maintenances">["type"], string> = {
  preventive: "Preventiva",
  corrective: "Corretiva",
  inspection: "Revisão",
  tire_change: "Troca de pneu",
  oil_change: "Troca de óleo",
  other: "Outro",
};

const EXPENSE_LABEL: Record<Tables<"vehicle_expenses">["category"], string> = {
  ipva: "IPVA",
  insurance: "Seguro",
  licensing: "Licenciamento",
  financing: "Financiamento",
  rent: "Aluguel",
  maintenance: "Manutenção",
  fuel: "Combustível",
  other: "Outro",
};

const STATUS_COLOR: Record<Tables<"vehicle_expenses">["status"], string> = {
  pending: "#f59e0b",
  paid: "#22c55e",
  overdue: "#ef4444",
};

const STATUS_LABEL: Record<Tables<"vehicle_expenses">["status"], string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Vencido",
};

export default function FinanceiroScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("refuelings");
  const [period, setPeriod] = useState<Period>("month");
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [periodKm, setPeriodKm] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { loadAll(period); }, []));
  useEffect(() => { loadAll(period); }, [period]);

  async function loadAll(p: Period = period) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: userVehicles } = await supabase
      .from("vehicles").select("id").eq("user_id", user.id).eq("status", "active");
    const vehicleIds = (userVehicles ?? []).map((v: { id: string }) => v.id);
    const range = getRange(p);

    let rq = supabase.from("refuelings").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(50);
    if (range) rq = rq.gte("created_at", range.start).lte("created_at", range.end);

    let mq = vehicleIds.length > 0
      ? supabase.from("maintenances").select("*").in("vehicle_id", vehicleIds)
          .order("performed_at", { ascending: false }).limit(50)
      : null;
    if (mq && range) mq = mq.gte("performed_at", range.start).lte("performed_at", range.end);

    const eq = vehicleIds.length > 0
      ? supabase.from("vehicle_expenses").select("*").in("vehicle_id", vehicleIds)
          .order("due_date", { ascending: true }).limit(100)
      : null;

    let sq = supabase.from("shifts").select("initial_odometer_km,final_odometer_km")
      .eq("user_id", user.id).eq("status", "completed").not("final_odometer_km", "is", null);
    if (range) sq = sq.gte("started_at", range.start).lte("started_at", range.end);

    const [{ data: r }, mResult, eResult, { data: shifts }] = await Promise.all([
      rq,
      mq ?? Promise.resolve({ data: [] as Maintenance[], error: null }),
      eq ?? Promise.resolve({ data: [] as Expense[], error: null }),
      sq,
    ]);

    setRefuelings((r ?? []) as Refueling[]);
    setMaintenances(((mResult as { data: Maintenance[] | null }).data ?? []));
    setExpenses(((eResult as { data: Expense[] | null }).data ?? []));

    const km = ((shifts ?? []) as { initial_odometer_km: number; final_odometer_km: number }[])
      .reduce((s, sh) => s + Math.max(0, (sh.final_odometer_km ?? 0) - sh.initial_odometer_km), 0);
    setPeriodKm(km);

    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = () => { setRefreshing(true); loadAll(period); };

  async function markPaid(id: string) {
    await supabase.from("vehicle_expenses").update({ status: "paid" }).eq("id", id);
    loadAll(period);
  }

  async function deleteRecord(table: "refuelings" | "maintenances" | "vehicle_expenses", id: string, label: string) {
    Alert.alert(`Excluir ${label}`, "Confirma a exclusão? Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        await supabase.from(table).delete().eq("id", id);
        loadAll(period);
      }},
    ]);
  }

  const totalRefueling = refuelings.reduce((s, r) => s + r.total_cost, 0);
  const totalMaintenance = maintenances.reduce((s, m) => s + (m.cost ?? 0), 0);
  const totalExpenses = expenses.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0);
  const totalCosts = totalRefueling + totalMaintenance + totalExpenses;
  const costPerKm = periodKm > 0 ? totalCosts / periodKm : 0;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Period selector */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, gap: 8 }}>
        {PERIOD_OPTIONS.map(p => (
          <Pressable key={p.value} onPress={() => setPeriod(p.value)}
            style={{ flex: 1, paddingVertical: 7, borderRadius: 20, alignItems: "center",
              backgroundColor: period === p.value ? "#1d4ed8" : "#1e293b",
              borderWidth: 1, borderColor: period === p.value ? "#3b82f6" : "#334155" }}>
            <Text style={{ color: period === p.value ? "#fff" : "#94a3b8", fontSize: 11, fontWeight: "600" }}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Summary pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 72 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: "row", alignItems: "center" }}>
        <SummaryPill label="Combustível" value={fmt(totalRefueling)} color="#f59e0b" />
        <SummaryPill label="Manutenções" value={fmt(totalMaintenance)} color="#8b5cf6" />
        <SummaryPill label="Despesas pagas" value={fmt(totalExpenses)} color="#ef4444" />
        {costPerKm > 0 && <SummaryPill label="Custo/km" value={`R$ ${costPerKm.toFixed(2)}`} color="#22c55e" />}
      </ScrollView>

      {/* Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 }}>
        {(["refuelings", "maintenances", "expenses"] as Tab[]).map(t => (
          <Pressable key={t} onPress={() => setTab(t)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
              backgroundColor: tab === t ? "#1d4ed8" : "#1e293b" }}>
            <Text style={{ color: tab === t ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: "600" }}>
              {t === "refuelings" ? "⛽ Combustível" : t === "maintenances" ? "🔧 Manutenção" : "📄 Despesas"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "refuelings" && (
        <>
          <AddButton label="+ Novo abastecimento" onPress={() => router.push("/(app)/refueling-add")} />
          <FlatList<Refueling> data={refuelings} keyExtractor={i => i.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            contentContainerStyle={{ padding: 16, gap: 10, paddingTop: 4 }}
            ListEmptyComponent={<Empty label="Nenhum abastecimento no período." />}
            renderItem={({ item }) => (
              <Pressable onLongPress={() => deleteRecord("refuelings", item.id, "abastecimento")}
                style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ color: "#f8fafc", fontWeight: "600" }}>⛽ {item.liters.toFixed(2)} L</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 12 }}>{item.station_name ?? "Posto não informado"}</Text>
                  <Text style={{ color: "#64748b", fontSize: 11 }}>{new Date(item.created_at).toLocaleDateString("pt-BR")}</Text>
                  <Text style={{ color: "#334155", fontSize: 10 }}>Segure para excluir</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={{ color: "#f59e0b", fontWeight: "700" }}>{fmt(item.total_cost)}</Text>
                  <Text style={{ color: "#64748b", fontSize: 11 }}>R$ {item.price_per_liter.toFixed(3)}/L</Text>
                  <Text style={{ color: "#64748b", fontSize: 11 }}>{item.odometer_km.toFixed(0)} km</Text>
                </View>
              </Pressable>
            )}
          />
        </>
      )}

      {tab === "maintenances" && (
        <>
          <AddButton label="+ Nova manutenção" onPress={() => router.push("/(app)/maintenance-add")} />
          <FlatList<Maintenance> data={maintenances} keyExtractor={i => i.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            contentContainerStyle={{ padding: 16, gap: 10, paddingTop: 4 }}
            ListEmptyComponent={<Empty label="Nenhuma manutenção no período." />}
            renderItem={({ item }) => (
              <Pressable onLongPress={() => deleteRecord("maintenances", item.id, "manutenção")}
                style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ gap: 2, flex: 1, marginRight: 12 }}>
                  <Text style={{ color: "#f8fafc", fontWeight: "600" }}>🔧 {MAINTENANCE_LABEL[item.type]}</Text>
                  {item.description ? <Text style={{ color: "#94a3b8", fontSize: 12 }}>{item.description}</Text> : null}
                  <Text style={{ color: "#64748b", fontSize: 11 }}>{new Date(item.performed_at).toLocaleDateString("pt-BR")} • {item.odometer_km.toFixed(0)} km</Text>
                  <Text style={{ color: "#334155", fontSize: 10 }}>Segure para excluir</Text>
                </View>
                <Text style={{ color: "#8b5cf6", fontWeight: "700" }}>{item.cost ? fmt(item.cost) : "—"}</Text>
              </Pressable>
            )}
          />
        </>
      )}

      {tab === "expenses" && (
        <>
          <AddButton label="+ Nova despesa" onPress={() => router.push("/(app)/expense-add")} />
          <FlatList<Expense> data={expenses} keyExtractor={i => i.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            contentContainerStyle={{ padding: 16, gap: 10, paddingTop: 4 }}
            ListEmptyComponent={<Empty label={"Nenhuma despesa cadastrada.\nToque em + Nova despesa para começar."} />}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: "#1e293b", borderRadius: 12, overflow: "hidden" }}>
                <Pressable onLongPress={() => deleteRecord("vehicle_expenses", item.id, "despesa")}
                  style={{ padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ gap: 2, flex: 1, marginRight: 12 }}>
                    <Text style={{ color: "#f8fafc", fontWeight: "600" }}>📄 {EXPENSE_LABEL[item.category]}</Text>
                    <Text style={{ color: "#94a3b8", fontSize: 12 }}>{item.description}</Text>
                    {item.due_date ? (
                      <Text style={{ color: "#64748b", fontSize: 11 }}>Vence: {new Date(item.due_date).toLocaleDateString("pt-BR")}</Text>
                    ) : null}
                    <Text style={{ color: "#334155", fontSize: 10 }}>Segure para excluir</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 6 }}>
                    <Text style={{ color: "#ef4444", fontWeight: "700" }}>{fmt(item.amount)}</Text>
                    <View style={{ backgroundColor: STATUS_COLOR[item.status] + "33", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: STATUS_COLOR[item.status], fontSize: 11, fontWeight: "600" }}>{STATUS_LABEL[item.status]}</Text>
                    </View>
                  </View>
                </Pressable>
                {(item.status === "pending" || item.status === "overdue") && (
                  <Pressable onPress={() => markPaid(item.id)}
                    style={{ backgroundColor: "#14532d", paddingVertical: 10, alignItems: "center" }}>
                    <Text style={{ color: "#4ade80", fontSize: 13, fontWeight: "700" }}>✓  Marcar como pago</Text>
                  </Pressable>
                )}
              </View>
            )}
          />
        </>
      )}
    </View>
  );
}

function SummaryPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ backgroundColor: "#1e293b", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, gap: 2 }}>
      <Text style={{ color: "#64748b", fontSize: 11 }}>{label}</Text>
      <Text style={{ color, fontWeight: "700", fontSize: 14 }}>{value}</Text>
    </View>
  );
}

function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 4, backgroundColor: "#1e293b", borderRadius: 10, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "#334155", borderStyle: "dashed" }}
    >
      <Text style={{ color: "#3b82f6", fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
      <Text style={{ fontSize: 32 }}>📭</Text>
      <Text style={{ color: "#475569", textAlign: "center" }}>{label}</Text>
    </View>
  );
}
