import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [weekDays, setWeekDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Generar la semana real dinámicamente
  useEffect(() => {
    const days = [];
    const today = new Date();
    // Obtenemos el lunes de la semana actual
    const current = new Date(today);
    const dayOfWeek = current.getDay(); // 0 es domingo
    const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    current.setDate(diff);

    const labels = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    for (let i = 0; i < 6; i++) {
      days.push({
        label: labels[i],
        num: current.getDate(),
        fullDate: new Date(current)
      });
      current.setDate(current.getDate() + 1);
    }
    setWeekDays(days);
  }, []);

  return (
    <View className="flex-1 bg-impulse-dark">
      <ScrollView className="flex-1 px-5 pt-14" showsVerticalScrollIndicator={false}>
        
        {/* HEADER PREMIUM (Original) */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full border-2 border-impulse-cyan p-[2px] mr-3">
              <View className="flex-1 rounded-full bg-impulse-gray items-center justify-center overflow-hidden">
                <IconSymbol name="person.fill" size={20} color="#00E5FF" />
              </View>
            </View>
            <View>
              <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">Impulse Lab</Text>
              <Text className="text-white text-xl font-black">Hola, {user?.displayName?.split(' ')[0] || "Atleta"}</Text>
            </View>
          </View>
          <TouchableOpacity className="w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
            <IconSymbol name="bell.fill" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* SEGUIMIENTO DE FECHAS REALES */}
        <View className="flex-row justify-between mb-8">
          {weekDays.map((day, index) => {
            const isToday = day.num === selectedDay;
            return (
              <TouchableOpacity 
                key={index}
                onPress={() => setSelectedDay(day.num)}
                className={`items-center justify-center w-12 py-4 rounded-2xl border ${isToday ? 'bg-impulse-cyan border-impulse-cyan' : 'bg-white/5 border-white/5'}`}
              >
                <Text className={`text-[10px] font-black mb-1 ${isToday ? 'text-black' : 'text-gray-500'}`}>{day.label}</Text>
                <Text className={`text-lg font-black ${isToday ? 'text-black' : 'text-white'}`}>{day.num}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PRÓXIMA CLASE / TICKET (Foco Principal) */}
        <View className="bg-impulse-gray rounded-[40px] p-8 border border-white/5 mb-6 overflow-hidden">
          <View className="absolute -top-10 -right-10 w-40 h-40 bg-impulse-cyan/5 rounded-full" />
          
          <Text className="text-impulse-cyan text-[10px] font-black uppercase tracking-[4px] mb-4">Acceso Rápido</Text>
          <Text className="text-white text-3xl font-black mb-2">CrossFit</Text>
          <Text className="text-gray-400 font-bold mb-8">18:00 hrs • Coach David</Text>
          
          <TouchableOpacity 
            onPress={() => router.push("/(user)/ticket")}
            className="bg-impulse-cyan py-5 rounded-3xl flex-row justify-center items-center shadow-lg shadow-impulse-cyan/20"
          >
            <IconSymbol name="qrcode" size={22} color="#000" style={{marginRight: 10}} />
            <Text className="text-black font-black tracking-widest text-sm">GENERAR PASE</Text>
          </TouchableOpacity>
        </View>

        {/* STATS SIMPLES */}
        <View className="flex-row gap-4">
          <View className="flex-1 bg-white/5 p-6 rounded-[32px] border border-white/5">
            <Text className="text-gray-500 text-[10px] font-black tracking-widest mb-1">ASISTENCIAS</Text>
            <Text className="text-white text-3xl font-black">12</Text>
          </View>
          <View className="flex-1 bg-white/5 p-6 rounded-[32px] border border-white/5">
            <Text className="text-gray-500 text-[10px] font-black tracking-widest mb-1">RACHA</Text>
            <View className="flex-row items-center">
              <Text className="text-white text-3xl font-black mr-2">4</Text>
              <IconSymbol name="flame.fill" size={20} color="#FF9500" />
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}