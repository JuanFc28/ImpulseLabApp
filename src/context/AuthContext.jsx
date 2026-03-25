import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubscribeUserDoc = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
                unsubscribeUserDoc = null;
            }

            if (firebaseUser) {
                try {
                    const docRef = doc(db, "users", firebaseUser.uid);

                    unsubscribeUserDoc = onSnapshot(
                        docRef,
                        async (docSnap) => {
                            let finalRole = "user";
                            let finalName = firebaseUser.displayName || "";

                            if (docSnap.exists()) {
                                const userData = docSnap.data();

                                finalRole = userData.role || "user";
                                finalName = firebaseUser.displayName || userData.name || "";

                                await AsyncStorage.setItem("@user_role", finalRole);

                                if (!firebaseUser.displayName && userData.name) {
                                    await updateProfile(firebaseUser, {
                                        displayName: userData.name,
                                    });
                                    finalName = userData.name;
                                }
                            } else {
                                const savedRole = await AsyncStorage.getItem("@user_role");
                                finalRole = savedRole || "user";
                            }

                            setUser({
                                ...firebaseUser,
                                displayName: finalName,
                            });
                            setRole(finalRole);
                            setIsLoading(false);
                        },
                        async (error) => {
                            console.error("Error escuchando documento del usuario:", error);

                            const savedRole = await AsyncStorage.getItem("@user_role");

                            setUser({
                                ...firebaseUser,
                                displayName: firebaseUser.displayName || "",
                            });
                            setRole(savedRole || "user");
                            setIsLoading(false);
                        }
                    );
                } catch (error) {
                    console.error("Error en AuthContext:", error);

                    const savedRole = await AsyncStorage.getItem("@user_role");

                    setUser({
                        ...firebaseUser,
                        displayName: firebaseUser.displayName || "",
                    });
                    setRole(savedRole || "user");
                    setIsLoading(false);
                }
            } else {
                setUser(null);
                setRole(null);
                await AsyncStorage.removeItem("@user_role");
                setIsLoading(false);
            }
        });

        return () => {
            if (unsubscribeUserDoc) {
                unsubscribeUserDoc();
            }
            unsubscribeAuth();
        };
    }, []);

    const login = async (email, pass) => {
        await signInWithEmailAndPassword(auth, email, pass);
    };

    const register = async (email, pass, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser = userCredential.user;

        await updateProfile(newUser, {
            displayName: name,
        });

        await setDoc(doc(db, "users", newUser.uid), {
            email: newUser.email,
            name: name,
            role: "user",
            createdAt: new Date(),
        });

        setUser({
            ...newUser,
            displayName: name,
        });
        setRole("user");
        await AsyncStorage.setItem("@user_role", "user");
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