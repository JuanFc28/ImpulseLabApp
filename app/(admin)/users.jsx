import React, { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function AdminUsersScreen() {
  const [activeFilter, setActiveFilter] = useState("Todos");

  // Mock de base de datos mixta (Atletas y Coaches)
  const usersList = [
    { id: 1, name: "David (Tú)", role: "admin", status: "activo" },
    { id: 2, name: "Pako", role: "coach", status: "activo" },
    { id: 3, name: "Roberto M.", role: "user", status: "activo" },
    { id: 4, name: "Ana Paula", role: "user", status: "inactivo" },
    { id: 5, name: "Omar", role: "coach", status: "activo" },
    { id: 6, name: "Luis García", role: "user", status: "activo" },
  ];

  const filters = ["Todos", "Atletas", "Coaches", "Inactivos"];

  return (
    <View className="flex-1 bg-impulse-dark relative">
      <View className="px-5 pt-16 pb-4 bg-impulse-dark/90 z-10">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-3xl font-black tracking-tight">Usuarios</Text>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center border border-emerald-500/30">
            <IconSymbol name="plus" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>
        
        {/* BARRA DE BÚSQUEDA */}
        <View className="flex-row items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
          <IconSymbol name="magnifyingglass" size={20} color="#888" />
          <TextInput 
            placeholder="Buscar por nombre, correo o rol..."
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
                      ? "bg-emerald-500/20 border-emerald-500/50" 
                      : "bg-transparent border-white/5"
                  }`}
                >
                  <Text className={`text-xs font-bold ${isActive ? "text-emerald-500" : "text-gray-500"}`}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* LISTA MAESTRA DE USUARIOS */}
        <View className="px-5">
          <Text className="text-white text-lg font-black mb-4">Base de Datos ({usersList.length})</Text>
          
          {usersList.map((user) => (
            <TouchableOpacity 
              key={user.id} 
              activeOpacity={0.7}
              className="flex-row items-center bg-impulse-gray border border-white/5 rounded-3xl p-4 mb-3"
            >
              {/* Avatar con Color Dinámico según Rol */}
              <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 relative ${
                user.role === 'admin' ? 'bg-emerald-500/20' : 
                user.role === 'coach' ? 'bg-orange-500/20' : 'bg-white/5'
              }`}>
                {user.role === 'admin' ? (
                  <IconSymbol name="shield.fill" size={20} color="#10B981" />
                ) : user.role === 'coach' ? (
                  <IconSymbol name="person.fill" size={20} color="#FF9500" />
                ) : (
                  <Text className="text-white font-black text-lg">{user.name.charAt(0)}</Text>
                )}
                {/* Indicador de Status */}
                <View className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-impulse-gray ${user.status === 'activo' ? 'bg-green-500' : 'bg-red-500'}`} />
              </View>

              {/* Info principal */}
              <View className="flex-1">
                <Text className="text-white font-black text-base">{user.name}</Text>
                <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                  ROL: {user.role}
                </Text>
              </View>

              {/* Botón de Acciones (Tres puntos) */}
              <View className="bg-white/5 w-8 h-8 rounded-full items-center justify-center">
                <IconSymbol name="ellipsis" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}