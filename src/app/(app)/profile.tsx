import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Profile = Tables<"profiles">;
type Vehicle = Tables<"vehicles">;
type RideApp = Tables<"ride_apps">;
type UserRideApp = Tables<"user_ride_apps">;

const GOAL_KEY = "@driveros:daily_goal";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [rideApps, setRideApps] = useState<RideApp[]>([]);
  const [userApps, setUserApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [saveError, setSaveError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [dailyGoal, setDailyGoal] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: p }, { data: v }, { data: apps }, { data: uApps }, goal] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("vehicles").select("*").eq("user_id", user.id).eq("status", "active"),
      supabase.from("ride_apps").select("*").order("name"),
      supabase.from("user_ride_apps").select("*").eq("user_id", user.id),
      AsyncStorage.getItem(GOAL_KEY),
    ]);

    setProfile(p ?? null);
    setVehicles((v ?? []) as Vehicle[]);
    setRideApps((apps ?? []) as RideApp[]);
    setUserApps(new Set(((uApps ?? []) as UserRideApp[]).map((ua) => ua.ride_app_id)));
    setName((p as Profile | null)?.full_name ?? "");
    setPhone((p as Profile | null)?.phone ?? "");
    setDailyGoal(goal ?? "");
    setLoading(false);
  }

  async function saveProfile() {
    setSaveMsg(""); setSaveError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: name, phone });
      if (error) { setSaveError(error.message); }
      else setSaveMsg("Perfil atualizado com sucesso.");
    } catch { setSaveError("Erro inesperado."); }
    finally { setSaving(false); }
  }

  async function toggleApp(app: RideApp) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const active = userApps.has(app.id);
    if (active) {
      await supabase.from("user_ride_apps").delete().eq("user_id", user.id).eq("ride_app_id", app.id);
      setUserApps(prev => { const s = new Set(prev); s.delete(app.id); return s; });
    } else {
      await supabase.from("user_ride_apps").upsert({ user_id: user.id, ride_app_id: app.id, is_active: true });
      setUserApps(prev => new Set(prev).add(app.id));
    }
  }

  async function saveGoal() {
    const val = parseFloat(dailyGoal.replace(",", "."));
    if (isNaN(val) || val <= 0) { Alert.alert("Valor inválido", "Informe um valor positivo."); return; }
    await AsyncStorage.setItem(GOAL_KEY, val.toString());
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 2000);
  }

  async function sendPasswordReset() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email);
    setResetSent(true);
    Alert.alert("Link enviado", `Verifique ${user.email} para redefinir sua senha.`);
  }

  async function signOut() {
    setLoggingOut(true);
    try { await supabase.auth.signOut(); }
    catch { setLoggingOut(false); }
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
      {/* Avatar */}
      <View style={{ alignItems: "center", paddingVertical: 20, gap: 8 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#1e293b", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 32 }}>👤</Text>
        </View>
        <Text style={{ color: "#f8fafc", fontSize: 18, fontWeight: "bold" }}>{name || "Motorista"}</Text>
        <Text style={{ color: "#64748b", fontSize: 12, textTransform: "uppercase" }}>{(profile as Profile | null)?.role ?? "driver"}</Text>
      </View>

      {/* Dados pessoais */}
      <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>DADOS PESSOAIS</Text>
      <View style={{ gap: 10 }}>
        <TextInput value={name} onChangeText={setName} placeholder="Nome completo" placeholderTextColor="#475569"
          style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155" }} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="Telefone" placeholderTextColor="#475569" keyboardType="phone-pad"
          style={{ backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155" }} />
        {saveError ? <Text style={{ color: "#ef4444", fontSize: 12, textAlign: "center" }}>{saveError}</Text> : null}
        {saveMsg ? <Text style={{ color: "#22c55e", fontSize: 12, textAlign: "center" }}>{saveMsg}</Text> : null}
        <Pressable onPress={saveProfile} disabled={saving}
          style={{ backgroundColor: "#3b82f6", borderRadius: 12, padding: 14, alignItems: "center", opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "600" }}>Salvar perfil</Text>}
        </Pressable>
      </View>

      {/* Meta diária */}
      <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 4 }}>🎯 META DIÁRIA</Text>
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <TextInput value={dailyGoal} onChangeText={setDailyGoal} placeholder="R$ 300,00" placeholderTextColor="#475569"
          keyboardType="decimal-pad"
          style={{ flex: 1, backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: "#334155" }} />
        <Pressable onPress={saveGoal}
          style={{ backgroundColor: goalSaved ? "#14532d" : "#1e293b", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: goalSaved ? "#22c55e" : "#334155" }}>
          <Text style={{ color: goalSaved ? "#22c55e" : "#3b82f6", fontWeight: "700" }}>{goalSaved ? "✓" : "Salvar"}</Text>
        </Pressable>
      </View>
      <Text style={{ color: "#475569", fontSize: 11 }}>Aparece como barra de progresso no Dashboard.</Text>

      {/* Apps de corrida */}
      <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 4 }}>APPS QUE USO</Text>
      <View style={{ gap: 8 }}>
        {rideApps.map(app => {
          const active = userApps.has(app.id);
          return (
            <Pressable key={app.id} onPress={() => toggleApp(app)}
              style={{ backgroundColor: active ? "#1d4ed833" : "#1e293b", borderRadius: 12, padding: 14,
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                borderWidth: 1, borderColor: active ? "#3b82f6" : "#334155" }}>
              <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{app.label}</Text>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: active ? "#3b82f6" : "#334155",
                alignItems: "center", justifyContent: "center" }}>
                {active ? <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>✓</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Veículos */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600" }}>VEÍCULOS</Text>
        <Pressable onPress={() => router.push("/(app)/vehicle-add")}>
          <Text style={{ color: "#3b82f6", fontSize: 13, fontWeight: "600" }}>+ Adicionar</Text>
        </Pressable>
      </View>
      {vehicles.length === 0 ? (
        <Pressable onPress={() => router.push("/(app)/vehicle-add")}
          style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#334155", borderStyle: "dashed" }}>
          <Text style={{ fontSize: 28 }}>🚗</Text>
          <Text style={{ color: "#3b82f6", marginTop: 8, fontWeight: "600" }}>Adicionar veículo</Text>
        </Pressable>
      ) : (
        vehicles.map((v: Vehicle) => (
          <View key={v.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 24 }}>🚗</Text>
            <View>
              <Text style={{ color: "#f8fafc", fontWeight: "600" }}>{v.brand} {v.model} {v.year}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>Placa: {v.plate} • {v.current_odometer_km.toFixed(0)} km</Text>
            </View>
          </View>
        ))
      )}

      {/* Segurança */}
      <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 4 }}>SEGURANÇA</Text>
      <Pressable onPress={sendPasswordReset} disabled={resetSent}
        style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 14, alignItems: "center",
          borderWidth: 1, borderColor: "#334155", opacity: resetSent ? 0.6 : 1 }}>
        <Text style={{ color: resetSent ? "#22c55e" : "#f8fafc", fontWeight: "600" }}>
          {resetSent ? "✓ Link enviado por e-mail" : "🔑 Alterar senha"}
        </Text>
      </Pressable>

      {/* Sair */}
      <Pressable onPress={signOut} disabled={loggingOut}
        style={{ borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#7f1d1d", marginTop: 8, opacity: loggingOut ? 0.6 : 1 }}>
        {loggingOut ? <ActivityIndicator color="#ef4444" /> : <Text style={{ color: "#ef4444", fontWeight: "600" }}>Sair da conta</Text>}
      </Pressable>
    </ScrollView>
  );
}
