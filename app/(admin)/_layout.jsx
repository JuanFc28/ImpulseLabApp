import { Tabs } from "expo-router";
import React from "react";
import { HapticTab } from "@/components/haptic-tab";
// La importación está bien
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#10B981",
        tabBarInactiveTintColor: "#666666",
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#0A0A0A",
          borderTopWidth: 1,
          borderTopColor: "#222222",
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
        },
      }}
    >
      {/* MÉTRICAS */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Métricas",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="stats-chart" color={color} />
          ),
        }}
      />

      {/* HORARIOS */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Horarios",
          tabBarIcon: ({ color }) => (
            /* calendar -> calendar (Este es igual) */
            <Ionicons size={24} name="calendar" color={color} />
          ),
        }}
      />

      {/* COMUNIDAD */}
      <Tabs.Screen
        name="users"
        options={{
          title: "Comunidad",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="people" color={color} />
          ),
        }}
      />

      {/* PERFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="person-circle" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="qr"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
