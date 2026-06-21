import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Snapshot = Tables<"driver_snapshots">;
type Shift = Tables<"shifts">;

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 12, padding: 16, gap: 4 }}>
      <Text style={{ color: "#94a3b8", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "#f8fafc", fontSize: 22, fontWeight: "bold" }}>{value}</Text>
      {sub ? <Text style={{ color: "#64748b", fontSize: 11 }}>{sub}</Text> : null}
    </View>
  );
}

export default function DashboardScreen() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const [{ data: snap }, { data: shift }] = await Promise.all([
        supabase
          .from("driver_snapshots")
          .select("*")
          .eq("user_id", user.id)
          .eq("snapshot_date", today)
          .maybeSingle(),
        supabase
          .from("shifts")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle(),
      ]);

      setSnapshot(snap ?? null);
      setActiveShift(shift ?? null);
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

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

      <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 8 }}>HOJE</Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          label="Ganhos"
          value={snapshot ? fmt(snapshot.total_earnings) : "R$ 0,00"}
        />
        <StatCard
          label="Despesas"
          value={snapshot ? fmt(snapshot.total_expenses) : "R$ 0,00"}
        />
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatCard
          label="Lucro líquido"
          value={snapshot ? fmt(snapshot.net_profit) : "R$ 0,00"}
          sub={snapshot && snapshot.total_earnings > 0
            ? `${((snapshot.net_profit / snapshot.total_earnings) * 100).toFixed(0)}% margem`
            : undefined}
        />
        <StatCard
          label="Quilômetros"
          value={snapshot ? `${snapshot.total_km.toFixed(0)} km` : "0 km"}
        />
      </View>

      {!snapshot && (
        <View style={{ alignItems: "center", paddingVertical: 32, gap: 8 }}>
          <Text style={{ fontSize: 32 }}>📊</Text>
          <Text style={{ color: "#94a3b8", textAlign: "center" }}>
            Nenhum dado registrado hoje.{"\n"}Inicie um turno para começar.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
