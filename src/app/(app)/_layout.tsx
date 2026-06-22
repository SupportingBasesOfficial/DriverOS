import { Tabs } from "expo-router";
import { Text } from "react-native";

function Icon({ label }: { label: string }) {
  return <Text style={{ fontSize: 20 }}>{label}</Text>;
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#f8fafc",
        tabBarStyle: { backgroundColor: "#0f172a", borderTopColor: "#1e293b" },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#475569",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Início",
          tabBarIcon: () => <Icon label="🏠" />,
        }}
      />
      <Tabs.Screen
        name="shift"
        options={{
          title: "Turno",
          tabBarLabel: "Turno",
          tabBarIcon: () => <Icon label="🚗" />,
        }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{
          title: "Financeiro",
          tabBarLabel: "Financeiro",
          tabBarIcon: () => <Icon label="💰" />,
        }}
      />
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="trip-map" options={{ href: null, tabBarStyle: { display: "none" }, headerShown: false }} />
      <Tabs.Screen name="vehicle-add" options={{ href: null }} />
      <Tabs.Screen name="refueling-add" options={{ href: null }} />
      <Tabs.Screen name="maintenance-add" options={{ href: null }} />
      <Tabs.Screen name="expense-add" options={{ href: null, headerShown: true, title: "Nova Despesa" }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: () => <Icon label="👤" />,
        }}
      />
    </Tabs>
  );
}
