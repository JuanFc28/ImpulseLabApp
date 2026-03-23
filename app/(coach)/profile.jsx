import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "../../src/context/AuthContext";

export default function CoachProfileScreen() {
  const { user, logout } = useAuth();
  const coachName = user?.displayName || "Coach";

  return (
    <View className="flex-1 bg-impulse-dark">
      <ScrollView 
        className="flex-1 px-5 pt-16"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32"
      >
        {/* HEADER DE PERFIL */}
        <View className="items-center mb-10 mt-4">
          <View className="w-28 h-28 rounded-full border-4 border-orange-500 p-1 mb-4 shadow-xl shadow-orange-500/20">
            <View className="flex-1 rounded-full bg-white/10 items-center justify-center overflow-hidden">
               <IconSymbol name="person.crop.circle" size={60} color="#FF9500" />
            </View>
          </View>
          <Text className="text-white text-3xl font-black">{coachName}</Text>
          <Text className="text-gray-400 text-xs font-bold tracking-[3px] uppercase mt-1">Head Coach</Text>
        </View>

        {/* ESTADÍSTICAS DEL MES */}
        <View className="flex-row gap-4 mb-10">
          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 items-center">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-2">CLASES MES</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-3xl font-black">48</Text>
            </View>
          </View>

          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 items-center">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-2">RATING AVG</Text>
            <View className="flex-row items-center">
               <Text className="text-white text-3xl font-black mr-1">4.9</Text>
               <IconSymbol name="star.fill" size={16} color="#FF9500" />
            </View>
          </View>
        </View>

        {/* MENÚ DE AJUSTES */}
        <Text className="text-white text-lg font-black mb-4">Ajustes de Cuenta</Text>
        <View className="bg-[#111] border border-white/5 rounded-[32px] p-4 mb-8">
          
          <TouchableOpacity className="flex-row items-center p-3 border-b border-white/5">
            <View className="bg-white/5 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <IconSymbol name="person.fill" size={18} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold">Editar Perfil</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-3 border-b border-white/5">
            <View className="bg-white/5 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <IconSymbol name="calendar" size={18} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold">Disponibilidad</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-3">
            <View className="bg-white/5 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <IconSymbol name="bell.fill" size={18} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold">Notificaciones</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* BOTÓN DE CERRAR SESIÓN */}
        <TouchableOpacity 
          onPress={logout}
          activeOpacity={0.8}
          className="bg-red-500/10 border-2 border-red-500/30 py-5 rounded-2xl flex-row justify-center items-center mb-8"
        >
          <IconSymbol name="arrow.right.square.fill" size={20} color="#EF4444" />
          <Text className="text-red-500 font-black text-base tracking-widest ml-3">
            CERRAR SESIÓN
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}