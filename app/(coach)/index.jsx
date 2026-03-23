import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function CoachHomeScreen() {
  const { user } = useAuth();
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : "Coach";
  const router = useRouter();

  // Mock de atletas inscritos en su próxima clase
  const enrolledAthletes = [
    { id: 1, name: "Roberto M.", status: "confirmado" },
    { id: 2, name: "Ana P.", status: "confirmado" },
    { id: 3, name: "Luis G.", status: "pendiente" },
    { id: 4, name: "Carlos R.", status: "confirmado" },
  ];

  return (
    <View className="flex-1 bg-impulse-dark relative">
      <ScrollView
        className="flex-1 px-5 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-[120px]"
      >
        {/* HEADER MODO COACH */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full border-2 border-orange-500 p-[2px] mr-3">
              <View className="flex-1 rounded-full bg-impulse-gray items-center justify-center overflow-hidden">
                <IconSymbol name="person.fill" size={20} color="#FF9500" />
              </View>
            </View>
            <View>
              <View className="flex-row items-center mb-0.5">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">Modo Coach</Text>
              </View>
              <Text className="text-white text-2xl font-black tracking-tight">Hola, {firstName}</Text>
            </View>
          </View>
          <TouchableOpacity className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
            <IconSymbol name="bell.fill" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* MÉTRICAS DEL DÍA PARA EL COACH */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-impulse-gray border border-white/5 rounded-3xl p-5 relative overflow-hidden">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">CLASES HOY</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-3xl font-black">3</Text>
              <Text className="text-gray-500 text-sm ml-1">/ 4</Text>
            </View>
          </View>

          <View className="flex-1 bg-impulse-gray border border-white/5 rounded-3xl p-5 relative overflow-hidden">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">ASISTENCIA TOTAL</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-3xl font-black">42</Text>
              <Text className="text-impulse-cyan text-sm ml-1"> atletas</Text>
            </View>
          </View>
        </View>

        {/* CLASE A IMPARTIR (HERO) */}
        <View className="flex-row justify-between items-end mb-4">
          <Text className="text-white text-lg font-black">Tu próxima clase</Text>
          <Text className="text-impulse-cyan text-xs font-bold">18:00 hrs</Text>
        </View>

        <View className="bg-impulse-cyan rounded-[32px] p-6 mb-8 shadow-xl shadow-impulse-cyan/20">
          <View className="flex-row justify-between items-start mb-4">
            <View className="bg-black/10 px-3 py-1.5 rounded-full border border-black/10">
              <Text className="text-black text-xs font-bold">CrossFit</Text>
            </View>
            <TouchableOpacity className="bg-black/10 w-10 h-10 rounded-full items-center justify-center">
              <IconSymbol name="pencil" size={18} color="#000" />
            </TouchableOpacity>
          </View>

          <Text className="text-black text-3xl font-black mb-1">"Power Cleans"</Text>
          <Text className="text-black/70 text-sm font-bold mb-6">WOD configurado correctamente</Text>
        </View>

        {/* LISTA DE ASISTENCIA RÁPIDA */}
        <View className="bg-[#111] border border-white/5 rounded-[32px] p-6 mb-8">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <IconSymbol name="person.3.fill" size={20} color="#FFF" />
              <Text className="text-white text-lg font-black ml-3">Atletas Inscritos</Text>
            </View>
            <View className="bg-white/10 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">{enrolledAthletes.length}/15</Text>
            </View>
          </View>

          {/* Mapeo de Atletas */}
          {enrolledAthletes.map((atleta, index) => (
            <View
              key={atleta.id}
              className={`flex-row justify-between items-center py-3 ${index !== enrolledAthletes.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-3">
                  <Text className="text-white font-bold">{atleta.name.charAt(0)}</Text>
                </View>
                <Text className="text-white font-bold text-base">{atleta.name}</Text>
              </View>

              {/* Status Indicator */}
              <View className={`w-3 h-3 rounded-full ${atleta.status === 'confirmado' ? 'bg-green-500' : 'bg-orange-500'}`} />
            </View>
          ))}

          <TouchableOpacity className="mt-4 pt-4 border-t border-white/10 items-center">
            <Text className="text-impulse-cyan font-bold text-sm">Ver lista completa</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* BOTÓN FLOTANTE: PASAR LISTA */}
      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/scanner")} // <--- AGREGAR ESTA LÍNEA
          className="bg-white flex-row items-center justify-center py-5 rounded-full shadow-2xl shadow-white/20"
        >
          <View className="bg-black/5 p-1 rounded-full mr-2">
            <IconSymbol name="checkmark.circle.fill" size={18} color="#000" />
          </View>
          <Text className="text-impulse-dark font-black text-sm tracking-[2px]">
            PASAR LISTA AHORA
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}