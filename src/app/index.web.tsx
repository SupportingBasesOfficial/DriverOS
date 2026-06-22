import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { DriverOSLogo } from "../components/DriverOSLogo";

const FEATURES = [
  { icon: "📍", title: "GPS Automático", tag: "CORE",
    desc: "Rastreie cada viagem em segundo plano. Distância, rota e velocidade capturadas sem fazer nada.", accent: "#3b82f6" },
  { icon: "💰", title: "Controle de Ganhos", tag: "FINANÇAS",
    desc: "Ganhos por turno, dia, semana e mês. Metas diárias, semanais e mensais com barras de progresso.", accent: "#22c55e" },
  { icon: "⛽", title: "Eficiência km/L", tag: "NOVO",
    desc: "Cálculo automático de consumo a cada abastecimento. Média dos últimos 5 registros no dashboard.", accent: "#f59e0b" },
  { icon: "📊", title: "Relatórios Inteligentes", tag: "ANALYTICS",
    desc: "Analise sua performance. Descubra horários mais lucrativos, gasto médio por km e eficiência real.", accent: "#a855f7" },
  { icon: "🚗", title: "Multi-Veículos", tag: "PRO",
    desc: "Gerencie múltiplos veículos. Troque o ativo com um toque e controle gastos separadamente.", accent: "#3b82f6" },
  { icon: "🗺️", title: "Mapa de Rotas", tag: "GPS",
    desc: "Visualize o trajeto exato de cada viagem. Compare rotas e identifique padrões geográficos.", accent: "#06b6d4" },
];

const STATS = [
  { value: "10k+", label: "Motoristas ativos", color: "#3b82f6" },
  { value: "R$50M+", label: "Ganhos rastreados", color: "#22c55e" },
  { value: "4.9★", label: "Avaliação média", color: "#f59e0b" },
  { value: "100%", label: "Gratuito para sempre", color: "#a855f7" },
];

const TESTIMONIALS = [
  { quote: "Finalmente sei exatamente quanto ganho e quanto gasto. O km/l automático é incrível.", name: "Carlos R.", role: "Motorista Uber — SP", stars: 5 },
  { quote: "Controlo meus 2 carros num só lugar. A troca de veículo ativo é simples e rápida.", name: "Marina S.", role: "Motorista 99 — RJ", stars: 5 },
  { quote: "A meta diária me mantém focado. Quando bate, a barra fica verde — motivação pura!", name: "João F.", role: "Motorista InDrive — BH", stars: 5 },
];

