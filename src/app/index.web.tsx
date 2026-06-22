import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

const FEATURES = [
  {
    icon: "📍",
    title: "GPS em Tempo Real",
    desc: "Rastreie automaticamente cada viagem. Distância, rota completa e velocidade capturadas sem precisar fazer nada.",
  },
  {
    icon: "💰",
    title: "Controle de Ganhos",
    desc: "Registre a tarifa de cada viagem e acompanhe seus ganhos por turno, dia, semana e mês.",
  },
  {
    icon: "📊",
    title: "Relatórios Inteligentes",
    desc: "Analise sua performance com gráficos claros. Descubra seus horários mais lucrativos e otimize seus turnos.",
  },
  {
    icon: "🚗",
    title: "Gestão de Veículos",
    desc: "Controle abastecimentos, manutenções e todos os custos operacionais do seu veículo em um só lugar.",
  },
  {
    icon: "🗺️",
    title: "Mapa de Rotas",
    desc: "Visualize o trajeto exato de cada viagem no mapa. Compare rotas e identifique padrões.",
  },
  {
    icon: "📋",
    title: "Histórico Completo",
    desc: "Acesse todos os seus turnos e viagens anteriores. Exporte relatórios para declaração de imposto.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Inicie o turno",
    desc: "Toque em 'Iniciar turno'. O app registra horário, odômetro e seu veículo automaticamente.",
  },
  {
    n: "02",
    title: "Viagens rastreadas",
    desc: "A cada corrida, o GPS registra o trajeto em segundo plano — sem interrupções para você.",
  },
  {
    n: "03",
    title: "Veja seu resumo",
    desc: "Finalize o turno e confira: total ganho, distância percorrida, custos e mapa de todas as rotas.",
  },
];

