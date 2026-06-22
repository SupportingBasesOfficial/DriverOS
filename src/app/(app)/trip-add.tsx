import { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, Alert, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

const TRIP_CATEGORIES = [
  { value: "app_ride", label: "App de transporte", icon: "🚕" },
  { value: "street_hail", label: "Bandeira", icon: "🙋" },
  { value: "private", label: "Particular", icon: "🤝" },
  { value: "other", label: "Outro", icon: "📦" },
];

export default function TripAddScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<{ id: string; name: string; plate: string }[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [category, setCategory] = useState("app_ride");
  const [fare, setFare] = useState("");
  const [tip, setTip] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [rideApps, setRideApps] = useState<{ id: string; name: string }[]>([]);
  const [selectedRideApp, setSelectedRideApp] = useState<string | null>(null);
  const [dateStr, setDateStr] = useState(() => {
    const now = new Date();
    return now.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", "");
  });
  const [activeShift, setActiveShift] = useState<{ id: string; vehicle_id: string } | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [vRes, aRes, rRes] = await Promise.all([
      supabase.from("vehicles").select("id, name, plate").eq("user_id", user.id).eq("status", "active"),
      supabase.from("shifts").select("id, vehicle_id").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      supabase.from("ride_apps").select("id, name").order("name"),
    ]);
    const vehs = (vRes.data ?? []) as { id: string; name: string; plate: string }[];
    setVehicles(vehs);
    setActiveShift((aRes.data as { id: string; vehicle_id: string } | null) ?? null);
    if (aRes.data) {
      setSelectedVehicle(aRes.data.vehicle_id);
    } else if (vehs.length === 1) {
      setSelectedVehicle(vehs[0].id);
    }
    setRideApps((rRes.data ?? []) as { id: string; name: string }[]);
  }

  function parseDateBR(s: string): Date | null {
    const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
    if (!m) return null;
    const [_, d, mo, y, h, mi] = m;
    const dt = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d), parseInt(h), parseInt(mi));
    return isNaN(dt.getTime()) ? null : dt;
  }

  async function handleSave() {
    const fareNum = parseFloat(fare.replace(",", "."));
    if (isNaN(fareNum) || fareNum <= 0) {
      Alert.alert("Informe o valor da corrida.");
      return;
    }
    if (!selectedVehicle) {
      Alert.alert("Selecione um veículo.");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const tipNum = tip ? parseFloat(tip.replace(",", ".")) : null;
    const distNum = distance ? parseFloat(distance.replace(",", ".")) : null;
    const durNum = duration ? parseInt(duration, 10) : null;

    const { error } = await supabase.from("trips").insert({
      user_id: user.id,
      shift_id: activeShift?.id ?? null,
      vehicle_id: selectedVehicle,
      category,
      ride_app_id: category === "app_ride" ? selectedRideApp : null,
      fare_amount: fareNum,
      tip_amount: tipNum,
      distance_km: distNum,
      duration_minutes: durNum,
      started_at: parseDateBR(dateStr)?.toISOString() ?? new Date().toISOString(),
      ended_at: parseDateBR(dateStr)?.toISOString() ?? new Date().toISOString(),
      status: "completed",
      origin_address: origin.trim() || null,
      destination_address: destination.trim() || null,
    });

    setLoading(false);
    if (error) { Alert.alert("Erro", error.message); return; }
    if (user && activeShift?.id) {
      const dt = parseDateBR(dateStr) ?? new Date();
      const today = dt.toISOString().split("T")[0];
      await supabase.rpc("snapshot_daily_update", { p_user_id: user.id, p_date: today });
    }
    router.back();
  }

  function maskMoney(v: string): string {
    const digits = v.replace(/\D/g, "");
    const num = parseInt(digits, 10);
    if (isNaN(num)) return "";
    return (num / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#0f172a" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 12 }}>
        <Text style={{ color: "#f8fafc", fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>📝 Registrar corrida</Text>

        {vehicles.length > 1 && !activeShift && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>VEÍCULO</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {vehicles.map(v => (
                <Pressable key={v.id} onPress={() => setSelectedVehicle(v.id)}
                  style={{ backgroundColor: selectedVehicle === v.id ? "#3b82f6" : "#1e293b", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: selectedVehicle === v.id ? "#3b82f6" : "#334155" }}>
                  <Text style={{ color: selectedVehicle === v.id ? "#fff" : "#94a3b8", fontSize: 13 }}>{v.name} ({v.plate})</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {activeShift && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 8, padding: 10 }}>
            <Text style={{ color: "#64748b", fontSize: 12 }}>TURNO ATIVO</Text>
            <Text style={{ color: "#f8fafc", fontSize: 13 }}>Vinculado ao turno em andamento</Text>
          </View>
        )}

        <View style={{ gap: 6 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>CATEGORIA</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {TRIP_CATEGORIES.map(c => (
              <Pressable key={c.value} onPress={() => setCategory(c.value)}
                style={{ backgroundColor: category === c.value ? "#3b82f6" : "#1e293b", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: category === c.value ? "#3b82f6" : "#334155" }}>
                <Text style={{ color: category === c.value ? "#fff" : "#94a3b8", fontSize: 13 }}>{c.icon} {c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {category === "app_ride" && rideApps.length > 0 && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>APP</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {rideApps.map(a => (
                <Pressable key={a.id} onPress={() => setSelectedRideApp(a.id)}
                  style={{ backgroundColor: selectedRideApp === a.id ? "#3b82f6" : "#1e293b", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: selectedRideApp === a.id ? "#3b82f6" : "#334155" }}>
                  <Text style={{ color: selectedRideApp === a.id ? "#fff" : "#94a3b8", fontSize: 13 }}>{a.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={{ gap: 6 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>VALOR DA CORRIDA (R$)</Text>
          <TextInput
            value={fare}
            onChangeText={(v) => setFare(maskMoney(v))}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 16 }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>GORJETA (R$) — opcional</Text>
          <TextInput
            value={tip}
            onChangeText={(v: string) => setTip(maskMoney(v))}
            keyboardType="decimal-pad"
            placeholder="0,00"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 16 }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>DISTÂNCIA (km)</Text>
            <TextInput
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              placeholder="0,0"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 16 }}
            />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>DURAÇÃO (min)</Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#475569"
              style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 16 }}
            />
          </View>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>DATA E HORA</Text>
          <TextInput
            value={dateStr}
            onChangeText={setDateStr}
            placeholder="DD/MM/AAAA HH:MM"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 16 }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>ORIGEM — opcional</Text>
          <TextInput
            value={origin}
            onChangeText={setOrigin}
            placeholder="Endereço de origem"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 14 }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>DESTINO — opcional</Text>
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="Endereço de destino"
            placeholderTextColor="#475569"
            style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 14 }}
          />
        </View>

        <Pressable onPress={handleSave} disabled={loading}
          style={{ backgroundColor: "#3b82f6", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>💾 Salvar corrida</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
