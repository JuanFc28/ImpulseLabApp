import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/src/config/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { evaluateAthlete } from "@/src/services/gymService";

export default function ClassDetailScreen() {
    const router = useRouter();
    const { classId } = useLocalSearchParams();

    const [classData, setClassData] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Estados para la Evaluación
    const [evalModalVisible, setEvalModalVisible] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [isSavingEval, setIsSavingEval] = useState(false);
    
    // Valores de evaluación por hábito (1 = Cumplido, 0.5 = Parcial, 0 = No cumplido)
    const [evalScores, setEvalScores] = useState({
        rutina: 1,
        cardio: 1,
        indicaciones: 1
    });

    const fetchClassAndReservations = async () => {
        if (!classId) return;
        setIsLoading(true);
        try {
            // 1. Traer la clase
            const classRef = doc(db, "classes", classId);
            const classSnap = await getDoc(classRef);
            if (classSnap.exists()) setClassData(classSnap.data());

            // 2. Traer los atletas apuntados a esta clase
            const q = query(collection(db, "reservations"), where("classID", "==", classId));
            const querySnapshot = await getDocs(q);
            const loadedReservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReservations(loadedReservations);
        } catch (error) {
            Alert.alert("Error", "No se pudo cargar la información de la clase.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClassAndReservations();
    }, [classId]);

    // LÓGICA DE EVALUACIÓN
    const openEvaluation = (reservation) => {
        if (reservation.status !== "attended") {
            Alert.alert("Atleta no validado", "Primero debes escanear el QR del atleta para confirmar su asistencia antes de evaluarlo.");
            return;
        }
        
        setSelectedReservation(reservation);
        // Si ya estaba evaluado, cargamos sus datos previos
        if (reservation.isEvaluated) {
            setEvalScores(reservation.evaluation);
        } else {
            // Valores por defecto
            setEvalScores({ rutina: 1, cardio: 1, indicaciones: 1 });
        }
        setEvalModalVisible(true);
    };

    const handleScoreChange = (habit, value) => {
        setEvalScores(prev => ({ ...prev, [habit]: value }));
    };

    const saveEvaluation = async () => {
        setIsSavingEval(true);
        
        // Calculamos el porcentaje (Promedio de los 3 hábitos multiplicado por 100)
        const totalScore = evalScores.rutina + evalScores.cardio + evalScores.indicaciones;
        const percentage = Math.round((totalScore / 3) * 100);
        
        // Asignamos el nivel de desempeño
        let performanceLevel = "Bajo";
        if (percentage === 100) performanceLevel = "Excelente";
        else if (percentage >= 70) performanceLevel = "Bueno";

        const evaluationData = {
            objectives: evalScores,
            percentage: percentage,
            performanceLevel: performanceLevel
        };

        const result = await evaluateAthlete(selectedReservation.id, evaluationData);
        
        setIsSavingEval(false);
        
        if (result.success) {
            setEvalModalVisible(false);
            fetchClassAndReservations(); // Recargar la lista para mostrar la calificación
        } else {
            Alert.alert("Error", "No se pudo guardar la evaluación.");
        }
    };

    // Componente visual para los botones de calificación
    const ScoreButton = ({ label, value, currentScore, onPress }) => {
        const isSelected = currentScore === value;
        let bgColor = "bg-white/5";
        let borderColor = "border-white/5";
        let textColor = "text-gray-500";

        if (isSelected) {
            if (value === 1) { bgColor = "bg-green-500/20"; borderColor = "border-green-500"; textColor = "text-green-500"; }
            else if (value === 0.5) { bgColor = "bg-yellow-500/20"; borderColor = "border-yellow-500"; textColor = "text-yellow-500"; }
            else { bgColor = "bg-red-500/20"; borderColor = "border-red-500"; textColor = "text-red-500"; }
        }

        return (
            <TouchableOpacity onPress={onPress} className={`flex-1 py-3 items-center rounded-xl border ${bgColor} ${borderColor} mx-1`}>
                <Text className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const attendedCount = reservations.filter(r => r.status === "attended").length;

    return (
        <View className="flex-1 bg-impulse-dark pt-16 px-5">
            {/* BOTÓN VOLVER */}
            <TouchableOpacity onPress={() => router.back()} className="mb-4 w-10 h-10 bg-white/5 rounded-full items-center justify-center border border-white/10">
                <IconSymbol name="chevron.left" size={20} color="#FF9500" />
            </TouchableOpacity>

            {/* HEADER */}
            {isLoading ? (
                <ActivityIndicator size="large" color="#FF9500" className="mt-10" />
            ) : (
                <View className="mb-8">
                    <Text className="text-white text-3xl font-black mb-1">{classData?.name}</Text>
                    <Text className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-4">
                        {classData?.date} • {classData?.startTime}
                    </Text>
                    
                    <View className="flex-row bg-impulse-gray p-4 rounded-3xl border border-white/5 justify-between items-center">
                        <View className="items-center flex-1 border-r border-white/10">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Apuntados</Text>
                            <Text className="text-white text-2xl font-black">{reservations.length}</Text>
                        </View>
                        <View className="items-center flex-1">
                            <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Asistieron</Text>
                            <Text className="text-orange-500 text-2xl font-black">{attendedCount}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* LISTA DE ATLETAS (CON EVALUACIÓN) */}
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Lista de Asistencia</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {reservations.length === 0 && !isLoading ? (
                    <Text className="text-gray-500 text-center mt-4">Nadie ha reservado aún.</Text>
                ) : (
                    reservations.map((item) => {
                        const attended = item.status === "attended";
                        const evaluated = item.isEvaluated;

                        return (
                            <TouchableOpacity 
                                key={item.id} 
                                activeOpacity={0.8}
                                onPress={() => openEvaluation(item)}
                                className={`bg-impulse-gray p-4 rounded-3xl mb-3 border flex-row justify-between items-center ${attended ? "border-orange-500/30 bg-orange-500/5" : "border-white/5"}`}
                            >
                                <View className="flex-1">
                                    <Text className="text-white font-black text-lg">{item.userName}</Text>
                                    {attended ? (
                                        evaluated ? (
                                            <Text className="text-green-500 text-[10px] font-black uppercase tracking-[1px] mt-1">Evaluación: {item.performanceLevel} ({item.compliancePercentage}%)</Text>
                                        ) : (
                                            <Text className="text-orange-500 text-[10px] font-black uppercase tracking-[1px] mt-1">Toca para evaluar</Text>
                                        )
                                    ) : (
                                        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-[1px] mt-1">Pendiente de llegada</Text>
                                    )}
                                </View>
                                <View className={`w-3 h-3 rounded-full ${attended ? (evaluated ? "bg-green-500" : "bg-orange-500") : "bg-white/20"}`} />
                            </TouchableOpacity>
                        );
                    })
                )}
            </ScrollView>

            {/* BOTÓN FLOTANTE ESCANEAR */}
            <View className="absolute bottom-10 left-6 right-6">
                <TouchableOpacity onPress={() => router.push({ pathname: "/(coach)/scanner", params: { classId: classId } })} className="bg-orange-500 flex-row items-center justify-center py-5 rounded-full shadow-2xl shadow-orange-500/20">
                    <View className="bg-black/10 p-1 rounded-full mr-2">
                        <IconSymbol name="qrcode.viewfinder" size={18} color="#000" />
                    </View>
                    <Text className="text-black font-black text-sm tracking-[2px]">ESCANEAR CÓDIGO QR</Text>
                </TouchableOpacity>
            </View>

            {/* MODAL DE EVALUACIÓN */}
            <Modal visible={evalModalVisible} animationType="slide" transparent={true}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 justify-end bg-black/80">
                    <View className="bg-impulse-gray p-6 pt-8 rounded-t-[40px] border-t border-white/10">
                        <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-6 absolute top-4" />
                        
                        <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Evaluación de Desempeño</Text>
                        <Text className="text-white text-2xl font-black text-center mb-8">{selectedReservation?.userName}</Text>

                        {/* HÁBITO 1 */}
                        <View className="mb-6">
                            <Text className="text-white font-bold mb-3 ml-1">Completó la rutina asignada</Text>
                            <View className="flex-row justify-between">
                                <ScoreButton label="Sí" value={1} currentScore={evalScores.rutina} onPress={() => handleScoreChange("rutina", 1)} />
                                <ScoreButton label="A medias" value={0.5} currentScore={evalScores.rutina} onPress={() => handleScoreChange("rutina", 0.5)} />
                                <ScoreButton label="No" value={0} currentScore={evalScores.rutina} onPress={() => handleScoreChange("rutina", 0)} />
                            </View>
                        </View>

                        {/* HÁBITO 2 */}
                        <View className="mb-6">
                            <Text className="text-white font-bold mb-3 ml-1">Realizó el cardio correspondiente</Text>
                            <View className="flex-row justify-between">
                                <ScoreButton label="Sí" value={1} currentScore={evalScores.cardio} onPress={() => handleScoreChange("cardio", 1)} />
                                <ScoreButton label="A medias" value={0.5} currentScore={evalScores.cardio} onPress={() => handleScoreChange("cardio", 0.5)} />
                                <ScoreButton label="No" value={0} currentScore={evalScores.cardio} onPress={() => handleScoreChange("cardio", 0)} />
                            </View>
                        </View>

                        {/* HÁBITO 3 */}
                        <View className="mb-8">
                            <Text className="text-white font-bold mb-3 ml-1">Cumplió indicaciones y técnica</Text>
                            <View className="flex-row justify-between">
                                <ScoreButton label="Sí" value={1} currentScore={evalScores.indicaciones} onPress={() => handleScoreChange("indicaciones", 1)} />
                                <ScoreButton label="A medias" value={0.5} currentScore={evalScores.indicaciones} onPress={() => handleScoreChange("indicaciones", 0.5)} />
                                <ScoreButton label="No" value={0} currentScore={evalScores.indicaciones} onPress={() => handleScoreChange("indicaciones", 0)} />
                            </View>
                        </View>

                        {/* BOTONES */}
                        <View className="flex-row gap-4 mb-4">
                            <TouchableOpacity onPress={() => setEvalModalVisible(false)} className="flex-1 py-4 justify-center items-center bg-white/5 rounded-2xl border border-white/10">
                                <Text className="text-white font-bold tracking-widest">CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={saveEvaluation} disabled={isSavingEval} className={`flex-1 py-4 rounded-2xl items-center justify-center shadow-lg ${isSavingEval ? "bg-orange-800" : "bg-orange-500 shadow-orange-500/20"}`}>
                                {isSavingEval ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black tracking-widest">GUARDAR</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}