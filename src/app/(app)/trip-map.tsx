import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import RouteMap from "../../components/RouteMap";

const CATEGORY_LABEL: Record<string, string> = {
  passenger_pickup: "🛣️ Buscar passageiro",
  passenger_dropoff: "🎯 Entregar passageiro",
  repositioning: "↩️ Reposicionamento",
  refueling: "⛽ Abastecimento",
  personal: "🏠 Pessoal",
  unpaid_detour: "⚠️ Desvio não pago",
};

type TripData = {
  id: string;
  category: string;
  started_at: string;
  ended_at: string | null;
  distance_km: number | null;
  fare_amount: number | null;
  start_location: { latitude: number; longitude: number } | null;
  end_location: { latitude: number; longitude: number } | null;
  route_geojson: object | null;
};

export default function TripMapScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<TripData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!tripId) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from("trips")
          .select("id, category, started_at, ended_at, distance_km, fare_amount, start_location, end_location, route_geojson")
          .eq("id", tripId)
          .single();
        if (error) console.error("[trip-map]", error);
        setTrip(data as TripData ?? null);
      } catch (e) {
        console.error("[trip-map] exception", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tripId]);

  const durationMin = trip?.started_at && trip.ended_at
    ? Math.round((new Date(trip.ended_at).getTime() - new Date(trip.started_at).getTime()) / 60000)
    : null;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a", position: "relative" }}>
      <RouteMap
        startLocation={trip?.start_location ?? null}
        endLocation={trip?.end_location ?? null}
        routeGeoJSON={trip?.route_geojson ?? null}
      />

      <Pressable
        onPress={() => router.back()}
        style={{ position: "absolute", top: 16, left: 16, backgroundColor: "rgba(15,23,42,0.88)", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 }}
      >
        <Text style={{ color: "#f8fafc", fontSize: 15, fontWeight: "600" }}>← Voltar</Text>
      </Pressable>

      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        backgroundColor: "rgba(15,23,42,0.93)", padding: 20, gap: 10,
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
      }}>
        <Text style={{ color: "#f8fafc", fontSize: 17, fontWeight: "700" }}>
          {CATEGORY_LABEL[trip?.category ?? ""] ?? trip?.category}
        </Text>
        <View style={{ flexDirection: "row", gap: 24, flexWrap: "wrap" }}>
          {trip?.distance_km ? (
            <View>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>DISTÂNCIA</Text>
              <Text style={{ color: "#f8fafc", fontWeight: "600", fontSize: 15 }}>{trip.distance_km.toFixed(1)} km</Text>
            </View>
          ) : null}
          {durationMin !== null ? (
            <View>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>DURAÇÃO</Text>
              <Text style={{ color: "#f8fafc", fontWeight: "600", fontSize: 15 }}>
                {durationMin < 60 ? `${durationMin}min` : `${Math.floor(durationMin / 60)}h${durationMin % 60}min`}
              </Text>
            </View>
          ) : null}
          {trip?.fare_amount ? (
            <View>
              <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "600" }}>GANHO</Text>
              <Text style={{ color: "#22c55e", fontWeight: "700", fontSize: 15 }}>
                {trip.fare_amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </Text>
            </View>
          ) : null}
        </View>
        {!trip?.route_geojson && (
          <Text style={{ color: "#475569", fontSize: 12 }}>
            Rota GPS não disponível (viagem registrada sem rastreamento ativo)
          </Text>
        )}
      </View>
    </View>
  );
}
