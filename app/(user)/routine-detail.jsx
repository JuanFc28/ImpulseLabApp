import React, { useState, useEffect } from "react";
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
        if (routineId) fetchRoutine();
    }, [routineId]);

    const fetchRoutine = async () => {
        setIsLoading(true);
        try {
            const docRef = doc(db, "routines", routineId);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                setRoutine({ id: snap.id, ...snap.data() });
            } else {
                Alert.alert("Error", "La rutina no existe.");
                router.back();
            }
        } catch (error) {
            console.error("Error fetching routine detail:", error);
            Alert.alert("Error", "No se pudo cargar la rutina.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!user?.uid || !routine) {
            Alert.alert("Error", "No se pudo identificar.");
            return;
        }

        Alert.alert("Completar Rutina", "¿Terminaste el entrenamiento?", [
            { text: "Aún no", style: "cancel" },
            {
                text: "Sí",
                onPress: async () => {
                    setIsCompleting(true);
                    try {
                        await markRoutineCompleted(user.uid, routine);
                        Alert.alert("🔥 Excelente", "Rutina completada", [
                            { text: "OK", onPress: () => router.back() },
                        ]);
                    } catch (error) {
                        console.error(error);
                        Alert.alert("Error", "No se pudo guardar.");
                    } finally {
                        setIsCompleting(false);
                    }
                },
            },
        ]);
    };

    if (isLoading || !routine) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0B0F" }}>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color="#00E5FF" />
                    <Text style={{ color: "#888", marginTop: 10 }}>
                        Cargando rutina...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const exercises = Array.isArray(routine.exercises) ? routine.exercises : [];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0B0F" }}>

            {/* HEADER */}
            <View style={{
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.1)",
                backgroundColor: "#0B0B0F"
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "rgba(255,255,255,0.1)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 10
                    }}
                >
                    <IconSymbol name="chevron.left" size={20} color="#FFF" />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "bold" }}>
                        {routine.title}
                    </Text>
                    <Text style={{ color: "#888", fontSize: 12 }}>
                        {routine.coachName}
                    </Text>
                </View>
            </View>

            {/* CONTENT */}
            <ScrollView
                style={{ flex: 1, backgroundColor: "#0B0B0F" }}
                contentContainerStyle={{
                    paddingBottom: 150,
                    paddingTop: 10,
                    backgroundColor: "#0B0B0F",
                }}
            >

                {/* INFO CARD */}
                <View style={{
                    marginHorizontal: 20,
                    backgroundColor: "#1C1C1E",
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 20
                }}>
                    <Text style={{ color: "#DDD", marginBottom: 10 }}>
                        {routine.description}
                    </Text>

                    <Text style={{ color: "#00E5FF", fontWeight: "bold" }}>
                        {routine.level} • {routine.durationMinutes} min
                    </Text>
                </View>

                {/* EJERCICIOS */}
                <View style={{ paddingHorizontal: 20, backgroundColor: "#0B0B0F" }}>
                    <Text style={{
                        color: "#FFF",
                        fontSize: 20,
                        fontWeight: "bold",
                        marginBottom: 10
                    }}>
                        Ejercicios
                    </Text>

                    {exercises.length === 0 ? (
                        <Text style={{ color: "#666" }}>
                            No hay ejercicios
                        </Text>
                    ) : (
                        exercises.map((ex, idx) => (
                            <View key={idx} style={{
                                backgroundColor: "#1C1C1E",
                                padding: 20,
                                borderRadius: 20,
                                marginBottom: 15
                            }}>
                                <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "bold" }}>
                                    {idx + 1}. {ex.name}
                                </Text>

                                <Text style={{ color: "#00E5FF", marginTop: 5 }}>
                                    {ex.sets} series • {ex.reps} reps • {ex.restSeconds}s
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* BOTÓN */}
            <View style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: 20,
                backgroundColor: "#0B0B0F",
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.1)"
            }}>
                <TouchableOpacity
                    onPress={handleComplete}
                    disabled={isCompleting}
                    style={{
                        backgroundColor: "#00E5FF",
                        padding: 18,
                        borderRadius: 20,
                        alignItems: "center"
                    }}
                >
                    {isCompleting ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={{ color: "#000", fontWeight: "bold" }}>
                            MARCAR COMO COMPLETADA
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}