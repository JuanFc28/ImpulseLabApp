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
    increment,
    deleteDoc,
} from "firebase/firestore";

const getLocalDateISO = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
    ).padStart(2, "0")}`;
};

export const createClass = async (classData) => {
    try {
        await addDoc(collection(db, "classes"), {
            ...classData,
            attendees: [],
            availableSpots: classData.totalSpots,
        });
    } catch (e) {
        console.error("Error creando clase: ", e);
    }
};

export const bookClass = async (userId, classData, userName) => {
    try {
        const q = query(
            collection(db, "reservations"),
            where("userId", "==", userId),
            where("classID", "==", classData.id)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
            throw new Error("Ya tienes una reserva para esta clase.");
        }

        const classRef = doc(db, "classes", classData.id);

        await addDoc(collection(db, "reservations"), {
            userId,
            classID: classData.id,
            className: classData.name,
            classTime: classData.startTime,
            userName,
            status: "booked",
            date: classData.date,
            coachId: classData.coachId || "",
            createdAt: new Date(),
        });

        await updateDoc(classRef, {
            availableSpots: increment(-1),
        });
    } catch (e) {
        console.error("Error al reservar: ", e);
        throw e;
    }
};

export const validateAttendance = async (userId, classId, type = "class") => {
    try {
        const collName = type === "monthly" ? "coach_reservations" : "reservations";
        const foreignKey = type === "monthly" ? "scheduleId" : "classID";

        const q = query(
            collection(db, collName),
            where("userId", "==", userId),
            where(foreignKey, "==", classId)
        );

        const snap = await getDocs(q);
        const todayISO = getLocalDateISO();

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

                if (data.attendanceDates?.includes(todayISO)) {
                    return {
                        success: false,
                        message: "Asistencia para hoy ya fue registrada previamente.",
                    };
                }

                await updateDoc(docRef, {
                    status: "attended",
                    attendanceDates: arrayUnion(todayISO),
                });

                return { success: true };
            }

            return { success: false, message: "El atleta no tiene reserva para esta clase." };
        }

        const reservationDoc = snap.docs[0];
        const docRef = doc(db, collName, reservationDoc.id);
        const data = reservationDoc.data();

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

            await updateDoc(docRef, { status: "attended" });
        }

        return { success: true };
    } catch (e) {
        console.error("Error validando asistencia: ", e);
        return { success: false, message: "Error en el servidor al validar ticket." };
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

export const evaluateAthlete = async (reservationId, evaluationData) => {
    try {
        const reservationRef = doc(db, "reservations", reservationId);

        await updateDoc(reservationRef, {
            evaluation: evaluationData.objectives,
            compliancePercentage: evaluationData.percentage,
            performanceLevel: evaluationData.performanceLevel,
            isEvaluated: true,
            evaluatedAt: new Date(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error al guardar la evaluación: ", error);
        return { success: false, message: error.message };
    }
};

export const cancelClassReservation = async (reservationId, classId) => {
    try {
        await deleteDoc(doc(db, "reservations", reservationId));

        if (classId) {
            await updateDoc(doc(db, "classes", classId), {
                availableSpots: increment(1),
            });
        }

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
            createdAt: new Date(),
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
            createdAt: new Date(),
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
            version: new Date().getTime(),
            active: true,
            updatedAt: new Date(),
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
            scannedAt: new Date(),
            createdAt: new Date(),
            checkInTime: new Date().toLocaleTimeString("es-MX", {
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
        await addDoc(collection(db, "routines"), {
            ...routineData,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    } catch (e) {
        console.error("Error creating routine: ", e);
        throw e;
    }
};

export const updateRoutine = async (routineId, routineData) => {
    try {
        const docRef = doc(db, "routines", routineId);

        await updateDoc(docRef, {
            ...routineData,
            updatedAt: new Date(),
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
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });

        return results;
    } catch (e) {
        console.error("Error fetching routines:", e);
        return [];
    }
};

export const getUserRoutineProgress = async (userId) => {
    try {
        const q = query(
            collection(db, "user_routine_progress"),
            where("userId", "==", userId)
        );

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
            const completedDates = Array.isArray(data.completedDates)
                ? data.completedDates
                : [];

            if (!completedDates.includes(todayISO)) {
                await updateDoc(docRef, {
                    completedDates: arrayUnion(todayISO),
                    totalCompletions: increment(1),
                    totalMinutes: increment(routine.durationMinutes || 0),
                    lastCompletedAt: new Date(),
                });
            }
        } else {
            await setDoc(docRef, {
                userId,
                routineId: routine.id,
                completedDates: [todayISO],
                totalCompletions: 1,
                totalMinutes: routine.durationMinutes || 0,
                lastCompletedAt: new Date(),
            });
        }

        return { success: true };
    } catch (e) {
        console.error("Error marking routine completed: ", e);
        throw e;
    }
};