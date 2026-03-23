import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function AthletesScreen() {
  const [activeFilter, setActiveFilter] = useState("Activos");

  // Mock de datos de los atletas del gimnasio
  const athletesList = [
    { id: 1, name: "Roberto M.", plan: "Ilimitado", streak: 4, active: true },
    { id: 2, name: "Ana Paula", plan: "3x Semana", streak: 12, active: true },
    { id: 3, name: "Luis García", plan: "Ilimitado", streak: 0, active: false },
    { id: 4, name: "Carlos R.", plan: "Drop-in", streak: 1, active: true },
    { id: 5, name: "Sofía T.", plan: "Ilimitado", streak: 8, active: true },
  ];

  const filters = ["Todos", "Activos", "Inactivos", "Nuevos"];

  return (
    <View className="flex-1 bg-impulse-dark relative">
      <View className="px-5 pt-16 pb-4 bg-impulse-dark/90 z-10">
        <Text className="text-white text-3xl font-black tracking-tight mb-4">Atletas</Text>
        
        {/* BARRA DE BÚSQUEDA */}
        <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <IconSymbol name="magnifyingglass" size={20} color="#888" />
          <TextInput 
            placeholder="Buscar por nombre..."
            placeholderTextColor="#888"
            className="flex-1 text-white ml-3 font-medium"
            keyboardAppearance="dark"
          />
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 pt-2"
      >
        {/* FILTROS RÁPIDOS */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mb-6 px-5"
        >
          <View className="flex-row gap-2 pr-10">
            {filters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  className={`px-5 py-2.5 rounded-full border ${
                    isActive 
                      ? "bg-orange-500/20 border-orange-500/50" 
                      : "bg-transparent border-white/5"
                  }`}
                >
                  <Text className={`text-xs font-bold ${isActive ? "text-orange-500" : "text-gray-500"}`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* LISTA DE ATLETAS */}
        <View className="px-5">
          <Text className="text-white text-lg font-black mb-4">Directorio ({athletesList.length})</Text>
          
          {athletesList.map((athlete) => (
            <TouchableOpacity 
              key={athlete.id} 
              activeOpacity={0.7}
              className="flex-row items-center bg-impulse-gray border border-white/5 rounded-3xl p-4 mb-3"
            >
              {/* Avatar */}
              <View className="w-12 h-12 rounded-full bg-white/5 items-center justify-center mr-4 relative">
                <Text className="text-white font-black text-lg">{athlete.name.charAt(0)}</Text>
                {/* Indicador de Status */}
                <View className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-impulse-gray ${athlete.active ? 'bg-green-500' : 'bg-red-500'}`} />
              </View>

              {/* Info principal */}
              <View className="flex-1">
                <Text className="text-white font-black text-base">{athlete.name}</Text>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{athlete.plan}</Text>
              </View>

              {/* Racha (Streak) */}
              <View className="items-end">
                <View className="flex-row items-center bg-orange-500/10 px-2 py-1 rounded-lg">
                  <IconSymbol name="flame.fill" size={12} color="#FF9500" />
                  <Text className="text-orange-500 font-black text-xs ml-1">{athlete.streak}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}