import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { db } from "@/src/config/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { createClass, deleteClass } from "@/src/services/gymService";

export default function ManageClassesScreen() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados del Formulario
  const [className, setClassName] = useState("");
  const [coachName, setCoachName] = useState("");
  const [classDate, setClassDate] = useState(""); // Formato YYYY-MM-DD
  const [startTime, setStartTime] = useState("");
  const [totalSpots, setTotalSpots] = useState("");

  // 1. Cargar las clases desde Firebase
  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "classes"), orderBy("date", "asc"));
      const querySnapshot = await getDocs(q);
      const loadedClasses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClasses(loadedClasses);
    } catch (error) {
      console.error("Error al cargar clases: ", error);
      Alert.alert("Error", "No se pudieron cargar los horarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // 2. Crear una nueva clase
  const handleCreate = async () => {
    if (!className || !coachName || !classDate || !startTime || !totalSpots) {
      Alert.alert("Campos incompletos", "Por favor llena todos los datos de la clase.");
      return;
    }

    setIsSaving(true);
    try {
      const newClassData = {
        name: className,
        coachName: coachName,
        date: classDate,
        startTime: startTime,
        totalSpots: parseInt(totalSpots, 10)
      };

      await createClass(newClassData);
      
      // Limpiar formulario y cerrar modal
      setClassName("");
      setCoachName("");
      setClassDate("");
      setStartTime("");
      setTotalSpots("");
      setModalVisible(false);
      
      Alert.alert("Éxito", "La clase ha sido publicada.");
      fetchClasses(); // Recargar la lista
    } catch (error) {
      Alert.alert("Error", "Hubo un problema al crear la clase.");
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Eliminar clase
  const handleDelete = (id, name) => {
    Alert.alert(
      "Eliminar Clase", 
      `¿Estás seguro de que quieres cancelar la clase de ${name}?`, 
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            const result = await deleteClass(id);
            if (result.success) {
              // Actualizamos el estado local para borrarlo visualmente de inmediato
              setClasses(classes.filter(c => c.id !== id));
            } else {
              Alert.alert("Error", "No se pudo eliminar la clase.");
            }
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-impulse-dark pt-16 px-5">
      {/* Botón Volver */}
      <TouchableOpacity onPress={() => router.back()} className="mb-4 w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
        <IconSymbol name="chevron.left" size={20} color="#00E5FF" />
      </TouchableOpacity>

      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-white text-3xl font-black">Horarios</Text>
          <Text className="text-gray-500 text-sm">Gestiona las sesiones diarias</Text>
        </View>
        <TouchableOpacity 
          onPress={() => setModalVisible(true)}
          className="bg-emerald-500 w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <IconSymbol name="plus" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Lista de Clases */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : classes.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <IconSymbol name="calendar.badge.exclamationmark" size={48} color="#444" />
          <Text className="text-gray-500 font-bold mt-4">No hay clases programadas.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {classes.map((item) => (
            <View key={item.id} className="bg-impulse-gray p-5 rounded-3xl mb-4 border border-white/5 flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-white font-black text-xl">{item.name}</Text>
                <Text className="text-emerald-500 font-bold text-xs uppercase mb-1">{item.date} • {item.startTime}</Text>
                <Text className="text-gray-400 text-xs">Coach: {item.coachName} • {item.availableSpots}/{item.totalSpots} lugares</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleDelete(item.id, item.name)}
                className="bg-red-500/10 p-4 rounded-2xl ml-4 border border-red-500/20"
              >
                <IconSymbol name="trash.fill" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODAL DE CREACIÓN */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/80"
        >
          <View className="bg-impulse-gray p-8 pt-6 rounded-t-[40px] border-t border-white/10 max-h-[90%]">
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6" />
              
              <Text className="text-white text-2xl font-black mb-6">Nueva Clase</Text>
              
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Disciplina</Text>
                  <TextInput value={className} onChangeText={setClassName} placeholder="Ej: CrossFit" placeholderTextColor="#444" className="bg-white/5 p-4 rounded-2xl text-white border border-white/5" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Coach</Text>
                  <TextInput value={coachName} onChangeText={setCoachName} placeholder="Ej: David" placeholderTextColor="#444" className="bg-white/5 p-4 rounded-2xl text-white border border-white/5" />
                </View>
              </View>

              <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Fecha (YYYY-MM-DD)</Text>
              <TextInput value={classDate} onChangeText={setClassDate} placeholder="Ej: 2026-03-24" placeholderTextColor="#444" className="bg-white/5 p-4 rounded-2xl text-white mb-4 border border-white/5" />
              
              <View className="flex-row gap-4 mb-8">
                <View className="flex-1">
                  <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Hora Inicio</Text>
                  <TextInput value={startTime} onChangeText={setStartTime} placeholder="Ej: 07:00" placeholderTextColor="#444" className="bg-white/5 p-4 rounded-2xl text-white border border-white/5" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Lugares</Text>
                  <TextInput value={totalSpots} onChangeText={setTotalSpots} keyboardType="numeric" placeholder="Ej: 15" placeholderTextColor="#444" className="bg-white/5 p-4 rounded-2xl text-white border border-white/5" />
                </View>
              </View>
              
              <View className="flex-row gap-4 mb-6">
                <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 py-4 justify-center items-center bg-white/5 rounded-2xl border border-white/10">
                  <Text className="text-white font-bold tracking-widest">CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleCreate} 
                  disabled={isSaving}
                  className={`flex-1 py-4 rounded-2xl items-center justify-center shadow-lg shadow-emerald-500/20 ${isSaving ? 'bg-emerald-800' : 'bg-emerald-500'}`}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text className="text-black font-black tracking-widest">PUBLICAR</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}