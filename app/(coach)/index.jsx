import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { db } from "@/src/config/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function CoachHomeScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Coach";

    useEffect(() => {
        const fetchCoachClasses = async () => {
            if (!user?.uid) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const q = query(
                    collection(db, "classes"),
                    where("coachId", "==", user.uid)
                );

                const querySnapshot = await getDocs(q);

                const loadedClasses = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                loadedClasses.sort((a, b) => {
                    const aDate = new Date(`${a.date}T${a.startTime || "00:00"}:00`);
                    const bDate = new Date(`${b.date}T${b.startTime || "00:00"}:00`);
                    return aDate - bDate;
                });

                setClasses(loadedClasses);
            } catch (error) {
                console.error("Error al cargar clases del coach:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCoachClasses();
    }, [user?.uid]);

    const todayString = new Date().toISOString().split("T")[0];

    const todayClasses = useMemo(() => {
        return classes.filter((item) => item.date === todayString);
    }, [classes, todayString]);

    const totalAttendanceCapacity = useMemo(() => {
        return classes.reduce((acc, item) => acc + (item.totalSpots || 0), 0);
    }, [classes]);

    const upcomingClass = useMemo(() => {
        const now = new Date();

        const futureClasses = classes.filter((item) => {
            const classDateTime = new Date(`${item.date}T${item.startTime || "00:00"}:00`);
            return classDateTime >= now;
        });

        if (futureClasses.length > 0) return futureClasses[0];
        return classes.length > 0 ? classes[0] : null;
    }, [classes]);

    if (isLoading) {
        return (
            <View className="flex-1 bg-impulse-dark justify-center items-center">
                <ActivityIndicator size="large" color="#FF9500" />
                <Text className="text-gray-400 mt-4 font-bold">Cargando panel del coach...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-impulse-dark relative">
            <ScrollView
                className="flex-1 px-5 pt-14"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-[120px]"
            >
                {/* HEADER MODO COACH */}
                <View className="flex-row justify-between items-center mb-8">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-full border-2 border-orange-500 p-[2px] mr-3">
                            <View className="flex-1 rounded-full bg-impulse-gray items-center justify-center overflow-hidden">
                                <IconSymbol name="person.fill" size={20} color="#FF9500" />
                            </View>
                        </View>
                        <View>
                            <View className="flex-row items-center mb-0.5">
                                <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">
                                    Modo Coach
                                </Text>
                            </View>
                            <Text className="text-white text-2xl font-black tracking-tight">
                                Hola, {firstName}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                        <IconSymbol name="bell.fill" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* MÉTRICAS DEL COACH */}
                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-impulse-gray border border-white/5 rounded-3xl p-5 relative overflow-hidden">
                        <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">
                            CLASES HOY
                        </Text>
                        <View className="flex-row items-baseline">
                            <Text className="text-white text-3xl font-black">
                                {todayClasses.length}
                            </Text>
                            <Text className="text-gray-500 text-sm ml-1">hoy</Text>
                        </View>
                    </View>

                    <View className="flex-1 bg-impulse-gray border border-white/5 rounded-3xl p-5 relative overflow-hidden">
                        <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">
                            CUPO TOTAL
                        </Text>
                        <View className="flex-row items-baseline">
                            <Text className="text-white text-3xl font-black">
                                {totalAttendanceCapacity}
                            </Text>
                            <Text className="text-impulse-cyan text-sm ml-1"> spots</Text>
                        </View>
                    </View>
                </View>

                {/* PRÓXIMA CLASE */}
                <View className="flex-row justify-between items-end mb-4">
                    <Text className="text-white text-lg font-black">Tu próxima clase</Text>
                    <Text className="text-impulse-cyan text-xs font-bold">
                        {upcomingClass?.startTime || "--:--"} hrs
                    </Text>
                </View>

                {upcomingClass ? (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() =>
                            router.push({
                                pathname: "/(coach)/class-detail",
                                params: { classId: upcomingClass.id },
                            })
                        }
                        className="bg-impulse-cyan rounded-[32px] p-6 mb-8 shadow-xl shadow-impulse-cyan/20"
                    >
                        <View className="flex-row justify-between items-start mb-4">
                            <View className="bg-black/10 px-3 py-1.5 rounded-full border border-black/10">
                                <Text className="text-black text-xs font-bold">
                                    {upcomingClass.name}
                                </Text>
                            </View>

                            <View className="bg-black/10 w-10 h-10 rounded-full items-center justify-center">
                                <IconSymbol name="chevron.right" size={18} color="#000" />
                            </View>
                        </View>

                        <Text className="text-black text-3xl font-black mb-1">
                            {upcomingClass.date}
                        </Text>
                        <Text className="text-black/70 text-sm font-bold mb-6">
                            Hora: {upcomingClass.startTime} • Lugares:{" "}
                            {upcomingClass.availableSpots ?? upcomingClass.totalSpots}/
                            {upcomingClass.totalSpots}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-impulse-gray border border-white/5 rounded-[32px] p-6 mb-8">
                        <Text className="text-white text-xl font-black mb-2">
                            Sin clases asignadas
                        </Text>
                        <Text className="text-gray-400">
                            Aún no tienes clases asignadas por el administrador.
                        </Text>
                    </View>
                )}

                {/* MIS CLASES */}
                <View className="bg-[#111] border border-white/5 rounded-[32px] p-6 mb-8">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <IconSymbol name="calendar" size={20} color="#FFF" />
                            <Text className="text-white text-lg font-black ml-3">Mis clases</Text>
                        </View>

                        <View className="bg-white/10 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold">{classes.length}</Text>
                        </View>
                    </View>

                    {classes.length === 0 ? (
                        <Text className="text-gray-400">
                            No tienes clases asignadas todavía.
                        </Text>
                    ) : (
                        classes.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.85}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(coach)/class-detail",
                                        params: { classId: item.id },
                                    })
                                }
                                className={`flex-row justify-between items-center py-3 ${
                                    index !== classes.length - 1 ? "border-b border-white/5" : ""
                                }`}
                            >
                                <View className="flex-1 pr-3">
                                    <Text className="text-white font-bold text-base">{item.name}</Text>
                                    <Text className="text-gray-400 text-xs mt-1">
                                        {item.date} • {item.startTime}
                                    </Text>
                                </View>

                                <View className="flex-row items-center">
                                    <View className="bg-white/5 px-3 py-2 rounded-full mr-2">
                                        <Text className="text-white text-xs font-bold">
                                            {item.availableSpots ?? item.totalSpots}/{item.totalSpots}
                                        </Text>
                                    </View>
                                    <IconSymbol name="chevron.right" size={16} color="#888" />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* BOTÓN FLOTANTE: PASAR LISTA */}
            <View className="absolute bottom-10 left-6 right-6">
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push("/scanner")}
                    className="bg-white flex-row items-center justify-center py-5 rounded-full shadow-2xl shadow-white/20"
                >
                    <View className="bg-black/5 p-1 rounded-full mr-2">
                        <IconSymbol name="checkmark.circle.fill" size={18} color="#000" />
                    </View>
                    <Text className="text-impulse-dark font-black text-sm tracking-[2px]">
                        PASAR LISTA AHORA
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}