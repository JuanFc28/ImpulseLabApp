import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/src/config/firebase";
import { collection, getDocs } from "firebase/firestore";

const getRoleStyles = (role) => {
    switch(role) {
        case "admin": return { text: "ADMIN", color: "#10B981", bg: "rgba(16, 185, 129, 0.1)", border: "rgba(16, 185, 129, 0.3)" };
        case "coach": return { text: "COACH", color: "#FF9500", bg: "rgba(255, 149, 0, 0.1)", border: "rgba(255, 149, 0, 0.3)" };
        default: return { text: "ATLETA", color: "#00E5FF", bg: "rgba(0, 229, 255, 0.1)", border: "rgba(0, 229, 255, 0.3)" };
    }
};

export default function CommunityScreen() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const loadedUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const roleWeight = { admin: 1, coach: 2, user: 3 };
            loadedUsers.sort((a, b) => {
                const roleA = a.role || "user";
                const roleB = b.role || "user";
                if (roleWeight[roleA] !== roleWeight[roleB]) return roleWeight[roleA] - roleWeight[roleB];
                return (a.name || a.email || "").toLowerCase().localeCompare((b.name || b.email || "").toLowerCase());
            });

            setUsers(loadedUsers);
        } catch (error) {
            Alert.alert("Error", "No se pudo cargar la lista de usuarios.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <SafeAreaView className="flex-1 bg-impulse-dark">
            <View className="flex-1 px-5 pt-6">
                
                {/* HEADER CON ESPACIO SEGURO */}
                <View className="mb-8 flex-row justify-between items-end">
                    <View>
                        <Text className="text-white text-3xl font-black">Comunidad</Text>
                        <Text className="text-gray-500 text-sm">Directorio del gimnasio</Text>
                    </View>
                    <Text className="text-emerald-500 font-black text-xl">{users.length} <Text className="text-gray-500 text-xs">total</Text></Text>
                </View>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                ) : users.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <IconSymbol name="person.crop.circle.badge.xmark" size={48} color="#444" />
                        <Text className="text-gray-500 font-bold mt-4">No se encontraron usuarios.</Text>
                    </View>
                ) : (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                        {users.map((user) => {
                            const roleStyle = getRoleStyles(user.role || "user"); 
                            return (
                                <View key={user.id} className="bg-impulse-gray p-4 rounded-3xl mb-3 border border-white/5 flex-row items-center">
                                    <View className="w-12 h-12 rounded-full items-center justify-center mr-4 border" style={{ backgroundColor: roleStyle.bg, borderColor: roleStyle.border }}>
                                        <IconSymbol name="person.fill" size={20} color={roleStyle.color} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-white font-black text-lg mb-0.5">{user.name || "Usuario sin nombre"}</Text>
                                        <Text className="text-gray-400 text-xs">{user.email || "Sin correo"}</Text>
                                    </View>
                                    <View className="px-3 py-1.5 rounded-full border" style={{ backgroundColor: roleStyle.bg, borderColor: roleStyle.border }}>
                                        <Text className="text-[10px] font-black tracking-widest" style={{ color: roleStyle.color }}>{roleStyle.text}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}