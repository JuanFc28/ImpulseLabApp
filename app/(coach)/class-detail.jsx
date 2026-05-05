import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/src/config/firebase";
import {
    doc,
    collection,
    query,
    where,
    onSnapshot,
} from "firebase/firestore";
import {
    evaluateAthlete,
    cancelClass,
    restoreCancelledClassDate,
    restoreCancelledClassWeek,
} from "@/src/services/gymService";

const getLocalDateISO = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
    ).padStart(2, "0")}`;
};

const normalizeParam = (value) => {
    if (Array.isArray(value)) return value[0];
    return value;
};

export default function ClassDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const classId = normalizeParam(params.classId);
    const selectedDate = normalizeParam(params.date) || getLocalDateISO();

    const [classData, setClassData] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [isLoadingClass, setIsLoadingClass] = useState(true);
    const [isLoadingReservations, setIsLoadingReservations] = useState(true);

    const [evalModalVisible, setEvalModalVisible] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [isSavingEval, setIsSavingEval] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const [evalScores, setEvalScores] = useState({
        rutina: 1,
        cardio: 1,
        indicaciones: 1,
    });

    const isLoading = isLoadingClass || isLoadingReservations;

    const isDateCancelled =
        Array.isArray(classData?.cancelledDates) &&
        classData.cancelledDates.includes(selectedDate);

    const isClassCancelled = isDateCancelled;

    const canRestoreSelectedDate = isDateCancelled;

    useEffect(() => {
        if (!classId) {
            setIsLoadingClass(false);
            return undefined;
        }

        setIsLoadingClass(true);

        const classRef = doc(db, "classes", classId);

        const unsubscribeClass = onSnapshot(
            classRef,
            (classSnap) => {
                if (classSnap.exists()) {
                    setClassData({
                        id: classSnap.id,
                        ...classSnap.data(),
                    });
                } else {
                    setClassData(null);
                }

                setIsLoadingClass(false);
            },
            (error) => {
                console.error("Error escuchando clase:", error);
                setIsLoadingClass(false);
            }
        );

        return () => unsubscribeClass();
    }, [classId]);

    useEffect(() => {
        if (!classId || !selectedDate) {
            setIsLoadingReservations(false);
            return undefined;
        }

        setIsLoadingReservations(true);

        const q = query(
            collection(db, "reservations"),
            where("classID", "==", classId),
            where("date", "==", selectedDate)
        );

        const unsubscribeReservations = onSnapshot(
            q,
            (querySnapshot) => {
                const loadedReservations = querySnapshot.docs.map((currentDoc) => ({
                    id: currentDoc.id,
                    ...currentDoc.data(),
                }));

                setReservations(loadedReservations);
                setIsLoadingReservations(false);
            },
            (error) => {
                console.error("Error escuchando reservaciones:", error);
                setReservations([]);
                setIsLoadingReservations(false);
            }
        );

        return () => unsubscribeReservations();
    }, [classId, selectedDate]);

    const attendedCount = useMemo(() => {
        return reservations.filter((reservation) => reservation?.status === "attended").length;
    }, [reservations]);

    const activeReservations = useMemo(() => {
        return reservations.filter((reservation) => reservation?.status !== "cancelled");
    }, [reservations]);

    const openEvaluation = (reservation) => {
        if (isClassCancelled) {
            Alert.alert("Clase cancelada", "No se puede evaluar una clase cancelada.");
            return;
        }

        if (reservation?.status === "cancelled") {
            Alert.alert("Reservación cancelada", "Esta reservación fue cancelada.");
            return;
        }

        if (reservation?.status !== "attended") {
            Alert.alert(
                "Atleta no validado",
                "Primero debes escanear el QR del atleta para confirmar su asistencia antes de evaluarlo."
            );
            return;
        }

        setSelectedReservation(reservation);

        if (reservation?.isEvaluated) {
            setEvalScores(
                reservation.evaluation || {
                    rutina: 1,
                    cardio: 1,
                    indicaciones: 1,
                }
            );
        } else {
            setEvalScores({
                rutina: 1,
                cardio: 1,
                indicaciones: 1,
            });
        }

        setEvalModalVisible(true);
    };

    const handleScoreChange = (habit, value) => {
        setEvalScores((prev) => ({
            ...prev,
            [habit]: value,
        }));
    };

    const saveEvaluation = async () => {
        if (!selectedReservation?.id) return;

        setIsSavingEval(true);

        try {
            const totalScore =
                evalScores.rutina + evalScores.cardio + evalScores.indicaciones;

            const percentage = Math.round((totalScore / 3) * 100);

            let performanceLevel = "Bajo";

            if (percentage === 100) {
                performanceLevel = "Excelente";
            } else if (percentage >= 70) {
                performanceLevel = "Bueno";
            }

            const evaluationData = {
                objectives: evalScores,
                percentage,
                performanceLevel,
            };

            const result = await evaluateAthlete(selectedReservation.id, evaluationData);

            if (result.success) {
                setEvalModalVisible(false);
            } else {
                Alert.alert("Error", "No se pudo guardar la evaluación.");
            }
        } catch (error) {
            console.error("Error guardando evaluación:", error);
            Alert.alert("Error", "No se pudo guardar la evaluación.");
        } finally {
            setIsSavingEval(false);
        }
    };

    const applyLocalCancelledDates = (datesToAdd = []) => {
        setClassData((prev) => {
            const previousCancelledDates = Array.isArray(prev?.cancelledDates)
                ? prev.cancelledDates
                : [];

            const nextCancelledDates = Array.from(
                new Set([...previousCancelledDates, ...datesToAdd])
            ).sort();

            return {
                ...prev,
                cancelledDates: nextCancelledDates,
                lastCancelledDate: selectedDate,
            };
        });
    };

    const removeLocalCancelledDate = () => {
        setClassData((prev) => ({
            ...prev,
            cancelledDates: Array.isArray(prev?.cancelledDates)
                ? prev.cancelledDates.filter((currentDate) => currentDate !== selectedDate)
                : [],
            lastRestoredDate: selectedDate,
        }));
    };

    const handleCancelSingleDate = () => {
        Alert.alert(
            "Cancelar sesión del día",
            `Se cancelará esta clase solo para el día ${selectedDate}.`,
            [
                { text: "Volver", style: "cancel" },
                {
                    text: "Cancelar este día",
                    style: "destructive",
                    onPress: async () => {
                        setIsCancelling(true);

                        const result = await cancelClass({
                            classId,
                            selectedDate,
                            scope: "single",
                            cancelledBy: "coach",
                            reason: "Sesión cancelada por el coach",
                        });

                        setIsCancelling(false);

                        if (result.success) {
                            applyLocalCancelledDates(result.cancelledDates || [selectedDate]);

                            Alert.alert(
                                "Sesión cancelada",
                                "La clase quedó cancelada solo para esta fecha."
                            );
                        } else {
                            Alert.alert("Error", result.message || "No se pudo cancelar la sesión.");
                        }
                    },
                },
            ]
        );
    };

    const handleCancelWeek = () => {
        Alert.alert(
            "Cancelar semana",
            `Se cancelarán las incidencias de esta clase correspondientes a la semana de ${selectedDate}. No se cancelará toda la recurrencia.`,
            [
                { text: "Volver", style: "cancel" },
                {
                    text: "Cancelar semana",
                    style: "destructive",
                    onPress: async () => {
                        setIsCancelling(true);

                        const result = await cancelClass({
                            classId,
                            selectedDate,
                            scope: "week",
                            cancelledBy: "coach",
                            reason: "Semana cancelada por el coach",
                        });

                        setIsCancelling(false);

                        if (result.success) {
                            applyLocalCancelledDates(result.cancelledDates || [selectedDate]);

                            Alert.alert(
                                "Semana cancelada",
                                "Solo se cancelaron las incidencias de esta semana."
                            );
                        } else {
                            Alert.alert("Error", result.message || "No se pudo cancelar la semana.");
                        }
                    },
                },
            ]
        );
    };

    const handleCancelClassCoach = () => {
        if (isClassCancelled) return;

        Alert.alert(
            "Cancelar clase",
            "¿Qué deseas cancelar?",
            [
                { text: "Volver", style: "cancel" },
                {
                    text: `Solo ${selectedDate}`,
                    style: "destructive",
                    onPress: handleCancelSingleDate,
                },
                {
                    text: "Toda esta semana",
                    style: "destructive",
                    onPress: handleCancelWeek,
                },
            ]
        );
    };

    const handleRestoreSingleDate = async () => {
        setIsRestoring(true);

        try {
            const result = await restoreCancelledClassDate({
                classId,
                selectedDate,
                restoredBy: "coach",
            });

            if (result.success) {
                removeLocalCancelledDate();

                Alert.alert(
                    "Clase reactivada",
                    result.message || "La clase fue reactivada correctamente."
                );
            } else {
                Alert.alert("Error", result.message || "No se pudo reactivar la clase.");
            }
        } catch (error) {
            console.error("Error reactivando clase:", error);
            Alert.alert("Error", "No se pudo reactivar la clase.");
        } finally {
            setIsRestoring(false);
        }
    };

    const handleRestoreWeek = async () => {
        setIsRestoring(true);

        try {
            const result = await restoreCancelledClassWeek({
                classId,
                selectedDate,
                restoredBy: "coach",
            });

            if (result.success) {
                setClassData((prev) => {
                    const restoredDates = result.restoredDates || [];
                    const previousCancelledDates = Array.isArray(prev?.cancelledDates)
                        ? prev.cancelledDates
                        : [];

                    return {
                        ...prev,
                        cancelledDates: previousCancelledDates.filter(
                            (currentDate) => !restoredDates.includes(currentDate)
                        ),
                        lastRestoredDate: selectedDate,
                        lastRestoredDates: restoredDates,
                    };
                });

                Alert.alert(
                    "Semana reactivada",
                    result.message || "La semana fue reactivada correctamente."
                );
            } else {
                Alert.alert("Error", result.message || "No se pudo reactivar la semana.");
            }
        } catch (error) {
            console.error("Error reactivando semana:", error);
            Alert.alert("Error", "No se pudo reactivar la semana.");
        } finally {
            setIsRestoring(false);
        }
    };

    const handleRestoreClassDate = () => {
        if (!canRestoreSelectedDate) return;

        Alert.alert(
            "Reactivar clase",
            "¿Qué deseas reactivar?",
            [
                { text: "Volver", style: "cancel" },
                {
                    text: `Solo ${selectedDate}`,
                    onPress: handleRestoreSingleDate,
                },
                {
                    text: "Toda esta semana",
                    onPress: handleRestoreWeek,
                },
            ]
        );
    };

    const ScoreButton = ({ label, value, currentScore, onPress }) => {
        const isSelected = currentScore === value;

        let bgColor = "bg-white/5";
        let borderColor = "border-white/5";
        let textColor = "text-gray-500";

        if (isSelected) {
            if (value === 1) {
                bgColor = "bg-green-500/20";
                borderColor = "border-green-500";
                textColor = "text-green-500";
            } else if (value === 0.5) {
                bgColor = "bg-yellow-500/20";
                borderColor = "border-yellow-500";
                textColor = "text-yellow-500";
            } else {
                bgColor = "bg-red-500/20";
                borderColor = "border-red-500";
                textColor = "text-red-500";
            }
        }

        return (
            <TouchableOpacity
                onPress={onPress}
                className={`flex-1 py-3 items-center rounded-xl border ${bgColor} ${borderColor} mx-1`}
            >
                <Text className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-impulse-dark pt-16 px-5">
            <TouchableOpacity
                onPress={() => router.back()}
                className="mb-4 w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
            >
                <IconSymbol name="chevron.left" size={20} color="#FF9500" />
            </TouchableOpacity>

            {isLoading ? (
                <ActivityIndicator size="large" color="#FF9500" className="mt-10" />
            ) : (
                <View className="mb-8">
                    <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1 pr-3">
                            <Text
                                className={`text-3xl font-black ${
                                    isClassCancelled ? "text-red-500" : "text-white"
                                }`}
                            >
                                {classData?.name || "Clase"}
                            </Text>

                            <Text className="text-orange-500 font-bold uppercase tracking-widest text-xs mt-2">
                                {selectedDate} • {classData?.startTime || ""}
                            </Text>
                        </View>

                        {!isClassCancelled && (
                            <TouchableOpacity
                                disabled={isCancelling}
                                onPress={handleCancelClassCoach}
                                className="bg-red-500/10 px-3 py-2 rounded-full border border-red-500/30"
                            >
                                <Text className="text-red-500 text-[10px] font-black uppercase">
                                    {isCancelling ? "Cancelando..." : "Cancelar"}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {canRestoreSelectedDate && (
                            <TouchableOpacity
                                disabled={isRestoring}
                                onPress={handleRestoreClassDate}
                                className="bg-green-500/10 px-3 py-2 rounded-full border border-green-500/30"
                            >
                                <Text className="text-green-500 text-[10px] font-black uppercase">
                                    {isRestoring ? "Reactivando..." : "Reactivar"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {isClassCancelled && (
                        <View className="bg-red-500/20 py-3 px-4 rounded-xl mb-4 border border-red-500/30">
                            <Text className="text-red-500 font-black text-xs text-center uppercase tracking-widest">
                                Esta sesión está cancelada
                            </Text>

                            <Text className="text-red-300 text-xs text-center mt-1">
                                Puedes reactivar solo esta fecha o toda esta semana desde el botón superior.
                            </Text>
                        </View>
                    )}

                    <View className="flex-row bg-impulse-gray p-4 rounded-3xl border border-white/5 justify-between items-center">
                        <View className="items-center flex-1 border-r border-white/10">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                                Apuntados
                            </Text>
                            <Text className="text-white text-2xl font-black">
                                {activeReservations.length}
                            </Text>
                        </View>

                        <View className="items-center flex-1">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                                Asistieron
                            </Text>
                            <Text className="text-orange-500 text-2xl font-black">
                                {attendedCount}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
                Lista de Asistencia
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {reservations.length === 0 && !isLoading ? (
                    <Text className="text-gray-500 text-center mt-4">
                        Nadie ha reservado aún.
                    </Text>
                ) : (
                    reservations.map((item, index) => {
                        if (!item) return null;

                        const attended = item.status === "attended";
                        const evaluated = item.isEvaluated;
                        const reservationCancelled = item.status === "cancelled";

                        return (
                            <TouchableOpacity
                                key={item.id || `res-${index}`}
                                activeOpacity={0.8}
                                onPress={() => openEvaluation(item)}
                                disabled={isClassCancelled || reservationCancelled}
                                className={`bg-impulse-gray p-4 rounded-3xl mb-3 border flex-row justify-between items-center ${
                                    reservationCancelled || isClassCancelled
                                        ? "border-red-500/30 bg-red-500/5 opacity-80"
                                        : attended
                                            ? "border-orange-500/30 bg-orange-500/5"
                                            : "border-white/5"
                                }`}
                            >
                                <View className="flex-1">
                                    <Text
                                        className={`font-black text-lg ${
                                            reservationCancelled || isClassCancelled
                                                ? "text-red-400"
                                                : "text-white"
                                        }`}
                                    >
                                        {item?.userName || "Usuario"}
                                    </Text>

                                    {reservationCancelled || isClassCancelled ? (
                                        <Text className="text-red-500 text-[10px] font-black uppercase tracking-[1px] mt-1">
                                            {reservationCancelled
                                                ? "Reservación cancelada"
                                                : "Clase cancelada"}
                                        </Text>
                                    ) : attended ? (
                                        evaluated ? (
                                            <Text className="text-green-500 text-[10px] font-black uppercase tracking-[1px] mt-1">
                                                Evaluación: {item.performanceLevel} ({item.compliancePercentage}%)
                                            </Text>
                                        ) : (
                                            <Text className="text-orange-500 text-[10px] font-black uppercase tracking-[1px] mt-1">
                                                Toca para evaluar
                                            </Text>
                                        )
                                    ) : (
                                        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[1px] mt-1">
                                            Pendiente de llegada
                                        </Text>
                                    )}
                                </View>

                                <View
                                    className={`w-3 h-3 rounded-full ${
                                        reservationCancelled || isClassCancelled
                                            ? "bg-red-500"
                                            : attended
                                                ? evaluated
                                                    ? "bg-green-500"
                                                    : "bg-orange-500"
                                                : "bg-white/20"
                                    }`}
                                />
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            <View className="absolute bottom-10 left-6 right-6">
                <TouchableOpacity
                    disabled={isClassCancelled}
                    onPress={() =>
                        router.push({
                            pathname: "/(coach)/scanner",
                            params: {
                                classId,
                                date: selectedDate,
                            },
                        })
                    }
                    className={`flex-row items-center justify-center py-5 rounded-full shadow-2xl ${
                        isClassCancelled
                            ? "bg-gray-600"
                            : "bg-orange-500 shadow-orange-500/20"
                    }`}
                >
                    <View className="bg-black/10 p-1 rounded-full mr-2">
                        <IconSymbol
                            name={isClassCancelled ? "xmark.circle.fill" : "qrcode.viewfinder"}
                            size={18}
                            color="#000"
                        />
                    </View>

                    <Text className="text-black font-black text-sm tracking-[2px]">
                        {isClassCancelled ? "CLASE CANCELADA" : "ESCANEAR CÓDIGO QR"}
                    </Text>
                </TouchableOpacity>
            </View>

            <Modal visible={evalModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1 justify-end bg-black/80"
                >
                    <View className="bg-impulse-gray p-6 pt-8 rounded-t-[40px] border-t border-white/10">
                        <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6 absolute top-4" />

                        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">
                            Evaluación de Desempeño
                        </Text>

                        <Text className="text-white text-2xl font-black text-center mb-8">
                            {selectedReservation?.userName}
                        </Text>

                        <View className="mb-6">
                            <Text className="text-white font-bold mb-3 ml-1">
                                Completó la rutina asignada
                            </Text>

                            <View className="flex-row justify-between">
                                <ScoreButton
                                    label="Sí"
                                    value={1}
                                    currentScore={evalScores.rutina}
                                    onPress={() => handleScoreChange("rutina", 1)}
                                />
                                <ScoreButton
                                    label="A medias"
                                    value={0.5}
                                    currentScore={evalScores.rutina}
                                    onPress={() => handleScoreChange("rutina", 0.5)}
                                />
                                <ScoreButton
                                    label="No"
                                    value={0}
                                    currentScore={evalScores.rutina}
                                    onPress={() => handleScoreChange("rutina", 0)}
                                />
                            </View>
                        </View>

                        <View className="mb-6">
                            <Text className="text-white font-bold mb-3 ml-1">
                                Realizó el cardio correspondiente
                            </Text>

                            <View className="flex-row justify-between">
                                <ScoreButton
                                    label="Sí"
                                    value={1}
                                    currentScore={evalScores.cardio}
                                    onPress={() => handleScoreChange("cardio", 1)}
                                />
                                <ScoreButton
                                    label="A medias"
                                    value={0.5}
                                    currentScore={evalScores.cardio}
                                    onPress={() => handleScoreChange("cardio", 0.5)}
                                />
                                <ScoreButton
                                    label="No"
                                    value={0}
                                    currentScore={evalScores.cardio}
                                    onPress={() => handleScoreChange("cardio", 0)}
                                />
                            </View>
                        </View>

                        <View className="mb-8">
                            <Text className="text-white font-bold mb-3 ml-1">
                                Cumplió indicaciones y técnica
                            </Text>

                            <View className="flex-row justify-between">
                                <ScoreButton
                                    label="Sí"
                                    value={1}
                                    currentScore={evalScores.indicaciones}
                                    onPress={() => handleScoreChange("indicaciones", 1)}
                                />
                                <ScoreButton
                                    label="A medias"
                                    value={0.5}
                                    currentScore={evalScores.indicaciones}
                                    onPress={() => handleScoreChange("indicaciones", 0.5)}
                                />
                                <ScoreButton
                                    label="No"
                                    value={0}
                                    currentScore={evalScores.indicaciones}
                                    onPress={() => handleScoreChange("indicaciones", 0)}
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-4 mb-4">
                            <TouchableOpacity
                                onPress={() => setEvalModalVisible(false)}
                                className="flex-1 py-4 justify-center items-center bg-white/5 rounded-2xl border border-white/10"
                            >
                                <Text className="text-white font-bold tracking-widest">
                                    CANCELAR
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={saveEvaluation}
                                disabled={isSavingEval}
                                className={`flex-1 py-4 rounded-2xl items-center justify-center shadow-lg ${
                                    isSavingEval
                                        ? "bg-orange-800"
                                        : "bg-orange-500 shadow-orange-500/20"
                                }`}
                            >
                                {isSavingEval ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text className="text-black font-black tracking-widest">
                                        GUARDAR
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}