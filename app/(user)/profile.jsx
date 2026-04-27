import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/src/context/AuthContext";
import { getUserGymAttendance, getUserRoutineProgress } from "@/src/services/gymService";

export default function UserProfileScreen() {
  const { user, logout } = useAuth();
  
  const [metrics, setMetrics] = useState({
    streak: 0,
    routinesCompleted: 0,
    totalMinutes: 0
  });

  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [user]);

  const loadMetrics = async () => {
    try {
      const attendance = await getUserGymAttendance(user.uid);
      const progress = await getUserRoutineProgress(user.uid);
      
      // Calculate streak
      let currentStreak = 0;
      let today = new Date();
      today.setHours(0,0,0,0);
      
      const attendedTimes = new Set(
        attendance.map(r => {
          const parts = r.dateISO.split('-');
          return new Date(parts[0], parts[1]-1, parts[2]).getTime();
        })
      );
      
      let checkDate = new Date(today.getTime());
      if (attendedTimes.has(checkDate.getTime())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
      } else {
          checkDate.setDate(checkDate.getDate() - 1);
          if (attendedTimes.has(checkDate.getTime())) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
          }
      }
      
      while(currentStreak > 0 && attendedTimes.has(checkDate.getTime())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Calculate routines and time
      let rCompleted = 0;
      let rTime = 0;
      progress.forEach(p => {
        rCompleted += p.totalCompletions || 0;
        rTime += p.totalMinutes || 0;
      });
      
      setMetrics({
        streak: currentStreak,
        routinesCompleted: rCompleted,
        totalMinutes: rTime
      });
    } catch (error) {
      console.error("Error loading metrics", error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas salir de tu cuenta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Salir", 
          style: "destructive", 
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert("Error", "No se pudo cerrar la sesión.");
            }
          } 
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-impulse-dark">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 40 }}
      >
        
        {/* USUARIO */}
        <View className="items-center mb-10">
          <View className="w-24 h-24 rounded-full border-4 border-[#00E5FF] p-1 mb-4 shadow-xl shadow-[#00E5FF]/20">
            <View className="flex-1 rounded-full bg-white/10 items-center justify-center overflow-hidden">
               <IconSymbol name="person.crop.circle.fill" size={60} color="#00E5FF" />
            </View>
          </View>
          
          <Text className="text-white text-2xl" style={{ fontWeight: '900' }}>
            {user?.displayName || "Atleta"}
          </Text>
          <Text className="text-gray-500 uppercase tracking-widest text-[10px] mt-1" style={{ fontWeight: 'bold' }}>
            Miembro Impulse
          </Text>
        </View>

        {/* PROGRESS METRICS */}
        <View className="flex-row justify-between mb-8 gap-x-3">
          <View className="flex-1 bg-impulse-gray rounded-[24px] p-4 items-center border border-white/5">
            <IconSymbol name="flame.fill" size={24} color="#00E5FF" />
            <Text className="text-white text-2xl font-black mt-2">{metrics.streak}</Text>
            <Text className="text-gray-500 text-[10px] uppercase font-bold mt-1 text-center">Racha Actual</Text>
          </View>
          
          <View className="flex-1 bg-impulse-gray rounded-[24px] p-4 items-center border border-white/5">
            <IconSymbol name="checkmark.circle.fill" size={24} color="#00E5FF" />
            <Text className="text-white text-2xl font-black mt-2">{metrics.routinesCompleted}</Text>
            <Text className="text-gray-500 text-[10px] uppercase font-bold mt-1 text-center">Rutinas</Text>
          </View>
          
          <View className="flex-1 bg-impulse-gray rounded-[24px] p-4 items-center border border-white/5">
            <IconSymbol name="timer" size={24} color="#00E5FF" />
            <Text className="text-white text-2xl font-black mt-2">{metrics.totalMinutes}</Text>
            <Text className="text-gray-500 text-[10px] uppercase font-bold mt-1 text-center">Minutos</Text>
          </View>
        </View>

        {/* INFO */}
        <View className="bg-impulse-gray rounded-[32px] p-2 border border-white/5 mb-8">
          <View className="p-4 flex-row items-center border-b border-white/5">
            <IconSymbol name="envelope.fill" size={18} color="#666" />
            <View className="ml-4">
              <Text className="text-gray-500 text-[10px] uppercase" style={{ fontWeight: '900' }}>Correo</Text>
              <Text className="text-white" style={{ fontWeight: 'bold' }}>{user?.email}</Text>
            </View>
          </View>

          <View className="p-4 flex-row items-center">
            <IconSymbol name="shield.fill" size={18} color="#666" />
            <View className="ml-4">
              <Text className="text-gray-500 text-[10px] uppercase" style={{ fontWeight: '900' }}>Nivel de Acceso</Text>
              <Text className="text-[#00E5FF]" style={{ fontWeight: 'bold' }}>Atleta</Text>
            </View>
          </View>
        </View>

        {/* CERRAR SESIÓN */}
        <TouchableOpacity 
          onPress={handleLogout}
          activeOpacity={0.8}
          className="bg-red-500/10 border border-red-500/30 py-5 rounded-3xl flex-row justify-center items-center"
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="#EF4444" style={{marginRight: 10}} />
          <Text className="text-red-500 tracking-widest" style={{ fontWeight: '900' }}>CERRAR SESIÓN</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-700 text-[10px] mt-8 uppercase tracking-[2px]" style={{ fontWeight: 'bold' }}>
          Impulse Lab App v1.0.0
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}