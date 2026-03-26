import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";

const AuthContext = createContext({});

const STORAGE_ROLE_KEY = "@user_role";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    setUser(firebaseUser);

                    let savedRole = await AsyncStorage.getItem(STORAGE_ROLE_KEY);

                    if (savedRole) {
                        setRole(savedRole);
                    } else {
                        const docRef = doc(db, "users", firebaseUser.uid);
                        const docSnap = await getDoc(docRef);

                        if (docSnap.exists()) {
                            const userData = docSnap.data();
                            const fetchedRole = userData.role || "user";

                            setRole(fetchedRole);
                            await AsyncStorage.setItem(STORAGE_ROLE_KEY, fetchedRole);

                            if (!firebaseUser.displayName && userData.name) {
                                await updateProfile(firebaseUser, {
                                    displayName: userData.name,
                                });
                            }
                        } else {
                            setRole("user");
                            await AsyncStorage.setItem(STORAGE_ROLE_KEY, "user");
                        }
                    }
                } else {
                    setUser(null);
                    setRole(null);
                    await AsyncStorage.removeItem(STORAGE_ROLE_KEY);
                }
            } catch (error) {
                console.error("Error en AuthContext:", error);
                setUser(null);
                setRole(null);
            } finally {
                setIsLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const login = async (email, pass) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        const loggedUser = userCredential.user;

        const docRef = doc(db, "users", loggedUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            const fetchedRole = userData.role || "user";

            setRole(fetchedRole);
            await AsyncStorage.setItem(STORAGE_ROLE_KEY, fetchedRole);
        } else {
            setRole("user");
            await AsyncStorage.setItem(STORAGE_ROLE_KEY, "user");
        }

        return userCredential;
    };

    const register = async (email, pass, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser = userCredential.user;

        await updateProfile(newUser, {
            displayName: name,
        });

        await setDoc(doc(db, "users", newUser.uid), {
            email: newUser.email,
            name,
            role: "user",
            createdAt: new Date(),
        });

        await AsyncStorage.setItem(STORAGE_ROLE_KEY, "user");

        setUser(newUser);
        setRole("user");

        return userCredential;
    };

    const logout = async () => {
        await AsyncStorage.removeItem(STORAGE_ROLE_KEY);
        await signOut(auth);
        setUser(null);
        setRole(null);
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