import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "../../src/context/AuthContext";

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <View className="flex-1 bg-impulse-dark">
      <ScrollView 
        className="flex-1 px-6 pt-16"
        showsVerticalScrollIndicator={false}
      >
        {/* Header con estilo premium */}
        <View className="flex-row justify-between items-center mb-10">
          <View>
            <Text className="text-gray-400 text-sm font-medium">BIENVENIDO,</Text>
            <Text className="text-white text-3xl font-black">
              {user?.displayName?.split(' ')[0] || "ATLETA"}
            </Text>
          </View>
          <TouchableOpacity className="w-14 h-14 rounded-2xl bg-impulse-gray border border-impulse-border items-center justify-center">
             <IconSymbol name="dumbbell.fill" size={28} color="#00E5FF" />
          </TouchableOpacity>
        </View>

        {/* Card de Próxima Clase con gradiente visual (usando opacidad) */}
        <View className="bg-impulse-cyan rounded-[32px] p-6 mb-8 shadow-xl shadow-impulse-cyan/20">
          <Text className="text-black/60 font-bold text-xs tracking-widest mb-1">PRÓXIMA SESIÓN</Text>
          <Text className="text-black text-2xl font-black mb-4">CrossFit Training</Text>
          <View className="flex-row items-center bg-black/10 self-start px-3 py-1 rounded-full">
            <IconSymbol name="calendar" size={14} color="black" />
            <Text className="text-black font-bold ml-2 text-xs">HOY • 18:00 HRS</Text>
          </View>
        </View>

        {/* Sección de estadísticas rápidas */}
        <View className="flex-row justify-between mb-8">
          <View className="w-[48%] bg-impulse-gray border border-impulse-border rounded-3xl p-5">
            <Text className="text-impulse-cyan text-2xl font-black">12</Text>
            <Text className="text-gray-500 text-xs font-bold uppercase">Asistencias</Text>
          </View>
          <View className="w-[48%] bg-impulse-gray border border-impulse-border rounded-3xl p-5">
            <Text className="text-orange-500 text-2xl font-black">🔥 4</Text>
            <Text className="text-gray-500 text-xs font-bold uppercase">Racha Días</Text>
          </View>
        </View>

        {/* Botón de Acción Principal */}
        <TouchableOpacity 
          activeOpacity={0.9}
          className="bg-impulse-gray border-2 border-impulse-cyan py-5 rounded-2xl items-center shadow-2xl shadow-impulse-cyan/40"
        >
          <Text className="text-impulse-cyan font-black text-base tracking-[3px]">
            NUEVA RESERVA
          </Text>
        </TouchableOpacity>

        <View className="h-20" /> {/* Espaciador final */}
      </ScrollView>
    </View>
  );
}