import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDpa7EWJZXeDSufHPr8f-2hEoBQF8d3iF4",
    authDomain: "impulselab-5f11b.firebaseapp.com",
    projectId: "impulselab-5f11b",
    storageBucket: "impulselab-5f11b.firebasestorage.app",
    messagingSenderId: "461010828388",
    appId: "1:461010828388:web:a696fc6a795b9aa9a93371",
    measurementId: "G-6M44YSTKNN",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);