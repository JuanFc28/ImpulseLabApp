import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "@/src/context/AuthContext";
import {
  getAttendanceQrConfig,
  generateAttendanceQr,
} from "@/src/services/gymService";

export default function AttendanceQrScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [qrToken, setQrToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchQrData();
  }, []);

  const fetchQrData = async () => {
    setIsLoading(true);

    try {
      const config = await getAttendanceQrConfig();

      if (config?.active && config?.qrToken) {
        setQrToken(config.qrToken);
      } else {
        setQrToken(null);
      }
    } catch (error) {
      console.error("Error fetching QR config:", error);
      Alert.alert("Error", "No se pudo cargar el QR de asistencia.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQr = async () => {
    Alert.alert(
      "Generar Nuevo QR",
      "Esto invalidará el QR anterior. ¿Estás seguro de generar uno nuevo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, generar",
          style: "destructive",
          onPress: async () => {
            if (!user?.uid) {
              Alert.alert("Error", "No se pudo identificar al administrador.");
              return;
            }

            setIsGenerating(true);

            try {
              const newConfig = await generateAttendanceQr(user.uid);
              setQrToken(newConfig.qrToken);
              Alert.alert("Éxito", "Nuevo QR generado exitosamente.");
            } catch (error) {
              console.error("Error generating QR:", error);
              Alert.alert("Error", "No se pudo generar el QR.");
            } finally {
              setIsGenerating(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <View className="px-5 pt-4 pb-4 flex-row items-center border-b border-white/10 bg-[#0A0A0A]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-4"
        >
          {/* chevron.left -> chevron-back */}
          <Ionicons name="chevron-back" size={20} color="#FFF" />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="text-white text-xl font-black">
            Asistencia General
          </Text>
          <Text className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-0.5">
            Check-in de Atletas
          </Text>
        </View>
      </View>

      <View
        style={{ flex: 1, backgroundColor: "#0A0A0A" }}
        className="justify-center items-center px-6"
      >
        {isLoading ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#10B981" />
            <Text className="text-gray-500 font-bold mt-4">Cargando QR...</Text>
          </View>
        ) : qrToken ? (
          <View className="items-center w-full">
            <View className="bg-white p-8 rounded-[40px] items-center justify-center mb-8 border-[8px] border-emerald-500/20 w-[300px] h-[300px]">
              <QRCode
                value={qrToken}
                size={220}
                color="#000000"
                backgroundColor="#FFFFFF"
                logoSize={50}
                logoBackgroundColor="transparent"
              />
            </View>

            <Text className="text-white text-center text-lg font-medium mb-1">
              Escanea este código para
            </Text>
            <Text className="text-white text-center text-2xl font-black mb-10">
              Registrar Asistencia
            </Text>

            <TouchableOpacity
              onPress={handleGenerateQr}
              disabled={isGenerating}
              className={`py-4 px-8 rounded-2xl flex-row items-center border ${
                isGenerating
                  ? "bg-white/5 border-white/10"
                  : "bg-emerald-500/20 border-emerald-500/30"
              }`}
            >
              {isGenerating ? (
                <ActivityIndicator color="#10B981" />
              ) : (
                <>
                  {/* arrow.triangle.2.circlepath -> refresh */}
                  <Ionicons name="refresh" size={18} color="#10B981" />
                  <Text className="text-emerald-400 font-bold tracking-widest ml-3">
                    REGENERAR QR
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="items-center w-full">
            <View className="bg-[#1C1C1E] p-8 rounded-[40px] border border-white/10 items-center justify-center mb-8 w-[300px] h-[300px]">
              {/* qrcode.viewfinder -> qr-code-outline */}
              <Ionicons name="qr-code-outline" size={80} color="#444" />
              <Text className="text-gray-500 text-center font-bold mt-6">
                Aún no hay un QR de asistencia configurado.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleGenerateQr}
              disabled={isGenerating}
              className={`bg-emerald-500 w-full py-5 rounded-3xl items-center flex-row justify-center ${
                isGenerating ? "opacity-70" : ""
              }`}
            >
              {isGenerating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  {/* qrcode -> qr-code */}
                  <Ionicons name="qr-code" size={24} color="#000" />
                  <Text className="text-black font-black text-lg tracking-widest ml-3">
                    GENERAR QR
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
