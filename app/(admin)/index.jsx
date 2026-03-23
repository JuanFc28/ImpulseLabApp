import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";

export default function AdminDashboardScreen() {
  const { user } = useAuth();
  // Asumimos que el admin principal es el dueño
  const adminName = user?.displayName ? user.displayName.split(' ')[0] : "David";
  const router = useRouter();

  return (
    <View className="flex-1 bg-impulse-dark relative">
      <ScrollView
        className="flex-1 px-5 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-[100px]"
      >
        {/* HEADER MODO ADMIN */}
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full border-2 border-emerald-500 p-[2px] mr-3">
              <View className="flex-1 rounded-full bg-impulse-gray items-center justify-center overflow-hidden">
                <IconSymbol name="shield.fill" size={20} color="#10B981" />
              </View>
            </View>
            <View>
              <View className="flex-row items-center mb-0.5">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 shadow-lg shadow-emerald-500/50" />
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">Admin Access</Text>
              </View>
              <Text className="text-white text-2xl font-black tracking-tight">Hola, {adminName}</Text>
            </View>
          </View>
          <TouchableOpacity className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
            <IconSymbol name="gearshape.fill" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* MÉTRICA PRINCIPAL: INGRESOS DEL MES */}
        <View className="bg-emerald-500 rounded-[32px] p-6 mb-6 shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
          <View className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-emerald-950 text-xs font-black tracking-widest uppercase">Ingresos Marzo</Text>
            <View className="bg-white/20 px-2 py-1 rounded-full">
              <Text className="text-emerald-950 text-[10px] font-bold">+15% vs mes ant.</Text>
            </View>
          </View>

          <Text className="text-emerald-950 text-4xl font-black mb-4">$42,500<Text className="text-xl"> MXN</Text></Text>

          <View className="flex-row gap-2">
            <TouchableOpacity className="bg-emerald-950/10 px-4 py-2 rounded-full border border-emerald-950/20">
              <Text className="text-emerald-950 text-xs font-bold">Ver Reporte</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-emerald-950/10 px-4 py-2 rounded-full border border-emerald-950/20">
              <Text className="text-emerald-950 text-xs font-bold">Cobrar Membresía</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* KPIs (Key Performance Indicators) */}
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5">
            <View className="bg-impulse-cyan/20 w-8 h-8 rounded-full items-center justify-center mb-3">
              <IconSymbol name="person.3.fill" size={14} color="#00E5FF" />
            </View>
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">ACTIVOS</Text>
            <Text className="text-white text-2xl font-black">128</Text>
          </View>

          <View className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-5">
            <View className="bg-orange-500/20 w-8 h-8 rounded-full items-center justify-center mb-3">
              <IconSymbol name="plus" size={14} color="#FF9500" />
            </View>
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">NUEVOS</Text>
            <Text className="text-white text-2xl font-black">12<Text className="text-gray-500 text-sm font-medium"> /este mes</Text></Text>
          </View>
        </View>

        {/* ACCIONES RÁPIDAS ADMINISTRATIVAS */}
        <Text className="text-white text-lg font-black mb-4">Gestión Rápida</Text>
        <View className="bg-[#111] border border-white/5 rounded-[32px] p-4 mb-8">
          <TouchableOpacity
            onPress={() => router.push("/(admin)/classes")} // Navega a la gestión de clases
            className="flex-row items-center p-3 border-b border-white/5"
          >
            <View className="bg-white/5 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <IconSymbol name="calendar" size={18} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold">Modificar Horarios</Text>
              <Text className="text-gray-500 text-xs">Agregar o quitar clases</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-3 border-b border-white/5">
            <View className="bg-white/5 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <IconSymbol name="megaphone.fill" size={18} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold">Enviar Anuncio</Text>
              <Text className="text-gray-500 text-xs">Notificar a todos los atletas</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-3">
            <View className="bg-white/5 w-10 h-10 rounded-xl items-center justify-center mr-4">
              <IconSymbol name="person.badge.plus" size={18} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold">Nuevo Atleta/Coach</Text>
              <Text className="text-gray-500 text-xs">Registro manual al sistema</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color="#666" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}