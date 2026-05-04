import React, { useEffect, useState } from "react";
import {
<<<<<<< HEAD
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
=======
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
>>>>>>> e3da7e70f0a31d403b96169003fd4eff8397a949
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/src/config/firebase";
import {
<<<<<<< HEAD
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { evaluateAthlete } from "@/src/services/gymService";

export default function ClassDetailScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
=======
    doc,
    getDoc,
    collection,
    query,
    where,
    onSnapshot,
} from "firebase/firestore";
import { evaluateAthlete, cancelClass } from "@/src/services/gymService";

const getLocalDateISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
    ).padStart(2, "0")}`;
};

export default function ClassDetailScreen() {
    const router = useRouter();
    const { classId, date } = useLocalSearchParams();

    const selectedDate = date || getLocalDateISO();
>>>>>>> e3da7e70f0a31d403b96169003fd4eff8397a949

  const [classData, setClassData] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

<<<<<<< HEAD
  const [evalModalVisible, setEvalModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isSavingEval, setIsSavingEval] = useState(false);
=======
    const [evalModalVisible, setEvalModalVisible] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [isSavingEval, setIsSavingEval] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const [evalScores, setEvalScores] = useState({
        rutina: 1,
        cardio: 1,
        indicaciones: 1,
    });

    const isClassCancelled =
        classData?.status === "cancelled" ||
        classData?.active === false ||
        (Array.isArray(classData?.cancelledDates) && classData.cancelledDates.includes(selectedDate));
>>>>>>> e3da7e70f0a31d403b96169003fd4eff8397a949

  const [evalScores, setEvalScores] = useState({
    rutina: 1,
    cardio: 1,
    indicaciones: 1,
  });

  useEffect(() => {
    if (!classId) return;

<<<<<<< HEAD
    setIsLoading(true);
=======
        const fetchClassData = async () => {
            try {
                const classRef = doc(db, "classes", classId);
                const classSnap = await getDoc(classRef);

                if (classSnap.exists()) {
                    setClassData({
                        id: classSnap.id,
                        ...classSnap.data(),
                    });
                }
            } catch (error) {
                console.error("Error al cargar clase:", error);
            }
        };
>>>>>>> e3da7e70f0a31d403b96169003fd4eff8397a949

    const fetchClassData = async () => {
      try {
        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) setClassData(classSnap.data());
      } catch (error) {
        console.error("Error al cargar clase:", error);
      }
    };

<<<<<<< HEAD
    fetchClassData();

    const q = query(
      collection(db, "reservations"),
      where("classID", "==", classId),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        try {
          if (!querySnapshot || !querySnapshot.docs) return;

          const loadedReservations = querySnapshot.docs.reduce(
            (acc, currentDoc) => {
              if (currentDoc && currentDoc.id && currentDoc.data) {
                acc.push({ id: currentDoc.id, ...currentDoc.data() });
              }
              return acc;
            },
            [],
          );

          setReservations(loadedReservations);
          setIsLoading(false);
        } catch (err) {
          console.error("Error procesando snapshot:", err);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error escuchando reservaciones:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [classId]);

  const openEvaluation = (reservation) => {
    if (reservation?.status !== "attended") {
      Alert.alert(
        "Atleta no validado",
        "Primero debes escanear el QR del atleta para confirmar su asistencia antes de evaluarlo.",
      );
      return;
    }

    setSelectedReservation(reservation);
    if (reservation?.isEvaluated) {
      setEvalScores(reservation.evaluation);
    } else {
      setEvalScores({ rutina: 1, cardio: 1, indicaciones: 1 });
    }
    setEvalModalVisible(true);
  };

  const handleScoreChange = (habit, value) => {
    setEvalScores((prev) => ({ ...prev, [habit]: value }));
  };

  const saveEvaluation = async () => {
    if (!selectedReservation?.id) return;
    setIsSavingEval(true);

    const totalScore =
      evalScores.rutina + evalScores.cardio + evalScores.indicaciones;
    const percentage = Math.round((totalScore / 3) * 100);

    let performanceLevel = "Bajo";
    if (percentage === 100) performanceLevel = "Excelente";
    else if (percentage >= 70) performanceLevel = "Bueno";

    const evaluationData = {
      objectives: evalScores,
      percentage,
      performanceLevel,
=======
        const q = query(
            collection(db, "reservations"),
            where("classID", "==", classId),
            where("date", "==", selectedDate)
        );

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                try {
                    const loadedReservations = querySnapshot.docs.map((currentDoc) => ({
                        id: currentDoc.id,
                        ...currentDoc.data(),
                    }));

                    setReservations(loadedReservations);
                    setIsLoading(false);
                } catch (err) {
                    console.error("Error procesando snapshot:", err);
                    setIsLoading(false);
                }
            },
            (error) => {
                console.error("Error escuchando reservaciones:", error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [classId, selectedDate]);

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
            setEvalScores(reservation.evaluation);
        } else {
            setEvalScores({
                rutina: 1,
                cardio: 1,
                indicaciones: 1,
            });
        }

        setEvalModalVisible(true);
>>>>>>> e3da7e70f0a31d403b96169003fd4eff8397a949
    };
    const result = await evaluateAthlete(
      selectedReservation.id,
      evaluationData,
    );

<<<<<<< HEAD
    setIsSavingEval(false);

    if (result.success) {
      setEvalModalVisible(false);
    } else {
      Alert.alert("Error", "No se pudo guardar la evaluación.");
    }
  };

  const ScoreButton = ({ label, value, currentScore, onPress }) => {
    const isSelected = currentScore === value;
    let bgColor = "bg-white/5",
      borderColor = "border-white/5",
      textColor = "text-gray-500";

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
        <Text
          className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleCancelClassCoach = () => {
    Alert.alert(
      "Cancelar Clase",
      "¿Estás seguro de cancelar esta clase? A los atletas les aparecerá como cancelada.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              const classRef = doc(db, "classes", classId);
              await updateDoc(classRef, { status: "cancelled" });
              setClassData((prev) => ({ ...prev, status: "cancelled" }));
              Alert.alert(
                "Cancelada",
                "La clase ha sido cancelada exitosamente.",
              );
            } catch (error) {
              Alert.alert("Error", "No se pudo cancelar la clase.");
            }
          },
        },
      ],
    );
  };

  const attendedCount =
    reservations?.filter((r) => r && r.status === "attended").length || 0;

  return (
    <View className="flex-1 bg-impulse-dark pt-16 px-5">
      <TouchableOpacity
        onPress={() => router.back()}
        className="mb-4 w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10"
      >
        {/* CORRECCIÓN: chevron.left -> chevron-back */}
        <Ionicons name="chevron-back" size={20} color="#FF9500" />
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color="#FF9500" className="mt-10" />
      ) : (
        <View className="mb-8">
          <View className="flex-row justify-between items-center mb-1">
            <Text
              className={`text-3xl font-black ${classData?.status === "cancelled" ? "text-red-500" : "text-white"}`}
            >
              {classData?.name || "Clase"}
            </Text>

            {classData?.status !== "cancelled" && (
              <TouchableOpacity
                onPress={handleCancelClassCoach}
                className="bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/30"
              >
                <Text className="text-red-500 text-[10px] font-black uppercase">
                  Cancelar Clase
                </Text>
              </TouchableOpacity>
=======
    const handleScoreChange = (habit, value) => {
        setEvalScores((prev) => ({
            ...prev,
            [habit]: value,
        }));
    };

    const saveEvaluation = async () => {
        if (!selectedReservation?.id) return;

        setIsSavingEval(true);

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

        setIsSavingEval(false);

        if (result.success) {
            setEvalModalVisible(false);
        } else {
            Alert.alert("Error", "No se pudo guardar la evaluación.");
        }
    };

    const handleCancelSingleDate = () => {
        Alert.alert(
            "Cancelar sesión del día",
            `Se cancelará esta clase solo para el día ${selectedDate}. Los usuarios con reserva verán el aviso de cancelación.`,
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
                            setClassData((prev) => ({
                                ...prev,
                                cancelledDates: [
                                    ...(Array.isArray(prev?.cancelledDates)
                                        ? prev.cancelledDates
                                        : []),
                                    selectedDate,
                                ],
                                lastCancelledDate: selectedDate,
                                lastCancellationReason: "Sesión cancelada por el coach",
                            }));

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

    const handleCancelSeries = () => {
        Alert.alert(
            "Cancelar toda la clase",
            "Esto cancelará toda la clase recurrente y sus futuras incidencias. Los usuarios con reserva verán el aviso de cancelación.",
            [
                { text: "Volver", style: "cancel" },
                {
                    text: "Cancelar toda",
                    style: "destructive",
                    onPress: async () => {
                        setIsCancelling(true);

                        const result = await cancelClass({
                            classId,
                            selectedDate,
                            scope: "series",
                            cancelledBy: "coach",
                            reason: "Clase cancelada por el coach",
                        });

                        setIsCancelling(false);

                        if (result.success) {
                            setClassData((prev) => ({
                                ...prev,
                                status: "cancelled",
                                active: false,
                                cancellationReason: "Clase cancelada por el coach",
                            }));

                            Alert.alert(
                                "Clase cancelada",
                                "La clase completa quedó cancelada."
                            );
                        } else {
                            Alert.alert("Error", result.message || "No se pudo cancelar la clase.");
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
                    text: "Toda la recurrencia",
                    style: "destructive",
                    onPress: handleCancelSeries,
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

    const attendedCount =
        reservations?.filter((reservation) => reservation?.status === "attended").length || 0;

    const activeReservations =
        reservations?.filter((reservation) => reservation?.status !== "cancelled") || [];

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
                    </View>

                    {isClassCancelled && (
                        <View className="bg-red-500/20 py-3 px-4 rounded-xl mb-4 border border-red-500/30">
                            <Text className="text-red-500 font-black text-xs text-center uppercase tracking-widest">
                                Esta clase está cancelada
                            </Text>
                            <Text className="text-red-300 text-xs text-center mt-1">
                                No se puede pasar lista ni evaluar atletas.
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
>>>>>>> e3da7e70f0a31d403b96169003fd4eff8397a949
            )}
          </View>

<<<<<<< HEAD
          {classData?.status === "cancelled" && (
            <View className="bg-red-500/20 py-2 px-4 rounded-xl mb-4 border border-red-500/30">
              <Text className="text-red-500 font-bold text-xs text-center uppercase tracking-widest">
                Esta clase ha sido cancelada
              </Text>
            </View>
          )}
          <Text className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-4">
            {classData?.date || ""} • {classData?.startTime || ""}
          </Text>

          <View className="flex-row bg-impulse-gray p-4 rounded-3xl border border-white/5 justify-between items-center">
            <View className="items-center flex-1 border-r border-white/10">
              <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                Apuntados
              </Text>
              <Text className="text-white text-2xl font-black">
                {reservations?.length || 0}
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {reservations?.length === 0 && !isLoading ? (
          <Text className="text-gray-500 text-center mt-4">
            Nadie ha reservado aún.
          </Text>
        ) : (
          reservations?.map((item, index) => {
            if (!item) return null;

            const attended = item.status === "attended";
            const evaluated = item.isEvaluated;

            return (
              <TouchableOpacity
                key={item.id || `res-${index}`}
                activeOpacity={0.8}
                onPress={() => openEvaluation(item)}
                className={`bg-impulse-gray p-4 rounded-3xl mb-3 border flex-row justify-between items-center ${attended ? "border-orange-500/30 bg-orange-500/5" : "border-white/5"}`}
              >
                <View className="flex-1">
                  <Text className="text-white font-black text-lg">
                    {item?.userName || "Usuario"}
                  </Text>
                  {attended ? (
                    evaluated ? (
                      <Text className="text-green-500 text-[10px] font-black uppercase tracking-[1px] mt-1">
                        Evaluación: {item.performanceLevel} (
                        {item.compliancePercentage}%)
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
                  className={`w-3 h-3 rounded-full ${attended ? (evaluated ? "bg-green-500" : "bg-orange-500") : "bg-white/20"}`}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View className="absolute bottom-10 left-6 right-6">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(coach)/scanner",
              params: { classId: classId },
            })
          }
          className="bg-orange-500 flex-row items-center justify-center py-5 rounded-full shadow-2xl shadow-orange-500/20"
        >
          <View className="bg-black/10 p-1 rounded-full mr-2">
            {/* CORRECCIÓN: qrcode.viewfinder -> qr-code-outline */}
            <Ionicons name="qr-code-outline" size={18} color="#000" />
          </View>
          <Text className="text-black font-black text-sm tracking-[2px]">
            ESCANEAR CÓDIGO QR
          </Text>
        </TouchableOpacity>
      </View>

      {/* MODAL DE EVALUACIÓN */}
      <Modal
        visible={evalModalVisible}
        animationType="slide"
        transparent={true}
      >
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
                className={`flex-1 py-4 rounded-2xl items-center justify-center shadow-lg ${isSavingEval ? "bg-orange-800" : "bg-orange-500 shadow-orange-500/20"}`}
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
=======
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
                Lista de Asistencia
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {reservations?.length === 0 && !isLoading ? (
                    <Text className="text-gray-500 text-center mt-4">
                        Nadie ha reservado aún.
                    </Text>
                ) : (
                    reservations?.map((item, index) => {
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
                                            Reservación cancelada
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
>>>>>>> e3da7e70f0a31d403b96169003fd4eff8397a949
