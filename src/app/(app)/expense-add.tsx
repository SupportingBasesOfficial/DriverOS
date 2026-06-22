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

type Category   = Tables<"vehicle_expenses">["category"];
type Frequency  = Tables<"vehicle_expenses">["frequency"];
type ExpStatus  = Tables<"vehicle_expenses">["status"];
type ExpenseType = "recurring" | "installment";

const CATEGORIES: { value: Category; label: string; icon: string; defaultType: ExpenseType }[] = [
  { value: "financing",   label: "Financiamento", icon: "🏦", defaultType: "installment" },
  { value: "rent",        label: "Aluguel",        icon: "🔑", defaultType: "recurring"   },
  { value: "insurance",   label: "Seguro",         icon: "🛡️", defaultType: "recurring"   },
  { value: "ipva",        label: "IPVA",           icon: "📋", defaultType: "recurring"   },
  { value: "licensing",   label: "Licenciamento",  icon: "📄", defaultType: "recurring"   },
  { value: "maintenance", label: "Manutenção",     icon: "🔧", defaultType: "recurring"   },
  { value: "fuel",        label: "Combustível",    icon: "⛽", defaultType: "recurring"   },
  { value: "other",       label: "Outro",          icon: "📌", defaultType: "recurring"   },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "monthly",   label: "Mensal"      },
  { value: "yearly",    label: "Anual"       },
  { value: "quarterly", label: "Trimestral"  },
  { value: "weekly",    label: "Semanal"     },
  { value: "daily",     label: "Diário"      },
];

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const STATUSES: { value: ExpStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pendente", color: "#f59e0b" },
  { value: "paid",    label: "Pago",     color: "#22c55e" },
  { value: "overdue", label: "Vencido",  color: "#ef4444" },
];

const inp = {
  backgroundColor: "#1e293b" as const,
  color: "#f8fafc" as const,
  borderRadius: 12,
  padding: 14,
  fontSize: 16,
  borderWidth: 1,
  borderColor: "#334155" as const,
};

const label12 = { color: "#94a3b8" as const, fontSize: 12, fontWeight: "700" as const, letterSpacing: 1 };

