import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import "../lib/locationTask";

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";
    const inApp = segments[0] === "(app)";

    if (!session) {
      if (inAuth) return;
      // Web: allow landing page at root; Native: go straight to login
      if (Platform.OS === "web" && (segments as string[])[0] === undefined) return;
      router.replace(Platform.OS === "web" ? "/" : "/(auth)/login");
      return;
    }

    // Already in the right place — don't redirect, avoids infinite loop
    if (inApp || inOnboarding) return;

    // Authenticated but at root or coming from auth → decide where to send
    checkOnboarding();
  }, [session, loading, segments]);

  async function checkOnboarding() {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .limit(1);

      if (error) { console.error("[checkOnboarding]", error); router.replace("/(app)"); return; }

      if (!data || data.length === 0) {
        router.replace("/(onboarding)/vehicle");
      } else {
        router.replace("/(app)");
      }
    } catch (e) {
      console.error("[checkOnboarding] exception", e);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  return <Slot />;
}
