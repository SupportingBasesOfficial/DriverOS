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
import type { Tables } from "../../lib/database.types";

const CATEGORIES: { value: Tables<"vehicle_expenses">["category"]; label: string; icon: string }[] = [
  { value: "financing", label: "Financiamento", icon: "🏦" },
  { value: "rent", label: "Aluguel", icon: "🔑" },
  { value: "insurance", label: "Seguro", icon: "🛡️" },
  { value: "ipva", label: "IPVA", icon: "📋" },
  { value: "licensing", label: "Licenciamento", icon: "📄" },
  { value: "maintenance", label: "Manutenção", icon: "🔧" },
  { value: "fuel", label: "Combustível", icon: "⛽" },
  { value: "other", label: "Outro", icon: "📌" },
];

const FREQUENCIES: { value: Tables<"vehicle_expenses">["frequency"]; label: string }[] = [
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
  { value: "quarterly", label: "Trimestral" },
  { value: "weekly", label: "Semanal" },
  { value: "daily", label: "Diário" },
];

const STATUSES: { value: Tables<"vehicle_expenses">["status"]; label: string; color: string }[] = [
  { value: "pending", label: "Pendente", color: "#f59e0b" },
  { value: "paid", label: "Pago", color: "#22c55e" },
  { value: "overdue", label: "Vencido", color: "#ef4444" },
];

export default function ExpenseAddScreen() {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [category, setCategory] = useState<Tables<"vehicle_expenses">["category"]>("other");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Tables<"vehicle_expenses">["frequency"]>("monthly");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Tables<"vehicle_expenses">["status"]>("pending");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingVehicle, setLoadingVehicle] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("vehicles")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      setVehicleId(data?.id ?? null);
      setLoadingVehicle(false);
    }
    load();
  }, []);

  async function save() {
    setError("");
    if (!description.trim()) { setError("Informe uma descrição."); return; }
    const amt = parseFloat(amount.replace(",", "."));
    if (isNaN(amt) || amt <= 0) { setError("Informe um valor válido (ex: 450,00)."); return; }
    if (!vehicleId) { setError("Nenhum veículo ativo encontrado. Cadastre um veículo primeiro."); return; }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setError("Data no formato AAAA-MM-DD (ex: 2026-07-15).");
      return;
    }
    setSaving(true);
    try {
      const { error: err } = await supabase.from("vehicle_expenses").insert({
        vehicle_id: vehicleId,
        category,
        description: description.trim(),
        amount: amt,
        frequency,
        due_date: dueDate || null,
        status,
      });
      if (err) { setError(err.message); return; }
      router.back();
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loadingVehicle) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 48 }}>

        <View style={{ gap: 10 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>CATEGORIA</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map(c => (
              <Pressable
                key={c.value}
                onPress={() => setCategory(c.value)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: category === c.value ? "#1d4ed8" : "#1e293b",
                  borderWidth: 1,
                  borderColor: category === c.value ? "#3b82f6" : "#334155",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>{c.icon}</Text>
                <Text style={{ color: category === c.value ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600" }}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>DESCRIÇÃO *</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Parcela 5/48 — Fiat Argo"
            placeholderTextColor="#475569"
            style={{
              backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12,
              padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155",
            }}
          />
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>VALOR (R$) *</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="450,00"
            placeholderTextColor="#475569"
            keyboardType="decimal-pad"
            style={{
              backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12,
              padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155",
            }}
          />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>FREQUÊNCIA</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {FREQUENCIES.map(f => (
              <Pressable
                key={f.value}
                onPress={() => setFrequency(f.value)}
                style={{
                  paddingVertical: 9,
                  paddingHorizontal: 16,
                  borderRadius: 20,
                  backgroundColor: frequency === f.value ? "#1d4ed8" : "#1e293b",
                  borderWidth: 1,
                  borderColor: frequency === f.value ? "#3b82f6" : "#334155",
                }}
              >
                <Text style={{ color: frequency === f.value ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600" }}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>
            DATA DE VENCIMENTO (opcional)
          </Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="AAAA-MM-DD  ex: 2026-07-10"
            placeholderTextColor="#475569"
            style={{
              backgroundColor: "#1e293b", color: "#f8fafc", borderRadius: 12,
              padding: 16, fontSize: 16, borderWidth: 1, borderColor: "#334155",
            }}
          />
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ color: "#94a3b8", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>STATUS</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {STATUSES.map(s => (
              <Pressable
                key={s.value}
                onPress={() => setStatus(s.value)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: status === s.value ? s.color + "22" : "#1e293b",
                  borderWidth: 1,
                  borderColor: status === s.value ? s.color : "#334155",
                }}
              >
                <Text style={{ color: status === s.value ? s.color : "#94a3b8", fontSize: 13, fontWeight: "700" }}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? (
          <Text style={{ color: "#ef4444", textAlign: "center", fontSize: 13 }}>{error}</Text>
        ) : null}

        <Pressable
          onPress={save}
          disabled={saving}
          style={{
            backgroundColor: "#3b82f6", borderRadius: 12, padding: 17,
            alignItems: "center", opacity: saving ? 0.7 : 1, marginTop: 4,
          }}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Salvar despesa</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
