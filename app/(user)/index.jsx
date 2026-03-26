import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function UserDashboard() {
    const { user } = useAuth();
    const [evaluations, setEvaluations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Atleta";

    const fetchEvaluations = async () => {
        if (!user?.uid) return;
        setIsLoading(true);
        try {
            const q = query(
                collection(db, "reservations"),
                where("userId", "==", user.uid),
                where("isEvaluated", "==", true)
            );
            const querySnapshot = await getDocs(q);
            const loadedEvals = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Orden de la más reciente a la más antigua
            loadedEvals.sort((a, b) => {
                const dateA = new Date(`${a.classDate || a.date}T${a.startTime || "00:00"}`);
                const dateB = new Date(`${b.classDate || b.date}T${b.startTime || "00:00"}`);
                return dateB - dateA;
            });

            setEvaluations(loadedEvals);
        } catch (error) {
            console.error("Error al cargar historial:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvaluations();
    }, [user]);

    const getPerformanceBadge = (level) => {
        if (level === "Excelente") return { bg: "bg-green-500/10", text: "text-green-500", border: "border-green-500/30", ring: "#10B981" };
        if (level === "Bueno") return { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/30", ring: "#EAB308" };
        return { bg: "bg-red-500/10", text: "text-red-500", border: "border-red-500/30", ring: "#EF4444" };
    };

    const HabitIndicator = ({ label, score }) => {
        let iconName = "xmark.circle.fill";
        let iconColor = "#EF4444";
        
        if (score === 1) { 
            iconName = "checkmark.circle.fill"; 
            iconColor = "#10B981";
        } else if (score === 0.5) { 
            iconName = "exclamationmark.triangle.fill"; 
            iconColor = "#EAB308";
        }

        return (
            <View className="flex-row items-center mb-2.5">
                <IconSymbol name={iconName} size={16} color={iconColor} />
                <Text className="text-gray-300 text-xs ml-2 font-medium">{label}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-impulse-dark">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                
                <View className="px-5 pt-6 mb-8">
                    <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[2px]">Dashboard</Text>
                    <Text className="text-white text-3xl font-black">Hola, {firstName}</Text>
                </View>

                {/* HISTORIAL DE CLASES */}
                <View className="px-5">
                    <View className="flex-row items-center mb-6">
                        <IconSymbol name="chart.bar.fill" size={20} color="#00E5FF" />
                        <Text className="text-white text-xl font-black ml-2">Tu Historial de Desempeño</Text>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator size="large" color="#00E5FF" className="mt-10" />
                    ) : evaluations.length === 0 ? (
                        <View className="bg-impulse-gray p-8 rounded-[32px] border border-white/5 items-center mt-2">
                            <View className="w-16 h-16 bg-white/5 rounded-full items-center justify-center mb-4">
                                <IconSymbol name="medal.fill" size={30} color="#666" />
                            </View>
                            <Text className="text-white text-lg font-black text-center">Aún no hay evaluaciones</Text>
                            <Text className="text-gray-500 text-xs text-center mt-2">Asiste a tu primera clase para que tu coach evalúe tu rendimiento y empieza a construir tu racha.</Text>
                        </View>
                    ) : (
                        evaluations.map((evalData) => {
                            const badge = getPerformanceBadge(evalData.performanceLevel);
                            
                            return (
                                <View key={evalData.id} className="bg-impulse-gray p-5 rounded-3xl mb-4 border border-white/5 shadow-xl">
                                    
                                    {/* HEADER DE LA TARJETA */}
                                    <View className="flex-row justify-between items-start mb-5 border-b border-white/5 pb-4">
                                        <View className="flex-1">
                                            <Text className="text-white font-black text-xl mb-1">{evalData.className}</Text>
                                            <Text className="text-[#00E5FF] text-[10px] font-bold uppercase tracking-widest">
                                                {evalData.classDate || evalData.date} • {evalData.startTime}
                                            </Text>
                                        </View>
                                        <View className={`px-3 py-1.5 rounded-full border ${badge.bg} ${badge.border}`}>
                                            <Text className={`text-[10px] font-black tracking-widest uppercase ${badge.text}`}>
                                                {evalData.performanceLevel}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* PORCENTAJE Y EVALUACIONES */}
                                    <View className="flex-row items-center justify-between">
                                        
                                        {/* Evaluaciones */}
                                        <View className="flex-1 pr-4">
                                            <HabitIndicator label="Rutina completada" score={evalData.evaluation?.rutina} />
                                            <HabitIndicator label="Cardio realizado" score={evalData.evaluation?.cardio} />
                                            <HabitIndicator label="Técnica / Indicaciones" score={evalData.evaluation?.indicaciones} />
                                        </View>

                                        {/* Porcentaje */}
                                        <View 
                                            className="w-[85px] h-[85px] rounded-full border-[5px] items-center justify-center bg-black/20" 
                                            style={{ borderColor: badge.ring }}
                                        >
                                            <Text className="text-white font-black text-2xl">{evalData.compliancePercentage}%</Text>
                                        </View>

                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}