import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getRoutines,
  listenFeaturedExercisesForUser,
} from "@/src/services/gymService";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/src/context/AuthContext";

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
  const { user } = useAuth();

  const [routines, setRoutines] = useState([]);
  const [featuredRoutines, setFeaturedRoutines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, []),
  );

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = listenFeaturedExercisesForUser(user.uid, (data) => {
      setFeaturedRoutines(data);
    });
    return () => unsubscribe();
  }, [user?.uid]);

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

  const filteredRoutines = routines.filter((r) => {
    if (selectedCategory === "Todos") return !r.featured && !r.isRecommended;
    return r.bodyPart === selectedCategory;
  });

  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/(user)/routine-detail",
          params: { routineId: item.id },
        })
      }
      activeOpacity={0.9}
      style={{ width: 280 }}
      className="bg-[#1C1C1E] rounded-3xl overflow-hidden border border-white/10 mr-4"
    >
      <View className="p-6 relative flex-1 justify-between">
        <View className="absolute top-0 right-0 p-6 opacity-10">
          <Ionicons name="flame" size={80} color="#00E5FF" />
        </View>

        <View>
          <View className="bg-[#00E5FF]/20 self-start px-3 py-1.5 rounded-full mb-3 border border-[#00E5FF]/30">
            <Text className="text-[#00E5FF] text-[10px] font-black uppercase tracking-widest">
              DESTACADO
            </Text>
          </View>

          <Text
            className="text-white text-2xl font-black mb-1"
            numberOfLines={2}
          >
            {item.title || "Rutina sin título"}
          </Text>

          {!!item.subtitle && (
            <Text
              className="text-gray-400 font-bold text-sm mb-4"
              numberOfLines={2}
            >
              {item.subtitle}
            </Text>
          )}

          {!item.subtitle && !!item.description && (
            <Text
              className="text-gray-400 font-bold text-sm mb-4"
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}

          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-row items-center gap-1.5">
              {/* time es compatible universalmente */}
              <Ionicons name="time" size={14} color="#666" />
              <Text className="text-gray-300 text-xs font-bold">
                {item.durationMinutes || 0} min
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5">
              <Ionicons name="calendar" size={14} color="#666" />
              <Text className="text-gray-300 text-xs font-bold">
                Vence:{" "}
                {item.featuredExpiresAt
                  ? new Date(
                      item.featuredExpiresAt.seconds * 1000,
                    ).toLocaleDateString()
                  : "Pronto"}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-5 flex-row items-center justify-between border-t border-white/10 pt-4">
          <View className="flex-row items-center flex-1 pr-2">
            <View className="w-8 h-8 rounded-full bg-white/10 mr-3 items-center justify-center">
              <Text className="text-white font-bold">
                {item.assignedByName?.charAt(0) ||
                  item.coachName?.charAt(0) ||
                  "C"}
              </Text>
            </View>

            <Text
              className="text-gray-400 font-medium text-xs"
              numberOfLines={1}
            >
              Por {item.assignedByName || item.coachName || "Coach"}
            </Text>
          </View>

          <View className="bg-[#00E5FF] w-8 h-8 rounded-full items-center justify-center">
            {/* CORRECCIÓN: chevron.right -> chevron-forward */}
            <Ionicons name="chevron-forward" size={16} color="#000" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            {selectedCategory === "Todos" && (
              <View className="mb-8">
                <Text className="px-5 text-white text-lg font-black mb-4 tracking-tight">
                  Recomendado para ti
                </Text>
                {featuredRoutines.length > 0 ? (
                  <FlatList
                    data={featuredRoutines}
                    keyExtractor={(item) => item.id}
                    renderItem={renderFeaturedItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                    snapToInterval={296}
                    decelerationRate="fast"
                  />
                ) : (
                  <View className="mx-5 bg-[#1C1C1E] p-6 rounded-3xl border border-white/10 items-center justify-center">
                    <Ionicons name="flame" size={32} color="#444" />
                    <Text className="text-gray-500 font-bold mt-2 text-center">
                      No hay rutinas destacadas ahora.
                    </Text>
                  </View>
                )}
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
                  {/* CORRECCIÓN: list.bullet -> list */}
                  <Ionicons name="list" size={40} color="#444" />
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
                      <Ionicons name="barbell" size={24} color="#666" />
                    </View>

                    <View className="flex-1">
                      <Text
                        className="text-white font-black text-lg"
                        numberOfLines={1}
                      >
                        {routine.title || "Rutina sin título"}
                      </Text>

                      <Text className="text-gray-400 font-medium text-xs mt-0.5">
                        {routine.bodyPart || "General"} •{" "}
                        {routine.level || "Sin nivel"}
                      </Text>

                      <View className="flex-row items-center mt-2">
                        {/* time compatible universalmente */}
                        <Ionicons name="time" size={12} color="#666" />
                        <Text className="text-gray-500 text-[10px] font-bold ml-1">
                          {routine.durationMinutes || 0} MIN
                        </Text>
                      </View>
                    </View>

                    {/* CORRECCIÓN: chevron.right -> chevron-forward */}
                    <Ionicons name="chevron-forward" size={20} color="#444" />
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
