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
  increment 
} from "firebase/firestore";
import { deleteDoc } from "firebase/firestore";

// Crear una nueva clase en el horario
export const createClass = async (classData) => {
  try {
    await addDoc(collection(db, "classes"), {
      ...classData,
      attendees: [],
      availableSpots: classData.totalSpots
    });
  } catch (e) {
    console.error("Error creando clase: ", e);
  }
};

export const bookClass = async (userId, classData, userName) => {
  try {
    // Verificar si ya existe
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

    // Registrar reserva
    await addDoc(collection(db, "reservations"), {
      userId: userId,
      classID: classData.id,
      className: classData.name,
      classTime: classData.startTime,
      userName: userName,
      status: "booked",
      date: classData.date, 
      coachId: classData.coachId || "",
      createdAt: new Date()
    });

    await updateDoc(classRef, {
      availableSpots: increment(-1)
    });
  } catch (e) {
    console.error("Error al reservar: ", e);
    throw e;
  }
};

// Validar el QR del scanner
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

    const todayISO = new Date().toISOString().split("T")[0];

    if (snap.empty) {
      if (type === "monthly") {
         const fallbackQ = query(
            collection(db, "coach_reservations"),
            where("userId", "==", userId),
            where("coachId", "==", classId)
         );
         const fallbackSnap = await getDocs(fallbackQ);
         if (fallbackSnap.empty) {
            return { success: false, message: "El atleta no tiene reserva para este entrenamiento personal." };
         }
         
         const docRef = doc(db, collName, fallbackSnap.docs[0].id);
         const data = fallbackSnap.docs[0].data();
         if (data.attendanceDates?.includes(todayISO)) {
             return { success: false, message: "Asistencia para hoy ya fue registrada previamente." };
         }
         const { arrayUnion } = require("firebase/firestore");
         await updateDoc(docRef, { status: "attended", attendanceDates: arrayUnion(todayISO) });
         return { success: true };
      }

      return { success: false, message: "El atleta no tiene reserva para esta clase." };
    }

    const reservationDoc = snap.docs[0];
    const docRef = doc(db, collName, reservationDoc.id);

    if (type === "monthly") {
        const data = reservationDoc.data();
        if (data.attendanceDates?.includes(todayISO)) {
            return { success: false, message: "La asistencia de hoy ya fue registrada." };
        }
        const { arrayUnion } = require("firebase/firestore");
        await updateDoc(docRef, { status: "attended", attendanceDates: arrayUnion(todayISO) });
    } else {
        const data = reservationDoc.data();
        if (data.status === "attended") {
            return { success: false, message: "Este ticket ya fue escaneado previamente para esta clase." };
        }
        await updateDoc(docRef, { status: "attended" });
    }

    return { success: true };
  } catch (e) {
    console.error("Error validando asistencia: ", e);
    return { success: false, message: "Error en el servidor al validar ticket." };
  }
};

// Eliminar una clase
export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, "classes", classId));
    return { success: true };
  } catch (e) {
    console.error("Error eliminando clase: ", e);
    return { success: false, message: e.message };
  }
};

// Guardar la evaluación de un atleta después de la clase
export const evaluateAthlete = async (reservationId, evaluationData) => {
  try {
    const reservationRef = doc(db, "reservations", reservationId);
    
    await updateDoc(reservationRef, {
      evaluation: evaluationData.objectives,
      compliancePercentage: evaluationData.percentage,
      performanceLevel: evaluationData.performanceLevel,
      isEvaluated: true,
      evaluatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error("Error al guardar la evaluación: ", error);
    return { success: false, message: error.message };
  }
};

// Cancelar una reserva de clase
export const cancelClassReservation = async (reservationId, classId) => {
  try {
    await deleteDoc(doc(db, "reservations", reservationId));
    if (classId) {
      await updateDoc(doc(db, "classes", classId), {
        availableSpots: increment(1)
      });
    }
    return { success: true };
  } catch (e) {
    console.error("Error cancelando reserva: ", e);
    throw e;
  }
};

// Obtener coaches disponibles
export const getCoaches = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "coach"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching coaches:", e);
    return [];
  }
};

// Admin: Crear horario mensual de coach
export const createCoachSchedule = async (scheduleData) => {
  try {
    await addDoc(collection(db, "coach_schedules"), {
      ...scheduleData,
      createdAt: new Date()
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
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching coach schedules:", e);
    return [];
  }
};

// Reservar un horario mensual con un coach
export const reserveCoachMonthlySchedule = async (userId, coachId, coachName, month, year, selectedSlots, scheduleId, time) => {
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
      status: "booked", // To maintain track record
      createdAt: new Date()
    });
  } catch (e) {
    console.error("Error al reservar coach:", e);
    throw e;
  }
};

