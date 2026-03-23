import "../src/styles/global.css"; // Ajusta la ruta según dónde lo creaste
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

const InitialLayout = () => {
  const { user, role, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user) {
      if (role === "admin" && segments[0] !== "(admin)") {
        router.replace("/(admin)");
      } else if (role === "coach" && segments[0] !== "(coach)") {
        router.replace("/(coach)");
      } else if (role === "user" && segments[0] !== "(user)") {
        router.replace("/(user)");
      }
    }
  }, [user, role, isLoading, segments]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0A0A0A",
        }}
      >
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
