import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/src/context/AuthContext";

export default function TicketScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams(); // Recibe los datos de la reserva

  // Si no hay params (entrada directa), usamos valores por defecto o de la base de datos
  const ticketInfo = {
    userId: user?.uid || "invitado",
    userName: user?.displayName || "Atleta Impulse",
    classId: params.classId || "no_class",
    className: params.className || "Próxima Clase",
    time: params.time || "--:--",
    coach: params.coach || "Staff"
  };

  // El payload que leerá el Scanner del Coach
  const qrPayload = JSON.stringify({
    uId: ticketInfo.userId,
    cId: ticketInfo.classId,
    name: ticketInfo.userName,
    date: new Date().toLocaleDateString()
  });

  return (
    <View className="flex-1 bg-impulse-dark justify-center px-8">
      <TouchableOpacity 
        onPress={() => router.back()}
        className="absolute top-16 left-6 w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/10"
      >
        <IconSymbol name="chevron.left" size={24} color="#FFF" />
      </TouchableOpacity>

      <View className="items-center bg-impulse-gray p-8 rounded-[40px] border border-white/10">
        <Text className="text-impulse-cyan font-black text-xs uppercase tracking-[4px] mb-2">Pase de Acceso</Text>
        <Text className="text-white text-3xl font-black mb-1">{ticketInfo.className}</Text>
        <Text className="text-gray-400 font-bold mb-8">{ticketInfo.time} • Coach {ticketInfo.coach}</Text>

        <View className="bg-white p-5 rounded-3xl mb-8 shadow-2xl shadow-cyan-500/20">
          <QRCode value={qrPayload} size={180} color="#000" backgroundColor="#FFF" />
        </View>

        <View className="w-full border-t border-white/5 pt-6 items-center">
          <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Atleta</Text>
          <Text className="text-white text-lg font-black">{ticketInfo.userName}</Text>
        </View>
      </View>
      
      <Text className="text-gray-600 text-center mt-8 px-10 text-xs">
        Presenta este código al coach al llegar al box para validar tu asistencia.
      </Text>
    </View>
  );
}