// Cancelar reserva de coach
export const cancelCoachReservation = async (reservationId) => {
  try {
    await deleteDoc(doc(db, "coach_reservations", reservationId));
    return { success: true };
  } catch (e) {
    console.error("Error cancelando coach:", e);
    throw e;
  }
};

// Obtener todas las reservas de un usuario para un mes (simplificado por ahora, se filtrará en cliente)
export const getUserReservations = async (userId) => {
  try {
    const q = query(collection(db, "reservations"), where("userId", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching user coach reservations:", e);
    return [];
  }
};

// ==========================================
// GENERAL GYM ATTENDANCE (NEW)
// ==========================================

export const getAttendanceQrConfig = async () => {
  try {
    const docRef = doc(db, "app_config", "gym_attendance_qr");
    const docSnap = await getDocs(query(collection(db, "app_config")));
    const configDoc = docSnap.docs.find(d => d.id === "gym_attendance_qr");
    if (configDoc) {
      return configDoc.data();
    }
    return null;
  } catch (e) {
    console.error("Error fetching attendance QR config: ", e);
    return null;
  }
};

export const generateAttendanceQr = async (adminId) => {
  try {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const docRef = doc(db, "app_config", "gym_attendance_qr");
    const data = {
      qrToken: token,
      version: new Date().getTime(),
      active: true,
      updatedAt: new Date(),
      generatedBy: adminId
    };
    // Use setDoc to create or overwrite
    const { setDoc } = require("firebase/firestore");
    await setDoc(docRef, data);
    return data;
  } catch (e) {
    console.error("Error generating attendance QR: ", e);
    throw e;
  }
};

export const registerGymAttendance = async (userId, scannedToken) => {
  try {
    // 1. Verify token
    const config = await getAttendanceQrConfig();
    if (!config || !config.active) {
      return { success: false, message: "El código QR de asistencia no está activo." };
    }
    if (config.qrToken !== scannedToken) {
      return { success: false, message: "Código QR inválido o expirado." };
    }

    // 2. Register for today
    const dateISO = new Date().toISOString().split("T")[0];
    const docId = `${userId}_${dateISO.replace(/-/g, "_")}`;
    const docRef = doc(db, "gym_attendance", docId);
    
    // Check if already registered
    const { getDoc, setDoc } = require("firebase/firestore");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { success: false, message: "La asistencia de hoy ya está registrada." };
    }

    await setDoc(docRef, {
      userId,
      dateISO,
      scannedAt: new Date(),
      qrVersion: config.version,
      source: "general_gym_qr"
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
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching gym attendance:", e);
    return [];
  }
};

// ==========================================
// ROUTINES MODULE (NEW)
// ==========================================

export const createRoutine = async (routineData) => {
  try {
    await addDoc(collection(db, "routines"), {
      ...routineData,
      createdAt: new Date(),
      updatedAt: new Date()
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
      updatedAt: new Date()
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
    let q = collection(db, "routines");
    
    // Simplistic filtering for now
    if (filters.coachId) {
      q = query(q, where("coachId", "==", filters.coachId));
    }
    
    const snap = await getDocs(q);
    let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Sort manually if needed (Firebase requires compound indexes for multiple sorts/wheres)
    results.sort((a, b) => b.createdAt - a.createdAt);
    
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
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching user routine progress:", e);
    return [];
  }
};

export const markRoutineCompleted = async (userId, routine) => {
  try {
    const docId = `${userId}_${routine.id}`;
    const docRef = doc(db, "user_routine_progress", docId);
    
    const { getDoc, setDoc } = require("firebase/firestore");
    const docSnap = await getDoc(docRef);
    const todayISO = new Date().toISOString().split("T")[0];
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (!data.completedDates.includes(todayISO)) {
        await updateDoc(docRef, {
          completedDates: arrayUnion(todayISO),
          totalCompletions: increment(1),
          totalMinutes: increment(routine.durationMinutes || 0),
          lastCompletedAt: new Date()
        });
      }
    } else {
      await setDoc(docRef, {
        userId,
        routineId: routine.id,
        completedDates: [todayISO],
        totalCompletions: 1,
        totalMinutes: routine.durationMinutes || 0,
        lastCompletedAt: new Date()
      });
    }
    return { success: true };
  } catch (e) {
    console.error("Error marking routine completed: ", e);
    throw e;
  }
};