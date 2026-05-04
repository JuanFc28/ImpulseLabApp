import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useAuth } from "@/src/context/AuthContext";
import { registerGymAttendance } from "@/src/services/gymService";

export default function ScanAttendanceScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // CORRECCIÓN: Uso del hook moderno de expo-camera
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const goToExplore = () => {
    router.replace("/(user)/explore");
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);

    try {
      if (!user?.uid) {
        Alert.alert("Error", "No se pudo identificar al usuario.", [
          { text: "Volver", onPress: goToExplore },
        ]);
        return;
      }

      const result = await registerGymAttendance(user.uid, data);

      if (result.success) {
        Alert.alert(
          "¡Check-in Exitoso!",
          "Tu asistencia ha sido registrada para hoy.",
          [{ text: "Genial", onPress: goToExplore }],
        );
      } else {
        Alert.alert(
          "Error de Asistencia",
          result.message || "No pudimos validar tu asistencia.",
          [
            {
              text: "Intentar de nuevo",
              onPress: () => {
                setScanned(false);
                setIsProcessing(false);
              },
            },
            { text: "Volver", onPress: goToExplore },
          ],
        );
      }
    } catch (error) {
      console.error("Error scanning attendance:", error);

      Alert.alert("Error", "Ocurrió un problema de conexión.", [
        {
          text: "Intentar de nuevo",
          onPress: () => {
            setScanned(false);
            setIsProcessing(false);
          },
        },
        { text: "Volver", onPress: goToExplore },
      ]);
    }
  };

  // Manejo de estados de carga de permisos
  if (!permission) {
    return (
      <View className="flex-1 bg-impulse-dark justify-center items-center">
        <ActivityIndicator size="large" color="#00E5FF" />
      </View>
    );
  }

  // Manejo de denegación de permisos
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-impulse-dark px-5 justify-center items-center">
        {/* CORRECCIÓN: camera.badge.ellipsis -> camera-reverse-outline */}
        <Ionicons name="camera-reverse-outline" size={60} color="#444" />
        <Text className="text-white text-lg font-bold mt-4 text-center">
          Sin acceso a la cámara
        </Text>
        <Text className="text-gray-500 text-center mt-2 px-6">
          Necesitas otorgar permisos de cámara para poder registrar tu
          asistencia.
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          className="bg-[#00E5FF] mt-8 py-3 px-8 rounded-full"
        >
          <Text className="text-black font-bold">Dar Permisos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToExplore}
          className="bg-white/10 mt-4 py-3 px-8 rounded-full"
        >
          <Text className="text-white font-bold">Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      <View className="absolute top-12 left-5 right-5 z-10 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={goToExplore}
          className="w-12 h-12 bg-black/60 rounded-full items-center justify-center border border-white/10"
        >
          {/* xmark es universal */}
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>

        <View className="bg-black/60 px-4 py-2 rounded-full border border-white/10">
          <Text className="text-white font-bold text-xs uppercase tracking-widest">
            Asistencia
          </Text>
        </View>
      </View>

      <View className="absolute inset-0 bg-black/40 justify-center items-center">
        <View className="w-64 h-64 border-2 border-[#00E5FF] rounded-[40px] bg-transparent items-center justify-center relative overflow-hidden">
          <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00E5FF] rounded-tl-[38px]" />
          <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00E5FF] rounded-tr-[38px]" />
          <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00E5FF] rounded-bl-[38px]" />
          <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00E5FF] rounded-br-[38px]" />

          {isProcessing && (
            <View className="absolute inset-0 bg-black/80 justify-center items-center z-10">
              <ActivityIndicator size="large" color="#00E5FF" />
              <Text className="text-[#00E5FF] font-bold mt-2">
                Validando...
              </Text>
            </View>
          )}
        </View>

        <Text className="text-white font-bold mt-10 text-lg">
          Apunta al QR del Gimnasio
        </Text>
        <Text className="text-gray-300 mt-2 text-center px-10">
          Escanea el código de asistencia para sumar días a tu racha.
        </Text>
      </View>
    </View>
  );
}
