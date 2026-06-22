import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Vehicle = Tables<"vehicles">;

export default function RefuelingAddScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [liters, setLiters] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [odometer, setOdometer] = useState("");
  const [stationName, setStationName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVehicles() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("vehicles").select("*").eq("user_id", user.id).eq("status", "active");
      const list = data ?? [];
      setVehicles(list);
      if (list.length > 0) setSelectedVehicle(list[0].id);
    }
    loadVehicles();
  }, []);

  async function handleSave() {
    if (!selectedVehicle || !liters || !totalCost || !odometer) {
      Alert.alert("Preencha litros, valor total e hodômetro.");
      return;
    }
    const litersNum = parseFloat(liters.replace(",", "."));
    const costNum = parseFloat(totalCost.replace(",", "."));
    const odoNum = parseFloat(odometer.replace(",", "."));
    if (litersNum <= 0 || costNum <= 0 || odoNum <= 0) {
      Alert.alert("Valores devem ser maiores que zero.");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: newRef, error } = await supabase.from("refuelings").insert({
      vehicle_id: selectedVehicle,
      user_id: user.id,
      liters: litersNum,
      total_cost: costNum,
      odometer_km: odoNum,
      station_name: stationName.trim() || null,
    }).select().single();
    if (error) { setLoading(false); Alert.alert("Erro", error.message); return; }

    if (newRef) {
      const { data: prev } = await supabase.from("refuelings")
        .select("odometer_km")
        .eq("vehicle_id", selectedVehicle)
        .lt("odometer_km", odoNum)
        .order("odometer_km", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prev) {
        const kmSince = odoNum - (prev as { odometer_km: number }).odometer_km;
        const kpl = kmSince / litersNum;
        if (kpl > 0 && kpl < 50) {
          await supabase.from("refuelings").update({ km_per_liter: parseFloat(kpl.toFixed(2)) }).eq("id", (newRef as { id: string }).id);
        }
      }
    }
    setLoading(false);
    router.back();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#0f172a" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 10 }}>
        <Text style={{ color: "#f8fafc", fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>⛽ Novo abastecimento</Text>

        {vehicles.length > 1 && (
          <View style={{ gap: 4 }}>
            <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>VEÍCULO</Text>
            {vehicles.map(v => (
              <Pressable
                key={v.id}
                onPress={() => setSelectedVehicle(v.id)}
                style={{ backgroundColor: selectedVehicle === v.id ? "#1d4ed8" : "#1e293b", borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: selectedVehicle === v.id ? "#3b82f6" : "#334155" }}
              >
                <Text style={{ color: "#f8fafc" }}>{v.brand} {v.model} • {v.plate}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Field label="Litros *" value={liters} onChange={setLiters} placeholder="Ex: 40.5" keyboard="decimal-pad" />
        <Field label="Valor total (R$) *" value={totalCost} onChange={setTotalCost} placeholder="Ex: 250,00" keyboard="decimal-pad" />
        <Field label="Hodômetro (km) *" value={odometer} onChange={setOdometer} placeholder="Ex: 48500" keyboard="decimal-pad" />
        <Field label="Nome do posto" value={stationName} onChange={setStationName} placeholder="Ex: Posto Shell" />

        {liters && totalCost && parseFloat(liters) > 0 && parseFloat(totalCost) > 0 && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 10, padding: 12, alignItems: "center" }}>
            <Text style={{ color: "#94a3b8", fontSize: 12 }}>Preço por litro</Text>
            <Text style={{ color: "#f59e0b", fontSize: 20, fontWeight: "bold" }}>
              R$ {(parseFloat(totalCost.replace(",", ".")) / parseFloat(liters.replace(",", "."))).toFixed(3)}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{ backgroundColor: "#f59e0b", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <ActivityIndicator color="#000" /> : <Text style={{ color: "#000", fontSize: 16, fontWeight: "700" }}>Salvar abastecimento</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder, keyboard = "default",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  keyboard?: "default" | "decimal-pad" | "number-pad";
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#475569" keyboardType={keyboard}
        style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#334155" }}
      />
    </View>
  );
}
