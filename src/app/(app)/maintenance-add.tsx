import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import type { Database, Tables } from "../../lib/database.types";

type Vehicle = Tables<"vehicles">;
type MaintenanceType = Database["public"]["Enums"]["maintenance_type"];

const TYPE_OPTIONS: { value: MaintenanceType; label: string; icon: string }[] = [
  { value: "oil_change", label: "Troca de óleo", icon: "🛢️" },
  { value: "tire_change", label: "Troca de pneu", icon: "🛞" },
  { value: "preventive", label: "Preventiva", icon: "🔧" },
  { value: "corrective", label: "Corretiva", icon: "🔩" },
  { value: "inspection", label: "Revisão", icon: "🔍" },
  { value: "other", label: "Outro", icon: "📋" },
];

export default function MaintenanceAddScreen() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [type, setType] = useState<MaintenanceType>("oil_change");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [odometer, setOdometer] = useState("");
  const [nextDueKm, setNextDueKm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
    setErrorMsg("");
    if (!selectedVehicle || !odometer) { setErrorMsg("Selecione o veículo e informe o hodômetro."); return; }
    const odoNum = parseFloat(odometer.replace(",", "."));
    if (isNaN(odoNum) || odoNum <= 0) { setErrorMsg("Hodômetro inválido."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("maintenances").insert({
        vehicle_id: selectedVehicle,
        type,
        description: description.trim() || null,
        cost: cost ? parseFloat(cost.replace(",", ".")) : null,
        odometer_km: odoNum,
        next_due_km: nextDueKm ? parseFloat(nextDueKm.replace(",", ".")) : null,
        status: "completed",
      });
      if (error) { setErrorMsg(error.message); console.error("[maintenance-add]", error); return; }
      router.back();
    } catch (e) {
      setErrorMsg("Erro inesperado. Tente novamente.");
      console.error("[maintenance-add] exception", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#0f172a" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 12 }}>
        <Text style={{ color: "#f8fafc", fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>🔧 Nova manutenção</Text>

        {vehicles.length > 1 && (
          <View style={{ gap: 6 }}>
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

        <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>TIPO DE MANUTENÇÃO</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {TYPE_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => setType(opt.value)}
              style={{
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                borderWidth: 1.5,
                borderColor: type === opt.value ? "#8b5cf6" : "#334155",
                backgroundColor: type === opt.value ? "#4c1d95" : "#1e293b",
              }}
            >
              <Text style={{ color: type === opt.value ? "#fff" : "#94a3b8" }}>{opt.icon} {opt.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>DESCRIÇÃO</Text>
          <TextInput
            value={description} onChangeText={setDescription}
            placeholder="Ex: Troca de óleo + filtro"
            placeholderTextColor="#475569" multiline numberOfLines={2}
            style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#334155" }}
          />
        </View>

        <Field label="Custo (R$)" value={cost} onChange={setCost} placeholder="Ex: 350,00" keyboard="decimal-pad" />
        <Field label="Hodômetro (km) *" value={odometer} onChange={setOdometer} placeholder="Ex: 48500" keyboard="decimal-pad" />
        <Field label="Próxima revisão (km)" value={nextDueKm} onChange={setNextDueKm} placeholder="Ex: 58500" keyboard="decimal-pad" />

        {errorMsg ? <Text style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>{errorMsg}</Text> : null}
        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{ backgroundColor: "#8b5cf6", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Salvar manutenção</Text>}
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
