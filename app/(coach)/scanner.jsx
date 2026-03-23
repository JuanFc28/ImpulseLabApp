import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Nuevos estados para manejar el éxito o el error
  const [athleteData, setAthleteData] = useState(null);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleBarcodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setIsProcessing(true);

    setTimeout(() => {
      try {
        // 1. Intentamos convertir el QR en objeto
        const parsedData = JSON.parse(data);
        
        // 2. Validamos que tenga las llaves de nuestro ticket de Impulse Lab
        if (parsedData.userId && parsedData.classId && parsedData.name) {
          setAthleteData(parsedData);
          setIsError(false);
        } else {
          // Es un JSON, pero no es de nuestra app
          setIsError(true);
          setErrorMessage("El pase no pertenece a Impulse Lab.");
        }
      } catch (error) {
        // 3. Si truena (como con el QR de Expo), es porque no es un JSON
        setIsError(true);
        setErrorMessage("Formato de código QR inválido.");
      }
      setIsProcessing(false);
    }, 1200); 
  };

  const resetScanner = () => {
    setScanned(false);
    setAthleteData(null);
    setIsError(false);
    setErrorMessage("");
  };

  if (!permission) {
    return <View className="flex-1 bg-impulse-dark" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-impulse-dark items-center justify-center px-6">
        <IconSymbol name="camera.badge.ellipsis" size={60} color="#FF9500" />
        <Text className="text-white text-xl font-black mt-4 text-center">Cámara desactivada</Text>
        <Text className="text-gray-400 text-center mt-2 mb-8">Necesitamos acceso a tu cámara para escanear los accesos.</Text>
        <TouchableOpacity 
          onPress={requestPermission}
          className="bg-orange-500 px-8 py-4 rounded-full"
        >
          <Text className="text-white font-black">OTORGAR PERMISO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* OVERLAY DEL ESCÁNER */}
      <View className="absolute inset-0 z-10 justify-center items-center pointer-events-none">
        <View className="absolute inset-0 bg-black/60" />
        <View className="w-72 h-72 border-[1000px] border-black/60 absolute" />

        <View className="w-72 h-72 relative">
          <View className={`absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 ${isError ? 'border-red-500' : 'border-orange-500'} rounded-tl-3xl transition-colors`} />
          <View className={`absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 ${isError ? 'border-red-500' : 'border-orange-500'} rounded-tr-3xl transition-colors`} />
          <View className={`absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 ${isError ? 'border-red-500' : 'border-orange-500'} rounded-bl-3xl transition-colors`} />
          <View className={`absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 ${isError ? 'border-red-500' : 'border-orange-500'} rounded-br-3xl transition-colors`} />
        </View>

        {!scanned && (
          <Text className="text-white text-sm font-bold tracking-widest mt-10 uppercase shadow-lg shadow-black">
            Alinea el código QR aquí
          </Text>
        )}
      </View>

      <TouchableOpacity 
        onPress={() => router.back()}
        className="absolute top-16 left-6 w-12 h-12 bg-black/50 rounded-full items-center justify-center border border-white/10 z-20"
      >
        <IconSymbol name="xmark" size={20} color="#FFF" />
      </TouchableOpacity>

      {/* MODAL DINÁMICO (Carga / Éxito / Error) */}
      {scanned && (
        <View className="absolute inset-x-0 bottom-0 bg-impulse-dark rounded-t-[40px] p-8 z-30 border-t border-white/10 shadow-2xl shadow-black">
          
          {isProcessing ? (
             <View className="items-center py-10">
               <ActivityIndicator size="large" color="#FF9500" />
               <Text className="text-white font-bold mt-4 tracking-widest">VALIDANDO PASE...</Text>
             </View>
          ) : isError ? (
             // VISTA DE ERROR ❌
             <View className="items-center">
               <View className="w-20 h-20 bg-red-500/20 rounded-full items-center justify-center mb-4 border-2 border-red-500/50">
                  <IconSymbol name="xmark" size={40} color="#EF4444" />
               </View>
               <Text className="text-red-500 text-xs font-black tracking-[3px] uppercase mb-1">
                 Acceso Denegado
               </Text>
               <Text className="text-white text-xl font-black mb-1 text-center">{errorMessage}</Text>
               <Text className="text-gray-400 font-medium mb-8 text-center">Pide al atleta que genere su QR desde la aplicación oficial.</Text>

               <TouchableOpacity 
                 onPress={resetScanner}
                 className="w-full bg-impulse-gray border border-white/10 py-5 rounded-2xl items-center"
               >
                 <Text className="text-white font-black tracking-widest">VOLVER A INTENTAR</Text>
               </TouchableOpacity>
             </View>
          ) : (
             // VISTA DE ÉXITO ✅
             <View className="items-center">
               <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-4 border-2 border-green-500/50">
                  <IconSymbol name="checkmark" size={40} color="#10B981" />
               </View>
               <Text className="text-green-500 text-xs font-black tracking-[3px] uppercase mb-1">
                 Acceso Autorizado
               </Text>
               <Text className="text-white text-3xl font-black mb-1">{athleteData?.name}</Text>
               <Text className="text-gray-400 font-medium mb-8">Clase: {athleteData?.className}</Text>

               <TouchableOpacity 
                 onPress={resetScanner}
                 className="w-full bg-impulse-gray border border-white/10 py-5 rounded-2xl items-center"
               >
                 <Text className="text-white font-black tracking-widest">ESCANEAR SIGUIENTE</Text>
               </TouchableOpacity>
             </View>
          )}
        </View>
      )}
    </View>
  );
}