const STEPS = [
  { n: "01", icon: "▶", title: "Inicie o turno", desc: "Um toque. O app registra horário, hodômetro e veículo automaticamente.", color: "#3b82f6" },
  { n: "02", icon: "📍", title: "GPS rastreia tudo", desc: "Cada corrida é registrada em segundo plano — sem pausas ou interrupções.", color: "#22c55e" },
  { n: "03", icon: "📊", title: "Confira seu resultado", desc: "Total ganho, distância, lucro líquido, km/l e mapa de rotas ao encerrar.", color: "#f59e0b" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#030712" }} contentContainerStyle={{ paddingBottom: 0 }}>

      {/* ─── NAVBAR ─── */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 40, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: "#0f172a",
        backgroundColor: "rgba(3,7,18,0.97)", position: "sticky" as never, top: 0, zIndex: 100 } as never}>
        <DriverOSLogo size="sm" />
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Pressable onPress={() => router.push("/(auth)/login" as never)}
            style={{ paddingVertical: 9, paddingHorizontal: 22, borderRadius: 9, borderWidth: 1, borderColor: "#1e293b" }}>
            <Text style={{ color: "#94a3b8", fontSize: 14, fontWeight: "600" }}>Entrar</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/register" as never)}
            style={{ paddingVertical: 9, paddingHorizontal: 22, borderRadius: 9, backgroundColor: "#2563eb",
              borderWidth: 1, borderColor: "#3b82f6" }}>
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>Criar conta grátis</Text>
          </Pressable>
        </View>
      </View>

      {/* ─── HERO ─── */}
      <View style={{ alignItems: "center", paddingHorizontal: 24, paddingTop: 110, paddingBottom: 80,
        borderBottomWidth: 1, borderBottomColor: "#0f172a" }}>

        <View style={{ backgroundColor: "#0c1a3a", borderRadius: 100, paddingVertical: 6, paddingHorizontal: 18,
          marginBottom: 32, borderWidth: 1, borderColor: "#1d4ed8", flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Text style={{ color: "#60a5fa", fontSize: 11, fontWeight: "800", letterSpacing: 2 }}>
            NOVO  ·  km/L AUTOMÁTICO
          </Text>
        </View>

        <Text style={{ fontSize: 62, fontWeight: "900", color: "#f1f5f9", textAlign: "center",
          lineHeight: 70, letterSpacing: -3, maxWidth: 760 } as never}>
          O <Text style={{ color: "#3b82f6" }}>Sistema Operacional</Text>{"\n"}do Motorista de App
        </Text>

        <Text style={{ color: "#64748b", fontSize: 19, textAlign: "center", marginTop: 26,
          maxWidth: 540, lineHeight: 32 } as never}>
          GPS automático · Metas de ganhos · km/l em tempo real{"\n"}
          Controle total em um app <Text style={{ color: "#22c55e", fontWeight: "700" }}>100% gratuito</Text>.
        </Text>

        <View style={{ flexDirection: "row", gap: 14, marginTop: 48, flexWrap: "wrap", justifyContent: "center" }}>
          <Pressable onPress={() => router.push("/(auth)/register" as never)}
            style={{ backgroundColor: "#2563eb", paddingVertical: 18, paddingHorizontal: 40, borderRadius: 13,
              borderWidth: 1, borderColor: "#3b82f6" }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>Começar agora — é grátis  →</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/login" as never)}
            style={{ backgroundColor: "#0f172a", paddingVertical: 18, paddingHorizontal: 40, borderRadius: 13,
              borderWidth: 1, borderColor: "#1e293b" }}>
            <Text style={{ color: "#94a3b8", fontSize: 17, fontWeight: "600" }}>Já tenho conta</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", gap: 56, marginTop: 80, flexWrap: "wrap",
          justifyContent: "center", paddingTop: 56, borderTopWidth: 1, borderTopColor: "#0f172a", alignSelf: "stretch" }}>
          {STATS.map(s => (
            <View key={s.label} style={{ alignItems: "center", gap: 6 }}>
              <Text style={{ fontSize: 28, fontWeight: "900", color: s.color }}>{s.value}</Text>
              <Text style={{ color: "#475569", fontSize: 13, fontWeight: "500" }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── FEATURES BENTO ─── */}
      <View style={{ paddingHorizontal: 32, paddingVertical: 100, alignItems: "center", backgroundColor: "#030712" }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#3b82f6", letterSpacing: 4, marginBottom: 18 }}>
          FUNCIONALIDADES
        </Text>
        <Text style={{ fontSize: 42, fontWeight: "900", color: "#f1f5f9", textAlign: "center",
          letterSpacing: -1.5, maxWidth: 600, marginBottom: 18 } as never}>
          Tudo que você precisa,{"\n"}em um só lugar
        </Text>
        <Text style={{ color: "#475569", fontSize: 16, textAlign: "center", maxWidth: 480,
          marginBottom: 72, lineHeight: 28 } as never}>
          Feito para Uber, 99, InDrive e qualquer plataforma de corrida.
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 960 } as never}>
          {FEATURES.map(f => (
            <Pressable key={f.title}
              onPress={() => {}}
              style={{ backgroundColor: "#080f1f", borderRadius: 20, padding: 30, width: 440,
                maxWidth: "100%" as never, borderWidth: 1, borderColor: "#0f172a", gap: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ fontSize: 40 }}>{f.icon}</Text>
                <View style={{ backgroundColor: "#0f172a", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4,
                  borderWidth: 1, borderColor: f.accent + "44" }}>
                  <Text style={{ color: f.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>{f.tag}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#f1f5f9" }}>{f.title}</Text>
              <Text style={{ color: "#475569", fontSize: 14, lineHeight: 24 }}>{f.desc}</Text>
              <View style={{ height: 2, backgroundColor: f.accent + "33", borderRadius: 2, marginTop: 4 }} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* ─── HOW IT WORKS ─── */}
      <View style={{ paddingHorizontal: 32, paddingVertical: 100, alignItems: "center",
        backgroundColor: "#030712", borderTopWidth: 1, borderTopColor: "#0f172a" }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#22c55e", letterSpacing: 4, marginBottom: 18 }}>
          COMO FUNCIONA
        </Text>
        <Text style={{ fontSize: 42, fontWeight: "900", color: "#f1f5f9", textAlign: "center",
          letterSpacing: -1.5, marginBottom: 80 }}>
          Pronto em 3 passos
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 32, justifyContent: "center", maxWidth: 960 } as never}>
          {STEPS.map(s => (
            <View key={s.n} style={{ backgroundColor: "#080f1f", borderRadius: 20, padding: 32, width: 280,
              maxWidth: "100%" as never, gap: 16, borderWidth: 1, borderColor: "#0f172a", alignItems: "flex-start" }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: s.color + "18",
                borderWidth: 1, borderColor: s.color + "55", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: s.color, fontSize: 20 }}>{s.icon}</Text>
              </View>
              <Text style={{ color: s.color, fontSize: 11, fontWeight: "800", letterSpacing: 2 }}>PASSO {s.n}</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#f1f5f9" }}>{s.title}</Text>
              <Text style={{ color: "#475569", fontSize: 14, lineHeight: 24 }}>{s.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ─── TESTIMONIALS ─── */}
      <View style={{ paddingHorizontal: 32, paddingVertical: 100, alignItems: "center",
        backgroundColor: "#030712", borderTopWidth: 1, borderTopColor: "#0f172a" }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#a855f7", letterSpacing: 4, marginBottom: 18 }}>
          DEPOIMENTOS
        </Text>
        <Text style={{ fontSize: 42, fontWeight: "900", color: "#f1f5f9", textAlign: "center",
          letterSpacing: -1.5, marginBottom: 72 }}>
          O que os motoristas dizem
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20, justifyContent: "center", maxWidth: 980 } as never}>
          {TESTIMONIALS.map(t => (
            <View key={t.name} style={{ backgroundColor: "#080f1f", borderRadius: 20, padding: 32, width: 300,
              maxWidth: "100%" as never, gap: 16, borderWidth: 1, borderColor: "#0f172a" }}>
              <Text style={{ color: "#f59e0b", fontSize: 18 }}>{"★".repeat(t.stars)}</Text>
              <Text style={{ color: "#94a3b8", fontSize: 15, lineHeight: 26, fontStyle: "italic" as never }}>
                "{t.quote}"
              </Text>
              <View style={{ gap: 3 }}>
                <Text style={{ color: "#f1f5f9", fontWeight: "700", fontSize: 14 }}>{t.name}</Text>
                <Text style={{ color: "#334155", fontSize: 12 }}>{t.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ─── PRICING / CTA ─── */}
      <View style={{ paddingHorizontal: 32, paddingVertical: 100, alignItems: "center",
        backgroundColor: "#030712", borderTopWidth: 1, borderTopColor: "#0f172a", gap: 0 }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: "#22c55e", letterSpacing: 4, marginBottom: 20 }}>
          PLANO ÚNICO
        </Text>
        <View style={{ backgroundColor: "#080f1f", borderRadius: 28, padding: 56, maxWidth: 480,
          borderWidth: 1, borderColor: "#0f172a", alignItems: "center", gap: 20, alignSelf: "stretch" } as never}>
          <View style={{ backgroundColor: "#022c14", borderRadius: 100, paddingVertical: 6, paddingHorizontal: 18,
            borderWidth: 1, borderColor: "#16a34a" }}>
            <Text style={{ color: "#4ade80", fontSize: 12, fontWeight: "800" }}>✓ GRATUITO PARA SEMPRE</Text>
          </View>
          <Text style={{ fontSize: 72, fontWeight: "900", color: "#f1f5f9", letterSpacing: -3 }}>R$0</Text>
          <Text style={{ color: "#475569", fontSize: 16, textAlign: "center" as never, lineHeight: 26 }}>
            Todas as funcionalidades incluídas.{"\n"}Sem limites. Sem período de trial.
          </Text>
          {["GPS automático ilimitado", "Metas diárias, semanais e mensais", "km/l calculado automaticamente",
            "Multi-veículos", "Histórico completo de turnos", "Relatórios e análises"].map(item => (
            <View key={item} style={{ flexDirection: "row", gap: 12, alignItems: "center", alignSelf: "stretch" }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#022c14",
                borderWidth: 1, borderColor: "#16a34a", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#22c55e", fontSize: 11, fontWeight: "800" }}>✓</Text>
              </View>
              <Text style={{ color: "#94a3b8", fontSize: 15 }}>{item}</Text>
            </View>
          ))}
          <Pressable onPress={() => router.push("/(auth)/register" as never)}
            style={{ backgroundColor: "#2563eb", borderRadius: 14, paddingVertical: 18, paddingHorizontal: 40,
              alignItems: "center", alignSelf: "stretch", borderWidth: 1, borderColor: "#3b82f6", marginTop: 8 }}>
            <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>Criar conta grátis  →</Text>
          </Pressable>
          <Text style={{ color: "#1e293b", fontSize: 13 }}>Sem cartão de crédito. Sem pegadinha.</Text>
        </View>
      </View>

      {/* ─── FOOTER ─── */}
      <View style={{ borderTopWidth: 1, borderTopColor: "#0f172a", paddingHorizontal: 40, paddingVertical: 40,
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 20, backgroundColor: "#030712" }}>
        <DriverOSLogo size="sm" />
        <View style={{ flexDirection: "row", gap: 32, flexWrap: "wrap" }}>
          <Pressable onPress={() => router.push("/(auth)/login" as never)}>
            <Text style={{ color: "#334155", fontSize: 14 }}>Entrar</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(auth)/register" as never)}>
            <Text style={{ color: "#334155", fontSize: 14 }}>Criar conta</Text>
          </Pressable>
        </View>
        <Text style={{ color: "#1e293b", fontSize: 13 }}>© 2026 DriverOS · Plataforma do motorista</Text>
      </View>
    </ScrollView>
  );
}
