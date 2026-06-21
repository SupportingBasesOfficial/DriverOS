import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Shift = Tables<"shifts">;
type Trip = Tables<"trips">;
type Vehicle = Tables<"vehicles">;

const TRIP_CATEGORIES: { value: Tables<"trips">["category"]; label: string; icon: string }[] = [
  { value: "passenger_pickup", label: "Buscar passageiro", icon: "🛣️" },
  { value: "passenger_dropoff", label: "Entregar passageiro", icon: "🎯" },
  { value: "repositioning", label: "Reposicionamento", icon: "↩️" },
  { value: "refueling", label: "Abastecimento", icon: "⛽" },
  { value: "personal", label: "Pessoal", icon: "🏠" },
  { value: "unpaid_detour", label: "Desvio não pago", icon: "⚠️" },
];

export default function ShiftScreen() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [todayTrips, setTodayTrips] = useState<Trip[]>([]);
  const [odometer, setOdometer] = useState("");
  const [fareModal, setFareModal] = useState(false);
  const [fareInput, setFareInput] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: shift }, { data: vehicles }] = await Promise.all([
      supabase.from("shifts").select("*").eq("user_id", user.id).eq("status", "active").maybeSingle(),
      supabase.from("vehicles").select("*").eq("user_id", user.id).eq("status", "active").limit(1),
    ]);

    setActiveShift(shift ?? null);
    setVehicle(vehicles?.[0] ?? null);

    if (shift) {
      const { data: trip } = await supabase
        .from("trips").select("*").eq("shift_id", shift.id).eq("status", "in_progress").maybeSingle();
      setActiveTrip(trip ?? null);

      const { data: trips } = await supabase
        .from("trips").select("*").eq("shift_id", shift.id).eq("status", "completed").order("ended_at", { ascending: false });
      setTodayTrips(trips ?? []);
    }

    setLoading(false);
  }

  async function startShift() {
    if (!odometer) { Alert.alert("Informe o hodômetro inicial."); return; }
    if (!vehicle) { Alert.alert("Cadastre um veículo primeiro."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setActionLoading(true);
    const { error } = await supabase.from("shifts").insert({
      user_id: user.id,
      vehicle_id: vehicle.id,
      initial_odometer_km: parseFloat(odometer),
      status: "active",
    });
    setActionLoading(false);
    if (error) { Alert.alert("Erro", error.message); return; }
    setOdometer("");
    loadData();
  }

  async function endShift() {
    if (!activeShift) return;
    if (!odometer) { Alert.alert("Informe o hodômetro final."); return; }
    Alert.alert("Encerrar turno?", "Confirma o encerramento do turno?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Encerrar", style: "destructive", onPress: async () => {
          setActionLoading(true);
          await supabase.from("shifts").update({
            status: "completed",
            ended_at: new Date().toISOString(),
            final_odometer_km: parseFloat(odometer),
          }).eq("id", activeShift.id);
          setActionLoading(false);
          setOdometer("");
          loadData();
        },
      },
    ]);
  }

  async function startTrip(category: Trip["category"]) {
    if (!activeShift || !vehicle) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setActionLoading(true);
    const { error } = await supabase.from("trips").insert({
      shift_id: activeShift.id,
      vehicle_id: vehicle.id,
      user_id: user.id,
      category,
      status: "in_progress",
    });
    setActionLoading(false);
    if (error) { Alert.alert("Erro", error.message); return; }
    loadData();
  }

  async function endTrip(fare?: number) {
    if (!activeTrip) return;
    setActionLoading(true);
    await supabase.from("trips").update({
      status: "completed",
      ended_at: new Date().toISOString(),
      fare_amount: fare ?? null,
    }).eq("id", activeTrip.id);
    setActionLoading(false);
    loadData();
  }

  function promptEndTrip() {
    setFareInput("");
    setFareModal(true);
  }

  function confirmEndTrip() {
    setFareModal(false);
    endTrip(fareInput ? parseFloat(fareInput.replace(",", ".")) : undefined);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <Modal visible={fareModal} transparent animationType="fade" onRequestClose={() => setFareModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 24, width: "100%", gap: 16 }}>
            <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "bold" }}>Encerrar viagem</Text>
            <Text style={{ color: "#94a3b8" }}>Valor recebido (R$) — deixe vazio se não aplicável:</Text>
            <TextInput
              value={fareInput}
              onChangeText={setFareInput}
              placeholder="0,00"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
              autoFocus
              style={{ backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: 10, padding: 14, fontSize: 18, borderWidth: 1, borderColor: "#334155", textAlign: "center" }}
            />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable onPress={() => setFareModal(false)} style={{ flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: "#334155", alignItems: "center" }}>
                <Text style={{ color: "#94a3b8", fontWeight: "600" }}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={confirmEndTrip} style={{ flex: 1, padding: 14, borderRadius: 10, backgroundColor: "#ef4444", alignItems: "center" }}>
                <Text style={{ color: "#fff", fontWeight: "600" }}>Encerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {!activeShift ? (
        <View style={{ gap: 12 }}>
          <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "bold" }}>Iniciar turno</Text>
          {vehicle ? (
            <Text style={{ color: "#94a3b8" }}>{vehicle.brand} {vehicle.model} • {vehicle.plate}</Text>
          ) : (
            <Text style={{ color: "#ef4444" }}>Nenhum veículo ativo. Cadastre um veículo.</Text>
          )}
          <TextInput
            value={odometer}
            onChangeText={setOdometer}
            placeholder="Hodômetro inicial (km)"
            placeholderTextColor="#475569"
            keyboardType="decimal-pad"
            style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155" }}
          />
          <Pressable
            onPress={startShift}
            disabled={actionLoading || !vehicle}
            style={{ backgroundColor: "#16a34a", borderRadius: 12, padding: 16, alignItems: "center", opacity: actionLoading ? 0.7 : 1 }}
          >
            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>▶ Iniciar turno</Text>}
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, gap: 4 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>TURNO ATIVO DESDE</Text>
            <Text style={{ color: "#f8fafc", fontSize: 16, fontWeight: "600" }}>
              {new Date(activeShift.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </Text>
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              {todayTrips.length} viagem{todayTrips.length !== 1 ? "s" : ""} concluída{todayTrips.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {activeTrip ? (
            <View style={{ backgroundColor: "#1d4ed8", borderRadius: 12, padding: 16, gap: 12 }}>
              <Text style={{ color: "#bfdbfe", fontSize: 12 }}>VIAGEM EM ANDAMENTO</Text>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                {TRIP_CATEGORIES.find(c => c.value === activeTrip.category)?.icon}{" "}
                {TRIP_CATEGORIES.find(c => c.value === activeTrip.category)?.label}
              </Text>
              <Pressable
                onPress={promptEndTrip}
                disabled={actionLoading}
                style={{ backgroundColor: "#ef4444", borderRadius: 10, padding: 14, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>⏹ Encerrar viagem</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>NOVA VIAGEM</Text>
              {TRIP_CATEGORIES.map(cat => (
                <Pressable
                  key={cat.value}
                  onPress={() => startTrip(cat.value)}
                  disabled={actionLoading}
                  style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}
                >
                  <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                  <Text style={{ color: "#f8fafc", fontSize: 15 }}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ gap: 8, marginTop: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>ENCERRAR TURNO</Text>
            <TextInput
              value={odometer}
              onChangeText={setOdometer}
              placeholder="Hodômetro final (km)"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
              style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155" }}
            />
            <Pressable
              onPress={endShift}
              disabled={actionLoading || !!activeTrip}
              style={{ backgroundColor: "#7f1d1d", borderRadius: 12, padding: 16, alignItems: "center", opacity: (actionLoading || !!activeTrip) ? 0.5 : 1 }}
            >
              <Text style={{ color: "#fca5a5", fontSize: 16, fontWeight: "600" }}>⏹ Encerrar turno</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
    </>
  );
}
