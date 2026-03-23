import { Tabs } from 'expo-router';
import React from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981', // Esmeralda Admin
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#222222',
        },
      }}>
      
      {/* 1. DASHBOARD - Visible */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />

      {/* 2. CLASES - OCULTO DEL TAB BAR ✅ */}
      <Tabs.Screen
        name="classes"
        options={{
          href: null, // <--- Esta es la clave: la ruta existe pero el botón desaparece
        }}
      />

      {/* 3. USUARIOS - Visible */}
      <Tabs.Screen
        name="users"
        options={{
          title: 'Staff/Atletas',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />

      {/* 4. FINANZAS - Visible */}
      <Tabs.Screen
        name="finances"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="dollarsign.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}