import { useState } from "react";
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
import { Link, useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    setErrorMsg("");
    setSuccessMsg("");
    if (!name || !email || !password) { setErrorMsg("Preencha todos os campos."); return; }
    if (password.length < 6) { setErrorMsg("A senha deve ter ao menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name } },
      });
      if (error) {
        setErrorMsg(error.message);
        console.error("[register]", error);
        return;
      }
      if (data.user && !data.session) {
        setSuccessMsg("Confirmação enviada para " + email + ". Verifique seu e-mail e faça login.");
        setTimeout(() => router.replace("/(auth)/login"), 3000);
      }
    } catch (e) {
      setErrorMsg("Erro inesperado. Tente novamente.");
      console.error("[register] exception", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "#f8fafc" }}>DriverOS</Text>
          <Text style={{ fontSize: 14, color: "#94a3b8", marginTop: 6 }}>Criar nova conta</Text>
        </View>

        <View style={{ gap: 12 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nome completo"
            placeholderTextColor="#475569"
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
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail"
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
          <View style={{ position: "relative" }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Senha (mín. 6 caracteres)"
              placeholderTextColor="#475569"
              secureTextEntry={!showPassword}
              style={{
                backgroundColor: "#1e293b",
                color: "#f8fafc",
                borderRadius: 12,
                padding: 16,
                paddingRight: 50,
                fontSize: 16,
                borderWidth: 1,
                borderColor: "#334155",
              }}
            />
            <Pressable
              onPress={() => setShowPassword((v: boolean) => !v)}
              style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}
            >
              <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁"}</Text>
            </Pressable>
          </View>

          {errorMsg ? (
            <Text style={{ color: "#ef4444", fontSize: 13, textAlign: "center" }}>{errorMsg}</Text>
          ) : null}
          {successMsg ? (
            <Text style={{ color: "#22c55e", fontSize: 13, textAlign: "center" }}>{successMsg}</Text>
          ) : null}

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={{
              backgroundColor: "#3b82f6",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
              marginTop: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Criar conta</Text>
            )}
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16, gap: 4 }}>
            <Text style={{ color: "#94a3b8" }}>Já tem conta?</Text>
            <Link href="/(auth)/login">
              <Text style={{ color: "#3b82f6", fontWeight: "600" }}>Entrar</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
