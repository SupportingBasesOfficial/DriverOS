import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Profile = Tables<"profiles">;
type Vehicle = Tables<"vehicles">;

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: p }, { data: v }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("vehicles").select("*").eq("user_id", user.id).eq("status", "active"),
    ]);

    setProfile(p ?? null);
    setVehicles(v ?? []);
    setName(p?.full_name ?? "");
    setPhone(p?.phone ?? "");
    setLoading(false);
  }

  async function saveProfile() {
    setSaveMsg("");
    setSaveError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: name, phone });
      if (error) { setSaveError(error.message); console.error("[saveProfile]", error); }
      else setSaveMsg("Perfil atualizado com sucesso.");
    } catch (e) {
      setSaveError("Erro inesperado.");
      console.error("[saveProfile] exception", e);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("[signOut]", e);
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0f172a" }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#1e293b", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 32 }}>👤</Text>
        </View>
        <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "bold" }}>{name || "Motorista"}</Text>
        <Text style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>{profile?.role ?? "driver"}</Text>
      </View>

      <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>DADOS PESSOAIS</Text>

      <View style={{ gap: 10 }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome completo"
          placeholderTextColor="#475569"
          style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155" }}
        />
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="Telefone"
          placeholderTextColor="#475569"
          keyboardType="phone-pad"
          style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155" }}
        />
        {saveError ? <Text style={{ color: "#ef4444", fontSize: 12, textAlign: "center" }}>{saveError}</Text> : null}
        {saveMsg ? <Text style={{ color: "#22c55e", fontSize: 12, textAlign: "center" }}>{saveMsg}</Text> : null}
        <Pressable
          onPress={saveProfile}
          disabled={saving}
          style={{ backgroundColor: "#3b82f6", borderRadius: 12, padding: 14, alignItems: "center", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600" }}>Salvar perfil</Text>}
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>VEÍCULOS</Text>
        <Pressable onPress={() => router.push("/(app)/vehicle-add")}>
          <Text style={{ color: "#3b82f6", fontSize: 13, fontWeight: "600" }}>+ Adicionar</Text>
        </Pressable>
      </View>

      {vehicles.length === 0 ? (
        <Pressable
          onPress={() => router.push("/(app)/vehicle-add")}
          style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#334155", borderStyle: "dashed" }}
        >
          <Text style={{ fontSize: 28 }}>🚗</Text>
          <Text style={{ color: "#3b82f6", marginTop: 8, fontWeight: "600" }}>Adicionar veículo</Text>
        </Pressable>
      ) : (
        vehicles.map(v => (
          <View key={v.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 24 }}>🚗</Text>
            <View>
              <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{v.brand} {v.model} {v.year}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>Placa: {v.plate} • {v.current_odometer_km.toFixed(0)} km</Text>
            </View>
          </View>
        ))
      )}

      <Pressable
        onPress={signOut}
        disabled={loggingOut}
        style={{ borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#7f1d1d", marginTop: 16, opacity: loggingOut ? 0.6 : 1 }}
      >
        {loggingOut
          ? <ActivityIndicator color="#ef4444" />
          : <Text style={{ color: "#ef4444", fontWeight: "600" }}>Sair da conta</Text>}
      </Pressable>
    </ScrollView>
  );
}
