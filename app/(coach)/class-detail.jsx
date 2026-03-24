import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/src/config/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
} from "firebase/firestore";

export default function ClassDetailScreen() {
    const router = useRouter();
    const { classId } = useLocalSearchParams();

    const [classData, setClassData] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchClassAndReservations = async () => {
        if (!classId) {
            Alert.alert("Error", "No se recibió el identificador de la clase.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // 1) Traer la clase
            const classRef = doc(db, "classes", classId);
            const classSnap = await getDoc(classRef);

            if (!classSnap.exists()) {
                Alert.alert("Error", "La clase no fue encontrada.");
                setIsLoading(false);
                return;
            }

            const classInfo = {
                id: classSnap.id,
                ...classSnap.data(),
            };
            setClassData(classInfo);

            // 2) Traer reservaciones de esa clase
            const reservationsQuery = query(
                collection(db, "reservations"),
                where("classID", "==", classId)
            );

            const reservationsSnap = await getDocs(reservationsQuery);

            const reservationList = reservationsSnap.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            }));

            // Orden opcional: attended primero, luego booked
            reservationList.sort((a, b) => {
                if (a.status === b.status) return 0;
                if (a.status === "attended") return -1;
                return 1;
            });

            setReservations(reservationList);
        } catch (error) {
            console.error("Error cargando detalle de clase:", error);
            Alert.alert("Error", "No se pudo cargar la información de la clase.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClassAndReservations();
    }, [classId]);

    const attendedCount = useMemo(() => {
        return reservations.filter((item) => item.status === "attended").length;
    }, [reservations]);

    const bookedCount = useMemo(() => {
        return reservations.filter((item) => item.status === "booked").length;
    }, [reservations]);

    if (isLoading) {
        return (
            <View className="flex-1 bg-impulse-dark justify-center items-center">
                <ActivityIndicator size="large" color="#FF9500" />
                <Text className="text-gray-400 mt-4 font-bold">
                    Cargando detalle de la clase...
                </Text>
            </View>
        );
    }

    if (!classData) {
        return (
            <View className="flex-1 bg-impulse-dark justify-center items-center px-6">
                <Text className="text-white text-xl font-black mb-2">
                    Clase no disponible
                </Text>
                <Text className="text-gray-400 text-center mb-6">
                    No fue posible encontrar la clase seleccionada.
                </Text>

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-orange-500 px-6 py-4 rounded-2xl"
                >
                    <Text className="text-black font-black">VOLVER</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-impulse-dark">
            <ScrollView
                className="flex-1 px-5 pt-14"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                {/* HEADER */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-5 w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
                >
                    <IconSymbol name="chevron.left" size={20} color="#FFF" />
                </TouchableOpacity>

                <View className="mb-8">
                    <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[2px] mb-2">
                        Detalle de clase
                    </Text>
                    <Text className="text-white text-3xl font-black mb-2">
                        {classData.name}
                    </Text>
                    <Text className="text-gray-400 font-bold">
                        {classData.date} • {classData.startTime}
                    </Text>
                </View>

                {/* RESUMEN */}
                <View className="bg-impulse-cyan rounded-[30px] p-6 mb-8">
                    <Text className="text-black text-xs font-black uppercase tracking-[2px] mb-2">
                        Resumen
                    </Text>

                    <Text className="text-black text-2xl font-black mb-2">
                        Coach: {classData.coachName || "Sin asignar"}
                    </Text>

                    <Text className="text-black/70 font-bold mb-5">
                        Cupo: {classData.availableSpots ?? classData.totalSpots}/
                        {classData.totalSpots}
                    </Text>

                    <View className="flex-row gap-4">
                        <View className="flex-1 bg-black/10 rounded-2xl p-4">
                            <Text className="text-black/60 text-[10px] font-bold uppercase mb-1">
                                Asistieron
                            </Text>
                            <Text className="text-black text-2xl font-black">
                                {attendedCount}
                            </Text>
                        </View>

                        <View className="flex-1 bg-black/10 rounded-2xl p-4">
                            <Text className="text-black/60 text-[10px] font-bold uppercase mb-1">
                                Pendientes
                            </Text>
                            <Text className="text-black text-2xl font-black">
                                {bookedCount}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* LISTA DE ASISTENTES */}
                <View className="bg-[#111] border border-white/5 rounded-[30px] p-5">
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="text-white text-lg font-black">
                            Asistentes
                        </Text>

                        <View className="bg-white/10 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold">
                                {reservations.length}
                            </Text>
                        </View>
                    </View>

                    {reservations.length === 0 ? (
                        <View className="py-8 items-center">
                            <IconSymbol name="person.3.fill" size={28} color="#666" />
                            <Text className="text-gray-400 font-bold mt-3 text-center">
                                Aún no hay reservaciones para esta clase.
                            </Text>
                        </View>
                    ) : (
                        reservations.map((item, index) => {
                            const attended = item.status === "attended";

                            return (
                                <View
                                    key={item.id}
                                    className={`flex-row justify-between items-center py-4 ${
                                        index !== reservations.length - 1
                                            ? "border-b border-white/5"
                                            : ""
                                    }`}
                                >
                                    <View className="flex-1 pr-3">
                                        <Text className="text-white font-bold text-base">
                                            {item.userName || "Usuario"}
                                        </Text>
                                        <Text className="text-gray-400 text-xs mt-1">
                                            {item.className || classData.name}
                                        </Text>
                                    </View>

                                    <View
                                        className={`px-3 py-2 rounded-full ${
                                            attended ? "bg-green-500/20" : "bg-yellow-500/20"
                                        }`}
                                    >
                                        <Text
                                            className={`text-xs font-black uppercase tracking-[1px] ${
                                                attended ? "text-green-400" : "text-yellow-400"
                                            }`}
                                        >
                                            {attended ? "Asistió" : "Reservado"}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* BOTÓN FLOTANTE */}
            <View className="absolute bottom-10 left-6 right-6">
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => router.push("/(coach)/scanner")}
                    className="bg-white flex-row items-center justify-center py-5 rounded-full shadow-2xl shadow-white/20"
                >
                    <View className="bg-black/5 p-1 rounded-full mr-2">
                        <IconSymbol name="qrcode.viewfinder" size={18} color="#000" />
                    </View>
                    <Text className="text-impulse-dark font-black text-sm tracking-[2px]">
                        ESCANEAR QR
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}