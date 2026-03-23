import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ExploreScreen() {
  const [activeFilter, setActiveFilter] = useState("CrossFit");
  const [selectedDay, setSelectedDay] = useState(11); // Simulamos que hoy es 11

  const filters = ["Todos", "CrossFit", "Fuerza", "Endurance"];
  
  const weekDays = [
    { day: 'LUN', num: 10 },
    { day: 'MAR', num: 11 },
    { day: 'MIE', num: 12 },
    { day: 'JUE', num: 13 },
    { day: 'VIE', num: 14 },
    { day: 'SAB', num: 15 },
  ];

  const classesMock = [
    { id: 1, time: "07:00", ampm: "AM", name: "CrossFit", coach: "David", spots: 2, color: "bg-impulse-cyan", textColor: "text-impulse-cyan" },
    { id: 2, time: "08:30", ampm: "AM", name: "Fuerza", coach: "Pako", spots: 5, color: "bg-orange-500", textColor: "text-orange-500" },
    { id: 3, time: "18:00", ampm: "PM", name: "CrossFit", coach: "David", spots: 0, color: "bg-impulse-cyan", textColor: "text-impulse-cyan" },
  ];

  return (
    <View className="flex-1 bg-impulse-dark">
      {/* HEADER FIJO */}
      <View className="px-5 pt-16 pb-4 bg-impulse-dark/90 z-10">
        <Text className="text-white text-3xl font-black tracking-tight mb-1">Horarios</Text>
        <View className="flex-row items-center">
          <IconSymbol name="calendar" size={14} color="#888" />
          <Text className="text-gray-400 text-xs font-bold ml-2 uppercase tracking-widest">
            Marzo 2026
          </Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 pt-2"
      >
        {/* SELECTOR DE DÍAS HORIZONTAL */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mb-6 px-5"
        >
          <View className="flex-row gap-3 pr-10">
            {weekDays.map((item) => {
              const isSelected = item.num === selectedDay;
              return (
                <TouchableOpacity 
                  key={item.num}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDay(item.num)}
                  className={`w-14 h-20 rounded-full items-center justify-center border ${
                    isSelected 
                      ? "bg-impulse-cyan border-impulse-cyan" 
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Text className={`text-[10px] font-black mb-1 ${isSelected ? "text-impulse-dark" : "text-gray-500"}`}>
                    {item.day}
                  </Text>
                  <Text className={`text-xl font-black ${isSelected ? "text-impulse-dark" : "text-white"}`}>
                    {item.num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* FILTROS (PÍLDORAS) */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mb-8 px-5"
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
                      ? "bg-white/10 border-white/20" 
                      : "bg-transparent border-white/5"
                  }`}
                >
                  <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-gray-500"}`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* LISTA DE CLASES (TIMELINE) */}
        <View className="px-5">
          {classesMock.map((cls, index) => (
            <View key={cls.id} className="flex-row mb-6">
              
              {/* Columna de Hora (Izquierda) */}
              <View className="w-16 items-center mr-4">
                <Text className="text-white text-lg font-black">{cls.time}</Text>
                <Text className="text-gray-500 text-[10px] font-bold mb-2">{cls.ampm}</Text>
                {/* Línea conectora visual (se oculta en el último elemento) */}
                {index !== classesMock.length - 1 && (
                  <View className="flex-1 w-[2px] bg-white/10 rounded-full" />
                )}
              </View>

              {/* Tarjeta de la Clase */}
              <View className="flex-1 bg-impulse-gray border border-white/5 rounded-3xl p-5 relative overflow-hidden">
                {/* Acento de color lateral */}
                <View className={`absolute left-0 top-0 bottom-0 w-1.5 ${cls.color}`} />

                <View className="flex-row justify-between items-start mb-4 ml-2">
                  <View>
                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                      Coach {cls.coach}
                    </Text>
                    <Text className="text-white text-xl font-black">{cls.name}</Text>
                  </View>
                  <View className="bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                    <Text className="text-gray-300 text-[10px] font-bold">60 min</Text>
                  </View>
                </View>

                {/* Área de Reserva */}
                <View className="flex-row items-center justify-between ml-2 mt-2">
                  <View className="flex-row items-center">
                    <IconSymbol name="person.fill" size={14} color={cls.spots > 0 ? "#FFF" : "#EF4444"} />
                    <Text className={`text-xs font-bold ml-1.5 ${cls.spots > 0 ? "text-gray-300" : "text-red-500"}`}>
                      {cls.spots > 0 ? `Quedan ${cls.spots} lugares` : "Lista de espera"}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    activeOpacity={0.8}
                    className={`px-5 py-2.5 rounded-xl ${cls.spots > 0 ? cls.color : "bg-white/10"}`}
                  >
                    <Text className={`text-xs font-black ${cls.spots > 0 ? "text-impulse-dark" : "text-gray-400"}`}>
                      {cls.spots > 0 ? "RESERVAR" : "UNIRSE"}
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}