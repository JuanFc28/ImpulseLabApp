import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#10B981", // Verde Esmeralda
        tabBarInactiveTintColor: "#666666",
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#0A0A0A",
          borderTopWidth: 1,
          borderTopColor: "#222222",
          height: 60 + insets.bottom,
          // Empuja los íconos hacia arriba si existen botones virtuales en la pantalla
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 10,
        },
      }}
    >
      {/* PESTAÑA 1: HORARIOS */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Horarios",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="calendar" color={color} />
          ),
        }}
      />

      {/* PESTAÑA 2: COMUNIDAD */}
      <Tabs.Screen
        name="users"
        options={{
          title: "Comunidad",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.3.fill" color={color} />
          ),
        }}
      />

      {/* PESTAÑA 3: PERFIL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <IconSymbol
              size={24}
              name="person.crop.circle.fill"
              color={color}
            />
          ),
        }}
      />

      {/* Si aún tienes el archivo classes.jsx, lo ocultamos para que no salga como una 4ta pestaña */}
      <Tabs.Screen name="classes" options={{ href: null }} />
    </Tabs>
  );
}
