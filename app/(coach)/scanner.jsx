import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { validateAttendance } from "@/src/services/gymService";

export default function ScannerScreen() {
  const router = useRouter();
  // 1. Recibimos el ID de la clase en la que está el coach actualmente
  const { classId } = useLocalSearchParams(); 
  
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
      const parsedData = JSON.parse(data);
      const uid = parsedData.userId || parsedData.uId;
      const cid = parsedData.classId || parsedData.classID || parsedData.cId;

      if (uid && cid) {
          
        // 2. VALIDACIÓN ESTRICTA: ¿El ticket pertenece a ESTA clase?
        if (classId && cid !== classId) {
            setIsError(true);
            const wrongClass = parsedData.className || "otra clase";
            setErrorMessage(`Ticket rechazado. Este pase pertenece a ${wrongClass}, no a la clase actual.`);
            setIsProcessing(false);
            return;
        }

        // Si la clase coincide, validamos en Firebase
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
      
      {/* BOTÓN FLOTANTE PARA REGRESAR A LA CLASE */}
      <SafeAreaView className="absolute top-0 w-full z-10 px-5 pt-4">
        <TouchableOpacity
            onPress={() => router.back()}
            className="w-12 h-12 bg-black/60 rounded-full items-center justify-center border border-white/20 shadow-lg"
        >
            <IconSymbol name="chevron.left" size={24} color="#FF9500" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* CÁMARA */}
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* OVERLAY OSCURO */}
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

      {/* RESULTADO DEL ESCÁNER */}
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
               <View className="flex-row gap-4 w-full">
                   <TouchableOpacity onPress={() => router.back()} className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl items-center">
                     <Text className="text-white font-black tracking-widest">SALIR</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={resetScanner} className="flex-1 bg-impulse-gray border border-white/10 py-5 rounded-2xl items-center shadow-lg">
                     <Text className="text-white font-black tracking-widest">REINTENTAR</Text>
                   </TouchableOpacity>
               </View>
             </View>
          ) : (
             // VISTA DE ÉXITO ✅
             <View className="items-center">
               <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-4 border-2 border-green-500/50">
                  <IconSymbol name="checkmark" size={40} color="#10B981" />
               </View>
               <Text className="text-green-500 text-xs font-black tracking-[3px] uppercase mb-1">Acceso Autorizado</Text>
               <Text className="text-white text-3xl font-black mb-1">{athleteData?.name || athleteData?.userName}</Text>
               <Text className="text-gray-400 font-medium mb-8">Clase: {athleteData?.className || "Confirmada"}</Text>
               
               <View className="flex-row gap-4 w-full">
                   <TouchableOpacity onPress={() => router.back()} className="flex-1 bg-white/5 border border-white/10 py-5 rounded-2xl items-center">
                     <Text className="text-white font-black tracking-widest">VOLVER</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={resetScanner} className="flex-2 bg-orange-500 py-5 px-8 rounded-2xl items-center shadow-lg shadow-orange-500/30">
                     <Text className="text-black font-black tracking-widest">SIGUIENTE</Text>
                   </TouchableOpacity>
               </View>
             </View>
          )}
        </View>
      )}
    </View>
  );
}