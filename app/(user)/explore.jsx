import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/src/context/AuthContext";
import { db } from "@/src/config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import {
    bookClass,
    cancelClassReservation,
    reserveCoachMonthlySchedule,
    cancelCoachReservation,
    getUserReservations,
    getUserCoachReservations,
    getUserGymAttendance,
} from "@/src/services/gymService";

export default function ExploreScreen() {
    const router = useRouter();
    const { user } = useAuth();

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDateISO, setSelectedDateISO] = useState("");
    const [activeTab, setActiveTab] = useState("classes");

    const [allReservations, setAllReservations] = useState([]);
    const [coachReservations, setCoachReservations] = useState([]);
    const [coachSchedules, setCoachSchedules] = useState([]);
    const [classesForDate, setClassesForDate] = useState([]);
    const [gymAttendance, setGymAttendance] = useState([]);

    const [isLoadingClasses, setIsLoadingClasses] = useState(false);
    const [isLoadingCoaches, setIsLoadingCoaches] = useState(false);
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

    useEffect(() => {
        const today = new Date();
        const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
            2,
            "0"
        )}-${String(today.getDate()).padStart(2, "0")}`;

        setSelectedDateISO(iso);
    }, []);

    const fetchCalendarData = useCallback(async () => {
        if (!user?.uid) return;

        setIsLoadingCalendar(true);

        try {
            const userRes = await getUserReservations(user.uid);
            setAllReservations(userRes || []);

            const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
            const year = currentMonth.getFullYear();

            const coachRes = await getUserCoachReservations(user.uid, month, year);
            setCoachReservations(coachRes || []);

            const attendance = await getUserGymAttendance(user.uid);
            setGymAttendance(attendance || []);
        } catch (error) {
            console.error("Error cargando calendario:", error);
        } finally {
            setIsLoadingCalendar(false);
        }
    }, [user?.uid, currentMonth]);

    useEffect(() => {
        fetchCalendarData();
    }, [fetchCalendarData]);

    useFocusEffect(
        useCallback(() => {
            fetchCalendarData();
        }, [fetchCalendarData])
    );

    useEffect(() => {
        if (!selectedDateISO || !user?.uid) return;

        const fetchClasses = async () => {
            setIsLoadingClasses(true);

            try {
                const qClasses = query(
                    collection(db, "classes"),
                    where("date", "==", selectedDateISO)
                );

                const classSnap = await getDocs(qClasses);

                const loadedClasses = classSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                loadedClasses.sort((a, b) =>
                    String(a.startTime || "").localeCompare(String(b.startTime || ""))
                );

                setClassesForDate(loadedClasses);
            } catch (error) {
                console.error("Error cargando clases:", error);
            } finally {
                setIsLoadingClasses(false);
            }
        };

        fetchClasses();
    }, [selectedDateISO, user?.uid]);

    useEffect(() => {
        if (activeTab !== "coaches" || coachSchedules.length > 0) return;

        const loadSchedules = async () => {
            setIsLoadingCoaches(true);

            try {
                const { getCoachSchedules } = require("@/src/services/gymService");
                const loadedSchedules = await getCoachSchedules();
                setCoachSchedules(loadedSchedules || []);
            } catch (error) {
                console.error("Error cargando horarios de coaches:", error);
            } finally {
                setIsLoadingCoaches(false);
            }
        };

        loadSchedules();
    }, [activeTab, coachSchedules.length]);

    const getAttendanceDate = (item) => {
        return item?.dateISO || item?.date || item?.classDate || "";
    };

    const streakCount = useMemo(() => {
        if (!gymAttendance.length) return 0;

        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendedTimes = new Set(
            gymAttendance
                .map((item) => getAttendanceDate(item))
                .filter(Boolean)
                .map((dateValue) => {
                    const [year, month, day] = dateValue.split("-");
                    return new Date(year, month - 1, day).getTime();
                })
        );

        const checkDate = new Date(today);

        if (attendedTimes.has(checkDate.getTime())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            checkDate.setDate(checkDate.getDate() - 1);

            if (attendedTimes.has(checkDate.getTime())) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                return 0;
            }
        }

        while (attendedTimes.has(checkDate.getTime())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        return streak;
    }, [gymAttendance]);

    const calendarDays = useMemo(() => {
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let creationDate = null;

        if (user?.metadata?.creationTime) {
            creationDate = new Date(user.metadata.creationTime);
            creationDate.setHours(0, 0, 0, 0);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(year, month, i);
            dateObj.setHours(0, 0, 0, 0);

            const isoDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                i
            ).padStart(2, "0")}`;

            const hasAttended = gymAttendance.some(
                (item) => getAttendanceDate(item) === isoDate
            );

            const hasClassMarker = allReservations.some(
                (reservation) =>
                    reservation.date === isoDate ||
                    reservation.classDate === isoDate ||
                    reservation.dateISO === isoDate
            );

            const dayOfWeek = dateObj.getDay();

            const hasCoachMarker = coachReservations.some(
                (reservation) =>
                    Array.isArray(reservation.slots) &&
                    reservation.slots.includes(dayOfWeek)
            );

            let attendanceState = "neutral";

            if (hasAttended) {
                attendanceState = "attended";
            } else if (dateObj < today) {
                if (!creationDate || dateObj >= creationDate) {
                    attendanceState = "missed";
                }
            }

            days.push({
                day: i,
                isoDate,
                dateObj,
                hasClassMarker,
                hasCoachMarker,
                attendanceState,
            });
        }

        return days;
    }, [currentMonth, allReservations, coachReservations, gymAttendance, user]);

    const handlePrevMonth = () => {
        setCurrentMonth(
            (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
        );
    };

    const handleNextMonth = () => {
        setCurrentMonth(
            (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
        );
    };

    const handleReserveClass = (cls) => {
        if ((cls.availableSpots || 0) <= 0) {
            Alert.alert("Clase llena", "No hay lugares disponibles.");
            return;
        }

        Alert.alert(
            "Confirmar reserva",
            `¿Quieres reservar ${cls.name} a las ${cls.startTime}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Reservar",
                    onPress: async () => {
                        try {
                            const userName = user?.displayName || "Atleta";

                            await bookClass(user.uid, cls, userName);
                            await fetchCalendarData();

                            Alert.alert("¡Listo!", "Tu lugar está asegurado.");
                        } catch (error) {
                            console.error("Error reservando clase:", error);
                            Alert.alert("Error", "No pudimos procesar tu reserva.");
                        }
                    },
                },
            ]
        );
    };

    const handleCancelClass = (cls) => {
        const reservation = allReservations.find(
            (item) => item.classID === cls.id || item.classId === cls.id
        );

        if (!reservation) {
            Alert.alert("Error", "No encontramos la reserva para cancelar.");
            return;
        }

        Alert.alert(
            "Cancelar reserva",
            `¿Seguro que quieres cancelar tu reserva de ${cls.name}?`,
            [
                { text: "Volver", style: "cancel" },
                {
                    text: "Sí, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await cancelClassReservation(reservation.id, cls.id);
                            await fetchCalendarData();

                            Alert.alert("Cancelada", "Reserva cancelada exitosamente.");
                        } catch (error) {
                            console.error("Error cancelando clase:", error);
                            Alert.alert("Error", "No se pudo cancelar la reserva.");
                        }
                    },
                },
            ]
        );
    };

    const handleReserveCoach = (schedule) => {
        Alert.alert(
            "Entrenamiento personal",
            `¿Deseas reservar con ${schedule.coachName} para el mes ${schedule.month}/${schedule.year}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Reservar mes",
                    onPress: async () => {
                        try {
                            await reserveCoachMonthlySchedule(
                                user.uid,
                                schedule.coachId,
                                schedule.coachName,
                                schedule.month,
                                schedule.year,
                                schedule.slots,
                                schedule.id,
                                schedule.startTime || schedule.time
                            );

                            await fetchCalendarData();

                            Alert.alert("¡Listo!", "Coach reservado para el mes.");
                        } catch (error) {
                            console.error("Error reservando coach:", error);
                            Alert.alert("Error", "No pudimos procesar tu reserva.");
                        }
                    },
                },
            ]
        );
    };

    const handleCancelCoach = (schedule) => {
        const reservation = coachReservations.find(
            (item) =>
                item.scheduleId === schedule.id ||
                (item.coachId === schedule.coachId && item.month === schedule.month)
        );

        if (!reservation) {
            Alert.alert("Error", "No encontramos la reserva mensual.");
            return;
        }

        Alert.alert(
            "Cancelar entrenamiento",
            `¿Seguro que quieres cancelar el entrenamiento mensual con ${schedule.coachName}?`,
            [
                { text: "Volver", style: "cancel" },
                {
                    text: "Sí, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await cancelCoachReservation(reservation.id);
                            await fetchCalendarData();

                            Alert.alert("Cancelado", "Entrenamiento mensual cancelado.");
                        } catch (error) {
                            console.error("Error cancelando coach:", error);
                            Alert.alert("Error", "No se pudo cancelar.");
                        }
                    },
                },
            ]
        );
    };

    const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
    ];

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

    return (
        <View className="flex-1 bg-impulse-dark pt-14 px-5">
            <View className="mb-6 mt-2 flex-row justify-between items-start">
                <View>
                    <Text className="text-white text-3xl font-black tracking-tight">
                        Tu Calendario
                    </Text>
                    <Text className="text-gray-400 font-medium mt-1">
                        Sigue tu progreso y actividades
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => router.push("/(user)/scan-attendance")}
                    className="bg-[#1C1C1E] flex-row items-center pl-3 pr-4 py-2 rounded-2xl border border-white/10"
                >
                    <IconSymbol name="qrcode.viewfinder" size={18} color="#00E5FF" />
                    <Text className="text-[#00E5FF] font-bold text-xs ml-2">SCAN</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                <View className="bg-[#1C1C1E] p-5 rounded-3xl mb-6 shadow-lg border border-white/5 mx-1">
                    <View className="flex-row justify-between items-center mb-4 px-2">
                        <TouchableOpacity
                            onPress={handlePrevMonth}
                            className="bg-white/10 p-2 rounded-full"
                        >
                            <IconSymbol name="chevron.left" size={20} color="#00E5FF" />
                        </TouchableOpacity>

                        <Text className="text-white text-lg font-bold">
                            {monthNames[currentMonth.getMonth()].toUpperCase()}{" "}
                            {currentMonth.getFullYear()}
                        </Text>

                        <TouchableOpacity
                            onPress={handleNextMonth}
                            className="bg-white/10 p-2 rounded-full"
                        >
                            <IconSymbol name="chevron.right" size={20} color="#00E5FF" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row mb-2">
                        {dayNames.map((day) => (
                            <Text
                                key={day}
                                className="flex-1 text-center text-gray-500 text-[10px] font-black uppercase"
                            >
                                {day}
                            </Text>
                        ))}
                    </View>

                    {isLoadingCalendar ? (
                        <View className="py-8 items-center justify-center">
                            <ActivityIndicator color="#00E5FF" size="large" />
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap">
                            {calendarDays.map((item, index) => {
                                if (!item) {
                                    return (
                                        <View
                                            key={`empty-${index}`}
                                            style={{ width: "14.28%", aspectRatio: 1 }}
                                        />
                                    );
                                }

                                const isSelected = item.isoDate === selectedDateISO;

                                let bgClass = "bg-[#2C2C2E]";
                                let borderClass = "border-transparent";
                                let textClass = "text-white";

                                if (item.attendanceState === "attended") {
                                    bgClass = "bg-green-500/30";
                                    textClass = "text-green-300";
                                }

                                if (item.attendanceState === "missed") {
                                    bgClass = "bg-red-500/20";
                                    textClass = "text-white";
                                }

                                if (isSelected) {
                                    borderClass = "border-impulse-cyan border-[2px]";
                                    textClass = "text-impulse-cyan";
                                }

                                return (
                                    <TouchableOpacity
                                        key={`day-${item.day}`}
                                        onPress={() => setSelectedDateISO(item.isoDate)}
                                        activeOpacity={0.7}
                                        style={{ width: "14.28%", aspectRatio: 1, padding: 3 }}
                                    >
                                        <View
                                            className={`flex-1 rounded-xl items-center justify-center border ${bgClass} ${borderClass}`}
                                        >
                                            <Text className={`text-sm font-bold ${textClass}`}>
                                                {item.day}
                                            </Text>

                                            <View className="flex-row mt-1 space-x-1">
                                                {item.hasClassMarker && (
                                                    <View className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                                )}

                                                {item.hasCoachMarker && (
                                                    <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                )}

                                                {item.attendanceState === "attended" && (
                                                    <View className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                <View className="bg-[#1C1C1E] p-5 rounded-3xl mb-6 mx-1 border border-green-500/30 flex-row items-center">
                    <View className="bg-green-500/20 p-3 rounded-2xl mr-4">
                        <IconSymbol name="flame.fill" size={28} color="#22c55e" />
                    </View>

                    <View className="flex-1">
                        <Text className="text-white text-xl font-black tracking-tighter">
                            {streakCount} días consecutivos
                        </Text>
                        <Text className="text-gray-400 text-sm font-medium mt-0.5">
                            {streakCount > 0
                                ? "¡Excelente ritmo, sigue así!"
                                : "Comienza tu racha hoy"}
                        </Text>
                    </View>
                </View>

                <View className="bg-[#1C1C1E] p-1 rounded-full flex-row mx-1 mb-6 border border-white/5">
                    <TouchableOpacity
                        onPress={() => setActiveTab("classes")}
                        className={`flex-1 py-3 rounded-full items-center ${
                            activeTab === "classes"
                                ? "bg-impulse-cyan/20 border border-impulse-cyan/30"
                                : "bg-transparent border border-transparent"
                        }`}
                    >
                        <Text
                            className={`font-black tracking-wide ${
                                activeTab === "classes" ? "text-impulse-cyan" : "text-gray-400"
                            }`}
                        >
                            CLASES
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setActiveTab("coaches")}
                        className={`flex-1 py-3 rounded-full items-center ${
                            activeTab === "coaches"
                                ? "bg-blue-600/20 border border-blue-500/30"
                                : "bg-transparent border border-transparent"
                        }`}
                    >
                        <Text
                            className={`font-black tracking-wide ${
                                activeTab === "coaches" ? "text-blue-400" : "text-gray-400"
                            }`}
                        >
                            COACHES
                        </Text>
                    </TouchableOpacity>
                </View>

                {activeTab === "classes" ? (
                    <View>
                        <Text className="text-white text-lg font-black mb-4 mx-2">
                            Programación del día
                        </Text>

                        {isLoadingClasses ? (
                            <View className="py-10 items-center justify-center">
                                <ActivityIndicator color="#00E5FF" size="large" />
                            </View>
                        ) : classesForDate.length === 0 ? (
                            <View className="py-10 items-center justify-center bg-[#1C1C1E] rounded-3xl mx-1 border border-white/5">
                                <IconSymbol
                                    name="calendar.badge.exclamationmark"
                                    size={48}
                                    color="#444"
                                />
                                <Text className="text-gray-500 font-bold mt-4">
                                    No hay clases programadas para este día.
                                </Text>
                            </View>
                        ) : (
                            classesForDate.map((cls) => {
                                const reservationInfo = allReservations.find(
                                    (item) => item.classID === cls.id || item.classId === cls.id
                                );

                                const isReserved = !!reservationInfo;
                                const isAttended = reservationInfo?.status === "attended";
                                const spots = cls.availableSpots || 0;
                                const isFull = spots <= 0 && !isReserved;

                                return (
                                    <View
                                        key={cls.id}
                                        className="bg-[#1C1C1E] p-5 rounded-3xl mb-4 border border-white/5 mx-1"
                                    >
                                        <View className="flex-row justify-between items-center mb-4">
                                            <View>
                                                <Text className="text-white text-3xl font-black tracking-tighter">
                                                    {cls.startTime}
                                                </Text>

                                                {cls.endTime && (
                                                    <Text className="text-gray-500 font-bold mb-1">
                                                        hasta {cls.endTime}
                                                    </Text>
                                                )}

                                                <Text className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-1">
                                                    {cls.name}
                                                </Text>
                                            </View>

                                            <View className="bg-pink-500/10 px-3 py-1.5 rounded-full border border-pink-500/30">
                                                <Text className="font-bold text-[10px] text-pink-400 tracking-wider">
                                                    GRUPO
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="flex-row items-center mb-5">
                                            <View className="bg-white/10 w-8 h-8 rounded-full items-center justify-center mr-3">
                                                <IconSymbol name="person.fill" size={14} color="#888" />
                                            </View>

                                            <Text className="text-gray-300 font-medium">
                                                {cls.coachName || "Coach Invitado"}
                                            </Text>
                                        </View>

                                        <View className="flex-row items-center justify-between mt-2 pt-4 border-t border-white/5">
                                            <Text
                                                className={`text-xs font-black ${
                                                    isFull ? "text-red-500" : "text-gray-400"
                                                }`}
                                            >
                                                {isFull ? "SIN CUPO" : `${spots} LUGARES`}
                                            </Text>

                                            {isReserved ? (
                                                <View className="flex-row gap-2">
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            router.push({
                                                                pathname: "/(user)/ticket",
                                                                params: {
                                                                    classId: cls.id,
                                                                    className: cls.name,
                                                                    time: cls.startTime,
                                                                    coach: cls.coachName,
                                                                },
                                                            })
                                                        }
                                                        className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/20"
                                                    >
                                                        <Text className="font-black text-xs text-white">
                                                            VER TICKET
                                                        </Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            isAttended
                                                                ? Alert.alert(
                                                                    "Realizada",
                                                                    "Ya asististe a esta clase."
                                                                )
                                                                : handleCancelClass(cls)
                                                        }
                                                        className={`px-5 py-2.5 rounded-xl border ${
                                                            isAttended
                                                                ? "bg-green-500/10 border-green-500/30"
                                                                : "bg-red-500/10 border-red-500/30"
                                                        }`}
                                                    >
                                                        <Text
                                                            className={`font-black text-xs ${
                                                                isAttended ? "text-green-500" : "text-red-500"
                                                            }`}
                                                        >
                                                            {isAttended ? "ASISTIDA" : "CANCELAR"}
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => handleReserveClass(cls)}
                                                    disabled={isFull}
                                                    className={`px-6 py-2.5 rounded-xl ${
                                                        isFull ? "bg-white/5" : "bg-impulse-cyan"
                                                    }`}
                                                >
                                                    <Text
                                                        className={`font-black text-xs ${
                                                            isFull ? "text-white/20" : "text-black"
                                                        }`}
                                                    >
                                                        RESERVAR
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                ) : (
                    <View>
                        <Text className="text-white text-lg font-black mb-4 mx-2">
                            Disponibilidad mensual
                        </Text>

                        {isLoadingCoaches ? (
                            <View className="py-10 items-center justify-center">
                                <ActivityIndicator color="#00E5FF" size="large" />
                            </View>
                        ) : coachSchedules.length === 0 ? (
                            <View className="py-10 items-center justify-center bg-[#1C1C1E] rounded-3xl mx-1 border border-white/5">
                                <IconSymbol name="person.3.fill" size={48} color="#444" />
                                <Text className="text-gray-500 font-bold mt-4">
                                    No hay entrenamientos mensuales disponibles.
                                </Text>
                            </View>
                        ) : (
                            coachSchedules.map((schedule) => {
                                const reservation = coachReservations.find(
                                    (item) =>
                                        item.scheduleId === schedule.id ||
                                        (item.coachId === schedule.coachId &&
                                            item.month === schedule.month)
                                );

                                const isReserved = !!reservation;

                                return (
                                    <View
                                        key={schedule.id}
                                        className="bg-[#1C1C1E] p-5 rounded-3xl mb-4 mx-1 border border-blue-500/20"
                                    >
                                        <View className="flex-row items-center mb-4">
                                            <View className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 items-center justify-center mr-4">
                                                <Text className="text-2xl font-black text-blue-400">
                                                    {schedule.coachName?.charAt(0) || "C"}
                                                </Text>
                                            </View>

                                            <View className="flex-1">
                                                <Text className="text-white text-xl font-black">
                                                    {schedule.coachName}
                                                </Text>
                                                <Text className="text-gray-400 font-bold text-xs uppercase mt-0.5">
                                                    Mensualidad ({schedule.month}/{schedule.year})
                                                </Text>
                                            </View>
                                        </View>

                                        <View className="bg-black/30 p-3 rounded-2xl mb-4 border border-white/5 opacity-80">
                                            <Text className="text-blue-300 text-xs font-black mb-1">
                                                DISPONIBILIDAD
                                            </Text>

                                            <Text className="text-gray-300 text-sm font-medium">
                                                A las {schedule.startTime || schedule.time}
                                                {schedule.endTime ? ` a ${schedule.endTime}` : ""}
                                            </Text>
                                        </View>

                                        {isReserved ? (
                                            <View className="flex-row items-center gap-2 mt-2">
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        router.push({
                                                            pathname: "/(user)/ticket",
                                                            params: {
                                                                classId: schedule.id,
                                                                type: "monthly",
                                                                className: `Coach ${schedule.coachName}`,
                                                                time: schedule.startTime || schedule.time,
                                                                coach: schedule.coachName,
                                                            },
                                                        })
                                                    }
                                                    className="bg-white/10 flex-1 border border-white/30 py-3 rounded-xl items-center"
                                                >
                                                    <Text className="text-white font-black text-xs">
                                                        VER TICKET
                                                    </Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    onPress={() => handleCancelCoach(schedule)}
                                                    className="bg-red-500/10 border border-red-500/30 py-3 px-4 rounded-xl items-center"
                                                >
                                                    <Text className="text-red-500 font-black text-xs">
                                                        X
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity
                                                onPress={() => handleReserveCoach(schedule)}
                                                className="bg-blue-600/20 border border-blue-500 py-3 rounded-xl items-center"
                                            >
                                                <Text className="text-blue-400 font-black text-xs tracking-wider">
                                                    RESERVAR MES
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}