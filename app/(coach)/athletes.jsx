import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/src/config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const athleteStyle = { 
    text: "ATLETA", 
    color: "#00E5FF", 
    bg: "rgba(0, 229, 255, 0.1)", 
    border: "rgba(0, 229, 255, 0.3)" 
};

export default function CoachAthletesScreen() {
    const [athletes, setAthletes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAthletes = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "users"), where("role", "==", "user"));
            const querySnapshot = await getDocs(q);
            
            const loadedAthletes = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
            loadedAthletes.sort((a, b) => {
                return (a.name || a.email || "").toLowerCase().localeCompare((b.name || b.email || "").toLowerCase());
            });

            setAthletes(loadedAthletes);
        } catch (error) {
            console.error("Error al cargar atletas:", error);
            Alert.alert("Error", "No se pudo cargar la lista de alumnos.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAthletes();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-impulse-dark">
            <View className="flex-1 px-5 pt-6">
                
                <View className="mb-8 flex-row justify-between items-end">
                    <View>
                        <Text className="text-white text-3xl font-black">Atletas</Text>
                        <Text className="text-gray-500 text-sm">Directorio de alumnos</Text>
                    </View>
                    <Text className="text-orange-500 font-black text-xl">
                        {athletes.length} <Text className="text-gray-500 text-xs">total</Text>
                    </Text>
                </View>

                {/* LISTA DE ATLETAS */}
                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#FF9500" />
                    </View>
                ) : athletes.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <IconSymbol name="person.crop.circle.badge.xmark" size={48} color="#444" />
                        <Text className="text-gray-500 font-bold mt-4">No se encontraron alumnos registrados.</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        {athletes.map((user) => (
                            <View key={user.id} className="bg-impulse-gray p-4 rounded-3xl mb-3 border border-white/5 flex-row items-center">
                                {/* AVATAR */}
                                <View 
                                    className="w-12 h-12 rounded-full items-center justify-center mr-4 border" 
                                    style={{ backgroundColor: athleteStyle.bg, borderColor: athleteStyle.border }}
                                >
                                    <IconSymbol name="person.fill" size={20} color={athleteStyle.color} />
                                </View>
                                
                                {/* INFO */}
                                <View className="flex-1">
                                    <Text className="text-white font-black text-lg mb-0.5">
                                        {user.name || "Atleta sin nombre"}
                                    </Text>
                                    <Text className="text-gray-400 text-xs">
                                        {user.email || "Sin correo"}
                                    </Text>
                                </View>
                                
                                {/* ETIQUETA */}
                                <View 
                                    className="px-3 py-1.5 rounded-full border" 
                                    style={{ backgroundColor: athleteStyle.bg, borderColor: athleteStyle.border }}
                                >
                                    <Text className="text-[10px] font-black tracking-widest" style={{ color: athleteStyle.color }}>
                                        {athleteStyle.text}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}