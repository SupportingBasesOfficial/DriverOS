import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [msg, setMsg] = useState("Confirmando sua conta...");

  useEffect(() => {
    async function handle() {
      if (params.error) {
        setMsg(params.error_description ?? params.error ?? "Erro na confirmação.");
        setTimeout(() => router.replace("/(auth)/login"), 3000);
        return;
      }

      if (params.code) {
        const { error } = await supabase.auth.exchangeCodeForSession(params.code);
        if (error) {
          console.error("[auth/callback] exchangeCode error", error);
          setMsg("Erro ao confirmar: " + error.message);
          setTimeout(() => router.replace("/(auth)/login"), 3000);
          return;
        }
      }

      router.replace("/");
    }

    handle();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", gap: 16 }}>
      <ActivityIndicator color="#3b82f6" size="large" />
      <Text style={{ color: "#94a3b8", fontSize: 14 }}>{msg}</Text>
    </View>
  );
}
