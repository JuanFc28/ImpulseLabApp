import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { getRoutines, deleteRoutine } from "@/src/services/gymService";
import { useFocusEffect } from "@react-navigation/native";

export default function CoachRoutinesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchCoachRoutines();
    }, [user])
  );

  const fetchCoachRoutines = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getRoutines({ coachId: user.uid });
      setRoutines(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (routine) => {
    Alert.alert(
      "Eliminar Rutina",
      `¿Estás seguro de que quieres eliminar "${routine.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoutine(routine.id);
              fetchCoachRoutines();
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-impulse-dark">
      <View className="flex-1 px-5 pt-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-3xl font-black tracking-tight">Mis Rutinas</Text>
            <Text className="text-gray-500 font-medium mt-1">Gestiona tus programas de entrenamiento</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => router.push("/(coach)/create-routine")}
            className="bg-[#FF9500] w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-orange-500/20"
          >
            <IconSymbol name="plus" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF9500" />
          </View>
        ) : routines.length === 0 ? (
          <View className="flex-1 justify-center items-center pb-20">
            <IconSymbol name="dumbbell.fill" size={60} color="#333" />
            <Text className="text-white font-black text-xl mt-6">Sin Rutinas</Text>
            <Text className="text-gray-500 text-center mt-2 px-10">Aún no has creado ninguna rutina. Toca el botón + para empezar.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {routines.map(routine => (
              <View key={routine.id} className="bg-[#1C1C1E] p-5 rounded-3xl mb-4 border border-white/5">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-white text-xl font-black">{routine.title}</Text>
                    {routine.subtitle && <Text className="text-gray-400 font-bold text-xs mt-1">{routine.subtitle}</Text>}
                  </View>
                  {routine.isRecommended && (
                    <View className="bg-orange-500/20 px-2 py-1 rounded-md border border-orange-500/30">
                      <Text className="text-orange-400 text-[10px] font-bold">RECOMENDADO</Text>
                    </View>
                  )}
                </View>
                
                <View className="flex-row flex-wrap gap-2 mt-3">
                  <View className="bg-white/10 px-3 py-1.5 rounded-full">
                    <Text className="text-gray-300 text-xs font-bold">{routine.bodyPart}</Text>
                  </View>
                  <View className="bg-white/10 px-3 py-1.5 rounded-full">
                    <Text className="text-gray-300 text-xs font-bold">{routine.level}</Text>
                  </View>
                  <View className="bg-white/10 px-3 py-1.5 rounded-full">
                    <Text className="text-gray-300 text-xs font-bold">{routine.durationMinutes} min</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-white/5">
                  <Text className="text-gray-500 text-xs font-bold">
                    {routine.exercises?.length || 0} Ejercicios
                  </Text>
                  <View className="flex-row gap-x-2">
                    <TouchableOpacity 
                      onPress={() => router.push({ pathname: "/(coach)/create-routine", params: { routineId: routine.id } })}
                      className="bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20"
                    >
                      <Text className="text-blue-500 font-bold text-xs">EDITAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDelete(routine)}
                      className="bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20"
                    >
                      <Text className="text-red-500 font-bold text-xs">ELIMINAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
