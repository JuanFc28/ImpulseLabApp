import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TicketScreen() {
  const router = useRouter();

  // Datos simulados de la reserva (Esto después vendrá de tu base de datos)
  const reservationData = {
    userId: "rob_12345",
    classId: "cf_1800_hoy",
    name: "Roberto M.",
    className: "CrossFit",
    time: "18:00 - 19:00 hrs",
    coach: "David",
    date: "Hoy, 11 de Marzo"
  };

  // Convertimos los datos a un string JSON para que el QR los almacene
  const qrPayload = JSON.stringify(reservationData);

  return (
    <View className="flex-1 bg-impulse-dark justify-center px-6">
      
      {/* Botón de regresar */}
      <TouchableOpacity 
        onPress={() => router.back()}
        className="absolute top-16 left-6 w-12 h-12 bg-white/5 rounded-full items-center justify-center border border-white/10 z-10"
      >
        <IconSymbol name="chevron.left" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* CONTENEDOR DEL BOLETO */}
      <View className="bg-impulse-gray rounded-[40px] border border-white/10 p-8 items-center relative overflow-hidden shadow-2xl shadow-impulse-cyan/30">
        
        {/* Decoración de fondo */}
        <View className="absolute -top-20 -right-20 w-48 h-48 bg-impulse-cyan/10 rounded-full" />
        <View className="absolute -bottom-20 -left-20 w-48 h-48 bg-impulse-cyan/10 rounded-full" />

        <Text className="text-gray-400 text-[10px] font-black tracking-[3px] uppercase mb-2">
          Pase de Acceso
        </Text>
        <Text className="text-white text-3xl font-black mb-1">{reservationData.className}</Text>
        <Text className="text-impulse-cyan font-bold text-sm mb-8">{reservationData.date} • {reservationData.time}</Text>

        {/* ZONA DEL CÓDIGO QR */}
        <View className="bg-white p-4 rounded-3xl mb-8 shadow-lg shadow-white/10">
          <QRCode
            value={qrPayload}
            size={200}
            color="#0A0A0A" // Color del código (oscuro para contraste)
            backgroundColor="#FFFFFF" // Fondo blanco crítico para que las cámaras lo lean
            logoBackgroundColor="transparent"
          />
        </View>

        {/* DETALLES DEL ATLETA */}
        <View className="w-full bg-black/20 rounded-2xl p-4 border border-white/5 mb-6">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500 text-xs font-bold uppercase">Atleta</Text>
            <Text className="text-white text-xs font-black">{reservationData.name}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-500 text-xs font-bold uppercase">Coach</Text>
            <Text className="text-white text-xs font-black">{reservationData.coach}</Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <IconSymbol name="checkmark.shield.fill" size={16} color="#10B981" />
          <Text className="text-green-500 text-xs font-bold ml-2">Reserva Confirmada</Text>
        </View>
      </View>

    </View>
  );
}