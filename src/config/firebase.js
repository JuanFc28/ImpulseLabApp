import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Importamos getAuth para la web, y las herramientas de React Native para el móvil
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyB5-G1LLhd1FGmLxlDOF_TqffO7LEVjd44",
  authDomain: "impulselab-5f11b.firebaseapp.com",
  projectId: "impulselab-5f11b",
  storageBucket: "impulselab-5f11b.firebasestorage.app",
  messagingSenderId: "461010828388",
  appId: "1:461010828388:web:a696fc6a795b9aa9a93371",
  measurementId: "G-6M44YSTKNN"
};

// Inicializamos la app y la base de datos
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Declaramos la variable auth
let auth;

// Lógica condicional: ¿Dónde estoy corriendo?
if (Platform.OS === 'web') {
    // Si estoy en un navegador web, uso getAuth estándar (que usa IndexedDB/LocalStorage del navegador)
    auth = getAuth(app);
} else {
    // Si estoy en iOS o Android, uso el adaptador de React Native
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
}

export { auth, db };