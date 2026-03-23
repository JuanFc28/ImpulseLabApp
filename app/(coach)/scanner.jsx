import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { validateAttendance } from "@/src/services/gymService"; // IMPORTAMOS EL SERVICIO REAL

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [athleteData, setAthleteData] = useState(null);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setIsProcessing(true);

    try {
      // 1. Convertimos el string del QR de nuevo a un objeto JSON
      const parsedData = JSON.parse(data);
      
      // Soportamos las llaves de tu Ticket actual
      const uid = parsedData.userId || parsedData.uId;
      const cid = parsedData.classId || parsedData.classID || parsedData.cId;

      if (uid && cid) {
        // 2. Llamada real a Firebase
        const result = await validateAttendance(uid, cid);

        if (result.success) {
          setAthleteData(parsedData);
          setIsError(false);
        } else {
          setIsError(true);
          setErrorMessage(result.message);
        }
      } else {
        setIsError(true);
        setErrorMessage("Código QR no compatible con el sistema de Impulse Lab.");
      }
    } catch (error) {
      setIsError(true);
      setErrorMessage("Formato de código QR inválido o corrupto.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setAthleteData(null);
    setIsError(false);
    setErrorMessage("");
  };

  if (!permission) return <View className="flex-1 bg-impulse-dark" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-impulse-dark justify-center items-center px-6">
        <Text className="text-white text-center mb-6">Necesitamos acceso a la cámara para escanear los accesos.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-orange-500 py-4 px-8 rounded-full">
          <Text className="text-black font-black">Permitir Cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* CÁMARA */}
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* OVERLAY OSCURO CON VENTANA TRANSAPARENTE */}
      <View className="flex-1 justify-center items-center bg-black/60">
        {!scanned && (
          <View className="w-64 h-64 border-2 border-orange-500/50 rounded-3xl bg-transparent items-center justify-center relative">
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-3xl" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-3xl" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-3xl" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-3xl" />
          </View>
        )}
        {!scanned && <Text className="text-white font-bold mt-8">Apunta al código QR del atleta</Text>}
      </View>

      {/* RESULTADO DEL ESCÁNER (Aparece desde abajo) */}
      {scanned && (
        <View className="absolute bottom-0 w-full bg-impulse-dark p-8 rounded-t-[40px] border-t border-white/10 shadow-2xl">
          {isProcessing ? (
             <View className="items-center py-10">
               <ActivityIndicator size="large" color="#FF9500" />
               <Text className="text-gray-400 font-bold mt-4 uppercase tracking-widest text-xs">Validando en base de datos...</Text>
             </View>
          ) : isError ? (
             // VISTA DE ERROR ❌
             <View className="items-center">
               <View className="w-20 h-20 bg-red-500/20 rounded-full items-center justify-center mb-4 border-2 border-red-500/50">
                  <IconSymbol name="xmark" size={40} color="#EF4444" />
               </View>
               <Text className="text-red-500 text-xs font-black tracking-[3px] uppercase mb-2">Acceso Denegado</Text>
               <Text className="text-white text-center font-bold mb-8 px-4">{errorMessage}</Text>
               <TouchableOpacity onPress={resetScanner} className="w-full bg-impulse-gray border border-white/10 py-5 rounded-2xl items-center">
                 <Text className="text-white font-black tracking-widest">VOLVER A INTENTAR</Text>
               </TouchableOpacity>
             </View>
          ) : (
             // VISTA DE ÉXITO ✅
             <View className="items-center">
               <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-4 border-2 border-green-500/50">
                  <IconSymbol name="checkmark" size={40} color="#10B981" />
               </View>
               <Text className="text-green-500 text-xs font-black tracking-[3px] uppercase mb-1">Acceso Autorizado</Text>
               <Text className="text-white text-3xl font-black mb-1">{athleteData?.name || athleteData?.userName}</Text>
               <Text className="text-gray-400 font-medium mb-8">Clase: {athleteData?.className}</Text>
               <TouchableOpacity onPress={resetScanner} className="w-full bg-orange-500 py-5 rounded-2xl items-center shadow-lg shadow-orange-500/30">
                 <Text className="text-black font-black tracking-widest">SIGUIENTE ATLETA</Text>
               </TouchableOpacity>
             </View>
          )}
        </View>
      )}
    </View>
  );
}