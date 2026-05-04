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
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
} from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createClass, deleteClass } from "@/src/services/gymService";

const WEEK_DAYS = [
    { label: "L", fullLabel: "Lunes", value: "monday" },
    { label: "M", fullLabel: "Martes", value: "tuesday" },
    { label: "X", fullLabel: "Miércoles", value: "wednesday" },
    { label: "J", fullLabel: "Jueves", value: "thursday" },
    { label: "V", fullLabel: "Viernes", value: "friday" },
    { label: "S", fullLabel: "Sábado", value: "saturday" },
    { label: "D", fullLabel: "Domingo", value: "sunday" },
];

const getSafeSpots = (item) => {
    const available = item?.availableSpots ?? item?.totalSpots ?? 0;
    return Math.max(available, 0);
};

export default function ManageClassesScreen() {
    const formScrollRef = useRef(null);

    const [classes, setClasses] = useState([]);
    const [coaches, setCoaches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCoaches, setIsLoadingCoaches] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingClass, setEditingClass] = useState(null);

    const [className, setClassName] = useState("");
    const [selectedCoach, setSelectedCoach] = useState(null);
    const [classDate, setClassDate] = useState("");
    const [selectedDays, setSelectedDays] = useState([]);
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

    const toggleDay = (day) => {
        setSelectedDays((prevDays) => {
            if (prevDays.includes(day)) {
                return prevDays.filter((item) => item !== day);
            }

            return [...prevDays, day];
        });
    };

    const getDaysText = (days = []) => {
        if (!days.length) return "Sin días seleccionados";

        return WEEK_DAYS
            .filter((day) => days.includes(day.value))
            .map((day) => day.fullLabel)
            .join(", ");
    };

    const fetchClasses = async () => {
        setIsLoading(true);

        try {
            const q = query(collection(db, "classes"));
            const querySnapshot = await getDocs(q);

            const loadedClasses = querySnapshot.docs.map((classDoc) => ({
                id: classDoc.id,
                ...classDoc.data(),
            }));

            loadedClasses.sort((a, b) => {
                const dateA = a.startDate || a.date || "";
                const dateB = b.startDate || b.date || "";

                if (dateA === dateB) {
                    return (a.startTime || "").localeCompare(b.startTime || "");
                }

                return dateA.localeCompare(dateB);
            });

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

            const loadedCoaches = querySnapshot.docs.map((coachDoc) => ({
                id: coachDoc.id,
                ...coachDoc.data(),
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
        setSelectedDays([]);
        setStartTime("");
        setTotalSpots("");
        setActivePicker(null);
        setTempDate(new Date());
        setTempTime(new Date());
        setEditingClass(null);
    };

    const openCreateModal = () => {
        resetForm();
        setModalVisible(true);
    };

    const openEditModal = (classItem) => {
        Keyboard.dismiss();

        if (classItem.status === "cancelled" || classItem.active === false) {
            Alert.alert(
                "Clase cancelada",
                "Esta clase fue cancelada por el coach. Puedes eliminarla definitivamente con el botón de bote de basura."
            );
            return;
        }

        const coachMatch =
            coaches.find((coach) => coach.id === classItem.coachId) || {
                id: classItem.coachId,
                name: classItem.coachName,
                email: classItem.coachName,
            };

        setEditingClass(classItem);
        setClassName(classItem.name || "");
        setSelectedCoach(coachMatch);
        setClassDate(classItem.startDate || classItem.date || "");
        setSelectedDays(classItem.recurrenceDays || []);
        setStartTime(classItem.startTime || "");
        setTotalSpots(String(classItem.totalSpots || ""));
        setActivePicker(null);

        if (classItem.startDate || classItem.date) {
            setTempDate(new Date(`${classItem.startDate || classItem.date}T12:00:00`));
        } else {
            setTempDate(new Date());
        }

        if (classItem.startTime) {
            setTempTime(new Date(`2000-01-01T${classItem.startTime}:00`));
        } else {
            setTempTime(new Date());
        }

        setModalVisible(true);
    };

    const closeModal = () => {
        resetForm();
        setModalVisible(false);
    };

    const openDatePicker = () => {
        Keyboard.dismiss();
        setTempDate(classDate ? new Date(`${classDate}T12:00:00`) : new Date());
        setActivePicker("date");
        keepScrollPosition(350);
    };

    const openTimePicker = () => {
        Keyboard.dismiss();
        setTempTime(startTime ? new Date(`2000-01-01T${startTime}:00`) : new Date());
        setActivePicker("time");
        keepScrollPosition(560);
    };

    const handleSave = async () => {
        Keyboard.dismiss();

        if (!className || !selectedCoach || !classDate || selectedDays.length === 0 || !startTime || !totalSpots) {
            Alert.alert("Campos incompletos", "Por favor llena todos los datos de la clase.");
            return;
        }

        const parsedSpots = parseInt(totalSpots, 10);

        if (Number.isNaN(parsedSpots) || parsedSpots <= 0) {
            Alert.alert("Lugares inválidos", "Ingresa un número válido de lugares.");
            return;
        }

        const payload = {
            name: className.trim(),
            coachId: selectedCoach.id,
            coachName: selectedCoach.name || selectedCoach.email || "Coach",
            startTime: startTime.trim(),
            totalSpots: parsedSpots,
            recurrenceType: "weekly",
            recurrenceDays: selectedDays,
            startDate: classDate,
            endDate: null,
            active: true,
            status: "active",
            availableSpots: parsedSpots,
        };

        setIsSaving(true);

        try {
            if (editingClass) {
                await updateDoc(doc(db, "classes", editingClass.id), {
                    ...payload,
                    updatedAt: new Date(),
                });

                Alert.alert("Éxito", "La clase ha sido actualizada.");
            } else {
                await createClass(payload);
                Alert.alert("Éxito", "La clase recurrente ha sido publicada.");
            }

            resetForm();
            setModalVisible(false);
            fetchClasses();
        } catch (error) {
            console.error("Error al guardar clase:", error);
            Alert.alert("Error", "Hubo un problema al guardar la clase.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClass = (classId, classNameValue) => {
        Alert.alert(
            "Eliminar clase",
            `¿Seguro que quieres eliminar "${classNameValue}"? Esta acción borra la clase de Firestore y no se puede deshacer.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                        const result = await deleteClass(classId);

                        if (result.success) {
                            Alert.alert("Eliminada", "La clase fue eliminada correctamente.");
                            fetchClasses();
                        } else {
                            Alert.alert("Error", result.message || "No se pudo eliminar la clase.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
            <View className="flex-1 px-5 pt-6">
                <View className="flex-row justify-between items-center mb-8">
                    <View>
                        <Text className="text-white text-3xl font-black">Horarios</Text>
                        <Text className="text-gray-500 text-sm">
                            Crea, edita y elimina sesiones recurrentes
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={openCreateModal}
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
                        {classes.map((item) => {
                            const isCancelled = item.status === "cancelled" || item.active === false;
                            const safeSpots = getSafeSpots(item);

                            return (
                                <View
                                    key={item.id}
                                    className={`p-5 rounded-3xl mb-4 border ${
                                        isCancelled
                                            ? "bg-red-500/10 border-red-500/30"
                                            : "bg-[#1C1C1E] border-white/5"
                                    }`}
                                >
                                    <View className="flex-row justify-between items-center">
                                        <View className="flex-1">
                                            <View className="flex-row items-center flex-wrap">
                                                <Text
                                                    className={`font-black text-xl ${
                                                        isCancelled ? "text-red-400" : "text-white"
                                                    }`}
                                                >
                                                    {item.name}
                                                </Text>

                                                {isCancelled && (
                                                    <View className="bg-red-500/20 px-2 py-1 rounded-full border border-red-500/30 ml-2">
                                                        <Text className="text-red-400 text-[9px] font-black uppercase">
                                                            Cancelada
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>

                                            <View className="flex-row items-center mt-1 mb-2">
                                                <IconSymbol
                                                    name="calendar"
                                                    size={12}
                                                    color={isCancelled ? "#EF4444" : "#10B981"}
                                                />
                                                <Text
                                                    className={`font-bold text-[10px] uppercase ml-1 ${
                                                        isCancelled ? "text-red-400" : "text-emerald-500"
                                                    }`}
                                                >
                                                    Inicia {item.startDate || item.date || "Sin fecha"} • {item.startTime}
                                                </Text>
                                            </View>

                                            <Text
                                                className={`text-xs mb-1 ${
                                                    isCancelled ? "text-red-300" : "text-gray-400"
                                                }`}
                                            >
                                                Se repite: {getDaysText(item.recurrenceDays)}
                                            </Text>

                                            {Array.isArray(item.cancelledDates) &&
                                                item.cancelledDates.length > 0 &&
                                                !isCancelled && (
                                                    <Text className="text-red-400 text-[10px] font-bold mb-1">
                                                        Fechas canceladas por coach: {item.cancelledDates.join(", ")}
                                                    </Text>
                                                )}

                                            <Text
                                                className={`text-xs ${
                                                    isCancelled ? "text-red-300" : "text-gray-400"
                                                }`}
                                            >
                                                Coach: {item.coachName || "Sin asignar"} •{" "}
                                                {safeSpots}/{item.totalSpots} lugares
                                            </Text>
                                        </View>

                                        <View className="flex-row ml-4">
                                            <TouchableOpacity
                                                onPress={() => openEditModal(item)}
                                                disabled={isCancelled}
                                                className={`p-4 rounded-2xl border mr-2 ${
                                                    isCancelled
                                                        ? "bg-white/5 border-white/5 opacity-40"
                                                        : "bg-emerald-500/10 border-emerald-500/20"
                                                }`}
                                            >
                                                <IconSymbol
                                                    name="pencil"
                                                    size={20}
                                                    color={isCancelled ? "#666" : "#10B981"}
                                                />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => handleDeleteClass(item.id, item.name)}
                                                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20"
                                            >
                                                <IconSymbol name="trash.fill" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {isCancelled && (
                                        <View className="mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
                                            <Text className="text-red-400 text-xs font-bold">
                                                Esta clase fue cancelada. Si ya no debe aparecer en administración, puedes eliminarla con el bote de basura.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
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

                            <Text className="text-white text-2xl font-black mb-6">
                                {editingClass ? "Editar Clase" : "Nueva Clase"}
                            </Text>

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

                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">
                                Coach asignado
                            </Text>

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
                                                <Text
                                                    className={`font-bold ${
                                                        isSelected ? "text-emerald-500" : "text-white"
                                                    }`}
                                                >
                                                    {coach.name || coach.email || "Coach"}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">
                                Inicia desde
                            </Text>

                            <Text className="text-gray-500 text-xs mb-3 ml-1">
                                Esta fecha indica desde cuándo comenzará a aparecer la clase en el calendario.
                            </Text>

                            <TouchableOpacity
                                onPress={openDatePicker}
                                className="bg-white/5 p-4 rounded-2xl mb-4 border border-white/5 flex-row items-center justify-between"
                            >
                                <Text className={classDate ? "text-white font-bold" : "text-[#444]"}>
                                    {classDate || "Seleccionar fecha de inicio"}
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
                                                    keepScrollPosition(350);
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
                                                    keepScrollPosition(330);
                                                }}
                                                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 items-center"
                                            >
                                                <Text className="text-white font-bold tracking-widest">CANCELAR</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    setClassDate(formatDate(tempDate));
                                                    setActivePicker(null);
                                                    keepScrollPosition(350);
                                                }}
                                                className="flex-1 py-4 rounded-2xl bg-emerald-500 items-center"
                                            >
                                                <Text className="text-black font-black tracking-widest">CONFIRMAR</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}

                            <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">
                                Se repite los días
                            </Text>

                            <Text className="text-gray-500 text-xs mb-3 ml-1">
                                Selecciona los días en los que esta clase se mostrará cada semana.
                            </Text>

                            <View className="flex-row flex-wrap gap-2 mb-5">
                                {WEEK_DAYS.map((day) => {
                                    const isSelected = selectedDays.includes(day.value);

                                    return (
                                        <TouchableOpacity
                                            key={day.value}
                                            onPress={() => {
                                                Keyboard.dismiss();
                                                setActivePicker(null);
                                                toggleDay(day.value);
                                            }}
                                            className={`w-11 h-11 rounded-full items-center justify-center border ${
                                                isSelected
                                                    ? "bg-emerald-500 border-emerald-500"
                                                    : "bg-white/5 border-white/10"
                                            }`}
                                        >
                                            <Text className={isSelected ? "text-black font-black" : "text-white font-bold"}>
                                                {day.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {(classDate || selectedDays.length > 0) && (
                                <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-5">
                                    <Text className="text-emerald-500 text-[10px] font-black uppercase mb-1">
                                        Resumen de recurrencia
                                    </Text>
                                    <Text className="text-white text-xs font-bold leading-5">
                                        Esta clase aparecerá en el calendario{" "}
                                        {selectedDays.length > 0
                                            ? `los días: ${getDaysText(selectedDays)}`
                                            : "en los días seleccionados"}
                                        {classDate ? ` a partir del ${classDate}.` : "."}
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row gap-4 mb-5">
                                <View className="flex-1">
                                    <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">
                                        Hora de inicio
                                    </Text>

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
                                    <Text className="text-gray-500 text-[10px] font-bold uppercase mb-2 ml-1">
                                        Cupo
                                    </Text>

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
                                                    keepScrollPosition(560);
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
                                                    keepScrollPosition(540);
                                                }}
                                                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 items-center"
                                            >
                                                <Text className="text-white font-bold tracking-widest">CANCELAR</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => {
                                                    setStartTime(formatTime(tempTime));
                                                    setActivePicker(null);
                                                    keepScrollPosition(560);
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
                                    onPress={closeModal}
                                    className="flex-1 py-4 justify-center items-center bg-white/5 rounded-2xl border border-white/10"
                                >
                                    <Text className="text-white font-bold tracking-widest">CANCELAR</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleSave}
                                    disabled={isSaving}
                                    className={`flex-1 py-4 rounded-2xl items-center justify-center ${
                                        isSaving ? "bg-emerald-800" : "bg-emerald-500"
                                    }`}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#000" />
                                    ) : (
                                        <Text className="text-black font-black tracking-widest">
                                            {editingClass ? "GUARDAR" : "PUBLICAR"}
                                        </Text>
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