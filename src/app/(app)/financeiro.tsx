import { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
  const [refuelings, setRefuelings] = useState<Refueling[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [])
  );

  async function loadAll() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First get the user's vehicle IDs to filter related records correctly
    const { data: userVehicles } = await supabase
      .from("vehicles")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active");

    const vehicleIds = (userVehicles ?? []).map((v: { id: string }) => v.id);

    const [{ data: r }, { data: m }, { data: e }] = await Promise.all([
      supabase.from("refuelings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      vehicleIds.length > 0
        ? supabase.from("maintenances").select("*").in("vehicle_id", vehicleIds).order("performed_at", { ascending: false }).limit(30)
        : Promise.resolve({ data: [] as Maintenance[], error: null }),
      vehicleIds.length > 0
        ? supabase.from("vehicle_expenses").select("*").in("vehicle_id", vehicleIds).order("due_date", { ascending: true }).limit(50)
        : Promise.resolve({ data: [] as Expense[], error: null }),
    ]);

    setRefuelings(r ?? []);
    setMaintenances(m ?? []);
    setExpenses(e ?? []);
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = () => { setRefreshing(true); loadAll(); };

  const totalRefueling = refuelings.reduce((s: number, r: Refueling) => s + r.total_cost, 0);
  const totalMaintenance = maintenances.reduce((s: number, m: Maintenance) => s + (m.cost ?? 0), 0);
  const totalExpenses = expenses.filter((e: Expense) => e.status === "paid").reduce((s: number, e: Expense) => s + e.amount, 0);

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 72 }}
        contentContainerStyle={{ padding: 16, gap: 10, flexDirection: "row" }}
      >
        <SummaryPill label="Combustível" value={fmt(totalRefueling)} color="#f59e0b" />
        <SummaryPill label="Manutenções" value={fmt(totalMaintenance)} color="#8b5cf6" />
        <SummaryPill label="Despesas pagas" value={fmt(totalExpenses)} color="#ef4444" />
      </ScrollView>

      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 4 }}>
        {(["refuelings", "maintenances", "expenses"] as Tab[]).map(t => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: tab === t ? "#1d4ed8" : "#1e293b",
            }}
          >
            <Text style={{ color: tab === t ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: "600" }}>
              {t === "refuelings" ? "⛽ Combustível" : t === "maintenances" ? "🔧 Manutenção" : "📄 Despesas"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "refuelings" && (
        <>
          <AddButton label="+ Novo abastecimento" onPress={() => router.push("/(app)/refueling-add")} />
          <FlatList<Refueling>
            data={refuelings}
            keyExtractor={(i: Refueling) => i.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            contentContainerStyle={{ padding: 16, gap: 10, paddingTop: 4 }}
            ListEmptyComponent={<Empty label="Nenhum abastecimento registrado." />}
            renderItem={({ item }: { item: Refueling }) => (
              <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ color: "#f8fafc", fontWeight: "600" }}>⛽ {item.liters.toFixed(2)} L</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 12 }}>{item.station_name ?? "Posto não informado"}</Text>
                  <Text style={{ color: "#64748b", fontSize: 11 }}>{new Date(item.created_at).toLocaleDateString("pt-BR")}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={{ color: "#f59e0b", fontWeight: "700" }}>{fmt(item.total_cost)}</Text>
                  <Text style={{ color: "#64748b", fontSize: 11 }}>R$ {item.price_per_liter.toFixed(3)}/L</Text>
                  <Text style={{ color: "#64748b", fontSize: 11 }}>{item.odometer_km.toFixed(0)} km</Text>
                </View>
              </View>
            )}
          />
        </>
      )}

      {tab === "maintenances" && (
        <>
          <AddButton label="+ Nova manutenção" onPress={() => router.push("/(app)/maintenance-add")} />
          <FlatList<Maintenance>
            data={maintenances}
            keyExtractor={(i: Maintenance) => i.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
            contentContainerStyle={{ padding: 16, gap: 10, paddingTop: 4 }}
            ListEmptyComponent={<Empty label="Nenhuma manutenção registrada." />}
            renderItem={({ item }: { item: Maintenance }) => (
              <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ gap: 2, flex: 1, marginRight: 12 }}>
                  <Text style={{ color: "#f8fafc", fontWeight: "600" }}>🔧 {MAINTENANCE_LABEL[item.type]}</Text>
                  {item.description ? <Text style={{ color: "#94a3b8", fontSize: 12 }}>{item.description}</Text> : null}
                  <Text style={{ color: "#64748b", fontSize: 11 }}>{new Date(item.performed_at).toLocaleDateString("pt-BR")} • {item.odometer_km.toFixed(0)} km</Text>
                </View>
                <Text style={{ color: "#8b5cf6", fontWeight: "700" }}>{item.cost ? fmt(item.cost) : "—"}</Text>
              </View>
            )}
          />
        </>
      )}

      {tab === "expenses" && (
        <FlatList<Expense>
          data={expenses}
          keyExtractor={(i: Expense) => i.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          contentContainerStyle={{ padding: 16, gap: 10, paddingTop: 4 }}
          ListEmptyComponent={<Empty label="Nenhuma despesa cadastrada." />}
          renderItem={({ item }: { item: Expense }) => (
            <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ gap: 2, flex: 1, marginRight: 12 }}>
                <Text style={{ color: "#f8fafc", fontWeight: "600" }}>📄 {EXPENSE_LABEL[item.category]}</Text>
                <Text style={{ color: "#94a3b8", fontSize: 12 }}>{item.description}</Text>
                {item.due_date ? <Text style={{ color: "#64748b", fontSize: 11 }}>Vence: {new Date(item.due_date).toLocaleDateString("pt-BR")}</Text> : null}
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ color: "#ef4444", fontWeight: "700" }}>{fmt(item.amount)}</Text>
                <View style={{ backgroundColor: STATUS_COLOR[item.status] + "33", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: STATUS_COLOR[item.status], fontSize: 11, fontWeight: "600" }}>{STATUS_LABEL[item.status]}</Text>
                </View>
              </View>
            </View>
          )}
        />
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
