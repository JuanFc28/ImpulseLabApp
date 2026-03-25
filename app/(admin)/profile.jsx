import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/src/context/AuthContext";

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Deseas salir del panel de administración?", [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive", 
          onPress: async () => {
            try { await logout(); } catch (error) { Alert.alert("Error", "No se pudo cerrar sesión."); }
          } 
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-impulse-dark">
      {/* ScrollView con flexGrow y justifyContent center para alinear todo verticalmente */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}
      >
        
        {/* INFO DE USUARIO */}
        <View className="items-center mb-10">
          <View className="w-24 h-24 rounded-full border-4 border-emerald-500 p-1 mb-4 shadow-xl shadow-emerald-500/20">
            <View className="flex-1 rounded-full bg-white/10 items-center justify-center overflow-hidden">
               <IconSymbol name="person.crop.circle.fill" size={60} color="#10B981" />
            </View>
          </View>
          <Text className="text-white text-2xl" style={{ fontWeight: '900' }}>
            {user?.displayName || "Administrador"}
          </Text>
          <Text className="text-gray-500 uppercase tracking-widest text-[10px] mt-1" style={{ fontWeight: 'bold' }}>
            Dueño / Admin
          </Text>
        </View>

        {/* SECCIÓN DE AJUSTES / INFO */}
        <View className="bg-impulse-gray rounded-[32px] p-2 border border-white/5 mb-8">
          <View className="p-4 flex-row items-center border-b border-white/5">
            <IconSymbol name="envelope.fill" size={18} color="#666" />
            <View className="ml-4">
              <Text className="text-gray-500 text-[10px] uppercase" style={{ fontWeight: '900' }}>Correo</Text>
              <Text className="text-white" style={{ fontWeight: 'bold' }}>{user?.email}</Text>
            </View>
          </View>

          <View className="p-4 flex-row items-center">
            <IconSymbol name="shield.fill" size={18} color="#666" />
            <View className="ml-4">
              <Text className="text-gray-500 text-[10px] uppercase" style={{ fontWeight: '900' }}>Nivel de Acceso</Text>
              <Text className="text-emerald-500" style={{ fontWeight: 'bold' }}>Control Total</Text>
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
          <Text className="text-red-500 tracking-widest" style={{ fontWeight: '900' }}>CERRAR SESIÓN</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-700 text-[10px] mt-8 uppercase tracking-[2px]" style={{ fontWeight: 'bold' }}>
          Impulse Lab App v1.0.0
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}