import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, Alert } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { markRoutineCompleted } from "@/src/services/gymService";

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { routineId } = useLocalSearchParams();
  
  const [routine, setRoutine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    if (routineId) {
      fetchRoutine();
    }
  }, [routineId]);

  const fetchRoutine = async () => {
    try {
      const docRef = doc(db, "routines", routineId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setRoutine({ id: snap.id, ...snap.data() });
      } else {
        Alert.alert("Error", "La rutina no existe.");
        router.back();
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo cargar la rutina.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    Alert.alert(
      "Completar Rutina",
      "¿Has terminado este entrenamiento?",
      [
        { text: "Aún no", style: "cancel" },
        {
          text: "Sí, terminar",
          onPress: async () => {
            setIsCompleting(true);
            try {
              await markRoutineCompleted(user.uid, routine);
              Alert.alert("¡Felicidades!", "Has completado la rutina y se ha sumado a tu progreso.", [
                { text: "Genial", onPress: () => router.back() }
              ]);
            } catch (error) {
              Alert.alert("Error", "Hubo un problema al guardar tu progreso.");
            } finally {
              setIsCompleting(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading || !routine) {
    return (
      <View className="flex-1 bg-impulse-dark justify-center items-center">
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-impulse-dark">
      <View className="px-5 pt-4 pb-4 flex-row items-center border-b border-white/5">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-4"
        >
          <IconSymbol name="chevron.left" size={20} color="#FFF" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-black" numberOfLines={1}>{routine.title}</Text>
          <Text className="text-gray-400 font-bold text-xs" numberOfLines={1}>{routine.coachName}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HEADER INFO */}
        <View className="p-6 bg-[#1C1C1E] border-b border-white/5 mb-6">
          {routine.subtitle && <Text className="text-gray-300 font-medium mb-4">{routine.subtitle}</Text>}
          
          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Text className="text-gray-300 text-xs font-bold uppercase">{routine.bodyPart}</Text>
            </View>
            <View className="bg-[#00E5FF]/10 px-3 py-1.5 rounded-full border border-[#00E5FF]/30">
              <Text className="text-[#00E5FF] text-xs font-bold uppercase">{routine.level}</Text>
            </View>
            <View className="bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex-row items-center">
              <IconSymbol name="timer" size={12} color="#999" />
              <Text className="text-gray-300 text-xs font-bold ml-1">{routine.durationMinutes} MIN</Text>
            </View>
            <View className="bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Text className="text-gray-300 text-xs font-bold uppercase">Obj: {routine.goal}</Text>
            </View>
          </View>
        </View>

        {/* EXERCISES */}
        <View className="px-5">
          <Text className="text-white text-xl font-black tracking-tight mb-4">Ejercicios</Text>
          
          {(!routine.exercises || routine.exercises.length === 0) ? (
            <View className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 items-center">
               <Text className="text-gray-500 font-bold">No hay ejercicios detallados para esta rutina.</Text>
            </View>
          ) : (
            routine.exercises.map((ex, idx) => (
              <View key={idx} className="bg-[#1C1C1E] p-5 rounded-3xl mb-4 border border-white/5">
                <View className="flex-row items-start">
                  <View className="bg-white/10 w-8 h-8 rounded-full items-center justify-center mr-3 mt-1">
                    <Text className="text-white font-black text-xs">{idx + 1}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-black text-lg">{ex.name}</Text>
                    
                    <View className="flex-row mt-3 bg-black/40 rounded-2xl p-3 border border-white/5">
                      <View className="flex-1 items-center border-r border-white/10">
                        <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1">Series</Text>
                        <Text className="text-[#00E5FF] font-black text-lg">{ex.sets}</Text>
                      </View>
                      <View className="flex-1 items-center border-r border-white/10">
                        <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1">Reps</Text>
                        <Text className="text-[#00E5FF] font-black text-lg">{ex.reps}</Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text className="text-gray-500 text-[10px] font-bold uppercase mb-1">Descanso</Text>
                        <Text className="text-white font-black text-lg">{ex.restSeconds ? `${ex.restSeconds}s` : '--'}</Text>
                      </View>
                    </View>

                    {ex.notes ? (
                      <View className="mt-3 bg-[#00E5FF]/5 p-3 rounded-xl border border-[#00E5FF]/10">
                        <Text className="text-gray-300 text-xs italic">{ex.notes}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* FIXED BOTTOM ACTION */}
      <View className="absolute bottom-0 left-0 right-0 p-5 bg-impulse-dark/90 backdrop-blur-xl border-t border-white/5 pt-4">
        <TouchableOpacity 
          onPress={handleComplete}
          disabled={isCompleting}
          className={`w-full py-5 rounded-3xl items-center shadow-lg shadow-[#00E5FF]/20 flex-row justify-center ${isCompleting ? 'bg-[#00E5FF]/50' : 'bg-[#00E5FF]'}`}
        >
          {isCompleting ? (
             <ActivityIndicator color="#000" />
          ) : (
             <>
                <IconSymbol name="checkmark" size={20} color="#000" />
                <Text className="text-black font-black tracking-widest ml-2 text-lg">MARCAR COMO COMPLETADA</Text>
             </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
