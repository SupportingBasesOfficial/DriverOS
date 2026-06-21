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
import { Link } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert("Erro ao entrar", error.message);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: "bold", color: "#f8fafc" }}>DriverOS</Text>
          <Text style={{ fontSize: 14, color: "#94a3b8", marginTop: 6 }}>Plataforma do motorista</Text>
        </View>

        <View style={{ gap: 12 }}>
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
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Senha"
            placeholderTextColor="#475569"
            secureTextEntry
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

          <Pressable
            onPress={handleLogin}
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
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>Entrar</Text>
            )}
          </Pressable>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 16, gap: 4 }}>
            <Text style={{ color: "#94a3b8" }}>Não tem conta?</Text>
            <Link href="/(auth)/register">
              <Text style={{ color: "#3b82f6", fontWeight: "600" }}>Criar conta</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
