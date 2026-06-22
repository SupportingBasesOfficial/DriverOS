import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabase";
import type { Tables } from "../../lib/database.types";

type Profile = Tables<"profiles">;
type Vehicle = Tables<"vehicles">;
type RideApp = Tables<"ride_apps">;
type UserRideApp = Tables<"user_ride_apps">;

const GOAL_KEY         = "@driveros:daily_goal";
const WEEKLY_GOAL_KEY  = "@driveros:weekly_goal";
const MONTHLY_GOAL_KEY = "@driveros:monthly_goal";

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
  const [dailyGoal, setDailyGoal]     = useState("");
  const [weeklyGoal, setWeeklyGoal]   = useState("");
  const [monthlyGoal, setMonthlyGoal] = useState("");
  const [goalSaved, setGoalSaved]     = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: p }, { data: v }, { data: apps }, { data: uApps }, dGoal, wGoal, mGoal] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("vehicles").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("ride_apps").select("*").order("name"),
      supabase.from("user_ride_apps").select("*").eq("user_id", user.id),
      AsyncStorage.getItem(GOAL_KEY),
      AsyncStorage.getItem(WEEKLY_GOAL_KEY),
      AsyncStorage.getItem(MONTHLY_GOAL_KEY),
    ]);

    setProfile(p ?? null);
    setVehicles((v ?? []) as Vehicle[]);
    setRideApps((apps ?? []) as RideApp[]);
    setUserApps(new Set(((uApps ?? []) as UserRideApp[]).map((ua) => ua.ride_app_id)));
    setName((p as Profile | null)?.full_name ?? "");
    setPhone((p as Profile | null)?.phone ?? "");
    setAvatarUrl((p as Profile | null)?.avatar_url ?? null);
    setDailyGoal(dGoal ?? "");
    setWeeklyGoal(wGoal ?? "");
    setMonthlyGoal(mGoal ?? "");
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

  async function saveGoals() {
    const parseGoal = (s: string) => { const v = parseFloat(s.replace(",", ".")); return isNaN(v) || v <= 0 ? null : v; };
    const d = parseGoal(dailyGoal);
    const w = parseGoal(weeklyGoal);
    const m = parseGoal(monthlyGoal);
    if (!d && !w && !m) { Alert.alert("Informe ao menos uma meta positiva."); return; }
    if (d) await AsyncStorage.setItem(GOAL_KEY, d.toString());
    else await AsyncStorage.removeItem(GOAL_KEY);
    if (w) await AsyncStorage.setItem(WEEKLY_GOAL_KEY, w.toString());
    else await AsyncStorage.removeItem(WEEKLY_GOAL_KEY);
    if (m) await AsyncStorage.setItem(MONTHLY_GOAL_KEY, m.toString());
    else await AsyncStorage.removeItem(MONTHLY_GOAL_KEY);
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 2500);
  }

  async function setActiveVehicle(vehicleId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("vehicles").update({ status: "inactive" as const }).eq("user_id", user.id).eq("status", "active");
    await supabase.from("vehicles").update({ status: "active" as const }).eq("id", vehicleId);
    loadData();
  }

  async function deleteVehicle(vehicleId: string) {
    Alert.alert("Excluir veículo", "Tem certeza? Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: async () => {
        await supabase.from("vehicles").delete().eq("id", vehicleId);
        loadData();
      }},
    ]);
  }

  async function pickAndUploadPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria para adicionar foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (result.canceled) return;
    setUploadingPhoto(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const uri = result.assets[0].uri;
      const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, { upsert: true, contentType: `image/${ext}` });
      if (upErr) { Alert.alert("Erro ao enviar foto", upErr.message); return; }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const urlWithBust = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: urlWithBust }).eq("id", user.id);
      setAvatarUrl(urlWithBust);
    } catch { Alert.alert("Erro inesperado ao fazer upload."); }
    finally { setUploadingPhoto(false); }
  }

  async function deletePhoto() {
    Alert.alert("Remover foto", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
        setAvatarUrl(null);
      }},
    ]);
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
      <View style={{ alignItems: "center", paddingVertical: 20, gap: 10 }}>
        <Pressable onPress={pickAndUploadPhoto} disabled={uploadingPhoto}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }}
              style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: "#3b82f6" }} />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#1e293b",
              alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#334155" }}>
              {uploadingPhoto ? <ActivityIndicator color="#3b82f6" /> : <Text style={{ fontSize: 36 }}>👤</Text>}
            </View>
          )}
        </Pressable>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={pickAndUploadPhoto} disabled={uploadingPhoto}
            style={{ backgroundColor: "#1e293b", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7,
              borderWidth: 1, borderColor: "#334155" }}>
            <Text style={{ color: "#3b82f6", fontSize: 12, fontWeight: "600" }}>
              {uploadingPhoto ? "Enviando..." : avatarUrl ? "Trocar foto" : "+ Foto"}
            </Text>
          </Pressable>
          {avatarUrl ? (
            <Pressable onPress={deletePhoto}
              style={{ backgroundColor: "#1e293b", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7,
                borderWidth: 1, borderColor: "#7f1d1d" }}>
              <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600" }}>Remover</Text>
            </Pressable>
          ) : null}
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

      {/* Metas */}
      <Text style={{ color: "#94a3b8", fontSize: 13, fontWeight: "600", marginTop: 4 }}>🎯 METAS DE GANHOS</Text>
      <View style={{ gap: 8 }}>
        <GoalInput label="🎯 Diária" value={dailyGoal} onChange={setDailyGoal} placeholder="Ex: 300" />
        <GoalInput label="📅 Semanal" value={weeklyGoal} onChange={setWeeklyGoal} placeholder="Ex: 1800" />
        <GoalInput label="📆 Mensal" value={monthlyGoal} onChange={setMonthlyGoal} placeholder="Ex: 7000" />
        <Pressable onPress={saveGoals}
          style={{ backgroundColor: goalSaved ? "#14532d" : "#1d4ed8", borderRadius: 12, padding: 14, alignItems: "center",
            borderWidth: 1, borderColor: goalSaved ? "#22c55e" : "#3b82f6" }}>
          <Text style={{ color: goalSaved ? "#22c55e" : "#fff", fontWeight: "700" }}>
            {goalSaved ? "✓ Metas salvas!" : "Salvar metas"}
          </Text>
        </Pressable>
      </View>
      <Text style={{ color: "#475569", fontSize: 11 }}>Aparecem como barras de progresso no Dashboard.</Text>

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
        vehicles.map((v: Vehicle) => {
          const isActive = v.status === "active";
          return (
            <View key={v.id} style={{ backgroundColor: isActive ? "#0f2040" : "#1e293b", borderRadius: 12, padding: 14, gap: 10,
              borderWidth: 1, borderColor: isActive ? "#3b82f6" : "#334155" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Text style={{ fontSize: 24 }}>🚗</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#f8fafc", fontWeight: "700" }}>{v.brand} {v.model} {v.year}</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 12 }}>Placa: {v.plate} • {v.current_odometer_km.toFixed(0)} km</Text>
                </View>
                {isActive && (
                  <View style={{ backgroundColor: "#14532d", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: "#22c55e", fontSize: 10, fontWeight: "700" }}>ATIVO</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {!isActive && (
                  <Pressable onPress={() => setActiveVehicle(v.id)}
                    style={{ flex: 1, backgroundColor: "#1d4ed8", borderRadius: 8, padding: 10, alignItems: "center" }}>
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>⚡ Ativar</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => deleteVehicle(v.id)}
                  style={{ flex: 1, backgroundColor: "#1e293b", borderRadius: 8, padding: 10, alignItems: "center",
                    borderWidth: 1, borderColor: "#7f1d1d" }}>
                  <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600" }}>🗑 Excluir</Text>
                </Pressable>
              </View>
            </View>
          );
        })
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

function GoalInput({ label, value, onChange, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text style={{ color: "#94a3b8", fontSize: 12, width: 72 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#475569" keyboardType="decimal-pad"
        style={{ flex: 1, backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: 10,
          padding: 12, fontSize: 15, borderWidth: 1, borderColor: "#334155" }} />
    </View>
  );
}
