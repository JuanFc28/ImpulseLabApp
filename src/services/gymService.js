import { db } from "../config/firebase";
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    arrayUnion,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    increment,
} from "firebase/firestore";

const getLocalDateISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
    ).padStart(2, "0")}`;
};

const nowDate = () => new Date();

export const getClassAvailableSpotsForDate = async (classId, dateISO, totalSpots = 0) => {
    const q = query(
        collection(db, "reservations"),
        where("classID", "==", classId),
        where("date", "==", dateISO)
    );

    const snap = await getDocs(q);

    const activeReservations = snap.docs.filter((reservationDoc) => {
        const data = reservationDoc.data();
        return data.status !== "cancelled";
    });

    return Math.max((totalSpots || 0) - activeReservations.length, 0);
};

export const createClass = async (classData) => {
    try {
        await addDoc(collection(db, "classes"), {
            ...classData,
            attendees: Array.isArray(classData.attendees) ? classData.attendees : [],
            availableSpots: classData.totalSpots,
            active: classData.active ?? true,
            status: classData.status || "active",
            recurrenceType: classData.recurrenceType || "weekly",
            recurrenceDays: Array.isArray(classData.recurrenceDays) ? classData.recurrenceDays : [],
            startDate: classData.startDate || classData.date || getLocalDateISO(),
            endDate: classData.endDate ?? null,
            cancelledDates: Array.isArray(classData.cancelledDates) ? classData.cancelledDates : [],
            createdAt: classData.createdAt || nowDate(),
        });
    } catch (e) {
        console.error("Error creando clase: ", e);
        throw e;
    }
};

export const bookClass = async (userId, classData, userName) => {
    try {
        const reservationDate =
            classData.dateISO || classData.classDate || classData.date || getLocalDateISO();

        const classRef = doc(db, "classes", classData.id);
        const classSnap = await getDoc(classRef);

        if (!classSnap.exists()) throw new Error("La clase no existe.");

        const storedClass = classSnap.data();

        if (storedClass.status === "cancelled" || storedClass.active === false) {
            throw new Error("Esta clase fue cancelada.");
        }

        if (Array.isArray(storedClass.cancelledDates) && storedClass.cancelledDates.includes(reservationDate)) {
            throw new Error("Esta sesión fue cancelada para la fecha seleccionada.");
        }

        const existingReservationQuery = query(
            collection(db, "reservations"),
            where("userId", "==", userId),
            where("classID", "==", classData.id),
            where("date", "==", reservationDate)
        );

        const existingReservationSnap = await getDocs(existingReservationQuery);

        if (!existingReservationSnap.empty) {
            throw new Error("Ya tienes una reserva para esta clase en esta fecha.");
        }

        const availableSpots = await getClassAvailableSpotsForDate(
            classData.id,
            reservationDate,
            storedClass.totalSpots || classData.totalSpots || 0
        );

        if (availableSpots <= 0) {
            throw new Error("No hay lugares disponibles para esta fecha.");
        }

        await addDoc(collection(db, "reservations"), {
            userId,
            classID: classData.id,
            classId: classData.id,
            className: storedClass.name || classData.name,
            classTime: storedClass.startTime || classData.startTime,
            userName,
            status: "booked",
            date: reservationDate,
            classDate: reservationDate,
            dateISO: reservationDate,
            coachId: storedClass.coachId || classData.coachId || "",
            coachName: storedClass.coachName || classData.coachName || "",
            createdAt: nowDate(),
        });

        return { success: true };
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

                if (Array.isArray(classData.cancelledDates) && classData.cancelledDates.includes(todayISO)) {
                    return {
                        success: false,
                        message: "Esta sesión fue cancelada para el día de hoy.",
                    };
                }
            }
        }

        const q =
            type === "monthly"
                ? query(collection(db, collName), where("userId", "==", userId), where(foreignKey, "==", classId))
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
        const cancellationDate = selectedDate || getLocalDateISO();

        if (scope === "series") {
            await updateDoc(classRef, {
                status: "cancelled",
                active: false,
                cancelledAt: nowDate(),
                cancelledBy,
                cancellationReason: reason,
            });

            const reservationsQuery = query(collection(db, "reservations"), where("classID", "==", classId));
            const reservationsSnap = await getDocs(reservationsQuery);

            await Promise.all(
                reservationsSnap.docs.map((reservationDoc) =>
                    updateDoc(doc(db, "reservations", reservationDoc.id), {
                        status: "cancelled",
                        cancelledAt: nowDate(),
                        cancelledBy,
                        cancellationReason: reason,
                        cancellationScope: "series",
                        userAcknowledgedCancellation: false,
                    })
                )
            );

            return { success: true };
        }

        const currentCancelledDates = Array.isArray(classData.cancelledDates)
            ? classData.cancelledDates
            : [];

        await updateDoc(classRef, {
            cancelledDates: currentCancelledDates.includes(cancellationDate)
                ? currentCancelledDates
                : [...currentCancelledDates, cancellationDate],
            updatedAt: nowDate(),
            lastCancelledDate: cancellationDate,
            lastCancellationReason: reason,
            lastCancelledBy: cancelledBy,
        });

        const reservationsQuery = query(
            collection(db, "reservations"),
            where("classID", "==", classId),
            where("date", "==", cancellationDate)
        );

        const reservationsSnap = await getDocs(reservationsQuery);

        await Promise.all(
            reservationsSnap.docs.map((reservationDoc) =>
                updateDoc(doc(db, "reservations", reservationDoc.id), {
                    status: "cancelled",
                    cancelledAt: nowDate(),
                    cancelledBy,
                    cancellationReason: reason,
                    cancellationScope: "single",
                    cancelledClassDate: cancellationDate,
                    userAcknowledgedCancellation: false,
                })
            )
        );

        return { success: true };
    } catch (e) {
        console.error("Error cancelando clase: ", e);
        return { success: false, message: e.message };
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

        if (!reservationSnap.exists()) throw new Error("La reserva no existe.");

        const reservationData = reservationSnap.data();

        if (reservationData.status === "cancelled") {
            await updateDoc(reservationRef, {
                userAcknowledgedCancellation: true,
                acknowledgedAt: nowDate(),
            });

            return { success: true };
        }

        await deleteDoc(reservationRef);

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
        });
    } catch (e) {
        console.error("Error al reservar coach:", e);
        throw e;
    }
};

export const cancelCoachReservation = async (reservationId) => {
    try {
        await deleteDoc(doc(db, "coach_reservations", reservationId));
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

            return getTime(b.createdAt || b.assignedAt || b.updatedAt) -
                getTime(a.createdAt || a.assignedAt || a.updatedAt);
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

                    return getTime(b.createdAt || b.assignedAt || b.updatedAt) -
                        getTime(a.createdAt || a.assignedAt || a.updatedAt);
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