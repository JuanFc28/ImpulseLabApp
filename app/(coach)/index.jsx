import React, { useEffect, useMemo, useState } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "../../src/context/AuthContext";
import { useRouter } from "expo-router";
import { db } from "@/src/config/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const WEEK_DAY_VALUES = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

const WEEK_DAY_LABELS = {
    sunday: "Domingo",
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
};

const toISODate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const normalizeTime = (value) => {
    if (!value || typeof value !== "string") return "00:00";

    const trimmed = value.trim();

    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
        const [hours, minutes] = trimmed.split(":");
        return `${String(Number(hours)).padStart(2, "0")}:${minutes}`;
    }

    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(trimmed)) {
        const match = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

        if (!match) return "00:00";

        let hours = Number(match[1]);
        const minutes = match[2];
        const meridiem = match[3].toUpperCase();

        if (meridiem === "PM" && hours < 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;

        return `${String(hours).padStart(2, "0")}:${minutes}`;
    }

    return "00:00";
};

const buildDateTime = (dateISO, timeValue = "00:00") => {
    if (!dateISO) return null;

    const [year, month, day] = dateISO.split("-").map(Number);
    const [hours, minutes] = normalizeTime(timeValue).split(":").map(Number);

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
};

const getWeekDayValue = (isoDate) => {
    const date = new Date(`${isoDate}T12:00:00`);
    return WEEK_DAY_VALUES[date.getDay()];
};

const getWeekRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
        startOfWeek,
        endOfWeek,
        startISO: toISODate(startOfWeek),
        endISO: toISODate(endOfWeek),
    };
};

const getReservationDate = (reservation) => {
    return reservation?.dateISO || reservation?.date || reservation?.classDate || "";
};

const classAppliesToDate = (classItem, selectedDateISO) => {
    if (!classItem || !selectedDateISO) return false;

    const startDate = classItem.startDate || classItem.date || "";
    const endDate = classItem.endDate || "";

    if (!startDate) return false;
    if (selectedDateISO < startDate) return false;
    if (endDate && selectedDateISO > endDate) return false;

    if (Array.isArray(classItem.recurrenceDays) && classItem.recurrenceDays.length > 0) {
        return classItem.recurrenceDays.includes(getWeekDayValue(selectedDateISO));
    }

    return classItem.date === selectedDateISO;
};

const isClassCancelledForDate = (classItem, selectedDateISO) => {
    if (!classItem) return false;

    return (
        classItem.status === "cancelled" ||
        classItem.active === false ||
        (Array.isArray(classItem.cancelledDates) &&
            classItem.cancelledDates.includes(selectedDateISO))
    );
};

const isClassSessionPast = (classItem, selectedDateISO) => {
    const sessionDateTime = buildDateTime(selectedDateISO, classItem?.startTime || "00:00");

    if (!sessionDateTime) return false;

    return sessionDateTime.getTime() < new Date().getTime();
};

const getClassDisplayDate = (classItem) => {
    return classItem.displayDate || classItem.startDate || classItem.date || "Sin fecha";
};

const getReservedCountForDate = (reservations, classId, dateISO) => {
    return reservations.filter((reservation) => {
        const sameClass =
            reservation.classID === classId ||
            reservation.classId === classId;

        const sameDate = getReservationDate(reservation) === dateISO;

        const activeReservation =
            reservation.status !== "cancelled" &&
            reservation.userAcknowledgedCancellation !== true;

        return sameClass && sameDate && activeReservation;
    }).length;
};

const getCapacityInfo = (classItem, reservations) => {
    const totalSpots = Number(classItem?.totalSpots || classItem?.capacity || 0);
    const dateISO =
        classItem?.displayDate ||
        classItem?.dateISO ||
        classItem?.date ||
        classItem?.startDate;

    const reservedCount = getReservedCountForDate(
        reservations,
        classItem.id,
        dateISO
    );

    const availableSpots = Math.max(totalSpots - reservedCount, 0);

    return {
        totalSpots,
        reservedCount,
        availableSpots,
        isFull: totalSpots > 0 && reservedCount >= totalSpots,
    };
};

