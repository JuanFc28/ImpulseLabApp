import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/src/config/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createClass, deleteClass } from "@/src/services/gymService";

export default function ManageClassesScreen() {
    const formScrollRef = useRef(null);

    const [classes, setClasses] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCoaches, setIsLoadingCoaches] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [className, setClassName] = useState("");
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [classDate, setClassDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [totalSpots, setTotalSpots] = useState("");

    const [activePicker, setActivePicker] = useState(null);
    const [tempDate, setTempDate] = useState(new Date());
    const [tempTime, setTempTime] = useState(new Date());

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const formatTime = (date) => {
        const hours = `${date.getHours()}`.padStart(2, "0");
        const minutes = `${date.getMinutes()}`.padStart(2, "0");
        return `${hours}:${minutes}`;
    };

    const keepScrollPosition = (y = 260) => {
        setTimeout(() => {
            formScrollRef.current?.scrollTo({
                y,
                animated: false,
            });
        }, 80);
    };

    const fetchClasses = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "classes"), orderBy("date", "asc"));
            const querySnapshot = await getDocs(q);
            const loadedClasses = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setClasses(loadedClasses);
        } catch (error) {
            Alert.alert("Error", "No se pudieron cargar los horarios.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCoaches = async () => {
        setIsLoadingCoaches(true);
        try {
            const q = query(collection(db, "users"), where("role", "==", "coach"));
            const querySnapshot = await getDocs(q);
            const loadedCoaches = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCoaches(loadedCoaches);
        } catch (error) {
            console.error("Error al cargar coaches: ", error);
        } finally {
            setIsLoadingCoaches(false);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchCoaches();
    }, []);

    const resetForm = () => {
        setClassName("");
        setSelectedCoach(null);
        setClassDate("");
        setStartTime("");
        setTotalSpots("");
        setActivePicker(null);
        setTempDate(new Date());
        setTempTime(new Date());
    };

    const openDatePicker = () => {
        Keyboard.dismiss();
        setTempDate(classDate ? new Date(`${classDate}T12:00:00`) : new Date());
        setActivePicker("date");
        keepScrollPosition(240);
    };

    const openTimePicker = () => {
        Keyboard.dismiss();
        setTempTime(startTime ? new Date(`2000-01-01T${startTime}:00`) : new Date());
        setActivePicker("time");
        keepScrollPosition(410);
    };

    const handleCreate = async () => {
        Keyboard.dismiss();

        if (!className || !selectedCoach || !classDate || !startTime || !totalSpots) {
            Alert.alert("Campos incompletos", "Por favor llena todos los datos de la clase.");
            return;
        }

        const parsedSpots = parseInt(totalSpots, 10);

        if (Number.isNaN(parsedSpots) || parsedSpots <= 0) {
            Alert.alert("Lugares inválidos", "Ingresa un número válido de lugares.");
            return;
        }

        setIsSaving(true);

        try {
            await createClass({
                name: className.trim(),
                coachId: selectedCoach.id,
                coachName: selectedCoach.name || selectedCoach.email || "Coach",
                date: classDate,
                startTime: startTime.trim(),
                totalSpots: parsedSpots,
            });

            resetForm();
            setModalVisible(false);
            Alert.alert("Éxito", "La clase ha sido publicada.");
            fetchClasses();
        } catch (error) {
            Alert.alert("Error", "Hubo un problema al crear la clase.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id, name) => {
        Alert.alert("Eliminar Clase", `¿Estás seguro de cancelar la clase de ${name}?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    const result = await deleteClass(id);
                    if (result.success) {
                        setClasses(classes.filter((c) => c.id !== id));
                    } else {
                        Alert.alert("Error", "No se pudo eliminar la clase.");
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
            <View className="flex-1 px-5 pt-6">
                <View className="flex-row justify-between items-center mb-8">
                    <View>
                        <Text className="text-white text-3xl font-black">Horarios</Text>
                        <Text className="text-gray-500 text-sm">Gestiona las sesiones diarias</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}
                        className="bg-emerald-500 w-14 h-14 rounded-full items-center justify-center"
                    >
                        <IconSymbol name="plus" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

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
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        {classes.map((item) => (
                            <View
                                key={item.id}
                                className="bg-[#1C1C1E] p-5 rounded-3xl mb-4 border border-white/5 flex-row justify-between items-center"
                            >
                                <View className="flex-1">
                                    <Text className="text-white font-black text-xl">{item.name}</Text>
                                    <View className="flex-row items-center mt-1 mb-2">
                                        <IconSymbol name="calendar" size={12} color="#10B981" />
                                        <Text className="text-emerald-500 font-bold text-[10px] uppercase ml-1">
                                            {item.date} • {item.startTime}
                                        </Text>
                                    </View>
                                    <Text className="text-gray-400 text-xs">
                                        Coach: {item.coachName || "Sin asignar"} •{" "}
                                        {item.availableSpots ?? item.totalSpots}/{item.totalSpots} lugares
                                    </Text>
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
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-end bg-black/80"
                >
                    <View className="bg-[#1C1C1E] p-8 pt-6 rounded-t-[40px] border-t border-white/10 max-h-[92%]">
                        <ScrollView
                            ref={formScrollRef}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            maintainVisibleContentPosition={{
                                minIndexForVisible: 0,
                            }}
                        >
                            <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6" />
                            <Text className="text-white text-2xl font-black mb-6">Nueva Clase</Text>

                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Disciplina</Text>
                            <TextInput
                                value={className}
                                onChangeText={setClassName}
                                placeholder="Ej: CrossFit"
                                placeholderTextColor="#444"
                                returnKeyType="done"
                                onFocus={() => setActivePicker(null)}
                                onSubmitEditing={Keyboard.dismiss}
                                className="bg-white/5 p-4 rounded-2xl text-white border border-white/5 mb-4 font-bold"
                            />

                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Coach asignado</Text>

                            {isLoadingCoaches ? (
                                <ActivityIndicator color="#10B981" className="mb-4" />
                            ) : coaches.length === 0 ? (
                                <Text className="text-gray-400 mb-4 italic">No hay coaches registrados.</Text>
                            ) : (
                                <View className="mb-4">
                                    {coaches.map((coach) => {
                                        const isSelected = selectedCoach?.id === coach.id;

                                        return (
                                            <TouchableOpacity
                                                key={coach.id}
                                                onPress={() => {
                                                    Keyboard.dismiss();
                                                    setActivePicker(null);
                                                    setSelectedCoach(coach);
                                                }}
                                                className={`p-4 rounded-2xl mb-2 border ${
                                                    isSelected
                                                        ? "bg-emerald-500/20 border-emerald-500/40"
                                                        : "bg-white/5 border-white/5"
                                                }`}
                                            >
                                                <Text className={`font-bold ${isSelected ? "text-emerald-500" : "text-white"}`}>
                                                    {coach.name || coach.email || "Coach"}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Fecha de la sesión</Text>
                            <TouchableOpacity
                                onPress={openDatePicker}
                                className="bg-white/5 p-4 rounded-2xl mb-4 border border-white/5 flex-row items-center justify-between"
                            >
                                <Text className={classDate ? "text-white font-bold" : "text-[#444]"}>
                                    {classDate || "Seleccionar fecha"}
                                </Text>
                                <IconSymbol name="calendar" size={18} color="#10B981" />
                            </TouchableOpacity>

                            {activePicker === "date" && (
                                <View className="bg-black/30 rounded-3xl border border-white/10 p-4 mb-5">
                                    <DateTimePicker
                                        value={tempDate}
                                        mode="date"
                                        display={Platform.OS === "ios" ? "inline" : "default"}
                                        minimumDate={new Date()}
                                        themeVariant="dark"
                                        textColor="#FFFFFF"
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS !== "ios") {
                                                setActivePicker(null);
                                                if (selectedDate) {
                                                    setTempDate(selectedDate);
                                                    setClassDate(formatDate(selectedDate));
                                                    keepScrollPosition(260);
                                                }
                                                return;
                                            }

                                            if (selectedDate) setTempDate(selectedDate);
                                        }}
                                    />

                                    {Platform.OS === "ios" && (
                                        <View className="flex-row gap-4 mt-4">
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setActivePicker(null);
                                                    keepScrollPosition(230);
                                                }}
                                                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 items-center"
                                            >
                                                <Text className="text-white font-bold tracking-widest">CANCELAR</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    setClassDate(formatDate(tempDate));
                                                    setActivePicker(null);
                                                    keepScrollPosition(260);
                                                }}
                                                className="flex-1 py-4 rounded-2xl bg-emerald-500 items-center"
                                            >
                                                <Text className="text-black font-black tracking-widest">CONFIRMAR</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View className="flex-row gap-4 mb-5">
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Hora de inicio</Text>
                                    <TouchableOpacity
                                        onPress={openTimePicker}
                                        className="bg-white/5 p-4 rounded-2xl border border-white/5 flex-row items-center justify-between"
                                    >
                                        <Text className={startTime ? "text-white font-bold" : "text-[#444]"}>
                                            {startTime || "--:--"}
                                        </Text>
                                        <IconSymbol name="clock.fill" size={18} color="#10B981" />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-1">
                                    <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">Cupo (Lugares)</Text>
                                    <View className="bg-white/5 p-4 rounded-2xl border border-white/5 flex-row items-center">
                                        <TextInput
                                            value={totalSpots}
                                            onChangeText={setTotalSpots}
                                            keyboardType="numeric"
                                            returnKeyType="done"
                                            onFocus={() => setActivePicker(null)}
                                            onSubmitEditing={Keyboard.dismiss}
                                            blurOnSubmit
                                            placeholder="Ej: 15"
                                            placeholderTextColor="#444"
                                            className="text-white font-bold p-0 flex-1"
                                        />
                                    </View>
                                </View>
                            </View>

                            {activePicker === "time" && (
                                <View className="bg-black/30 rounded-3xl border border-white/10 p-4 mb-5">
                                    <DateTimePicker
                                        value={tempTime}
                                        mode="time"
                                        is24Hour
                                        display={Platform.OS === "ios" ? "spinner" : "default"}
                                        themeVariant="dark"
                                        textColor="#FFFFFF"
                                        onChange={(event, selectedDate) => {
                                            if (Platform.OS !== "ios") {
                                                setActivePicker(null);
                                                if (selectedDate) {
                                                    setTempTime(selectedDate);
                                                    setStartTime(formatTime(selectedDate));
                                                    keepScrollPosition(410);
                                                }
                                                return;
                                            }

                                            if (selectedDate) setTempTime(selectedDate);
                                        }}
                                    />

                                    {Platform.OS === "ios" && (
                                        <View className="flex-row gap-4 mt-4">
                                            <TouchableOpacity
                                                onPress={() => {
                                                    setActivePicker(null);
                                                    keepScrollPosition(360);
                                                }}
                                                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 items-center"
                                            >
                                                <Text className="text-white font-bold tracking-widest">CANCELAR</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    setStartTime(formatTime(tempTime));
                                                    setActivePicker(null);
                                                    keepScrollPosition(410);
                                                }}
                                                className="flex-1 py-4 rounded-2xl bg-emerald-500 items-center"
                                            >
                                                <Text className="text-black font-black tracking-widest">CONFIRMAR</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}

                            <View className="flex-row gap-4 mb-6">
                                <TouchableOpacity
                                    onPress={() => {
                                        resetForm();
                                        setModalVisible(false);
                                    }}
                                    className="flex-1 py-4 justify-center items-center bg-white/5 rounded-2xl border border-white/10"
                                >
                                    <Text className="text-white font-bold tracking-widest">CANCELAR</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleCreate}
                                    disabled={isSaving}
                                    className={`flex-1 py-4 rounded-2xl items-center justify-center ${
                                        isSaving ? "bg-emerald-800" : "bg-emerald-500"
                                    }`}
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
        </SafeAreaView>
    );
}