const STATS = [
  { value: "100%", label: "Gratuito" },
  { value: "GPS", label: "Automático" },
  { value: "APK", label: "Android" },
  { value: "Web", label: "e Navegador" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#0f172a" }}
      contentContainerStyle={{ paddingBottom: 0 }}
    >
      {/* ─── NAVBAR ─── */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#1e293b",
          backgroundColor: "rgba(15,23,42,0.96)",
          position: "sticky" as never,
          top: 0,
          zIndex: 100,
        } as never}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#f8fafc", letterSpacing: -0.5 }}>
          Driver<Text style={{ color: "#3b82f6" }}>OS</Text>
        </Text>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Pressable
            onPress={() => router.push("/(auth)/login" as never)}
            style={{ paddingVertical: 9, paddingHorizontal: 20, borderRadius: 9, borderWidth: 1, borderColor: "#334155" }}
          >
            <Text style={{ color: "#cbd5e1", fontSize: 14, fontWeight: "600" }}>Entrar</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(auth)/register" as never)}
            style={{ paddingVertical: 9, paddingHorizontal: 20, borderRadius: 9, backgroundColor: "#3b82f6" }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>Criar conta</Text>
          </Pressable>
        </View>
      </View>

      {/* ─── HERO ─── */}
      <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 100, paddingBottom: 88 }}>
        <View
          style={{
            backgroundColor: "#172554",
            borderRadius: 100,
            paddingVertical: 7,
            paddingHorizontal: 20,
            marginBottom: 28,
            borderWidth: 1,
            borderColor: "#1d4ed8",
          }}
        >
          <Text style={{ color: "#93c5fd", fontSize: 13, fontWeight: "700" }}>
            🚀 Disponível para Android e Navegador
          </Text>
        </View>

        <Text
          style={{
            fontSize: 56,
            fontWeight: "800",
            color: "#f8fafc",
            textAlign: "center",
            lineHeight: 64,
            letterSpacing: -2,
            maxWidth: 700,
          } as never}
        >
          O sistema completo para{" "}
          <Text style={{ color: "#3b82f6" }}>motoristas</Text>
          {"\n"}de aplicativo
        </Text>

        <Text
          style={{
            color: "#94a3b8",
            fontSize: 19,
            textAlign: "center",
            marginTop: 24,
            maxWidth: 540,
            lineHeight: 30,
          } as never}
        >
          GPS automático, controle de ganhos, relatórios detalhados e mapa de rotas —
          tudo em um app gratuito feito para quem vive ao volante.
        </Text>

        <View
          style={{
            flexDirection: "row",
            gap: 16,
            marginTop: 44,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => router.push("/(auth)/register" as never)}
            style={{
              backgroundColor: "#3b82f6",
              paddingVertical: 17,
              paddingHorizontal: 36,
              borderRadius: 13,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
              Criar conta grátis →
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(auth)/login" as never)}
            style={{
              backgroundColor: "#1e293b",
              paddingVertical: 17,
              paddingHorizontal: 36,
              borderRadius: 13,
              borderWidth: 1,
              borderColor: "#334155",
            }}
          >
            <Text style={{ color: "#f8fafc", fontSize: 17, fontWeight: "600" }}>
              Já tenho conta
            </Text>
          </Pressable>
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            gap: 48,
            marginTop: 72,
            flexWrap: "wrap",
            justifyContent: "center",
            paddingTop: 48,
            borderTopWidth: 1,
            borderTopColor: "#1e293b",
            alignSelf: "stretch",
          }}
        >
          {STATS.map(s => (
            <View key={s.label} style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 26, fontWeight: "800", color: "#3b82f6" }}>{s.value}</Text>
              <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "500" }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── FEATURES ─── */}
      <View
        style={{
          backgroundColor: "#080f1f",
          paddingHorizontal: 24,
          paddingVertical: 96,
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: "#1e293b",
        }}
      >
        <Text
          style={{ fontSize: 12, fontWeight: "700", color: "#3b82f6", letterSpacing: 3, marginBottom: 16 }}
        >
          FUNCIONALIDADES
        </Text>
        <Text
          style={{
            fontSize: 38,
            fontWeight: "800",
            color: "#f8fafc",
            textAlign: "center",
            letterSpacing: -1,
            maxWidth: 560,
            marginBottom: 16,
          } as never}
        >
          Tudo que você precisa
        </Text>
        <Text
          style={{
            color: "#94a3b8",
            fontSize: 16,
            textAlign: "center",
            maxWidth: 460,
            marginBottom: 64,
            lineHeight: 26,
          } as never}
        >
          Desenvolvido pensando no dia a dia de quem trabalha com Uber, 99, InDrive e similares.
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 20,
            justifyContent: "center",
            maxWidth: 920,
          } as never}
        >
          {FEATURES.map(f => (
            <View
              key={f.title}
              style={{
                backgroundColor: "#0f172a",
                borderRadius: 18,
                padding: 28,
                width: 420,
                maxWidth: "100%" as never,
                borderWidth: 1,
                borderColor: "#1e293b",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 36 }}>{f.icon}</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#f8fafc" }}>{f.title}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 14, lineHeight: 22 }}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── HOW IT WORKS ─── */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 96,
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: "#1e293b",
        }}
      >
        <Text
          style={{ fontSize: 12, fontWeight: "700", color: "#22c55e", letterSpacing: 3, marginBottom: 16 }}
        >
          COMO FUNCIONA
        </Text>
        <Text
          style={{
            fontSize: 38,
            fontWeight: "800",
            color: "#f8fafc",
            textAlign: "center",
            letterSpacing: -1,
            marginBottom: 72,
          }}
        >
          Simples como deve ser
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 40,
            justifyContent: "center",
            maxWidth: 960,
          } as never}
        >
          {STEPS.map((s, i) => (
            <View key={s.n} style={{ alignItems: "center", width: 280, maxWidth: "100%" as never, gap: 16 }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: "#0f2041",
                  borderWidth: 2,
                  borderColor: "#3b82f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#3b82f6", fontSize: 18, fontWeight: "800" }}>{s.n}</Text>
              </View>
              {i < STEPS.length - 1 && (
                <View
                  style={{
                    position: "absolute",
                    top: 28,
                    left: "78%" as never,
                    width: 60,
                    height: 2,
                    backgroundColor: "#1e293b",
                  }}
                />
              )}
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#f8fafc", textAlign: "center" }}>
                  {s.title}
                </Text>
                <Text style={{ color: "#94a3b8", fontSize: 14, textAlign: "center", lineHeight: 22 }}>
                  {s.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ─── TESTIMONIAL / TRUST ─── */}
      <View
        style={{
          backgroundColor: "#080f1f",
          borderTopWidth: 1,
          borderTopColor: "#1e293b",
          paddingHorizontal: 24,
          paddingVertical: 72,
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#0f172a",
            borderRadius: 20,
            padding: 40,
            maxWidth: 680,
            borderWidth: 1,
            borderColor: "#334155",
            gap: 20,
            alignItems: "center",
          } as never}
        >
          <Text style={{ fontSize: 36, color: "#3b82f6" }}>💬</Text>
          <Text
            style={{
              fontSize: 20,
              color: "#e2e8f0",
              textAlign: "center",
              lineHeight: 32,
              fontStyle: "italic",
            } as never}
          >
            "Finalmente um app que entende o motorista. Sei exatamente quanto ganho, quanto gasto e
            se vale a pena trabalhar em cada horário."
          </Text>
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={{ color: "#f8fafc", fontWeight: "700" }}>Carlos R.</Text>
            <Text style={{ color: "#64748b", fontSize: 13 }}>Motorista Uber — São Paulo</Text>
          </View>
        </View>
      </View>

      {/* ─── FINAL CTA ─── */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 100,
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: "#1e293b",
          gap: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "#172554",
            borderRadius: 100,
            paddingVertical: 6,
            paddingHorizontal: 18,
            borderWidth: 1,
            borderColor: "#1d4ed8",
          }}
        >
          <Text style={{ color: "#93c5fd", fontSize: 13, fontWeight: "700" }}>✅ Gratuito para sempre</Text>
        </View>
        <Text
          style={{
            fontSize: 44,
            fontWeight: "800",
            color: "#f8fafc",
            textAlign: "center",
            letterSpacing: -1.5,
            maxWidth: 560,
            lineHeight: 52,
          } as never}
        >
          Pronto para ter controle total?
        </Text>
        <Text
          style={{
            color: "#94a3b8",
            fontSize: 17,
            textAlign: "center",
            maxWidth: 420,
            lineHeight: 28,
          } as never}
        >
          Crie sua conta em menos de 1 minuto e comece a rastrear suas viagens hoje.
        </Text>
        <Pressable
          onPress={() => router.push("/(auth)/register" as never)}
          style={{
            backgroundColor: "#3b82f6",
            paddingVertical: 19,
            paddingHorizontal: 52,
            borderRadius: 14,
            marginTop: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            Começar agora — é grátis
          </Text>
        </Pressable>
        <Text style={{ color: "#475569", fontSize: 13 }}>
          Sem cartão de crédito. Sem pegadinha.
        </Text>
      </View>

      {/* ─── FOOTER ─── */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#1e293b",
          paddingHorizontal: 32,
          paddingVertical: 36,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          backgroundColor: "#080f1f",
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#f8fafc" }}>
          Driver<Text style={{ color: "#3b82f6" }}>OS</Text>
        </Text>
        <View style={{ flexDirection: "row", gap: 24 }}>
          <Pressable onPress={() => router.push("/(auth)/login" as never)}>
            <Text style={{ color: "#64748b", fontSize: 14 }}>Entrar</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/register" as never)}>
            <Text style={{ color: "#64748b", fontSize: 14 }}>Criar conta</Text>
          </Pressable>
        </View>
        <Text style={{ color: "#334155", fontSize: 13 }}>
          © 2026 DriverOS — Plataforma do motorista
        </Text>
      </View>
    </ScrollView>
  );
}
