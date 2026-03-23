import React, { useState, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, Alert, ActivityIndicator } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { bookClass } from "@/src/services/gymService"; // Asegúrate de que la ruta sea correcta

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [weekDays, setWeekDays] = useState([]);
  const [selectedDateISO, setSelectedDateISO] = useState(""); // Ej. "2026-03-24"
  
  const [classes, setClasses] = useState([]);
  const [myReservations, setMyReservations] = useState([]); // Array de classID
  const [isLoading, setIsLoading] = useState(true);

  // 1. Generar la semana actual y el formato de fecha para Firebase
  useEffect(() => {
    const days = [];
    const today = new Date();
    const current = new Date(today);
    const dayOfWeek = current.getDay(); 
    const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    current.setDate(diff);

    const labels = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    
    for (let i = 0; i < 6; i++) {
      // Crear string ISO manual (YYYY-MM-DD) para evitar problemas de zona horaria
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;

      days.push({
        label: labels[i],
        num: current.getDate(),
        isoDate: isoDate
      });
      
      // Si es hoy, lo seleccionamos por defecto
      if (today.getDate() === current.getDate()) {
        setSelectedDateISO(isoDate);
      }
      
      current.setDate(current.getDate() + 1);
    }
    setWeekDays(days);
  }, []);

  // 2. Traer clases y reservas desde Firebase cuando cambia el día
  useEffect(() => {
    if (!selectedDateISO || !user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // A. Traer las clases de ese día específico
        const qClasses = query(collection(db, "classes"), where("date", "==", selectedDateISO));
        const classSnap = await getDocs(qClasses);
        const loadedClasses = classSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // B. Traer las reservaciones de este usuario para saber cuáles botones poner en "VER TICKET"
        const qRes = query(collection(db, "reservations"), where("userId", "==", user.uid));
        const resSnap = await getDocs(qRes);
        // Extraemos solo los IDs de las clases reservadas (Usando tu campo classID)
        const bookedIds = resSnap.docs.map(doc => doc.data().classID);

        setClasses(loadedClasses);
        setMyReservations(bookedIds);
      } catch (error) {
        console.error("Error cargando datos: ", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDateISO, user]);

  // 3. Lógica Real de Reserva
  const handleReserve = (classItem) => {
    if (classItem.availableSpots <= 0) {
      Alert.alert("Lista de Espera", "Esta clase está llena. Te hemos añadido a la lista de espera.");
      return;
    }

    Alert.alert(
      "Confirmar Reserva",
      `¿Quieres apartar tu lugar en ${classItem.name} a las ${classItem.startTime}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Reservar", 
          onPress: async () => {
            try {
              const userName = user?.displayName || "Atleta";
              // Llamamos al servicio real
              await bookClass(user.uid, classItem, userName);
              
              // Actualizamos el estado local para que el botón cambie de inmediato
              setMyReservations([...myReservations, classItem.id]);
              
              Alert.alert("¡Listo!", "Tu lugar está asegurado.");
            } catch (error) {
              Alert.alert("Error", "No pudimos procesar tu reserva. Intenta de nuevo.");
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-impulse-dark pt-14 px-5">
      <Text className="text-white text-3xl font-black mb-6">Explorar Clases</Text>
      
      {/* CALENDARIO DE LA SEMANA */}
      <View className="flex-row justify-between mb-8">
        {weekDays.map((day, index) => {
          const isSelected = day.isoDate === selectedDateISO;
          return (
            <TouchableOpacity 
              key={index}
              onPress={() => setSelectedDateISO(day.isoDate)}
              className={`items-center justify-center w-12 py-4 rounded-2xl border ${isSelected ? 'bg-impulse-cyan border-impulse-cyan' : 'bg-white/5 border-white/5'}`}
            >
              <Text className={`text-[10px] font-black mb-1 ${isSelected ? 'text-black' : 'text-gray-500'}`}>{day.label}</Text>
              <Text className={`text-lg font-black ${isSelected ? 'text-black' : 'text-white'}`}>{day.num}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LISTA DE CLASES */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#00E5FF" />
        </View>
      ) : classes.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <IconSymbol name="calendar.badge.exclamationmark" size={48} color="#444" />
          <Text className="text-gray-500 font-bold mt-4">No hay clases programadas para este día.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {classes.map((cls) => {
            const isReserved = myReservations.includes(cls.id);
            const spots = cls.availableSpots || 0;
            const colorClass = cls.name === "CrossFit" ? "bg-impulse-cyan" : "bg-orange-500";
            
            return (
              <View key={cls.id} className="bg-impulse-gray p-5 rounded-3xl mb-4 border border-white/5">
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-white text-2xl font-black">{cls.startTime}</Text>
                    <Text className="text-gray-400 font-bold">{cls.name} con {cls.coachName}</Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${colorClass} opacity-20`}>
                     <Text className="font-bold text-[10px] text-white">60 MIN</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className={`text-xs font-bold ${spots > 0 ? "text-gray-400" : "text-red-500"}`}>
                    {spots > 0 ? `${spots} lugares disponibles` : "Sin cupo"}
                  </Text>

                  <TouchableOpacity 
                    onPress={() => {
                      if (isReserved) {
                        router.push({
                          pathname: "/(user)/ticket",
                          params: { classId: cls.id, className: cls.name, time: cls.startTime, coach: cls.coachName }
                        });
                      } else {
                        handleReserve(cls);
                      }
                    }}
                    className={`px-6 py-3 rounded-2xl ${isReserved ? "bg-white/10 border border-white/20" : (spots > 0 ? colorClass : "bg-red-500/20")}`}
                  >
                    <Text className={`font-black text-xs ${isReserved ? "text-white" : "text-black"}`}>
                      {isReserved ? "VER TICKET" : (spots > 0 ? "RESERVAR" : "ESPERA")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}