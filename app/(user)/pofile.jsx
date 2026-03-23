import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/src/context/AuthContext";

export default function UserProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres salir de Impulse Lab?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive", 
          onPress: async () => {
            try {
              await logout();
              // El InitialLayout en _layout.jsx detectará que user es null 
              // y te mandará automáticamente al /(auth)/login
            } catch (error) {
              Alert.alert("Error", "No se pudo cerrar la sesión.");
            }
          } 
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-impulse-dark">
      <ScrollView className="flex-1 px-6 pt-16" showsVerticalScrollIndicator={false}>
        
        {/* INFO DE USUARIO */}
        <View className="items-center mb-10">
          <View className="w-24 h-24 rounded-full border-4 border-impulse-cyan p-1 mb-4 shadow-xl shadow-impulse-cyan/20">
            <View className="flex-1 rounded-full bg-white/10 items-center justify-center overflow-hidden">
               <IconSymbol name="person.crop.circle.fill" size={60} color="#00E5FF" />
            </View>
          </View>
          <Text className="text-white text-2xl font-black">{user?.displayName || "Atleta"}</Text>
          <Text className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Miembro Activo</Text>
        </View>

        {/* SECCIÓN DE AJUSTES / INFO */}
        <View className="bg-impulse-gray rounded-[32px] p-2 border border-white/5 mb-8">
          <View className="p-4 flex-row items-center border-b border-white/5">
            <IconSymbol name="envelope.fill" size={18} color="#666" />
            <View className="ml-4">
              <Text className="text-gray-500 text-[10px] font-black uppercase">Correo</Text>
              <Text className="text-white font-bold">{user?.email}</Text>
            </View>
          </View>

          <View className="p-4 flex-row items-center">
            <IconSymbol name="creditcard.fill" size={18} color="#666" />
            <View className="ml-4">
              <Text className="text-gray-500 text-[10px] font-black uppercase">Plan Actual</Text>
              <Text className="text-white font-bold text-emerald-500">Ilimitado Impulse</Text>
            </View>
          </View>
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity 
          onPress={handleLogout}
          activeOpacity={0.8}
          className="bg-red-500/10 border border-red-500/30 py-5 rounded-3xl flex-row justify-center items-center"
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#EF4444" style={{marginRight: 10}} />
          <Text className="text-red-500 font-black tracking-widest">CERRAR SESIÓN</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-700 text-[10px] mt-8 font-bold uppercase tracking-[2px]">
          Impulse Lab App v1.0.0
        </Text>

      </ScrollView>
    </View>
  );
}