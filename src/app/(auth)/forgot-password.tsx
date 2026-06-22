import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSend() {
    setError("");
    if (!email.trim()) { setError("Informe seu e-mail."); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (err) { setError(err.message); return; }
      setSent(true);
    } catch {
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", padding: 24 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ alignItems: "center", marginBottom: 40, gap: 10 }}>
        <Text style={{ fontSize: 32 }}>🔑</Text>
        <Text style={{ fontSize: 26, fontWeight: "800", color: "#f8fafc" }}>Recuperar senha</Text>
        <Text style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 22 }}>
          Informe seu e-mail e enviaremos um link para criar uma nova senha.
        </Text>
      </View>

      {sent ? (
        <View
          style={{
            backgroundColor: "#14532d",
            borderRadius: 16,
            padding: 28,
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderColor: "#166534",
          }}
        >
          <Text style={{ fontSize: 40 }}>✅</Text>
          <Text style={{ color: "#86efac", fontSize: 16, fontWeight: "700" }}>E-mail enviado!</Text>
          <Text style={{ color: "#4ade80", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
            Verifique sua caixa de entrada e clique no link para criar uma nova senha.
          </Text>
          <Pressable onPress={() => router.replace("/(auth)/login")} style={{ marginTop: 8 }}>
            <Text style={{ color: "#3b82f6", fontWeight: "600", fontSize: 15 }}>Voltar ao login</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Seu e-mail"
            placeholderTextColor="#475569"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              backgroundColor: "#1e293b",
              color: "#f8fafc",
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              borderWidth: 1,
              borderColor: "#334155",
            }}
          />

          {error ? (
            <Text style={{ color: "#ef4444", textAlign: "center", fontSize: 13 }}>{error}</Text>
          ) : null}

          <Pressable
            onPress={handleSend}
            disabled={loading}
            style={{
              backgroundColor: "#3b82f6",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Enviar link de recuperação</Text>}
          </Pressable>

          <Pressable onPress={() => router.back()} style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ color: "#94a3b8", fontSize: 14 }}>← Voltar ao login</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