const expandClassOccurrences = (classes, startDate, endDate, includePast = true) => {
    const occurrences = [];
    const todayNow = new Date();

    let cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    const limit = new Date(endDate);
    limit.setHours(23, 59, 59, 999);

    while (cursor <= limit) {
        const dateISO = toISODate(cursor);

        classes.forEach((classItem) => {
            if (!classAppliesToDate(classItem, dateISO)) return;

            const cancelledForDate = isClassCancelledForDate(classItem, dateISO);

            if (!includePast) {
                const sessionDateTime = buildDateTime(dateISO, classItem.startTime || "00:00");
                if (sessionDateTime && sessionDateTime.getTime() < todayNow.getTime()) return;
            }

            occurrences.push({
                ...classItem,
                displayDate: dateISO,
                date: dateISO,
                dateISO,
                classDate: dateISO,
                dayValue: getWeekDayValue(dateISO),
                isCancelledForDate: cancelledForDate,
            });
        });

        cursor = addDays(cursor, 1);
    }

    return occurrences.sort((a, b) => {
        const dateA = buildDateTime(a.displayDate, a.startTime || "00:00");
        const dateB = buildDateTime(b.displayDate, b.startTime || "00:00");

        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });
};

const findNextClassOccurrence = (classes, todayISO) => {
    const todayDate = new Date(`${todayISO}T12:00:00`);
    const searchEndDate = addDays(todayDate, 90);

    const upcomingOccurrences = expandClassOccurrences(
        classes.filter((item) => item.status !== "cancelled" && item.active !== false),
        todayDate,
        searchEndDate,
        false
    ).filter((item) => !isClassCancelledForDate(item, item.displayDate));

    return upcomingOccurrences[0] || null;
};

