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
import { getRoutines } from "@/src/services/gymService";
import { useFocusEffect } from "@react-navigation/native";

const CATEGORIES = [
    "Todos",
    "Pecho y Hombros",
    "Espalda y Bíceps",
    "Pierna",
    "Full Body",
    "Core y Abs",
    "Cardio",
];

export default function UserRoutinesScreen() {
    const router = useRouter();

    const [routines, setRoutines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("Todos");

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const fetchData = async () => {
        setIsLoading(true);

        try {
            const data = await getRoutines();
            setRoutines(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching user routines:", error);
            Alert.alert("Error", "No se pudieron cargar las rutinas.");
        } finally {
            setIsLoading(false);
        }
    };

    const recommendedRoutine = routines.find((r) => r.isRecommended);

    const filteredRoutines = routines.filter((r) => {
        if (selectedCategory === "Todos") return !r.isRecommended;
        return r.bodyPart === selectedCategory;
    });

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0B0F" }}>
            <View style={{ flex: 1, backgroundColor: "#0B0B0F", paddingTop: 24 }}>
                <View className="px-5 mb-6">
                    <Text className="text-white text-3xl font-black tracking-tight">
                        Rutinas
                    </Text>
                    <Text className="text-gray-400 font-medium mt-1">
                        Sigue programas diseñados por expertos
                    </Text>
                </View>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#00E5FF" />
                        <Text className="text-gray-500 mt-4 font-bold">
                            Cargando rutinas...
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    >
                        {recommendedRoutine && selectedCategory === "Todos" && (
                            <View className="px-5 mb-8">
                                <Text className="text-white text-lg font-black mb-4 tracking-tight">
                                    Recomendado para ti
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(user)/routine-detail",
                                            params: { routineId: recommendedRoutine.id },
                                        })
                                    }
                                    activeOpacity={0.9}
                                    className="bg-[#1C1C1E] rounded-3xl overflow-hidden border border-white/10"
                                >
                                    <View className="p-6 relative">
                                        <View className="absolute top-0 right-0 p-6 opacity-10">
                                            <IconSymbol name="flame.fill" size={80} color="#00E5FF" />
                                        </View>

                                        <View className="bg-[#00E5FF]/20 self-start px-3 py-1.5 rounded-full mb-3 border border-[#00E5FF]/30">
                                            <Text className="text-[#00E5FF] text-[10px] font-black uppercase tracking-widest">
                                                DESTACADO
                                            </Text>
                                        </View>

                                        <Text className="text-white text-2xl font-black mb-1 w-3/4">
                                            {recommendedRoutine.title || "Rutina sin título"}
                                        </Text>

                                        {!!recommendedRoutine.subtitle && (
                                            <Text className="text-gray-400 font-bold text-sm mb-4">
                                                {recommendedRoutine.subtitle}
                                            </Text>
                                        )}

                                        {!recommendedRoutine.subtitle && !!recommendedRoutine.description && (
                                            <Text className="text-gray-400 font-bold text-sm mb-4">
                                                {recommendedRoutine.description}
                                            </Text>
                                        )}

                                        <View className="flex-row items-center gap-4 mt-2">
                                            <View className="flex-row items-center gap-1.5">
                                                <IconSymbol name="timer" size={14} color="#666" />
                                                <Text className="text-gray-300 text-xs font-bold">
                                                    {recommendedRoutine.durationMinutes || 0} min
                                                </Text>
                                            </View>

                                            <View className="flex-row items-center gap-1.5">
                                                <IconSymbol name="chart.bar.fill" size={14} color="#666" />
                                                <Text className="text-gray-300 text-xs font-bold">
                                                    {recommendedRoutine.level || "Sin nivel"}
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="mt-5 flex-row items-center justify-between border-t border-white/10 pt-4">
                                            <View className="flex-row items-center">
                                                <View className="w-8 h-8 rounded-full bg-white/10 mr-3 items-center justify-center">
                                                    <Text className="text-white font-bold">
                                                        {recommendedRoutine.coachName?.charAt(0) || "C"}
                                                    </Text>
                                                </View>

                                                <Text className="text-gray-400 font-medium text-xs">
                                                    Por {recommendedRoutine.coachName || "Coach"}
                                                </Text>
                                            </View>

                                            <View className="bg-[#00E5FF] w-8 h-8 rounded-full items-center justify-center">
                                                <IconSymbol name="chevron.right" size={16} color="#000" />
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View className="mb-6">
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 20 }}
                            >
                                {CATEGORIES.map((cat) => {
                                    const isSelected = selectedCategory === cat;

                                    return (
                                        <TouchableOpacity
                                            key={cat}
                                            onPress={() => setSelectedCategory(cat)}
                                            className={`mr-3 px-5 py-2.5 rounded-full border ${
                                                isSelected
                                                    ? "bg-[#00E5FF]/20 border-[#00E5FF]/50"
                                                    : "bg-[#1C1C1E] border-white/10"
                                            }`}
                                        >
                                            <Text
                                                className={`font-black tracking-wide text-xs ${
                                                    isSelected ? "text-[#00E5FF]" : "text-gray-400"
                                                }`}
                                            >
                                                {cat.toUpperCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <View className="px-5">
                            <Text className="text-white text-lg font-black mb-4 tracking-tight">
                                {selectedCategory === "Todos"
                                    ? "Todas las Rutinas"
                                    : `Rutinas de ${selectedCategory}`}
                            </Text>

                            {filteredRoutines.length === 0 ? (
                                <View className="bg-[#1C1C1E] p-8 rounded-3xl border border-white/10 items-center justify-center mt-2">
                                    <IconSymbol name="list.bullet" size={40} color="#444" />
                                    <Text className="text-gray-500 font-bold mt-4 text-center">
                                        No hay rutinas disponibles en esta categoría.
                                    </Text>
                                </View>
                            ) : (
                                filteredRoutines.map((routine) => (
                                    <TouchableOpacity
                                        key={routine.id}
                                        onPress={() =>
                                            router.push({
                                                pathname: "/(user)/routine-detail",
                                                params: { routineId: routine.id },
                                            })
                                        }
                                        activeOpacity={0.8}
                                        className="bg-[#1C1C1E] p-4 rounded-3xl mb-4 border border-white/10 flex-row items-center"
                                    >
                                        <View className="w-16 h-16 rounded-2xl bg-white/5 items-center justify-center mr-4">
                                            <IconSymbol name="dumbbell.fill" size={24} color="#666" />
                                        </View>

                                        <View className="flex-1">
                                            <Text className="text-white font-black text-lg" numberOfLines={1}>
                                                {routine.title || "Rutina sin título"}
                                            </Text>

                                            <Text className="text-gray-400 font-medium text-xs mt-0.5">
                                                {routine.bodyPart || "General"} • {routine.level || "Sin nivel"}
                                            </Text>

                                            <View className="flex-row items-center mt-2">
                                                <IconSymbol name="timer" size={12} color="#666" />
                                                <Text className="text-gray-500 text-[10px] font-bold ml-1">
                                                    {routine.durationMinutes || 0} MIN
                                                </Text>
                                            </View>
                                        </View>

                                        <IconSymbol name="chevron.right" size={20} color="#444" />
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}