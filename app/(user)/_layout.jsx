import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function UserLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#00E5FF', // Cyan del usuario
                tabBarInactiveTintColor: '#666666',
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: '#0A0A0A',
                    borderTopWidth: 1,
                    borderTopColor: '#222222',
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    paddingTop: 10,
                },
            }}
        >
            {/* PESTAÑA 1: INICIO (Dashboard) */}
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={24} name="house.fill" color={color} />
                    ),
                }}
            />

            {/* PESTAÑA 2: EXPLORAR (Reservas/Clases) */}
            <Tabs.Screen
                name="explore" // Asumiendo que tu archivo se llama classes.jsx
                options={{
                    title: 'Explorar',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={24} name="magnifyingglass" color={color} /> // Ícono de lupa para explorar
                    ),
                }}
            />

            {/* PESTAÑA 3: PERFIL */}
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={24} name="person.crop.circle.fill" color={color} />
                    ),
                }}
            />

            {/* Pestañas ocultas (si tienes archivos que no deben salir en la barra) */}
            <Tabs.Screen name="ticket" options={{ href: null }} />
        </Tabs>
    );
}