export default function CoachHomeScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [classes, setClasses] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [isLoadingClasses, setIsLoadingClasses] = useState(true);
    const [isLoadingReservations, setIsLoadingReservations] = useState(true);

    const todayString = toISODate(new Date());
    const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Coach";
    const isLoading = isLoadingClasses || isLoadingReservations;

    useEffect(() => {
        if (!user?.uid) {
            setIsLoadingClasses(false);
            return undefined;
        }

        setIsLoadingClasses(true);

        const q = query(
            collection(db, "classes"),
            where("coachId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const loadedClasses = querySnapshot.docs.map((classDoc) => ({
                    id: classDoc.id,
                    ...classDoc.data(),
                }));

                loadedClasses.sort((a, b) => {
                    const dateA = getClassDisplayDate(a);
                    const dateB = getClassDisplayDate(b);

                    if (dateA === dateB) {
                        return String(a.startTime || "").localeCompare(String(b.startTime || ""));
                    }

                    return String(dateA).localeCompare(String(dateB));
                });

                setClasses(loadedClasses);
                setIsLoadingClasses(false);
            },
            (error) => {
                console.error("Error en tiempo real al cargar clases del coach:", error);
                setIsLoadingClasses(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid]);

    useEffect(() => {
        if (!user?.uid) {
            setIsLoadingReservations(false);
            return undefined;
        }

        setIsLoadingReservations(true);

        const q = query(
            collection(db, "reservations"),
            where("coachId", "==", user.uid)
        );

        const unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
                const loadedReservations = querySnapshot.docs.map((reservationDoc) => ({
                    id: reservationDoc.id,
                    ...reservationDoc.data(),
                }));

                setReservations(loadedReservations);
                setIsLoadingReservations(false);
            },
            (error) => {
                console.error("Error en tiempo real al cargar reservaciones del coach:", error);
                setReservations([]);
                setIsLoadingReservations(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid]);

    const activeClasses = useMemo(() => {
        return classes.filter((item) => item.status !== "cancelled" && item.active !== false);
    }, [classes]);

    const weeklyClasses = useMemo(() => {
        const { startOfWeek, endOfWeek } = getWeekRange();

        return expandClassOccurrences(classes, startOfWeek, endOfWeek, true);
    }, [classes]);

    const cancelledClasses = useMemo(() => {
        return weeklyClasses.filter((item) =>
            isClassCancelledForDate(item, item.displayDate)
        );
    }, [weeklyClasses]);

    const activeWeeklyClasses = useMemo(() => {
        return weeklyClasses.filter(
            (item) => !isClassCancelledForDate(item, item.displayDate)
        );
    }, [weeklyClasses]);

    const todayClasses = useMemo(() => {
        return activeWeeklyClasses.filter((item) => {
            if (item.displayDate !== todayString) return false;
            if (isClassSessionPast(item, todayString)) return false;

            return true;
        });
    }, [activeWeeklyClasses, todayString]);

    const totalWeeklyCapacity = useMemo(() => {
        return activeWeeklyClasses.reduce(
            (acc, item) => acc + Number(item.totalSpots || item.capacity || 0),
            0
        );
    }, [activeWeeklyClasses]);

    const upcomingClass = useMemo(() => {
        return findNextClassOccurrence(activeClasses, todayString);
    }, [activeClasses, todayString]);

    const { startISO, endISO } = useMemo(() => getWeekRange(), []);

    if (isLoading) {
        return (
            <View className="flex-1 bg-impulse-dark justify-center items-center">
                <ActivityIndicator size="large" color="#FF9500" />
                <Text className="text-gray-400 mt-4 font-bold">
                    Cargando panel del coach...
                </Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-impulse-dark relative">
            <ScrollView
                className="flex-1 px-5 pt-14"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-[120px]"
            >
                <View className="flex-row justify-between items-center mb-8">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-full border-2 border-orange-500 p-[2px] mr-3">
                            <View className="flex-1 rounded-full bg-impulse-gray items-center justify-center overflow-hidden">
                                <IconSymbol name="person.fill" size={20} color="#FF9500" />
                            </View>
                        </View>

                        <View>
                            <View className="flex-row items-center mb-0.5">
                                <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-[2px]">
                                    Modo Coach
                                </Text>
                            </View>

                            <Text className="text-white text-2xl font-black tracking-tight">
                                Hola, {firstName}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center">
                        <IconSymbol name="bell.fill" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-impulse-gray border border-white/5 rounded-3xl p-5 relative overflow-hidden">
                        <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">
                            CLASES RESTANTES HOY
                        </Text>

                        <View className="flex-row items-baseline">
                            <Text className="text-white text-3xl font-black">
                                {todayClasses.length}
                            </Text>
                            <Text className="text-gray-500 text-sm ml-1">hoy</Text>
                        </View>
                    </View>

                    <View className="flex-1 bg-impulse-gray border border-white/5 rounded-3xl p-5 relative overflow-hidden">
                        <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-1">
                            CUPO SEMANAL
                        </Text>

                        <View className="flex-row items-baseline">
                            <Text className="text-white text-3xl font-black">
                                {totalWeeklyCapacity}
                            </Text>
                            <Text className="text-impulse-cyan text-sm ml-1">spots</Text>
                        </View>
                    </View>
                </View>

                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-red-500/10 border border-red-500/20 rounded-3xl p-5 relative overflow-hidden">
                        <Text className="text-red-400 text-[10px] font-bold tracking-widest mb-1">
                            CANCELADAS
                        </Text>

                        <View className="flex-row items-baseline">
                            <Text className="text-red-400 text-3xl font-black">
                                {cancelledClasses.length}
                            </Text>
                            <Text className="text-red-300 text-sm ml-1">total</Text>
                        </View>
                    </View>

                    <View className="flex-1 bg-green-500/10 border border-green-500/20 rounded-3xl p-5 relative overflow-hidden">
                        <Text className="text-green-400 text-[10px] font-bold tracking-widest mb-1">
                            ACTIVAS
                        </Text>

                        <View className="flex-row items-baseline">
                            <Text className="text-green-400 text-3xl font-black">
                                {activeClasses.length}
                            </Text>
                            <Text className="text-green-300 text-sm ml-1">clases</Text>
                        </View>
                    </View>
                </View>

                <View className="flex-row justify-between items-end mb-4">
                    <Text className="text-white text-lg font-black">Tu próxima clase</Text>
                    <Text className="text-impulse-cyan text-xs font-bold">
                        {upcomingClass?.startTime || "--:--"} hrs
                    </Text>
                </View>

                {upcomingClass ? (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() =>
                            router.push({
                                pathname: "/(coach)/class-detail",
                                params: {
                                    classId: upcomingClass.id,
                                    date: upcomingClass.displayDate || todayString,
                                },
                            })
                        }
                        className="rounded-[32px] p-6 mb-8 shadow-xl bg-impulse-cyan shadow-impulse-cyan/20"
                    >
                        <View className="flex-row justify-between items-start mb-4">
                            <View className="px-3 py-1.5 rounded-full border bg-black/10 border-black/10">
                                <Text className="text-xs font-bold text-black">
                                    {upcomingClass.name}
                                </Text>
                            </View>

                            <View className="bg-black/10 w-10 h-10 rounded-full items-center justify-center">
                                <IconSymbol name="chevron.right" size={18} color="#000" />
                            </View>
                        </View>

                        <Text className="text-3xl font-black mb-1 text-black">
                            {upcomingClass.displayDate}
                        </Text>

                        {(() => {
                            const capacity = getCapacityInfo(upcomingClass, reservations);

                            return (
                                <Text className="text-sm font-bold mb-6 text-black/70">
                                    Hora: {upcomingClass.startTime} • Cupos:{" "}
                                    {capacity.reservedCount}/{capacity.totalSpots}
                                </Text>
                            );
                        })()}
                    </TouchableOpacity>
                ) : (
                    <View className="bg-impulse-gray border border-white/5 rounded-[32px] p-6 mb-8">
                        <Text className="text-white text-xl font-black mb-2">
                            Sin próximas clases
                        </Text>

                        <Text className="text-gray-400">
                            No tienes clases próximas activas desde este momento.
                        </Text>
                    </View>
                )}

                <View className="bg-[#111] border border-white/5 rounded-[32px] p-6 mb-8">
                    <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center">
                            <IconSymbol name="calendar" size={20} color="#FFF" />
                            <Text className="text-white text-lg font-black ml-3">
                                Mis clases de la semana
                            </Text>
                        </View>

                        <View className="bg-white/10 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold">
                                {weeklyClasses.length}
                            </Text>
                        </View>
                    </View>

                    <Text className="text-gray-500 text-[11px] font-bold mb-5 ml-8">
                        {startISO} al {endISO}
                    </Text>

                    {weeklyClasses.length === 0 ? (
                        <Text className="text-gray-400">
                            No tienes clases asignadas para esta semana.
                        </Text>
                    ) : (
                        weeklyClasses.map((item, index) => {
                            const displayDate = item.displayDate || getClassDisplayDate(item);
                            const isCancelled = isClassCancelledForDate(item, displayDate);
                            const capacity = getCapacityInfo(item, reservations);
                            const dayLabel = WEEK_DAY_LABELS[item.dayValue] || "";
                            const isCancelledSpecificDate =
                                Array.isArray(item.cancelledDates) &&
                                item.cancelledDates.includes(displayDate);

                            return (
                                <TouchableOpacity
                                    key={`${item.id}-${displayDate}-${index}`}
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(coach)/class-detail",
                                            params: {
                                                classId: item.id,
                                                date: displayDate,
                                            },
                                        })
                                    }
                                    className={`flex-row justify-between items-center py-3 ${
                                        index !== weeklyClasses.length - 1
                                            ? "border-b border-white/5"
                                            : ""
                                    }`}
                                >
                                    <View className="flex-1 pr-3">
                                        <View className="flex-row items-center flex-wrap">
                                            <Text
                                                className={`font-bold text-base ${
                                                    isCancelled
                                                        ? "text-red-400"
                                                        : "text-white"
                                                }`}
                                            >
                                                {item.name}
                                            </Text>

                                            {isCancelled && (
                                                <View className="bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30 ml-2">
                                                    <Text className="text-red-400 text-[9px] font-black uppercase">
                                                        Cancelada
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        <Text
                                            className={`text-xs mt-1 ${
                                                isCancelled
                                                    ? "text-red-300"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            {dayLabel} • {displayDate} • {item.startTime || "--:--"}
                                        </Text>

                                        {isCancelledSpecificDate && (
                                            <Text className="text-red-400 text-[10px] font-bold mt-1">
                                                Fecha cancelada: {displayDate}
                                            </Text>
                                        )}

                                        {!isCancelled && (
                                            <Text className="text-gray-500 text-[10px] font-bold mt-1">
                                                {capacity.availableSpots} lugares disponibles
                                            </Text>
                                        )}
                                    </View>

                                    <View className="flex-row items-center">
                                        <View
                                            className={`px-3 py-2 rounded-full mr-2 ${
                                                isCancelled
                                                    ? "bg-red-500/10 border border-red-500/20"
                                                    : capacity.isFull
                                                        ? "bg-red-500/10 border border-red-500/20"
                                                        : "bg-white/5"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    isCancelled || capacity.isFull
                                                        ? "text-red-400"
                                                        : "text-white"
                                                }`}
                                            >
                                                {capacity.reservedCount}/{capacity.totalSpots}
                                            </Text>
                                        </View>

                                        <IconSymbol name="chevron.right" size={16} color="#888" />
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <View className="absolute bottom-10 left-6 right-6">
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                        router.push({
                            pathname: "/(coach)/scanner",
                            params: {
                                date: todayString,
                            },
                        })
                    }
                    className="bg-white flex-row items-center justify-center py-5 rounded-full shadow-2xl shadow-white/20"
                >
                    <View className="bg-black/5 p-1 rounded-full mr-2">
                        <IconSymbol name="checkmark.circle.fill" size={18} color="#000" />
                    </View>

                    <Text className="text-impulse-dark font-black text-sm tracking-[2px]">
                        PASAR LISTA AHORA
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}