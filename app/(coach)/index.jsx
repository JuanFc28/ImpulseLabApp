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

const toISODate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getTodayTimeValue = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
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

const getClassDisplayDate = (classItem) => {
    return classItem.startDate || classItem.date || "Sin fecha";
};

const getSafeSpots = (classItem) => {
    const available = classItem.availableSpots ?? classItem.totalSpots ?? 0;
    return Math.max(available, 0);
};

const findNextClassOccurrence = (classes, todayISO) => {
    const currentTime = getTodayTimeValue();
    const todayDate = new Date(`${todayISO}T12:00:00`);
    const candidates = [];

    for (let offset = 0; offset <= 90; offset++) {
        const dateISO = toISODate(addDays(todayDate, offset));

        classes.forEach((classItem) => {
            if (classItem.status === "cancelled" || classItem.active === false) return;
            if (!classAppliesToDate(classItem, dateISO)) return;
            if (isClassCancelledForDate(classItem, dateISO)) return;

            const classTime = classItem.startTime || "00:00";

            if (dateISO === todayISO && classTime < currentTime) return;

            candidates.push({
                ...classItem,
                displayDate: dateISO,
            });
        });

        if (candidates.length > 0) {
            break;
        }
    }

    candidates.sort((a, b) => {
        if (a.displayDate === b.displayDate) {
            return String(a.startTime || "").localeCompare(String(b.startTime || ""));
        }

        return String(a.displayDate).localeCompare(String(b.displayDate));
    });

    return candidates[0] || null;
};

export default function CoachHomeScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const todayString = toISODate(new Date());
    const firstName = user?.displayName ? user.displayName.split(" ")[0] : "Coach";

    useEffect(() => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

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
                setIsLoading(false);
            },
            (error) => {
                console.error("Error en tiempo real al cargar clases del coach:", error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.uid]);

    const todayClasses = useMemo(() => {
        const currentTime = getTodayTimeValue();

        return classes
            .filter((item) => classAppliesToDate(item, todayString))
            .filter((item) => !isClassCancelledForDate(item, todayString))
            .filter((item) => String(item.startTime || "00:00") >= currentTime);
    }, [classes, todayString]);

    const activeClasses = useMemo(() => {
        return classes.filter((item) => item.status !== "cancelled" && item.active !== false);
    }, [classes]);

    const cancelledClasses = useMemo(() => {
        return classes.filter((item) => item.status === "cancelled" || item.active === false);
    }, [classes]);

    const totalAttendanceCapacity = useMemo(() => {
        return activeClasses.reduce((acc, item) => acc + (item.totalSpots || 0), 0);
    }, [activeClasses]);

    const upcomingClass = useMemo(() => {
        return findNextClassOccurrence(activeClasses, todayString);
    }, [activeClasses, todayString]);

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
                            CUPO TOTAL
                        </Text>

                        <View className="flex-row items-baseline">
                            <Text className="text-white text-3xl font-black">
                                {totalAttendanceCapacity}
                            </Text>
                            <Text className="text-impulse-cyan text-sm ml-1"> spots</Text>
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

                        <Text className="text-sm font-bold mb-6 text-black/70">
                            Hora: {upcomingClass.startTime} • Lugares:{" "}
                            {getSafeSpots(upcomingClass)}/{upcomingClass.totalSpots}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-impulse-gray border border-white/5 rounded-[32px] p-6 mb-8">
                        <Text className="text-white text-xl font-black mb-2">
                            Sin próximas clases
                        </Text>

                        <Text className="text-gray-400">
                            No tienes clases próximas activas desde hoy.
                        </Text>
                    </View>
                )}

                <View className="bg-[#111] border border-white/5 rounded-[32px] p-6 mb-8">
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="flex-row items-center">
                            <IconSymbol name="calendar" size={20} color="#FFF" />
                            <Text className="text-white text-lg font-black ml-3">
                                Mis clases
                            </Text>
                        </View>

                        <View className="bg-white/10 px-3 py-1 rounded-full">
                            <Text className="text-white text-xs font-bold">
                                {classes.length}
                            </Text>
                        </View>
                    </View>

                    {classes.length === 0 ? (
                        <Text className="text-gray-400">
                            No tienes clases asignadas todavía.
                        </Text>
                    ) : (
                        classes.map((item, index) => {
                            const displayDate = getClassDisplayDate(item);
                            const isCancelled = isClassCancelledForDate(item, todayString);
                            const safeSpots = getSafeSpots(item);

                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    activeOpacity={0.85}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(coach)/class-detail",
                                            params: {
                                                classId: item.id,
                                                date: todayString,
                                            },
                                        })
                                    }
                                    className={`flex-row justify-between items-center py-3 ${
                                        index !== classes.length - 1
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
                                            Inicia {displayDate} • {item.startTime}
                                        </Text>

                                        {Array.isArray(item.cancelledDates) &&
                                            item.cancelledDates.length > 0 &&
                                            item.status !== "cancelled" && (
                                                <Text className="text-red-400 text-[10px] font-bold mt-1">
                                                    Fechas canceladas: {item.cancelledDates.join(", ")}
                                                </Text>
                                            )}
                                    </View>

                                    <View className="flex-row items-center">
                                        <View
                                            className={`px-3 py-2 rounded-full mr-2 ${
                                                isCancelled
                                                    ? "bg-red-500/10 border border-red-500/20"
                                                    : "bg-white/5"
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-bold ${
                                                    isCancelled
                                                        ? "text-red-400"
                                                        : "text-white"
                                                }`}
                                            >
                                                {safeSpots}/{item.totalSpots}
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