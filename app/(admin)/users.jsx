import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    Alert,
    Modal,
    TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { db } from "@/src/config/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

const getRoleStyles = (role) => {
    switch (role) {
        case "admin":
            return {
                text: "ADMIN",
                color: "#10B981",
                bg: "rgba(16, 185, 129, 0.10)",
                border: "rgba(16, 185, 129, 0.30)",
            };
        case "coach":
            return {
                text: "COACH",
                color: "#FF9500",
                bg: "rgba(255, 149, 0, 0.10)",
                border: "rgba(255, 149, 0, 0.30)",
            };
        default:
            return {
                text: "ATLETA",
                color: "#00E5FF",
                bg: "rgba(0, 229, 255, 0.10)",
                border: "rgba(0, 229, 255, 0.30)",
            };
    }
};

const ROLE_OPTIONS = [
    { value: "admin", label: "ADMIN" },
    { value: "coach", label: "COACH" },
    { value: "user", label: "ATLETA" },
];

export default function CommunityScreen() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState("user");
    const [isSaving, setIsSaving] = useState(false);

    const sortUsers = (usersArray) => {
        const roleWeight = { admin: 1, coach: 2, user: 3 };

        return [...usersArray].sort((a, b) => {
            const roleA = a.role || "user";
            const roleB = b.role || "user";

            if (roleWeight[roleA] !== roleWeight[roleB]) {
                return roleWeight[roleA] - roleWeight[roleB];
            }

            return (a.name || a.email || "")
                .toLowerCase()
                .localeCompare((b.name || b.email || "").toLowerCase());
        });
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, "users"));

            const loadedUsers = querySnapshot.docs.map((document) => ({
                id: document.id,
                ...document.data(),
            }));

            setUsers(sortUsers(loadedUsers));
        } catch (error) {
            console.error("Error cargando usuarios:", error);
            Alert.alert("Error", "No se pudo cargar la lista de usuarios.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openEditRoleModal = (user) => {
        setSelectedUser(user);
        setSelectedRole(user.role || "user");
        setIsModalVisible(true);
    };

    const closeModal = () => {
        if (isSaving) return;
        setIsModalVisible(false);
        setSelectedUser(null);
        setSelectedRole("user");
    };

    const handleSaveRole = async () => {
        if (!selectedUser) return;

        const currentRole = selectedUser.role || "user";

        if (currentRole === selectedRole) {
            closeModal();
            return;
        }

        try {
            setIsSaving(true);

            const userRef = doc(db, "users", selectedUser.id);

            await updateDoc(userRef, {
                role: selectedRole,
            });

            const updatedUsers = users.map((user) =>
                user.id === selectedUser.id
                    ? { ...user, role: selectedRole }
                    : user
            );

            setUsers(sortUsers(updatedUsers));
            setIsModalVisible(false);

            Alert.alert(
                "Rol actualizado",
                `${selectedUser.name || selectedUser.email || "El usuario"} ahora es ${selectedRole === "user" ? "atleta" : selectedRole}.`
            );

            setSelectedUser(null);
            setSelectedRole("user");
        } catch (error) {
            console.error("Error actualizando rol:", error);
            Alert.alert("Error", "No se pudo actualizar el rol del usuario.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-impulse-dark">
            <View className="flex-1 px-5 pt-6">
                <View className="mb-8 flex-row justify-between items-end">
                    <View>
                        <Text className="text-white text-3xl font-black">Comunidad</Text>
                        <Text className="text-gray-500 text-sm">Directorio del gimnasio</Text>
                    </View>

                    <Text className="text-emerald-500 font-black text-xl">
                        {users.length} <Text className="text-gray-500 text-xs">total</Text>
                    </Text>
                </View>

                {isLoading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#10B981" />
                    </View>
                ) : users.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <IconSymbol
                            name="person.crop.circle.badge.xmark"
                            size={48}
                            color="#444"
                        />
                        <Text className="text-gray-500 font-bold mt-4">
                            No se encontraron usuarios.
                        </Text>
                    </View>
                ) : (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 120 }}
                    >
                        {users.map((user) => {
                            const roleStyle = getRoleStyles(user.role || "user");

                            return (
                                <View
                                    key={user.id}
                                    className="bg-impulse-gray p-4 rounded-3xl mb-3 border border-white/5"
                                >
                                    <View className="flex-row items-center">
                                        <View
                                            className="w-12 h-12 rounded-full items-center justify-center mr-4 border"
                                            style={{
                                                backgroundColor: roleStyle.bg,
                                                borderColor: roleStyle.border,
                                            }}
                                        >
                                            <IconSymbol
                                                name="person.fill"
                                                size={20}
                                                color={roleStyle.color}
                                            />
                                        </View>

                                        <View className="flex-1">
                                            <Text className="text-white font-black text-lg mb-0.5">
                                                {user.name || "Usuario sin nombre"}
                                            </Text>
                                            <Text className="text-gray-400 text-xs">
                                                {user.email || "Sin correo"}
                                            </Text>
                                        </View>

                                        <View
                                            className="px-3 py-1.5 rounded-full border"
                                            style={{
                                                backgroundColor: roleStyle.bg,
                                                borderColor: roleStyle.border,
                                            }}
                                        >
                                            <Text
                                                className="text-[10px] font-black tracking-widest"
                                                style={{ color: roleStyle.color }}
                                            >
                                                {roleStyle.text}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        className="mt-4 self-end px-4 py-2 rounded-full border border-white/10 bg-white/5"
                                        onPress={() => openEditRoleModal(user)}
                                        activeOpacity={0.8}
                                    >
                                        <Text className="text-white text-xs font-black tracking-wide">
                                            EDITAR ROL
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>
                )}
            </View>

            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        justifyContent: "center",
                        paddingHorizontal: 20,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: "#111111",
                            borderRadius: 28,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: "rgba(255,255,255,0.06)",
                        }}
                    >
                        <Text
                            style={{
                                color: "white",
                                fontSize: 24,
                                fontWeight: "900",
                                marginBottom: 6,
                            }}
                        >
                            Editar rol
                        </Text>

                        <Text
                            style={{
                                color: "#9CA3AF",
                                fontSize: 13,
                                marginBottom: 18,
                            }}
                        >
                            {selectedUser?.name || "Usuario"} · {selectedUser?.email || "Sin correo"}
                        </Text>

                        {ROLE_OPTIONS.map((option) => {
                            const style = getRoleStyles(option.value);
                            const isSelected = selectedRole === option.value;

                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    onPress={() => setSelectedRole(option.value)}
                                    activeOpacity={0.85}
                                    style={{
                                        borderRadius: 18,
                                        paddingVertical: 14,
                                        paddingHorizontal: 16,
                                        marginBottom: 12,
                                        borderWidth: 1,
                                        backgroundColor: isSelected ? style.bg : "rgba(255,255,255,0.03)",
                                        borderColor: isSelected ? style.border : "rgba(255,255,255,0.08)",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Text
                                        style={{
                                            color: isSelected ? style.color : "white",
                                            fontWeight: "900",
                                            letterSpacing: 1,
                                        }}
                                    >
                                        {option.label}
                                    </Text>

                                    {isSelected && (
                                        <IconSymbol
                                            name="checkmark.circle.fill"
                                            size={20}
                                            color={style.color}
                                        />
                                    )}
                                </TouchableOpacity>
                            );
                        })}

                        <View style={{ flexDirection: "row", marginTop: 8 }}>
                            <TouchableOpacity
                                onPress={closeModal}
                                disabled={isSaving}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    marginRight: 8,
                                    paddingVertical: 14,
                                    borderRadius: 18,
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderWidth: 1,
                                    borderColor: "rgba(255,255,255,0.08)",
                                }}
                            >
                                <Text style={{ color: "white", fontWeight: "900" }}>
                                    CANCELAR
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSaveRole}
                                disabled={isSaving}
                                activeOpacity={0.8}
                                style={{
                                    flex: 1,
                                    marginLeft: 8,
                                    paddingVertical: 14,
                                    borderRadius: 18,
                                    backgroundColor: "#10B981",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={{ color: "#000", fontWeight: "900" }}>
                                        GUARDAR
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}