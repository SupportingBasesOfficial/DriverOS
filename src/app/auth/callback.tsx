import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // With implicit flow, Supabase JS detects the #access_token hash automatically
    // and fires onAuthStateChange. Just redirect to root and _layout.tsx handles the rest.
    router.replace("/");
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
      <ActivityIndicator color="#3b82f6" size="large" />
    </View>
  );
}
