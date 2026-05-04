import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { db } from "@/src/config/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export default function CoachHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = user?.displayName
    ? user.displayName.split(" ")[0]
    : "Coach";

  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Calculamos el rango de la semana (desde hoy hasta 7 días después)
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split("T")[0];

    // Query para traer las clases de la semana asignadas a este coach
    const q = query(
      collection(db, "classes"),
      where("coachId", "==", user.uid),
      where("date", ">=", todayStr),
      where("date", "<=", nextWeekStr),
      orderBy("date", "asc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const loadedClasses = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Orden secundario por hora de inicio
        loadedClasses.sort((a, b) => {
          if (a.date === b.date) {
            return String(a.startTime).localeCompare(String(b.startTime));
          }
          return 0;
        });

        setClasses(loadedClasses);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error cargando agenda semanal:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Agrupamos las clases por fecha para mostrarlas por secciones
  const groupedClasses = useMemo(() => {
    return classes.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [classes]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-impulse-dark justify-center items-center">
        <ActivityIndicator size="large" color="#FF9500" />
        <Text className="text-gray-400 mt-4 font-bold">
          Cargando agenda semanal...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-impulse-dark">
      <ScrollView
        className="flex-1 px-5 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ pb: 120 }}
      >
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">
              Mi Agenda
            </Text>
            <Text className="text-white text-3xl font-black">
              Hola, {firstName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(coach)/profile")}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center"
          >
            <Ionicons name="person" size={20} color="#FF9500" />
          </TouchableOpacity>
        </View>

        {/* RESUMEN SEMANAL */}
        <TouchableOpacity
          activeOpacity={0.9}
          className="bg-orange-500 rounded-[32px] p-6 mb-8"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-black/60 font-bold text-xs uppercase">
                Total semana
              </Text>
              <Text className="text-black text-4xl font-black">
                {classes.length}
              </Text>
              <Text className="text-black/80 font-medium">
                Clases programadas
              </Text>
            </View>
            <Ionicons name="calendar" size={50} color="rgba(0,0,0,0.1)" />
          </View>
        </TouchableOpacity>

        {/* LISTADO POR DÍAS */}
        <Text className="text-white text-xl font-black mb-6">
          Próximas Clases
        </Text>

        {Object.keys(groupedClasses).length === 0 ? (
          <View className="bg-white/5 p-10 rounded-[32px] items-center">
            <Ionicons name="calendar-outline" size={40} color="#444" />
            <Text className="text-gray-500 font-bold mt-4">
              No tienes clases esta semana
            </Text>
          </View>
        ) : (
          Object.keys(groupedClasses).map((date) => (
            <View key={date} className="mb-6">
              <View className="flex-row items-center mb-3">
                <View className="h-[1px] flex-1 bg-white/10" />
                <Text className="text-orange-500 font-black text-[10px] px-4 uppercase tracking-widest">
                  {new Date(date + "T12:00:00").toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
                <View className="h-[1px] flex-1 bg-white/10" />
              </View>

              {groupedClasses[date].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(coach)/class-detail",
                      params: { classId: item.id },
                    })
                  }
                  className="bg-impulse-gray border border-white/5 rounded-3xl p-5 mb-3 flex-row justify-between items-center"
                >
                  <View className="flex-1">
                    <Text className="text-white font-black text-lg">
                      {item.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="time-outline" size={14} color="#888" />
                      <Text className="text-gray-400 text-xs ml-1 font-bold">
                        {item.startTime} hrs
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <View className="bg-white/5 px-3 py-1 rounded-full mb-1">
                      <Text className="text-orange-500 font-black text-[10px]">
                        {item.totalSpots - (item.availableSpots ?? 0)}/
                        {item.totalSpots}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#444" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* BOTÓN FLOTANTE SCANNER */}
      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity
          onPress={() => router.push("/(coach)/scanner")}
          className="bg-white flex-row items-center justify-center py-5 rounded-full shadow-2xl"
        >
          <Ionicons name="qr-code" size={18} color="#000" className="mr-2" />
          <Text className="text-black font-black text-sm tracking-[2px] ml-2">
            PASAR LISTA
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
