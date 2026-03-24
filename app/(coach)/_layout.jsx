import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function CoachLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#FF9500',
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
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Agenda',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={24} name="calendar" color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="athletes"
                options={{
                    title: 'Atletas',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={24} name="person.3.fill" color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={24} name="gearshape.fill" color={color} />
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
        </Tabs>
    );
}