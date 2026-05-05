import { db } from "../config/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    arrayUnion,
    arrayRemove,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    increment,
} from "firebase/firestore";

const WEEK_DAY_VALUES = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
];

const getLocalDateISO = () => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
    ).padStart(2, "0")}`;
};

const nowDate = () => new Date();

const padNumber = (value) => String(value).padStart(2, "0");

const normalizeDateISO = (value) => {
    if (!value) return null;

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }

        const parsed = new Date(trimmed);

        if (!Number.isNaN(parsed.getTime())) {
            return `${parsed.getFullYear()}-${padNumber(parsed.getMonth() + 1)}-${padNumber(
                parsed.getDate()
            )}`;
        }

        return null;
    }

    if (value?.seconds) {
        const date = new Date(value.seconds * 1000);

        return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return `${value.getFullYear()}-${padNumber(value.getMonth() + 1)}-${padNumber(value.getDate())}`;
    }

    return null;
};

const normalizeTime = (value) => {
    if (!value) return "00:00";
    if (typeof value !== "string") return "00:00";

    const trimmed = value.trim();

    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
        const [hours, minutes] = trimmed.split(":");
        return `${padNumber(Number(hours))}:${minutes}`;
    }

    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(trimmed)) {
        const match = trimmed.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

        if (!match) return "00:00";

        let hours = Number(match[1]);
        const minutes = match[2];
        const meridiem = match[3].toUpperCase();

        if (meridiem === "PM" && hours < 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;

        return `${padNumber(hours)}:${minutes}`;
    }

    return "00:00";
};

const buildLocalDateTime = (dateISO, timeValue = "00:00") => {
    const normalizedDate = normalizeDateISO(dateISO);

    if (!normalizedDate) return null;

    const normalizedTime = normalizeTime(timeValue);
    const [year, month, day] = normalizedDate.split("-").map(Number);
    const [hours, minutes] = normalizedTime.split(":").map(Number);

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const addDays = (date, days) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
};

const toISODate = (date) => {
    return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;
};

const getWeekDayValue = (dateISO) => {
    const date = buildLocalDateTime(dateISO, "12:00");
    if (!date) return null;

    return WEEK_DAY_VALUES[date.getDay()];
};

const getWeekRangeFromDate = (dateISO) => {
    const baseDate = buildLocalDateTime(dateISO, "00:00") || new Date();
    baseDate.setHours(0, 0, 0, 0);

    const day = baseDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const startOfWeek = new Date(baseDate);
    startOfWeek.setDate(baseDate.getDate() + diffToMonday);
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

const classAppliesToDate = (classData = {}, selectedDateISO) => {
    const normalizedDate = normalizeDateISO(selectedDateISO);

    if (!normalizedDate) return false;

    const startDate =
        normalizeDateISO(classData.startDate) ||
        normalizeDateISO(classData.date) ||
        normalizeDateISO(classData.classDate);

    const endDate = normalizeDateISO(classData.endDate);

    if (!startDate) return false;
    if (normalizedDate < startDate) return false;
    if (endDate && normalizedDate > endDate) return false;

    if (Array.isArray(classData.recurrenceDays) && classData.recurrenceDays.length > 0) {
        return classData.recurrenceDays.includes(getWeekDayValue(normalizedDate));
    }

    return normalizeDateISO(classData.date) === normalizedDate;
};

const getClassDatesForWeek = (classData = {}, selectedDateISO) => {
    const normalizedDate = normalizeDateISO(selectedDateISO) || getLocalDateISO();
    const { startOfWeek, endOfWeek } = getWeekRangeFromDate(normalizedDate);

    const dates = [];
    let cursor = new Date(startOfWeek);

    while (cursor <= endOfWeek) {
        const currentISO = toISODate(cursor);

        if (classAppliesToDate(classData, currentISO)) {
            dates.push(currentISO);
        }

        cursor = addDays(cursor, 1);
    }

    return dates.length > 0 ? dates : [normalizedDate];
};

export const isPastClassSession = (classData = {}, selectedDate = null) => {
    const dateISO =
        normalizeDateISO(selectedDate) ||
        normalizeDateISO(classData.dateISO) ||
        normalizeDateISO(classData.classDate) ||
        normalizeDateISO(classData.date) ||
        normalizeDateISO(classData.startDate);

    if (!dateISO) return false;

    const timeValue =
        classData.startTime ||
        classData.classTime ||
        classData.time ||
        classData.hour ||
        "00:00";

    const classDateTime = buildLocalDateTime(dateISO, timeValue);

    if (!classDateTime) return false;

    return classDateTime.getTime() < nowDate().getTime();
};

export const isPastDateOnly = (dateValue) => {
    const dateISO = normalizeDateISO(dateValue);

    if (!dateISO) return false;

    const todayISO = getLocalDateISO();
    const today = buildLocalDateTime(todayISO, "00:00");
    const target = buildLocalDateTime(dateISO, "00:00");

    if (!today || !target) return false;

    return target.getTime() < today.getTime();
};

export const getReservationDateFromClass = (classData = {}) => {
    return (
        normalizeDateISO(classData.dateISO) ||
        normalizeDateISO(classData.classDate) ||
        normalizeDateISO(classData.date) ||
        normalizeDateISO(classData.startDate) ||
        getLocalDateISO()
    );
};

export const getClassReservedCountForDate = async (classId, dateISO) => {
    const normalizedDate = normalizeDateISO(dateISO) || getLocalDateISO();

    const q = query(
        collection(db, "reservations"),
        where("classID", "==", classId),
        where("date", "==", normalizedDate)
    );

    const snap = await getDocs(q);

    return snap.docs.filter((reservationDoc) => {
        const data = reservationDoc.data();

        return (
            data.status !== "cancelled" &&
            data.userAcknowledgedCancellation !== true
        );
    }).length;
};

export const getClassAvailableSpotsForDate = async (classId, dateISO, totalSpots = 0) => {
    const reservedCount = await getClassReservedCountForDate(classId, dateISO);

    return Math.max((Number(totalSpots) || 0) - reservedCount, 0);
};

export const getClassCapacityInfoForDate = async (classId, dateISO, totalSpots = 0) => {
    const reservedCount = await getClassReservedCountForDate(classId, dateISO);
    const capacity = Number(totalSpots) || 0;
    const availableSpots = Math.max(capacity - reservedCount, 0);

    return {
        reservedCount,
        capacity,
        totalSpots: capacity,
        availableSpots,
        reservedLabel: `${reservedCount}/${capacity} reservados`,
        availableLabel: `${availableSpots} lugares disponibles`,
        isFull: capacity > 0 && reservedCount >= capacity,
    };
};

export const createClass = async (classData) => {
    try {
        const totalSpots = Number(classData.totalSpots || classData.capacity || 0);

        await addDoc(collection(db, "classes"), {
            ...classData,
            attendees: Array.isArray(classData.attendees) ? classData.attendees : [],
            availableSpots: totalSpots,
            totalSpots,
            capacity: totalSpots,
            active: classData.active ?? true,
            status: classData.status || "active",
            recurrenceType: classData.recurrenceType || "weekly",
            recurrenceDays: Array.isArray(classData.recurrenceDays) ? classData.recurrenceDays : [],
            startDate: classData.startDate || classData.date || getLocalDateISO(),
            endDate: classData.endDate ?? null,
            cancelledDates: Array.isArray(classData.cancelledDates) ? classData.cancelledDates : [],
            createdAt: classData.createdAt || nowDate(),
            updatedAt: nowDate(),
        });
    } catch (e) {
        console.error("Error creando clase: ", e);
        throw e;
    }
};

export const bookClass = async (userId, classData, userName) => {
    try {
        if (!userId) throw new Error("No se recibió el usuario.");
        if (!classData?.id) throw new Error("No se recibió la clase.");

        const reservationDate = getReservationDateFromClass(classData);

        if (isPastDateOnly(reservationDate)) {
            throw new Error("No puedes reservar una clase de un día pasado.");
        }

        const classRef = doc(db, "classes", classData.id);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) throw new Error("La clase no existe.");

        const storedClass = {
            id: classSnap.id,
            ...classSnap.data(),
        };

        const mergedClass = {
            ...storedClass,
            ...classData,
            id: classData.id,
            date: reservationDate,
            dateISO: reservationDate,
            classDate: reservationDate,
            startTime:
                classData.startTime ||
                classData.classTime ||
                storedClass.startTime ||
                storedClass.classTime ||
                storedClass.time ||
                "00:00",
        };

        if (storedClass.status === "cancelled" || storedClass.active === false) {
            throw new Error("Esta clase fue cancelada.");
        }

        if (
            Array.isArray(storedClass.cancelledDates) &&
            storedClass.cancelledDates.includes(reservationDate)
        ) {
            throw new Error("Esta sesión fue cancelada para la fecha seleccionada.");
        }

        if (isPastClassSession(mergedClass, reservationDate)) {
            throw new Error("No puedes reservar una clase que ya pasó.");
        }

        const existingReservationQuery = query(
            collection(db, "reservations"),
            where("userId", "==", userId),
            where("classID", "==", classData.id),
            where("date", "==", reservationDate)
        );

        const existingReservationSnap = await getDocs(existingReservationQuery);

        const hasActiveReservation = existingReservationSnap.docs.some((reservationDoc) => {
            const data = reservationDoc.data();

            return (
                data.status !== "cancelled" &&
                data.userAcknowledgedCancellation !== true
            );
        });

        if (hasActiveReservation) {
            throw new Error("Ya tienes una reserva activa para esta clase en esta fecha.");
        }

        const totalSpots = Number(storedClass.totalSpots || storedClass.capacity || classData.totalSpots || 0);

        const capacityInfo = await getClassCapacityInfoForDate(
            classData.id,
            reservationDate,
            totalSpots
        );

        if (capacityInfo.availableSpots <= 0) {
            throw new Error("No hay lugares disponibles para esta fecha.");
        }

        await addDoc(collection(db, "reservations"), {
            userId,
            uId: userId,
            classID: classData.id,
            classId: classData.id,
            className: storedClass.name || classData.name || "Clase",
            classTime:
                storedClass.startTime ||
                storedClass.classTime ||
                storedClass.time ||
                classData.startTime ||
                classData.classTime ||
                "00:00",
            userName: userName || "",
            status: "booked",
            date: reservationDate,
            classDate: reservationDate,
            dateISO: reservationDate,
            coachId: storedClass.coachId || classData.coachId || "",
            coachName: storedClass.coachName || classData.coachName || "",
            createdAt: nowDate(),
        });

        const newReservedCount = capacityInfo.reservedCount + 1;
        const newAvailableSpots = Math.max(totalSpots - newReservedCount, 0);

        return {
            success: true,
            reservedCount: newReservedCount,
            totalSpots,
            availableSpots: newAvailableSpots,
            reservedLabel: `${newReservedCount}/${totalSpots} reservados`,
            availableLabel: `${newAvailableSpots} lugares disponibles`,
        };
    } catch (e) {
        console.error("Error al reservar: ", e);
        throw e;
    }
};

export const validateAttendance = async (userId, classId, type = "class") => {
    try {
        const collName = type === "monthly" ? "coach_reservations" : "reservations";
        const foreignKey = type === "monthly" ? "scheduleId" : "classID";
        const todayISO = getLocalDateISO();

        if (type !== "monthly") {
            const classSnap = await getDoc(doc(db, "classes", classId));

            if (classSnap.exists()) {
                const classData = classSnap.data();

                if (classData.status === "cancelled" || classData.active === false) {
                    return {
                        success: false,
                        message: "Esta clase fue cancelada. No se puede registrar asistencia.",
                    };
                }

                if (
                    Array.isArray(classData.cancelledDates) &&
                    classData.cancelledDates.includes(todayISO)
                ) {
                    return {
                        success: false,
                        message: "Esta sesión fue cancelada para el día de hoy.",
                    };
                }
            }
        }

        const q =
            type === "monthly"
                ? query(
                    collection(db, collName),
                    where("userId", "==", userId),
                    where(foreignKey, "==", classId)
                )
                : query(
                    collection(db, collName),
                    where("userId", "==", userId),
                    where(foreignKey, "==", classId),
                    where("date", "==", todayISO)
                );

        const snap = await getDocs(q);

        if (snap.empty) {
            if (type === "monthly") {
                const fallbackQ = query(
                    collection(db, "coach_reservations"),
                    where("userId", "==", userId),
                    where("coachId", "==", classId)
                );

                const fallbackSnap = await getDocs(fallbackQ);

                if (fallbackSnap.empty) {
                    return {
                        success: false,
                        message: "El atleta no tiene reserva para este entrenamiento personal.",
                    };
                }

                const fallbackDoc = fallbackSnap.docs[0];
                const docRef = doc(db, collName, fallbackDoc.id);
                const data = fallbackDoc.data();

                if (data.status === "cancelled") {
                    return { success: false, message: "Esta reservación fue cancelada." };
                }

                if (data.attendanceDates?.includes(todayISO)) {
                    return { success: false, message: "Asistencia para hoy ya fue registrada previamente." };
                }

                await updateDoc(docRef, {
                    status: "attended",
                    attendanceDates: arrayUnion(todayISO),
                    lastAttendedAt: nowDate(),
                });

                return { success: true };
            }

            return {
                success: false,
                message: "El atleta no tiene reserva para esta clase en la fecha de hoy.",
            };
        }

        const reservationDoc = snap.docs[0];
        const docRef = doc(db, collName, reservationDoc.id);
        const data = reservationDoc.data();

        if (data.status === "cancelled") {
            return { success: false, message: "Esta reservación fue cancelada." };
        }

        if (type === "monthly") {
            if (data.attendanceDates?.includes(todayISO)) {
                return { success: false, message: "La asistencia de hoy ya fue registrada." };
            }

            await updateDoc(docRef, {
                status: "attended",
                attendanceDates: arrayUnion(todayISO),
                lastAttendedAt: nowDate(),
            });
        } else {
            if (data.status === "attended") {
                return {
                    success: false,
                    message: "Este ticket ya fue escaneado previamente para esta clase.",
                };
            }

            await updateDoc(docRef, {
                status: "attended",
                attendedAt: nowDate(),
            });
        }

        return { success: true };
    } catch (e) {
        console.error("Error validando asistencia: ", e);

        return { success: false, message: "Error en el servidor al validar ticket." };
    }
};

export const cancelClass = async ({
                                      classId,
                                      selectedDate = null,
                                      scope = "single",
                                      cancelledBy = "coach",
                                      reason = "Clase cancelada por el coach",
                                  }) => {
    try {
        if (!classId) throw new Error("No se recibió el ID de la clase.");

        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) throw new Error("La clase no existe.");

        const classData = classSnap.data();
        const cancellationDate = normalizeDateISO(selectedDate) || getLocalDateISO();

        const cancellationScope = scope === "week" ? "week" : "single";

        const datesToCancel =
            cancellationScope === "week"
                ? getClassDatesForWeek(classData, cancellationDate)
                : [cancellationDate];

        const currentCancelledDates = Array.isArray(classData.cancelledDates)
            ? classData.cancelledDates
            : [];

        const mergedCancelledDates = Array.from(
            new Set([...currentCancelledDates, ...datesToCancel])
        ).sort();

        await updateDoc(classRef, {
            cancelledDates: mergedCancelledDates,
            updatedAt: nowDate(),
            lastCancelledDate: cancellationDate,
            lastCancelledDates: datesToCancel,
            lastCancellationScope: cancellationScope,
            lastCancellationReason: reason,
            lastCancelledBy: cancelledBy,
        });

        await Promise.all(
            datesToCancel.map(async (dateToCancel) => {
                const reservationsQuery = query(
                    collection(db, "reservations"),
                    where("classID", "==", classId),
                    where("date", "==", dateToCancel)
                );

                const reservationsSnap = await getDocs(reservationsQuery);

                return Promise.all(
                    reservationsSnap.docs.map((reservationDoc) => {
                        const reservationData = reservationDoc.data();

                        if (reservationData.status === "cancelled") {
                            return Promise.resolve();
                        }

                        return updateDoc(doc(db, "reservations", reservationDoc.id), {
                            status: "cancelled",
                            cancelledAt: nowDate(),
                            cancelledBy,
                            cancellationReason: reason,
                            cancellationScope,
                            cancelledClassDate: dateToCancel,
                            userAcknowledgedCancellation: false,
                        });
                    })
                );
            })
        );

        return {
            success: true,
            scope: cancellationScope,
            cancelledDates: datesToCancel,
        };
    } catch (e) {
        console.error("Error cancelando clase: ", e);

        return { success: false, message: e.message };
    }
};

export const restoreCancelledClassDate = async ({
                                                    classId,
                                                    selectedDate,
                                                    restoredBy = "coach",
                                                }) => {
    try {
        if (!classId) {
            throw new Error("No se recibió el ID de la clase.");
        }

        if (!selectedDate) {
            throw new Error("No se recibió la fecha que se desea reactivar.");
        }

        const normalizedDate = normalizeDateISO(selectedDate);

        if (!normalizedDate) {
            throw new Error("La fecha seleccionada no es válida.");
        }

        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
            throw new Error("La clase no existe.");
        }

        const classData = classSnap.data();
        const cancelledDates = Array.isArray(classData.cancelledDates)
            ? classData.cancelledDates
            : [];

        if (!cancelledDates.includes(normalizedDate)) {
            return {
                success: true,
                message: "Esta fecha ya se encontraba activa.",
            };
        }

        await updateDoc(classRef, {
            cancelledDates: arrayRemove(normalizedDate),
            lastRestoredDate: normalizedDate,
            lastRestoredBy: restoredBy,
            restoredAt: nowDate(),
            updatedAt: nowDate(),
        });

        const reservationsQuery = query(
            collection(db, "reservations"),
            where("classID", "==", classId),
            where("date", "==", normalizedDate)
        );

        const reservationsSnap = await getDocs(reservationsQuery);

        await Promise.all(
            reservationsSnap.docs.map((reservationDoc) => {
                const reservationData = reservationDoc.data();

                if (reservationData.status !== "cancelled") {
                    return Promise.resolve();
                }

                if (reservationData.cancelledBy === "user") {
                    return Promise.resolve();
                }

                return updateDoc(doc(db, "reservations", reservationDoc.id), {
                    status: "booked",
                    restoredAt: nowDate(),
                    restoredBy,
                    userAcknowledgedCancellation: false,
                    cancellationScope: null,
                    cancelledClassDate: null,
                    cancellationReason: null,
                    cancelledAt: null,
                    cancelledBy: null,
                });
            })
        );

        return {
            success: true,
            message: "La clase fue reactivada correctamente.",
        };
    } catch (e) {
        console.error("Error reactivando clase cancelada: ", e);

        return {
            success: false,
            message: e.message || "No se pudo reactivar la clase.",
        };
    }
};

export const restoreCancelledClassWeek = async ({
                                                    classId,
                                                    selectedDate,
                                                    restoredBy = "coach",
                                                }) => {
    try {
        if (!classId) {
            throw new Error("No se recibió el ID de la clase.");
        }

        if (!selectedDate) {
            throw new Error("No se recibió la semana que se desea reactivar.");
        }

        const normalizedDate = normalizeDateISO(selectedDate);

        if (!normalizedDate) {
            throw new Error("La fecha seleccionada no es válida.");
        }

        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) {
            throw new Error("La clase no existe.");
        }

        const classData = classSnap.data();
        const datesToRestore = getClassDatesForWeek(classData, normalizedDate);

        await updateDoc(classRef, {
            cancelledDates: arrayRemove(...datesToRestore),
            lastRestoredDate: normalizedDate,
            lastRestoredDates: datesToRestore,
            lastRestoredBy: restoredBy,
            restoredAt: nowDate(),
            updatedAt: nowDate(),
        });

        await Promise.all(
            datesToRestore.map(async (dateToRestore) => {
                const reservationsQuery = query(
                    collection(db, "reservations"),
                    where("classID", "==", classId),
                    where("date", "==", dateToRestore)
                );

                const reservationsSnap = await getDocs(reservationsQuery);

                return Promise.all(
                    reservationsSnap.docs.map((reservationDoc) => {
                        const reservationData = reservationDoc.data();

                        if (reservationData.status !== "cancelled") {
                            return Promise.resolve();
                        }

                        if (reservationData.cancelledBy === "user") {
                            return Promise.resolve();
                        }

                        return updateDoc(doc(db, "reservations", reservationDoc.id), {
                            status: "booked",
                            restoredAt: nowDate(),
                            restoredBy,
                            userAcknowledgedCancellation: false,
                            cancellationScope: null,
                            cancelledClassDate: null,
                            cancellationReason: null,
                            cancelledAt: null,
                            cancelledBy: null,
                        });
                    })
                );
            })
        );

        return {
            success: true,
            message: "La semana fue reactivada correctamente.",
            restoredDates: datesToRestore,
        };
    } catch (e) {
        console.error("Error reactivando semana cancelada: ", e);

        return {
            success: false,
            message: e.message || "No se pudo reactivar la semana.",
        };
    }
};

export const deleteClass = async (classId) => {
    try {
        await deleteDoc(doc(db, "classes", classId));

        return { success: true };
    } catch (e) {
        console.error("Error eliminando clase: ", e);

        return { success: false, message: e.message };
    }
};

export const acknowledgeClassCancellation = async (reservationId) => {
    try {
        await updateDoc(doc(db, "reservations", reservationId), {
            userAcknowledgedCancellation: true,
            acknowledgedAt: nowDate(),
        });

        return { success: true };
    } catch (e) {
        console.error("Error confirmando cancelación: ", e);

        return { success: false, message: e.message };
    }
};

export const evaluateAthlete = async (reservationId, evaluationData) => {
    try {
        await updateDoc(doc(db, "reservations", reservationId), {
            evaluation: evaluationData.objectives,
            compliancePercentage: evaluationData.percentage,
            performanceLevel: evaluationData.performanceLevel,
            isEvaluated: true,
            evaluatedAt: nowDate(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error al guardar la evaluación: ", error);

        return { success: false, message: error.message };
    }
};

export const cancelClassReservation = async (reservationId) => {
    try {
        const reservationRef = doc(db, "reservations", reservationId);
        const reservationSnap = await getDoc(reservationRef);

        if (!reservationSnap.exists()) {
            throw new Error("La reserva no existe.");
        }

        const reservationData = reservationSnap.data();

        if (reservationData.status === "attended") {
            throw new Error("No puedes cancelar una clase a la que ya asististe.");
        }

        if (reservationData.status === "cancelled") {
            await updateDoc(reservationRef, {
                userAcknowledgedCancellation: true,
                acknowledgedAt: nowDate(),
            });

            return { success: true };
        }

        await updateDoc(reservationRef, {
            status: "cancelled",
            cancelledAt: nowDate(),
            cancelledBy: "user",
            userAcknowledgedCancellation: true,
        });

        return { success: true };
    } catch (e) {
        console.error("Error cancelando reserva: ", e);

        throw e;
    }
};

export const getCoaches = async () => {
    try {
        const q = query(collection(db, "users"), where("role", "==", "coach"));
        const snap = await getDocs(q);

        return snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    } catch (e) {
        console.error("Error fetching coaches:", e);

        return [];
    }
};

export const createCoachSchedule = async (scheduleData) => {
    try {
        await addDoc(collection(db, "coach_schedules"), {
            ...scheduleData,
            createdAt: nowDate(),
            updatedAt: nowDate(),
        });
    } catch (e) {
        console.error("Error creando horario de coach: ", e);

        throw e;
    }
};

export const getCoachSchedules = async () => {
    try {
        const q = query(collection(db, "coach_schedules"));
        const snap = await getDocs(q);

        return snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    } catch (e) {
        console.error("Error fetching coach schedules:", e);

        return [];
    }
};

export const reserveCoachMonthlySchedule = async (
    userId,
    coachId,
    coachName,
    month,
    year,
    selectedSlots,
    scheduleId,
    time
) => {
    try {
        await addDoc(collection(db, "coach_reservations"), {
            userId,
            coachId,
            coachName,
            month,
            year,
            slots: selectedSlots,
            scheduleId: scheduleId || null,
            time: time || null,
            status: "booked",
            createdAt: nowDate(),
            updatedAt: nowDate(),
        });

        return { success: true };
    } catch (e) {
        console.error("Error al reservar coach:", e);

        throw e;
    }
};

export const cancelCoachReservation = async (reservationId) => {
    try {
        await updateDoc(doc(db, "coach_reservations", reservationId), {
            status: "cancelled",
            cancelledAt: nowDate(),
            cancelledBy: "user",
        });

        return { success: true };
    } catch (e) {
        console.error("Error cancelando coach:", e);

        throw e;
    }
};

export const getUserReservations = async (userId) => {
    try {
        const q = query(collection(db, "reservations"), where("userId", "==", userId));
        const snap = await getDocs(q);

        return snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    } catch (e) {
        console.error("Error fetching user reservations:", e);

        return [];
    }
};

export const getUserCoachReservations = async (userId, month, year) => {
    try {
        const q = query(
            collection(db, "coach_reservations"),
            where("userId", "==", userId),
            where("month", "==", month),
            where("year", "==", year)
        );

        const snap = await getDocs(q);

        return snap.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }));
    } catch (e) {
        console.error("Error fetching user coach reservations:", e);

        return [];
    }
};

export const getAttendanceQrConfig = async () => {
    try {
        const docRef = doc(db, "app_config", "gym_attendance_qr");
        const snap = await getDoc(docRef);

        if (!snap.exists()) return null;

        return snap.data();
    } catch (e) {
        console.error("Error fetching attendance QR config: ", e);

        return null;
    }
};

export const generateAttendanceQr = async (adminId) => {
    try {
        const token =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

        const docRef = doc(db, "app_config", "gym_attendance_qr");

        const data = {
            qrToken: token,
            version: nowDate().getTime(),
            active: true,
            updatedAt: nowDate(),
            generatedBy: adminId,
        };

        await setDoc(docRef, data);

        return data;
    } catch (e) {
        console.error("Error generating attendance QR: ", e);

        throw e;
    }
};

export const registerGymAttendance = async (userId, scannedToken) => {
    try {
        const config = await getAttendanceQrConfig();

        if (!config || !config.active) {
            return { success: false, message: "El código QR de asistencia no está activo." };
        }

        if (config.qrToken !== scannedToken) {
            return { success: false, message: "Código QR inválido o expirado." };
        }

        const dateISO = getLocalDateISO();
        const docId = `${userId}_${dateISO.replace(/-/g, "_")}`;
        const docRef = doc(db, "gym_attendance", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: false, message: "La asistencia de hoy ya está registrada." };
        }

        await setDoc(docRef, {
            userId,
            dateISO,
            date: dateISO,
            status: "attended",
            type: "general",
            scannedAt: nowDate(),
            createdAt: nowDate(),
            checkInTime: nowDate().toLocaleTimeString("es-MX", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            }),
            qrVersion: config.version,
            source: "general_gym_qr",
        });

        return { success: true };
    } catch (e) {
        console.error("Error registering attendance: ", e);

        return { success: false, message: "Error al registrar asistencia." };
    }
};

export const getUserGymAttendance = async (userId) => {
    try {
        const q = query(collection(db, "gym_attendance"), where("userId", "==", userId));
        const snap = await getDocs(q);

        return snap.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
        }));
    } catch (e) {
        console.error("Error fetching gym attendance:", e);

        return [];
    }
};

export const createRoutine = async (routineData) => {
    try {
        const docRef = await addDoc(collection(db, "routines"), {
            ...routineData,
            createdAt: nowDate(),
            updatedAt: nowDate(),
        });

        return docRef.id;
    } catch (e) {
        console.error("Error creating routine: ", e);

        throw e;
    }
};

export const updateRoutine = async (routineId, routineData) => {
    try {
        await updateDoc(doc(db, "routines", routineId), {
            ...routineData,
            updatedAt: nowDate(),
        });
    } catch (e) {
        console.error("Error updating routine: ", e);

        throw e;
    }
};

export const deleteRoutine = async (routineId) => {
    try {
        await deleteDoc(doc(db, "routines", routineId));

        return { success: true };
    } catch (e) {
        console.error("Error deleting routine: ", e);

        throw e;
    }
};

export const getRoutines = async (filters = {}) => {
    try {
        let qRef = collection(db, "routines");

        if (filters.coachId) {
            qRef = query(qRef, where("coachId", "==", filters.coachId));
        }

        const snap = await getDocs(qRef);

        const results = snap.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
        }));

        results.sort((a, b) => {
            const getTime = (value) => {
                if (!value) return 0;
                if (value.seconds) return value.seconds * 1000;
                if (value instanceof Date) return value.getTime();

                return new Date(value).getTime() || 0;
            };

            return (
                getTime(b.createdAt || b.assignedAt || b.updatedAt) -
                getTime(a.createdAt || a.assignedAt || a.updatedAt)
            );
        });

        return results;
    } catch (e) {
        console.error("Error fetching routines:", e);

        return [];
    }
};

export const getUserRoutineProgress = async (userId) => {
    try {
        const q = query(collection(db, "user_routine_progress"), where("userId", "==", userId));
        const snap = await getDocs(q);

        return snap.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
        }));
    } catch (e) {
        console.error("Error fetching user routine progress:", e);

        return [];
    }
};

export const markRoutineCompleted = async (userId, routine) => {
    try {
        const docId = `${userId}_${routine.id}`;
        const docRef = doc(db, "user_routine_progress", docId);
        const docSnap = await getDoc(docRef);
        const todayISO = getLocalDateISO();

        if (docSnap.exists()) {
            const data = docSnap.data();
            const completedDates = Array.isArray(data.completedDates) ? data.completedDates : [];

            if (!completedDates.includes(todayISO)) {
                await updateDoc(docRef, {
                    completedDates: arrayUnion(todayISO),
                    totalCompletions: increment(1),
                    totalMinutes: increment(routine.durationMinutes || 0),
                    lastCompletedAt: nowDate(),
                    updatedAt: nowDate(),
                });
            }
        } else {
            await setDoc(docRef, {
                userId,
                routineId: routine.id,
                completedDates: [todayISO],
                totalCompletions: 1,
                totalMinutes: routine.durationMinutes || 0,
                lastCompletedAt: nowDate(),
                createdAt: nowDate(),
                updatedAt: nowDate(),
            });
        }

        return { success: true };
    } catch (e) {
        console.error("Error marking routine completed: ", e);

        throw e;
    }
};

export const listenLatestRoutinesForUser = (userId, callback, maxItems = 8) => {
    const qRef = query(collection(db, "routines"));

    return onSnapshot(
        qRef,
        (snap) => {
            const results = snap.docs
                .map((docItem) => ({
                    id: docItem.id,
                    ...docItem.data(),
                }))
                .filter((routine) => {
                    const assignedUsers = routine.assignedUsers || routine.assignedUserIds || [];

                    if (!userId) return true;
                    if (!Array.isArray(assignedUsers) || assignedUsers.length === 0) return true;

                    return assignedUsers.includes(userId);
                })
                .sort((a, b) => {
                    const getTime = (value) => {
                        if (!value) return 0;
                        if (value.seconds) return value.seconds * 1000;
                        if (value instanceof Date) return value.getTime();

                        return new Date(value).getTime() || 0;
                    };

                    return (
                        getTime(b.createdAt || b.assignedAt || b.updatedAt) -
                        getTime(a.createdAt || a.assignedAt || a.updatedAt)
                    );
                })
                .slice(0, maxItems);

            callback(results);
        },
        (error) => {
            console.error("Error listening to latest routines:", error);
            callback([]);
        }
    );
};