export default function ExpenseAddScreen() {
  const router = useRouter();
  const [vehicleId, setVehicleId]         = useState<string | null>(null);
  const [loadingVehicle, setLoadingVehicle] = useState(true);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");

  // Common
  const [category, setCategory]           = useState<Category>("other");
  const [expenseType, setExpenseType]     = useState<ExpenseType>("recurring");
  const [description, setDescription]     = useState("");
  const [notes, setNotes]                 = useState("");

  // Recurring
  const [amount, setAmount]               = useState("");
  const [frequency, setFrequency]         = useState<Frequency>("monthly");
  const [dueDay, setDueDay]               = useState("");
  const [dueMonth, setDueMonth]           = useState("");
  const [status, setStatus]               = useState<ExpStatus>("pending");

  // Installment
  const [totalAmount, setTotalAmount]           = useState("");
  const [installmentCount, setInstallmentCount] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [installmentsPaid, setInstallmentsPaid] = useState("0");
  const [instDueDay, setInstDueDay]             = useState("");
  const [startedAt, setStartedAt]               = useState("");

  useEffect(() => {
    supabase.from("vehicles").select("id")
      .eq("user_id", (async () => { const { data: { user } } = await supabase.auth.getUser(); return user?.id ?? ""; })() as unknown as string)
      .eq("status", "active").limit(1).maybeSingle()
      .then(() => {});
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingVehicle(false); return; }
      const { data } = await supabase.from("vehicles").select("id")
        .eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
      setVehicleId(data?.id ?? null);
      setLoadingVehicle(false);
    })();
  }, []);

  function onCategoryPress(cat: typeof CATEGORIES[0]) {
    setCategory(cat.value);
    setExpenseType(cat.defaultType);
  }

  // Auto-calculate installment amount
  function onTotalChange(val: string) {
    setTotalAmount(val);
    const tot = parseFloat(val.replace(",", "."));
    const cnt = parseInt(installmentCount);
    if (!isNaN(tot) && !isNaN(cnt) && cnt > 0)
      setInstallmentAmount((tot / cnt).toFixed(2));
  }
  function onCountChange(val: string) {
    setInstallmentCount(val);
    const tot = parseFloat(totalAmount.replace(",", "."));
    const cnt = parseInt(val);
    if (!isNaN(tot) && !isNaN(cnt) && cnt > 0)
      setInstallmentAmount((tot / cnt).toFixed(2));
  }
  function onInstAmountChange(val: string) {
    setInstallmentAmount(val);
    const amt = parseFloat(val.replace(",", "."));
    const cnt = parseInt(installmentCount);
    if (!isNaN(amt) && !isNaN(cnt) && cnt > 0)
      setTotalAmount((amt * cnt).toFixed(2));
  }

  // Preview calculations
  const instCount   = parseInt(installmentCount) || 0;
  const instPaid    = parseInt(installmentsPaid) || 0;
  const instAmt     = parseFloat(installmentAmount.replace(",", ".")) || 0;
  const instTotal   = parseFloat(totalAmount.replace(",", ".")) || instAmt * instCount;
  const remaining   = Math.max(0, instCount - instPaid);
  const totalLeft   = remaining * instAmt;
  const nextDueCalc = (() => {
    if (!startedAt || !instDueDay) return null;
    try {
      const d = new Date(startedAt);
      d.setMonth(d.getMonth() + instPaid);
      d.setDate(parseInt(instDueDay));
      return d.toLocaleDateString("pt-BR");
    } catch { return null; }
  })();

  async function save() {
    setError("");
    if (!vehicleId) { setError("Nenhum veículo ativo. Cadastre um veículo primeiro."); return; }
    if (!description.trim()) { setError("Informe uma descrição."); return; }

    setSaving(true);
    try {
      if (expenseType === "recurring") {
        const amt = parseFloat(amount.replace(",", "."));
        if (isNaN(amt) || amt <= 0) { setError("Informe o valor por período."); setSaving(false); return; }

        let due: string | null = null;
        if (dueDay) {
          const now = new Date();
          const day = parseInt(dueDay);
          const month = frequency === "yearly" && dueMonth ? parseInt(dueMonth) - 1 : now.getMonth();
          due = new Date(now.getFullYear(), month, day).toISOString().split("T")[0];
        }

        const { error: err } = await supabase.from("vehicle_expenses").insert({
          vehicle_id: vehicleId,
          category,
          description: description.trim(),
          amount: amt,
          frequency,
          due_date: due,
          status,
          due_day:   dueDay   ? parseInt(dueDay)   : null,
          due_month: frequency === "yearly" && dueMonth ? parseInt(dueMonth) : null,
          notes:     notes.trim() || null,
        });
        if (err) { setError(err.message); setSaving(false); return; }

      } else {
        if (instCount <= 0) { setError("Informe o número total de parcelas."); setSaving(false); return; }
        if (instAmt <= 0)   { setError("Informe o valor por parcela."); setSaving(false); return; }

        // Next due date = started_at + installments_paid months, on instDueDay
        let nextDue: string | null = null;
        if (startedAt && instDueDay) {
          const d = new Date(startedAt);
          d.setMonth(d.getMonth() + instPaid);
          d.setDate(parseInt(instDueDay));
          nextDue = d.toISOString().split("T")[0];
        }

        const autoStatus: ExpStatus = instPaid >= instCount ? "paid" : "pending";

        const { error: err } = await supabase.from("vehicle_expenses").insert({
          vehicle_id:       vehicleId,
          category,
          description:      description.trim(),
          amount:           instAmt,
          frequency:        "monthly",
          due_date:         nextDue,
          status:           autoStatus,
          installment_count:  instCount,
          installments_paid:  instPaid,
          installment_amount: instAmt,
          total_amount:       isNaN(instTotal) ? instAmt * instCount : instTotal,
          due_day:            instDueDay ? parseInt(instDueDay) : null,
          started_at:         startedAt || null,
          notes:              notes.trim() || null,
        });
        if (err) { setError(err.message); setSaving(false); return; }
      }

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
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#0f172a" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 56 }}>

        {/* Categoria */}
        <View style={{ gap: 10 }}>
          <Text style={label12}>CATEGORIA</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map(c => (
              <Pressable key={c.value} onPress={() => onCategoryPress(c)}
                style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, flexDirection: "row",
                  alignItems: "center", gap: 6,
                  backgroundColor: category === c.value ? "#1d4ed8" : "#1e293b",
                  borderWidth: 1, borderColor: category === c.value ? "#3b82f6" : "#334155" }}>
                <Text style={{ fontSize: 14 }}>{c.icon}</Text>
                <Text style={{ color: category === c.value ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600" }}>{c.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tipo */}
        <View style={{ gap: 10 }}>
          <Text style={label12}>TIPO DE DESPESA</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["recurring", "installment"] as ExpenseType[]).map(t => (
              <Pressable key={t} onPress={() => setExpenseType(t)}
                style={{ flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: "center",
                  backgroundColor: expenseType === t ? "#1d4ed8" : "#1e293b",
                  borderWidth: 1, borderColor: expenseType === t ? "#3b82f6" : "#334155" }}>
                <Text style={{ color: expenseType === t ? "#fff" : "#94a3b8", fontWeight: "700", fontSize: 13 }}>
                  {t === "recurring" ? "🔁  Recorrente" : "📋  Parcelada"}
                </Text>
                <Text style={{ color: expenseType === t ? "#bfdbfe" : "#475569", fontSize: 10, marginTop: 2 }}>
                  {t === "recurring" ? "Aluguel, IPVA, seguro…" : "Financiamento, parcelas…"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Descrição */}
        <View style={{ gap: 8 }}>
          <Text style={label12}>DESCRIÇÃO *</Text>
          <TextInput value={description} onChangeText={setDescription}
            placeholder={expenseType === "installment" ? "Ex: Financiamento Fiat Argo 2023" : "Ex: Aluguel — Localiza"}
            placeholderTextColor="#475569" style={inp} />
        </View>

        {/* ── RECORRENTE ── */}
        {expenseType === "recurring" && (<>
          <View style={{ gap: 8 }}>
            <Text style={label12}>VALOR POR PERÍODO (R$) *</Text>
            <TextInput value={amount} onChangeText={setAmount} placeholder="450,00"
              placeholderTextColor="#475569" keyboardType="decimal-pad" style={inp} />
          </View>

          <View style={{ gap: 10 }}>
            <Text style={label12}>FREQUÊNCIA</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {FREQUENCIES.map(f => (
                <Pressable key={f.value} onPress={() => setFrequency(f.value)}
                  style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20,
                    backgroundColor: frequency === f.value ? "#1d4ed8" : "#1e293b",
                    borderWidth: 1, borderColor: frequency === f.value ? "#3b82f6" : "#334155" }}>
                  <Text style={{ color: frequency === f.value ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: "600" }}>{f.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Due day for monthly/quarterly/weekly */}
          {(frequency === "monthly" || frequency === "quarterly" || frequency === "weekly") && (
            <View style={{ gap: 8 }}>
              <Text style={label12}>DIA DO MÊS EM QUE VENCE (1–31)</Text>
              <TextInput value={dueDay} onChangeText={setDueDay} placeholder="Ex: 10"
                placeholderTextColor="#475569" keyboardType="number-pad" style={inp} />
            </View>
          )}

          {/* Month + day for yearly */}
          {frequency === "yearly" && (
            <View style={{ gap: 10 }}>
              <Text style={label12}>MÊS DE VENCIMENTO</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {MONTHS.map((m, i) => (
                  <Pressable key={i} onPress={() => setDueMonth(String(i + 1))}
                    style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10,
                      backgroundColor: dueMonth === String(i + 1) ? "#1d4ed8" : "#1e293b",
                      borderWidth: 1, borderColor: dueMonth === String(i + 1) ? "#3b82f6" : "#334155" }}>
                    <Text style={{ color: dueMonth === String(i + 1) ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: "600" }}>{m}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={{ gap: 8 }}>
                <Text style={label12}>DIA DO VENCIMENTO</Text>
                <TextInput value={dueDay} onChangeText={setDueDay} placeholder="Ex: 31"
                  placeholderTextColor="#475569" keyboardType="number-pad" style={inp} />
              </View>
            </View>
          )}

          <View style={{ gap: 10 }}>
            <Text style={label12}>STATUS</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {STATUSES.map(s => (
                <Pressable key={s.value} onPress={() => setStatus(s.value)}
                  style={{ flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: "center",
                    backgroundColor: status === s.value ? s.color + "22" : "#1e293b",
                    borderWidth: 1, borderColor: status === s.value ? s.color : "#334155" }}>
                  <Text style={{ color: status === s.value ? s.color : "#94a3b8", fontSize: 13, fontWeight: "700" }}>{s.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </>)}

        {/* ── PARCELADA ── */}
        {expenseType === "installment" && (<>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={label12}>VALOR TOTAL (R$)</Text>
              <TextInput value={totalAmount} onChangeText={onTotalChange} placeholder="57.600,00"
                placeholderTextColor="#475569" keyboardType="decimal-pad" style={inp} />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={label12}>Nº DE PARCELAS *</Text>
              <TextInput value={installmentCount} onChangeText={onCountChange} placeholder="48"
                placeholderTextColor="#475569" keyboardType="number-pad" style={inp} />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={label12}>VALOR POR PARCELA (R$) *</Text>
            <TextInput value={installmentAmount} onChangeText={onInstAmountChange} placeholder="1.200,00"
              placeholderTextColor="#475569" keyboardType="decimal-pad" style={inp} />
            <Text style={{ color: "#475569", fontSize: 11 }}>Auto-calculado a partir do total ÷ nº de parcelas. Pode editar.</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={label12}>PARCELAS JÁ PAGAS</Text>
              <TextInput value={installmentsPaid} onChangeText={setInstallmentsPaid} placeholder="0"
                placeholderTextColor="#475569" keyboardType="number-pad" style={inp} />
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={label12}>DIA DE VENCIMENTO</Text>
              <TextInput value={instDueDay} onChangeText={setInstDueDay} placeholder="10"
                placeholderTextColor="#475569" keyboardType="number-pad" style={inp} />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text style={label12}>DATA DA 1ª PARCELA (AAAA-MM-DD)</Text>
            <TextInput value={startedAt} onChangeText={setStartedAt} placeholder="2024-02-10"
              placeholderTextColor="#475569" style={inp} />
          </View>

          {/* Preview */}
          {instCount > 0 && instAmt > 0 && (
            <View style={{ backgroundColor: "#0f2744", borderRadius: 12, padding: 16, gap: 10, borderWidth: 1, borderColor: "#1d4ed8" }}>
              <Text style={{ color: "#93c5fd", fontWeight: "700", fontSize: 13 }}>📊 RESUMO DO PARCELAMENTO</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                <SumItem label="Total contratado"   value={`R$ ${instTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                <SumItem label="Valor por parcela"  value={`R$ ${instAmt.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                <SumItem label="Parcelas pagas"     value={`${instPaid} / ${instCount}`} />
                <SumItem label="Parcelas restantes" value={String(remaining)} />
                <SumItem label="Total restante"     value={`R$ ${totalLeft.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                {nextDueCalc && <SumItem label="Próx. vencimento" value={nextDueCalc} />}
              </View>
              {instCount > 0 && (
                <View style={{ marginTop: 4 }}>
                  <View style={{ height: 6, backgroundColor: "#1e3a5f", borderRadius: 3, overflow: "hidden" }}>
                    <View style={{ width: `${Math.round((instPaid / instCount) * 100)}%` as unknown as number,
                      height: 6, backgroundColor: "#3b82f6", borderRadius: 3 }} />
                  </View>
                  <Text style={{ color: "#64748b", fontSize: 10, marginTop: 4 }}>
                    {Math.round((instPaid / instCount) * 100)}% quitado
                  </Text>
                </View>
              )}
            </View>
          )}
        </>)}

        {/* Notas */}
        <View style={{ gap: 8 }}>
          <Text style={label12}>OBSERVAÇÕES (opcional)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Ex: Banco Itaú, contrato #12345"
            placeholderTextColor="#475569" multiline numberOfLines={3}
            style={{ ...inp, minHeight: 80, textAlignVertical: "top" }} />
        </View>

        {error ? <Text style={{ color: "#ef4444", textAlign: "center", fontSize: 13 }}>{error}</Text> : null}

        <Pressable onPress={save} disabled={saving}
          style={{ backgroundColor: "#3b82f6", borderRadius: 12, padding: 17,
            alignItems: "center", opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Salvar despesa</Text>}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SumItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: "#64748b", fontSize: 10 }}>{label}</Text>
      <Text style={{ color: "#f8fafc", fontWeight: "700", fontSize: 13 }}>{value}</Text>
    </View>
  );
}
