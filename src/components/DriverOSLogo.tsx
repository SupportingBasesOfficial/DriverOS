import { View, Text } from "react-native";

type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";

const CONFIG: Record<LogoSize, { badge: number; font: number; text: number; gap: number; radius: number; border: number }> = {
  xs: { badge: 22, font: 11, text: 13, gap: 6,  radius: 6,  border: 1   },
  sm: { badge: 28, font: 14, text: 17, gap: 8,  radius: 8,  border: 1.5 },
  md: { badge: 36, font: 18, text: 21, gap: 10, radius: 10, border: 1.5 },
  lg: { badge: 46, font: 23, text: 27, gap: 12, radius: 13, border: 2   },
  xl: { badge: 60, font: 30, text: 34, gap: 14, radius: 16, border: 2   },
};

export function DriverOSLogo({
  size = "md" as LogoSize,
  showText = true,
  color = "#f8fafc",
}: {
  size?: LogoSize;
  showText?: boolean;
  color?: string;
}) {
  const c = CONFIG[size];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: c.gap }}>
      <DriverOSMark size={c.badge} />
      {showText && (
        <Text style={{ color, fontWeight: "800", fontSize: c.text, letterSpacing: -0.5 }}>
          Driver<Text style={{ color: "#3b82f6" }}>OS</Text>
        </Text>
      )}
    </View>
  );
}

export function DriverOSMark({ size = 36 }: { size?: number }) {
  const radius = Math.round(size * 0.27);
  const fontSize = Math.round(size * 0.48);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: "#1d4ed8",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: "#3b82f6",
        shadowColor: "#3b82f6",
        shadowOpacity: 0.45,
        shadowRadius: size * 0.22,
        elevation: 4,
      }}
    >
      {/* Inner accent bar — gives a "speed" feel */}
      <View
        style={{
          position: "absolute",
          bottom: Math.round(size * 0.14),
          left: Math.round(size * 0.2),
          right: Math.round(size * 0.2),
          height: Math.round(size * 0.06),
          backgroundColor: "#93c5fd",
          borderRadius: 99,
          opacity: 0.6,
        }}
      />
      <Text
        style={{
          color: "#fff",
          fontWeight: "900",
          fontSize,
          letterSpacing: -1,
          marginBottom: Math.round(size * 0.04),
        }}
      >
        D
      </Text>
    </View>
  );
}
