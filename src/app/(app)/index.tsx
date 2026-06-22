import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
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
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split("T")[0];

        const [{ data: snap, error: e1 }, { data: shift, error: e2 }] = await Promise.all([
          supabase.from("driver_snapshots").select("*").eq("user_id", user.id).eq("snapshot_date", today).maybeSingle(),
          supabase.from("shifts").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
        ]);

        if (e1) console.error("[dashboard] snapshots", e1);
        if (e2) console.error("[dashboard] shifts", e2);

        setSnapshot(snap ?? null);
        setActiveShift(shift ?? null);
      } catch (e) {
        console.error("[dashboard] exception", e);
      } finally {
        setLoading(false);
      }
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

      <Pressable
        onPress={() => router.push("/(app)/history")}
        style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}
      >
        <Text style={{ color: "#f8fafc", fontWeight: "600" }}>📋 Histórico de turnos</Text>
        <Text style={{ color: "#94a3b8" }}>→</Text>
      </Pressable>
    </ScrollView>
  );
}
