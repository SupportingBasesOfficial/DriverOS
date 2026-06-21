import { useState } from "react";
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
import type { Database } from "../../lib/database.types";

type FuelType = Database["public"]["Enums"]["fuel_type"];

const FUEL_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "flex", label: "Flex" },
  { value: "gasoline", label: "Gasolina" },
  { value: "ethanol", label: "Etanol" },
  { value: "diesel", label: "Diesel" },
  { value: "electric", label: "Elétrico" },
  { value: "hybrid", label: "Híbrido" },
];

export default function VehicleAddScreen() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [plate, setPlate] = useState("");
  const [odometer, setOdometer] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("flex");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!brand || !model || !year || !plate || !odometer) {
      Alert.alert("Preencha todos os campos obrigatórios.");
      return;
    }
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 1990 || yearNum > new Date().getFullYear() + 1) {
      Alert.alert("Ano inválido.");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("vehicles").insert({
      user_id: user.id,
      brand: brand.trim(),
      model: model.trim(),
      year: yearNum,
      plate: plate.trim().toUpperCase(),
      current_odometer_km: parseFloat(odometer.replace(",", ".")),
      fuel_type: fuelType,
      status: "active",
    });
    setLoading(false);
    if (error) {
      Alert.alert("Erro ao salvar veículo", error.message);
      return;
    }
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, gap: 8 }}>
        <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginBottom: 8 }}>DADOS DO VEÍCULO</Text>

        <Field label="Marca *" value={brand} onChange={setBrand} placeholder="Ex: Toyota" />
        <Field label="Modelo *" value={model} onChange={setModel} placeholder="Ex: Corolla" />
        <Field label="Ano *" value={year} onChange={setYear} placeholder="Ex: 2020" keyboard="number-pad" />
        <Field label="Placa *" value={plate} onChange={setPlate} placeholder="Ex: ABC1D23" autoCapitalize="characters" />
        <Field label="Hodômetro atual (km) *" value={odometer} onChange={setOdometer} placeholder="Ex: 45000" keyboard="decimal-pad" />

        <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 8 }}>COMBUSTÍVEL</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {FUEL_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              onPress={() => setFuelType(opt.value)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: fuelType === opt.value ? "#3b82f6" : "#334155",
                backgroundColor: fuelType === opt.value ? "#1d4ed8" : "#1e293b",
              }}
            >
              <Text style={{ color: fuelType === opt.value ? "#fff" : "#94a3b8", fontWeight: "500" }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={loading}
          style={{ backgroundColor: "#3b82f6", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Salvar veículo</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder,
  keyboard = "default", autoCapitalize = "words",
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  keyboard?: "default" | "number-pad" | "decimal-pad" | "phone-pad";
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "600" }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#475569" keyboardType={keyboard} autoCapitalize={autoCapitalize}
        style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#334155" }}
      />
    </View>
  );
}
