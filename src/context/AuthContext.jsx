import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const savedRole = await AsyncStorage.getItem("@user_role");
        if (savedRole) {
          setRole(savedRole);
        } else {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setRole(userData.role);
            await AsyncStorage.setItem("@user_role", userData.role);
          }
        }
      } else {
        setUser(null);
        setRole(null);
        await AsyncStorage.removeItem("@user_role");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, pass) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email, pass, name) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      pass,
    );
    const newUser = userCredential.user;

    await setDoc(doc(db, "users", newUser.uid), {
      email: newUser.email,
      name: name,
      role: "user",
      createdAt: new Date(),
    });
  };

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem("@user_role");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
