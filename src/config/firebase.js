// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDpa7EWJZXeDSufHPr8f-2hEoBQF8d3iF4",
  authDomain: "impulselab-5f11b.firebaseapp.com",
  projectId: "impulselab-5f11b",
  storageBucket: "impulselab-5f11b.firebasestorage.app",
  messagingSenderId: "461010828388",
  appId: "1:461010828388:web:a696fc6a795b9aa9a93371",
  measurementId: "G-6M44YSTKNN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
