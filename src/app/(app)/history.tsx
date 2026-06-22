import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Share, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Shift = Tables<"shifts"> & { trips: Tables<"trips">[] };
type FilterPeriod = "week" | "month" | "prev" | "all";

const PERIOD_OPTS: { value: FilterPeriod; label: string }[] = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "prev", label: "Mês ant." },
  { value: "all", label: "Tudo" },
];

function getPeriodRange(p: FilterPeriod): { start: string; end: string } | null {
  if (p === "all") return null;
  const now = new Date();
  if (p === "week") {
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString(), end: now.toISOString() };
  }
  if (p === "month") {
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

const CATEGORY_LABEL: Record<Tables<"trips">["category"], string> = {
  passenger_pickup: "🛣️ Buscar",
  passenger_dropoff: "🎯 Entregar",
  repositioning: "↩️ Reposicionamento",
  refueling: "⛽ Abastecimento",
  personal: "🏠 Pessoal",
  unpaid_detour: "⚠️ Desvio",
};

function ShiftCard({ shift }: { shift: Shift }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const earnings = shift.trips.reduce((s, t) => s + (t.fare_amount ?? 0), 0);
  const duration = shift.ended_at
    ? Math.round((new Date(shift.ended_at).getTime() - new Date(shift.started_at).getTime()) / 60000)
    : null;

  return (
    <Pressable onPress={() => setExpanded(e => !e)} style={{ backgroundColor: "#1e293b", borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
      <View style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ gap: 2 }}>
          <Text style={{ color: "#f8fafc", fontWeight: "600" }}>
            {new Date(shift.started_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </Text>
          <Text style={{ color: "#94a3b8", fontSize: 12 }}>
            {new Date(shift.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {shift.ended_at ? ` → ${new Date(shift.ended_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : " (ativo)"}
            {duration ? ` • ${Math.floor(duration / 60)}h${duration % 60}min` : ""}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 2 }}>
          <Text style={{ color: "#22c55e", fontWeight: "700" }}>
            {earnings.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 12 }}>{shift.trips.length} viagens</Text>
        </View>
      </View>

      {expanded && shift.trips.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: "#334155" }}>
          {shift.trips.map(trip => (
            <View key={trip.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#0f172a" }}>
              <View style={{ gap: 2 }}>
                <Text style={{ color: "#94a3b8", fontSize: 13 }}>{CATEGORY_LABEL[trip.category]}</Text>
                {trip.distance_km ? (
                  <Text style={{ color: "#475569", fontSize: 11 }}>{Number(trip.distance_km).toFixed(1)} km</Text>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {trip.route_geojson ? (
                  <Pressable onPress={() => router.push(`/(app)/trip-map?tripId=${trip.id}` as never)}>
                    <Text style={{ color: "#3b82f6", fontSize: 12, fontWeight: "600" }}>🗺 Rota</Text>
                  </Pressable>
                ) : null}
                <Text style={{ color: trip.fare_amount ? "#f8fafc" : "#475569", fontSize: 13 }}>
                  {trip.fare_amount
                    ? trip.fare_amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                    : "—"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

export default function HistoryScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FilterPeriod>("month");

  useEffect(() => {
    load(period);
  }, [period]);

  async function load(p: FilterPeriod) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const range = getPeriodRange(p);
      let q = supabase
        .from("shifts")
        .select("*, trips(*)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(100);
      if (range) q = q.gte("started_at", range.start).lte("started_at", range.end);
      const { data, error } = await q;
      if (error) console.error("[history]", error);
      setShifts((data as Shift[]) ?? []);
    } catch (e) {
      console.error("[history] exception", e);
    } finally {
      setLoading(false);
    }
  }

  const totalEarnings = shifts.reduce(
    (s: number, sh: Shift) => s + sh.trips.reduce((t: number, tr: Tables<"trips">) => t + (tr.fare_amount ?? 0), 0), 0
  );
  const totalKm = shifts.reduce((s: number, sh: Shift) => {
    const fin = sh.final_odometer_km ?? 0;
    const ini = sh.initial_odometer_km ?? 0;
    return s + Math.max(0, fin - ini);
  }, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  async function exportCsv() {
    if (shifts.length === 0) {
      Alert.alert("Sem dados", "Não há turnos no período selecionado para exportar.");
      return;
    }
    const header = "Data,Início,Fim,Km Inicial,Km Final,Km Rodados,Nº Viagens,Ganhos (R$),Status";
    const rows = shifts.map((sh: Shift) => {
      const date = new Date(sh.started_at).toLocaleDateString("pt-BR");
      const start = new Date(sh.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const end = sh.ended_at ? new Date(sh.ended_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "";
      const kmIni = sh.initial_odometer_km?.toFixed(0) ?? "";
      const kmFin = sh.final_odometer_km?.toFixed(0) ?? "";
      const km = sh.final_odometer_km && sh.initial_odometer_km
        ? Math.max(0, sh.final_odometer_km - sh.initial_odometer_km).toFixed(0) : "";
      const trips = sh.trips.length;
      const earnings = sh.trips.reduce((s: number, tr: Tables<"trips">) => s + (tr.fare_amount ?? 0), 0).toFixed(2);
      return `${date},${start},${end},${kmIni},${kmFin},${km},${trips},${earnings},${sh.status}`;
    });
    const csv = [header, ...rows].join("\n");
    try {
      await Share.share({ message: csv, title: "DriverOS - Histórico de Turnos" });
    } catch (e) {
      console.error("[exportCsv]", e);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      {/* Period filter */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8 }}>
        {PERIOD_OPTS.map(p => (
          <Pressable key={p.value} onPress={() => setPeriod(p.value)}
            style={{ flex: 1, paddingVertical: 7, borderRadius: 20, alignItems: "center",
              backgroundColor: period === p.value ? "#1d4ed8" : "#1e293b",
              borderWidth: 1, borderColor: period === p.value ? "#3b82f6" : "#334155" }}>
            <Text style={{ color: period === p.value ? "#fff" : "#94a3b8", fontSize: 11, fontWeight: "600" }}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Period summary + export */}
      {!loading && shifts.length > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 8, gap: 8 }}>
        <Pressable onPress={exportCsv}
          style={{ backgroundColor: "#1e293b", borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14,
            alignItems: "center", borderWidth: 1, borderColor: "#334155" }}>
          <Text style={{ color: "#3b82f6", fontWeight: "600", fontSize: 13 }}>📤 Exportar CSV</Text>
        </Pressable>
        <View style={{ flexDirection: "row", backgroundColor: "#1e293b", borderRadius: 12, padding: 14, gap: 16 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: "#64748b", fontSize: 11 }}>Ganhos no período</Text>
            <Text style={{ color: "#22c55e", fontWeight: "700", fontSize: 18 }}>{fmt(totalEarnings)}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: "#64748b", fontSize: 11 }}>Turnos</Text>
            <Text style={{ color: "#f8fafc", fontWeight: "700", fontSize: 18 }}>{shifts.length}</Text>
          </View>
          {totalKm > 0 && (
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: "#64748b", fontSize: 11 }}>Km rodados</Text>
              <Text style={{ color: "#f8fafc", fontWeight: "700", fontSize: 18 }}>{totalKm.toFixed(0)}</Text>
            </View>
          )}
        </View>
        </View>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#3b82f6" />
        </View>
      ) : shifts.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text style={{ fontSize: 40 }}>📋</Text>
          <Text style={{ color: "#94a3b8", textAlign: "center" }}>
            Nenhum turno no período selecionado.
          </Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={(s: Shift) => s.id}
          renderItem={({ item }: { item: Shift }) => <ShiftCard shift={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        />
      )}
    </View>
  );
}
