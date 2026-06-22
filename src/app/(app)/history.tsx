import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Shift = Tables<"shifts"> & { trips: Tables<"trips">[] };

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

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
          .from("shifts")
          .select("*, trips(*)")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(30);
        if (error) console.error("[history]", error);
        setShifts((data as Shift[]) ?? []);
      } catch (e) {
        console.error("[history] exception", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a", padding: 16 }}>
      {shifts.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text style={{ fontSize: 40 }}>📋</Text>
          <Text style={{ color: "#94a3b8", textAlign: "center" }}>
            Nenhum turno registrado ainda.{"\n"}Inicie seu primeiro turno na aba Turno.
          </Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          keyExtractor={s => s.id}
          renderItem={({ item }) => <ShiftCard shift={item} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
