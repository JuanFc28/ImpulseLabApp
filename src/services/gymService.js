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

// Actualización en src/services/gymService.js
export const bookClass = async (userId, classData, userName) => {
  const classRef = doc(db, "classes", classData.id);
  
  try {
    // Registrar reserva con la estructura exacta
    await addDoc(collection(db, "reservations"), {
      userId: userId,
      classID: classData.id,
      className: classData.name,
      classTime: classData.startTime,
      userName: userName,
      status: "booked",
      date: classData.date, 
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
export const validateAttendance = async (userId, classId) => {
  try {
    const q = query(
      collection(db, "reservations"), 
      where("userId", "==", userId), 
      where("classID", "==", classId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const reservationDoc = querySnapshot.docs[0];
      const resData = reservationDoc.data();

      if (resData.status === "attended") {
        return { success: false, message: "Este ticket ya fue escaneado previamente." };
      }

      // actualizamos el estado a "attended"
      await updateDoc(doc(db, "reservations", reservationDoc.id), {
        status: "attended"
      });
      return { success: true, message: "¡Asistencia registrada!" };
    } else {
      return { success: false, message: "No se encontró una reserva activa para este usuario en esta clase." };
    }
  } catch (e) {
    return { success: false, message: "Error de conexión con la base de datos." };
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