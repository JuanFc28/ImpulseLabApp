import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UserLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#00E5FF",
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
      {/* INICIO */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            /* CORRECCIÓN: house.fill -> home */
            <Ionicons size={24} name="home" color={color} />
          ),
        }}
      />

      {/* RUTINAS */}
      <Tabs.Screen
        name="routines"
        options={{
          title: "Rutinas",
          tabBarIcon: ({ color }) => (
            /* CORRECCIÓN: dumbbell.fill -> barbell */
            <Ionicons size={24} name="barbell" color={color} />
          ),
        }}
      />

      {/* EXPLORAR */}
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color }) => (
            /* CORRECCIÓN: magnifyingglass -> search */
            <Ionicons size={24} name="search" color={color} />
          ),
        }}
      />

      {/* PERFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            /* CORRECCIÓN: person.crop.circle.fill -> person-circle */
            <Ionicons size={24} name="person-circle" color={color} />
          ),
        }}
      />

      <Tabs.Screen name="ticket" options={{ href: null }} />
      <Tabs.Screen name="routine-detail" options={{ href: null }} />
      <Tabs.Screen name="scan-attendance" options={{ href: null }} />
    </Tabs>
  );
}
