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

// 1. PARA EL ADMIN: Crear una nueva clase en el horario
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
    // Registramos la reserva con la estructura exacta que creaste
    await addDoc(collection(db, "reservations"), {
      userId: userId,
      classID: classData.id, // Respetando tu D mayúscula
      className: classData.name,
      classTime: classData.startTime,
      userName: userName,
      status: "booked",
      date: classData.date, 
      createdAt: new Date()
    });

    // Actualizamos la clase restando un lugar
    // (Opcional: Si después agregas el array de attendees en Firebase, se sumaría aquí)
    await updateDoc(classRef, {
      availableSpots: increment(-1)
    });
  } catch (e) {
    console.error("Error al reservar: ", e);
    throw e;
  }
};

// 3. PARA EL COACH: Validar el QR del scanner
// Añadir en src/services/gymService.js
export const validateAttendance = async (userId, classId) => {
  try {
    // Buscamos la reserva usando los nombres de campos exactos que creaste
    const q = query(
      collection(db, "reservations"), 
      where("userId", "==", userId), 
      where("classID", "==", classId) // Respetando tu "classID" con D mayúscula
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const reservationDoc = querySnapshot.docs[0];
      const resData = reservationDoc.data();

      // Validación extra: ¿Ya había entrado?
      if (resData.status === "attended") {
        return { success: false, message: "Este ticket ya fue escaneado previamente." };
      }

      // Si todo está bien, actualizamos el estado a "attended"
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

// 4. PARA EL ADMIN: Eliminar una clase
export const deleteClass = async (classId) => {
  try {
    await deleteDoc(doc(db, "classes", classId));
    return { success: true };
  } catch (e) {
    console.error("Error eliminando clase: ", e);
    return { success: false, message: e.message };
  }
};