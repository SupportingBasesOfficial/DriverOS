import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

type Status = "loading" | "ok" | "error";

export default function HomeScreen() {
  const [status, setStatus] = useState<Status>("loading");
  const [info, setInfo] = useState("");

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          setStatus("error");
          setInfo(error.message);
        } else {
          setStatus("ok");
          setInfo(data.session ? "Sessão ativa" : "Sem sessão (anônimo)");
        }
      } catch (e: any) {
        setStatus("error");
        setInfo(e?.message ?? "Erro desconhecido");
      }
    }
    testConnection();
  }, []);

  const color = status === "ok" ? "#22c55e" : status === "error" ? "#ef4444" : "#94a3b8";
  const label = status === "ok" ? "✅ Supabase conectado" : status === "error" ? "❌ Erro de conexão" : "Conectando...";

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", gap: 16 }}>
      <Text style={{ color: "#f8fafc", fontSize: 28, fontWeight: "bold" }}>DriverOS</Text>
      {status === "loading" ? (
        <ActivityIndicator color="#94a3b8" />
      ) : (
        <Text style={{ color, fontSize: 16 }}>{label}</Text>
      )}
      {info ? <Text style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", paddingHorizontal: 32 }}>{info}</Text> : null}
    </View>
  );
}
