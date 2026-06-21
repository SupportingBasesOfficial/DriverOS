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
          tabBarIcon: ({ focused }) => <Icon label={focused ? "🏠" : "🏠"} />,
        }}
      />
      <Tabs.Screen
        name="shift"
        options={{
          title: "Turno",
          tabBarLabel: "Turno",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "🚗" : "🚗"} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Histórico",
          tabBarLabel: "Histórico",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "📋" : "📋"} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarLabel: "Perfil",
          tabBarIcon: ({ focused }) => <Icon label={focused ? "👤" : "👤"} />,
        }}
      />
    </Tabs>
  );
}
