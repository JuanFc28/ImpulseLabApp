import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import {
  createRoutine,
  updateRoutine,
  markExerciseAsFeatured,
} from "@/src/services/gymService";
import { db } from "@/src/config/firebase";
import { doc, getDoc } from "firebase/firestore";

const LEVELS = ["Principiante", "Intermedio", "Avanzado"];
const BODY_PARTS = [
  "Pecho y Hombros",
  "Espalda y Bíceps",
  "Pierna",
  "Full Body",
  "Core y Abs",
  "Cardio",
  "Movilidad",
];
const GOALS = [
  "Hipertrofia",
  "Fuerza",
  "Resistencia",
  "Pérdida de Grasa",
  "Acondicionamiento",
];

export default function CreateRoutineScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { routineId } = useLocalSearchParams();
  const isEditing = !!routineId;

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [level, setLevel] = useState("Intermedio");
  const [bodyPart, setBodyPart] = useState("Full Body");
  const [goal, setGoal] = useState("Hipertrofia");
  const [duration, setDuration] = useState("45");
  const [featured, setFeatured] = useState(false);
  const [exercises, setExercises] = useState([]);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null);

  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState({
    name: "",
    sets: "",
    reps: "",
    restSeconds: "",
    notes: "",
  });
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(-1);

  useEffect(() => {
    if (isEditing) fetchRoutine();
  }, [routineId]);

  const fetchRoutine = async () => {
    try {
      const docRef = doc(db, "routines", routineId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        setTitle(data.title || "");
        setSubtitle(data.subtitle || "");
        setLevel(data.level || "Intermedio");
        setBodyPart(data.bodyPart || "Full Body");
        setGoal(data.goal || "Hipertrofia");
        setDuration(data.durationMinutes?.toString() || "45");
        setFeatured(data.featured || data.isRecommended || false);
        setExercises(Array.isArray(data.exercises) ? data.exercises : []);
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo cargar la rutina.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !duration.trim()) {
      Alert.alert(
        "Campos requeridos",
        "El título y la duración son obligatorios.",
      );
      return;
    }

    const durNum = parseInt(duration, 10);

    if (isNaN(durNum) || durNum <= 0) {
      Alert.alert("Duración inválida", "Ingresa un tiempo válido en minutos.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: subtitle.trim(),
        level,
        bodyPart,
        goal,
        durationMinutes: durNum,
        featured,
        isActive: true,
        exercises,
        exerciseCount: exercises.length,
        status: "active",
        coachId: user?.uid,
        coachName: user?.displayName || "Coach",
        coachPhotoUrl: user?.photoURL || null,
      };

      if (isEditing) {
        await updateRoutine(routineId, payload);
        if (featured) {
          await markExerciseAsFeatured(
            routineId,
            user?.uid,
            user?.displayName || "Coach",
          );
        }
        Alert.alert("Actualizada", "La rutina ha sido guardada.");
      } else {
        const docRefId = await createRoutine(payload);
        if (featured && docRefId) {
          await markExerciseAsFeatured(
            docRefId,
            user?.uid,
            user?.displayName || "Coach",
          );
        }
        Alert.alert("Creada", "La rutina ha sido publicada.");
      }

      router.back();
    } catch (error) {
      console.error("Error saving routine:", error);
      Alert.alert("Error", "Ocurrió un problema al guardar la rutina.");
    } finally {
      setIsSaving(false);
    }
  };

  const openPicker = (type) => {
    setPickerType(type);
    setPickerVisible(true);
  };

  const selectPickerValue = (val) => {
    if (pickerType === "level") setLevel(val);
    if (pickerType === "bodyPart") setBodyPart(val);
    if (pickerType === "goal") setGoal(val);
    setPickerVisible(false);
  };

  const getPickerOptions = () => {
    if (pickerType === "level") return LEVELS;
    if (pickerType === "bodyPart") return BODY_PARTS;
    if (pickerType === "goal") return GOALS;
    return [];
  };

  const openExerciseModal = (index = -1) => {
    if (index >= 0) {
      setCurrentExercise({ ...exercises[index] });
      setEditingExerciseIndex(index);
    } else {
      setCurrentExercise({
        name: "",
        sets: "",
        reps: "",
        restSeconds: "",
        notes: "",
      });
      setEditingExerciseIndex(-1);
    }

    setExerciseModalVisible(true);
  };

  const saveExercise = () => {
    if (
      !currentExercise.name.trim() ||
      !currentExercise.sets.trim() ||
      !currentExercise.reps.trim()
    ) {
      Alert.alert(
        "Incompleto",
        "Nombre, series y repeticiones son requeridos.",
      );
      return;
    }

    const ex = {
      name: currentExercise.name.trim(),
      sets: currentExercise.sets.trim(),
      reps: currentExercise.reps.trim(),
      restSeconds: currentExercise.restSeconds.trim(),
      notes: currentExercise.notes.trim(),
    };

    if (editingExerciseIndex >= 0) {
      const newExs = [...exercises];
      newExs[editingExerciseIndex] = ex;
      setExercises(newExs);
    } else {
      setExercises([...exercises, ex]);
    }

    setExerciseModalVisible(false);
  };

  const removeExercise = (index) => {
    const newExs = [...exercises];
    newExs.splice(index, 1);
    setExercises(newExs);
  };

  const moveExercise = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === exercises.length - 1) return;

    const newExs = [...exercises];
    const temp = newExs[index];
    newExs[index] = newExs[index + direction];
    newExs[index + direction] = temp;
    setExercises(newExs);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0B0B0F",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#FF9500" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B0B0F" }}>
      <View className="px-5 pt-4 pb-2 flex-row items-center border-b border-white/5 justify-between bg-[#0B0B0F]">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-4"
          >
            {/* CORRECCIÓN: chevron.left -> chevron-back */}
            <Ionicons name="chevron-back" size={20} color="#FFF" />
          </TouchableOpacity>

          <Text className="text-white text-xl font-black">
            {isEditing ? "Editar Rutina" : "Nueva Rutina"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 rounded-xl ${isSaving ? "bg-orange-800" : "bg-orange-500"}`}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text className="text-black font-black text-xs">GUARDAR</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: "#0B0B0F" }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
          style={{ flex: 1, backgroundColor: "#0B0B0F" }}
        >
          <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
            Título de la Rutina
          </Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Destructor de Piernas"
            placeholderTextColor="#777"
            className="bg-[#1C1C1E] p-4 rounded-2xl text-white border border-white/10 mb-4 font-bold text-lg"
          />

          <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
            Subtítulo o Descripción Corta
          </Text>

          <TextInput
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="Ej: Enfoque en cuádriceps y glúteos"
            placeholderTextColor="#777"
            className="bg-[#1C1C1E] p-4 rounded-2xl text-white border border-white/10 mb-6"
          />

          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
                Nivel
              </Text>
              <TouchableOpacity
                onPress={() => openPicker("level")}
                className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/10 flex-row justify-between items-center"
              >
                <Text className="text-white font-bold">{level}</Text>
                {/* CORRECCIÓN: chevron.right -> chevron-forward */}
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
                Duración
              </Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="45"
                placeholderTextColor="#777"
                className="bg-[#1C1C1E] p-4 rounded-2xl text-white border border-white/10 font-bold"
              />
            </View>
          </View>

          <View className="flex-row gap-4 mb-6">
            <View className="flex-1">
              <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
                Zona Muscular
              </Text>
              <TouchableOpacity
                onPress={() => openPicker("bodyPart")}
                className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/10 flex-row justify-between items-center"
              >
                <Text className="text-white font-bold">{bodyPart}</Text>
                {/* CORRECCIÓN: chevron.right -> chevron-forward */}
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>
            </View>

            <View className="flex-1">
              <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
                Objetivo
              </Text>
              <TouchableOpacity
                onPress={() => openPicker("goal")}
                className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/10 flex-row justify-between items-center"
              >
                <Text className="text-white font-bold">{goal}</Text>
                {/* CORRECCIÓN: chevron.right -> chevron-forward */}
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setFeatured(!featured)}
            className={`p-4 rounded-2xl flex-row items-center justify-between border mb-8 ${
              featured
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-[#1C1C1E] border-white/10"
            }`}
          >
            <View>
              <Text
                className={`font-bold ${featured ? "text-orange-400" : "text-white"}`}
              >
                Destacar Rutina
              </Text>
              <Text className="text-gray-500 text-xs mt-0.5">
                Aparecerá en destacados por 3 días
              </Text>
            </View>

            <View
              className={`w-6 h-6 rounded-full border items-center justify-center ${
                featured ? "bg-orange-500 border-orange-500" : "border-gray-500"
              }`}
            >
              {featured && <Ionicons name="checkmark" size={14} color="#000" />}
            </View>
          </TouchableOpacity>

          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-black">
              Ejercicios ({exercises.length})
            </Text>

            <TouchableOpacity
              onPress={() => openExerciseModal()}
              className="bg-white/10 px-4 py-2 rounded-xl"
            >
              <Text className="text-white font-bold text-xs">+ AGREGAR</Text>
            </TouchableOpacity>
          </View>

          {exercises.length === 0 ? (
            <View className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/10 items-center justify-center">
              <Text className="text-gray-500 font-bold">
                No hay ejercicios agregados aún.
              </Text>
            </View>
          ) : (
            exercises.map((ex, idx) => (
              <View
                key={`${ex.name}-${idx}`}
                className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/10 mb-3"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-4">
                    <Text className="text-white font-black text-lg">
                      {idx + 1}. {ex.name}
                    </Text>

                    <View className="flex-row mt-1 gap-3">
                      <Text className="text-orange-400 font-bold text-xs">
                        {ex.sets} Series
                      </Text>
                      <Text className="text-orange-400 font-bold text-xs">
                        {ex.reps} Reps
                      </Text>
                      {!!ex.restSeconds && (
                        <Text className="text-gray-400 font-bold text-xs">
                          {ex.restSeconds}s Rest
                        </Text>
                      )}
                    </View>

                    {!!ex.notes && (
                      <Text className="text-gray-500 text-xs mt-2 italic">
                        {ex.notes}
                      </Text>
                    )}
                  </View>

                  <View className="flex-col gap-2">
                    <TouchableOpacity
                      onPress={() => openExerciseModal(idx)}
                      className="bg-blue-500/20 p-2 rounded-lg items-center"
                    >
                      <Ionicons name="pencil" size={16} color="#3B82F6" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => removeExercise(idx)}
                      className="bg-red-500/20 p-2 rounded-lg items-center"
                    >
                      {/* CORRECCIÓN: xmark -> close */}
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                  <TouchableOpacity
                    onPress={() => moveExercise(idx, -1)}
                    disabled={idx === 0}
                    className={`p-2 rounded-full ${idx === 0 ? "opacity-20" : "bg-white/10"}`}
                  >
                    <Text className="text-white font-bold text-xs">Subir</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => moveExercise(idx, 1)}
                    disabled={idx === exercises.length - 1}
                    className={`p-2 rounded-full ${idx === exercises.length - 1 ? "opacity-20" : "bg-white/10"}`}
                  >
                    <Text className="text-white font-bold text-xs">Bajar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerVisible} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center px-4">
          <View className="bg-[#1C1C1E] w-full rounded-3xl border border-white/10 overflow-hidden max-h-[70%]">
            <View className="p-5 border-b border-white/5 flex-row justify-between items-center bg-[#111]">
              <Text className="text-white font-black text-lg">
                Seleccionar Opción
              </Text>

              <TouchableOpacity
                onPress={() => setPickerVisible(false)}
                className="bg-white/10 p-2 rounded-full"
              >
                {/* CORRECCIÓN: xmark -> close */}
                <Ionicons name="close" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {getPickerOptions().map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => selectPickerValue(opt)}
                  className="py-4 border-b border-white/5"
                >
                  <Text className="text-white font-bold text-lg text-center">
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={exerciseModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-black/90 justify-end"
        >
          <View className="bg-[#1C1C1E] w-full rounded-t-3xl border-t border-white/10 p-6 pb-10">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-xl font-black">
                {editingExerciseIndex >= 0
                  ? "Editar Ejercicio"
                  : "Nuevo Ejercicio"}
              </Text>

              <TouchableOpacity
                onPress={() => setExerciseModalVisible(false)}
                className="bg-white/10 p-2 rounded-full"
              >
                {/* CORRECCIÓN: xmark -> close */}
                <Ionicons name="close" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
              Nombre del Ejercicio
            </Text>
            <TextInput
              value={currentExercise.name}
              onChangeText={(v) =>
                setCurrentExercise({ ...currentExercise, name: v })
              }
              placeholder="Ej: Press de Banca"
              placeholderTextColor="#777"
              className="bg-white/5 p-4 rounded-2xl text-white border border-white/10 mb-4 font-bold"
            />

            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
                  Series
                </Text>
                <TextInput
                  value={currentExercise.sets}
                  onChangeText={(v) =>
                    setCurrentExercise({ ...currentExercise, sets: v })
                  }
                  placeholder="Ej: 4"
                  keyboardType="numeric"
                  placeholderTextColor="#777"
                  className="bg-white/5 p-4 rounded-2xl text-white border border-white/10 font-bold"
                />
              </View>

              <View className="flex-1">
                <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
                  Reps
                </Text>
                <TextInput
                  value={currentExercise.reps}
                  onChangeText={(v) =>
                    setCurrentExercise({ ...currentExercise, reps: v })
                  }
                  placeholder="Ej: 10-12"
                  placeholderTextColor="#777"
                  className="bg-white/5 p-4 rounded-2xl text-white border border-white/10 font-bold"
                />
              </View>
            </View>

            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
              Descanso
            </Text>
            <TextInput
              value={currentExercise.restSeconds}
              onChangeText={(v) =>
                setCurrentExercise({ ...currentExercise, restSeconds: v })
              }
              placeholder="Ej: 90 segundos"
              keyboardType="numeric"
              placeholderTextColor="#777"
              className="bg-white/5 p-4 rounded-2xl text-white border border-white/10 mb-4 font-bold"
            />

            <Text className="text-gray-400 text-[10px] font-bold uppercase mb-2 ml-1">
              Notas Opcionales
            </Text>
            <TextInput
              value={currentExercise.notes}
              onChangeText={(v) =>
                setCurrentExercise({ ...currentExercise, notes: v })
              }
              placeholder="Ej: Controlar la excéntrica"
              placeholderTextColor="#777"
              className="bg-white/5 p-4 rounded-2xl text-white border border-white/10 mb-8"
            />

            <TouchableOpacity
              onPress={saveExercise}
              className="bg-orange-500 py-4 rounded-2xl items-center"
            >
              <Text className="text-black font-black tracking-widest text-lg">
                {editingExerciseIndex >= 0
                  ? "GUARDAR CAMBIOS"
                  : "AGREGAR EJERCICIO"}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
