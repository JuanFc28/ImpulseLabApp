import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme'; // Ajusta la ruta según tu theme.ts
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  // Forzamos el esquema oscuro por defecto si no detecta uno, 
  // alineado a la identidad de Impulse Lab.
  const colorScheme = useColorScheme() ?? 'dark';

  return (
    <Tabs
      screenOptions={{
        // Aplicamos el color neón (cyan) para la pestaña activa
        tabBarActiveTintColor: Colors[colorScheme].tint,
        // Ocultamos el header por defecto para crear un diseño más inmersivo
        headerShown: false,
        // Componente personalizado para vibración sutil al cambiar de pestaña
        tabBarButton: HapticTab,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(10, 10, 10, 0.90)', // Desenfoque premium en iOS
            borderTopWidth: 0,
          },
          default: {
            backgroundColor: '#0A0A0A', // Fondo oscuro sólido para Android
            borderTopWidth: 0,
            elevation: 0,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rutinas"
        options={{
          title: 'Rutinas',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet.clipboard.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Clases',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}