import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CoachLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FF9500",
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
      <Tabs.Screen
        name="index"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => (
            /* calendar -> calendar */
            <Ionicons size={24} name="calendar" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="athletes"
        options={{
          title: "Atletas",
          tabBarIcon: ({ color }) => (
            /* person.3.fill -> people */
            <Ionicons size={24} name="people" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="routines"
        options={{
          title: "Rutinas",
          tabBarIcon: ({ color }) => (
            /* dumbbell.fill -> barbell */
            <Ionicons size={24} name="barbell" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            /* person.crop.circle.fill -> person-circle */
            <Ionicons size={24} name="person-circle" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="scanner"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="class-detail"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="create-routine"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
