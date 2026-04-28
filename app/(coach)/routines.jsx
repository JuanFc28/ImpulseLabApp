import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
        }, [user?.uid])
    );

    const fetchCoachRoutines = async () => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const data = await getRoutines({ coachId: user.uid });
            setRoutines(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching routines:", error);
            Alert.alert("Error", "No se pudieron cargar las rutinas.");
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
                            console.error("Error deleting routine:", error);
                            Alert.alert("Error", "No se pudo eliminar la rutina.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0B0F" }}>
            <View style={{ flex: 1, backgroundColor: "#0B0B0F", paddingHorizontal: 20, paddingTop: 24 }}>
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-1 pr-4">
                        <Text className="text-white text-3xl font-black tracking-tight">
                            Mis Rutinas
                        </Text>
                        <Text className="text-gray-500 font-medium mt-1">
                            Gestiona tus programas de entrenamiento
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push("/(coach)/create-routine")}
                        activeOpacity={0.85}
                        className="bg-[#FF9500] w-14 h-14 rounded-full items-center justify-center"
                    >
                        <IconSymbol name="plus" size={28} color="#000" />
                    </TouchableOpacity>
                </View>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#FF9500" />
                        <Text className="text-gray-500 mt-4 font-bold">Cargando rutinas...</Text>
                    </View>
                ) : routines.length === 0 ? (
                    <View className="flex-1 justify-center items-center pb-20">
                        <IconSymbol name="dumbbell.fill" size={64} color="#333" />
                        <Text className="text-white font-black text-xl mt-6">Sin Rutinas</Text>
                        <Text className="text-gray-500 text-center mt-2 px-10">
                            Aún no has creado ninguna rutina. Toca el botón + para empezar.
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    >
                        {routines.map((routine) => (
                            <View
                                key={routine.id}
                                className="bg-[#1C1C1E] p-5 rounded-3xl mb-4 border border-white/10"
                            >
                                <View className="flex-row justify-between items-start mb-2">
                                    <View className="flex-1 pr-3">
                                        <Text className="text-white text-xl font-black">
                                            {routine.title || "Rutina sin título"}
                                        </Text>

                                        {!!routine.subtitle && (
                                            <Text className="text-gray-400 font-bold text-xs mt-1">
                                                {routine.subtitle}
                                            </Text>
                                        )}

                                        {!routine.subtitle && !!routine.description && (
                                            <Text className="text-gray-400 font-bold text-xs mt-1">
                                                {routine.description}
                                            </Text>
                                        )}
                                    </View>

                                    {routine.isRecommended && (
                                        <View className="bg-orange-500/20 px-2 py-1 rounded-md border border-orange-500/30">
                                            <Text className="text-orange-400 text-[10px] font-bold">
                                                RECOMENDADO
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                <View className="flex-row flex-wrap gap-2 mt-3">
                                    <View className="bg-white/10 px-3 py-1.5 rounded-full">
                                        <Text className="text-gray-300 text-xs font-bold">
                                            {routine.bodyPart || "General"}
                                        </Text>
                                    </View>

                                    <View className="bg-white/10 px-3 py-1.5 rounded-full">
                                        <Text className="text-gray-300 text-xs font-bold">
                                            {routine.level || "Sin nivel"}
                                        </Text>
                                    </View>

                                    <View className="bg-white/10 px-3 py-1.5 rounded-full">
                                        <Text className="text-gray-300 text-xs font-bold">
                                            {routine.durationMinutes || 0} min
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between mt-5 pt-4 border-t border-white/10">
                                    <Text className="text-gray-500 text-xs font-bold">
                                        {Array.isArray(routine.exercises) ? routine.exercises.length : 0} Ejercicios
                                    </Text>

                                    <View className="flex-row gap-x-2">
                                        <TouchableOpacity
                                            onPress={() =>
                                                router.push({
                                                    pathname: "/(coach)/create-routine",
                                                    params: { routineId: routine.id },
                                                })
                                            }
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