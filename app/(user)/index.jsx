import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user } = useAuth();
  const firstName = user?.displayName ? user.displayName.split(' ')[0] : "Atleta";
  const router = useRouter();

  return (
    <View className="flex-1 bg-impulse-dark relative">
      <ScrollView
        className="flex-1 px-5 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-[180px]"
      >
        {/* HEADER PREMIUM */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full border-2 border-impulse-cyan p-[2px] mr-3">
              <View className="flex-1 rounded-full bg-impulse-gray items-center justify-center overflow-hidden">
                <IconSymbol name="person.fill" size={20} color="#00E5FF" />
              </View>
            </View>
            <View>
              <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">Impulse Lab</Text>
              <Text className="text-white text-2xl font-black tracking-tight">Hola, {firstName}</Text>
            </View>
          </View>
          <TouchableOpacity className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
            <IconSymbol name="bell.fill" size={20} color="#FFF" />
            <View className="absolute top-3 right-3 w-2.5 h-2.5 bg-impulse-cyan rounded-full border-2 border-impulse-dark" />
          </TouchableOpacity>
        </View>

        {/* CALENDARIO SCROLLABLE */}
        <View className="mb-8 -mx-5 px-5">
          <View className="flex-row justify-between items-end mb-4 px-5">
            <Text className="text-white text-lg font-black">Esta semana</Text>
            <TouchableOpacity>
              <Text className="text-impulse-cyan text-xs font-bold">Ver mes</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5">
            <View className="flex-row gap-3 pr-10">
              {/* Día Asistido */}
              <View className="w-16 h-20 rounded-3xl bg-white/5 border border-white/10 items-center justify-center">
                <Text className="text-gray-400 text-[10px] font-bold mb-1">LUN</Text>
                <Text className="text-white text-xl font-black mb-1">10</Text>
                <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </View>

              {/* Día Actual (Cyan Neón) */}
              <View className="w-16 h-20 rounded-3xl bg-impulse-cyan items-center justify-center">
                <Text className="text-impulse-dark text-[10px] font-black mb-1">MAR</Text>
                <Text className="text-impulse-dark text-xl font-black mb-1">11</Text>
                <View className="w-1.5 h-1.5 rounded-full bg-impulse-dark" />
              </View>

              {/* Días Futuros */}
              {[12, 13, 14, 15, 16].map((day, i) => (
                <View key={day} className="w-16 h-20 rounded-3xl bg-white/5 border border-white/10 items-center justify-center">
                  <Text className="text-gray-500 text-[10px] font-bold mb-1">
                    {['MIE', 'JUE', 'VIE', 'SAB', 'DOM'][i]}
                  </Text>
                  <Text className="text-gray-400 text-xl font-black mb-1">{day}</Text>
                  <View className="w-1.5 h-1.5 rounded-full bg-transparent" />
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* TARJETA HERO - PRÓXIMA CLASE */}
        <Text className="text-white text-lg font-black mb-4">Tu próxima sesión</Text>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/ticket")} // <--- AGREGAR ESTA LÍNEA
          className="relative bg-impulse-gray border border-white/10 rounded-[32px] p-6 mb-8 overflow-hidden"
        >

          <View className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-impulse-cyan/10" />
          <View className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full bg-impulse-cyan/5" />

          <View className="flex-row justify-between items-start mb-6">
            <View className="bg-impulse-cyan/20 px-3 py-1.5 rounded-full border border-impulse-cyan/30">
              <Text className="text-impulse-cyan text-xs font-bold">18:00 - 19:00</Text>
            </View>
            <View className="bg-white/10 w-10 h-10 rounded-full items-center justify-center">
              <IconSymbol name="chevron.right" size={20} color="#FFF" />
            </View>
          </View>

          <Text className="text-white text-3xl font-black mb-1">CrossFit</Text>
          <Text className="text-gray-400 text-sm font-medium mb-6">Coach: David</Text>

          <View className="flex-row items-center">
            <View className="flex-row">
              <View className="w-8 h-8 rounded-full bg-gray-600 border-2 border-impulse-gray z-30" />
              <View className="w-8 h-8 rounded-full bg-gray-500 border-2 border-impulse-gray -ml-3 z-20" />
              <View className="w-8 h-8 rounded-full bg-gray-400 border-2 border-impulse-gray -ml-3 z-10" />
            </View>
            <Text className="text-gray-400 text-xs font-bold ml-3">+12 atletas inscritos</Text>
          </View>
        </TouchableOpacity>

        {/* WOD CARD MEJORADA */}
        <View className="bg-[#111] border border-white/5 rounded-[32px] p-6 mb-8">
          <View className="flex-row justify-between items-center mb-6">
            <View className="flex-row items-center">
              <View className="bg-orange-500/20 w-10 h-10 rounded-2xl items-center justify-center mr-3">
                <IconSymbol name="flame.fill" size={20} color="#FF9500" />
              </View>
              <View>
                <Text className="text-gray-400 text-[10px] font-bold tracking-widest">WOD DEL DÍA</Text>
                <Text className="text-white text-lg font-black">"Power Cleans"</Text>
              </View>
            </View>
            <TouchableOpacity className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <Text className="text-white text-xs font-bold">Detalles</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-black/40 p-5 rounded-2xl border border-white/5">
            <View className="flex-row items-center mb-3">
              <View className="w-1.5 h-4 bg-impulse-cyan rounded-full mr-2" />
              <Text className="text-white font-bold text-sm">AMRAP 15 Minutos</Text>
            </View>
            <Text className="text-gray-400 text-xs leading-6 ml-3.5">
              • 10 Power Cleans (135/95 lbs){"\n"}
              • 15 Burpees over the bar{"\n"}
              • 200m Row
            </Text>
          </View>
        </View>

        {/* MÉTRICAS (Estructura de Textos separada) */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">ASISTENCIAS</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-3xl font-black">12</Text>
              <Text className="text-impulse-cyan text-lg">/mes</Text>
            </View>
          </View>

          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5 relative overflow-hidden">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">RACHA ACTUAL</Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-3xl font-black">4</Text>
              <Text className="text-orange-500 text-lg"> días</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BOTÓN FLOTANTE DE ACCIÓN (FAB) */}
      <View className="absolute bottom-28 left-6 right-6">
        <TouchableOpacity
          activeOpacity={0.9}
          className="bg-impulse-cyan flex-row items-center justify-center py-5 rounded-full"
        >
          <View className="bg-impulse-dark/10 p-1 rounded-full mr-2">
            <IconSymbol name="plus" size={16} color="#000" />
          </View>
          <Text className="text-impulse-dark font-black text-sm tracking-[2px]">
            RESERVAR CLASE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}