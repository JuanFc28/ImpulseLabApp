import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function AdminFinancesScreen() {
  // Mock de transacciones recientes
  const transactions = [
    { id: 1, name: "Carlos R.", type: "Membresía Ilimitada", amount: "$1,200", status: "pagado", date: "Hoy, 10:30 AM" },
    { id: 2, name: "Sofía T.", type: "Drop-in", amount: "$150", status: "pagado", date: "Hoy, 08:15 AM" },
    { id: 3, name: "Luis García", type: "Membresía 3x", amount: "$850", status: "pendiente", date: "Ayer" },
    { id: 4, name: "Ana Paula", type: "Membresía Ilimitada", amount: "$1,200", status: "vencido", date: "Hace 3 días" },
  ];

  return (
    <View className="flex-1 bg-impulse-dark relative">
      {/* HEADER FINANZAS */}
      <View className="px-5 pt-16 pb-6 bg-emerald-950/30 border-b border-emerald-900/50">
        <Text className="text-emerald-500 text-[10px] font-black uppercase tracking-[3px] mb-1">Balance General</Text>
        <Text className="text-white text-3xl font-black tracking-tight">Finanzas</Text>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 pt-6"
      >
        {/* TARJETAS DE RESUMEN FINANCIERO */}
        <View className="flex-row gap-4 px-5 mb-8">
          <View className="flex-1 bg-impulse-gray border border-emerald-500/30 rounded-3xl p-5 relative overflow-hidden">
            <View className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-emerald-500/10" />
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-2">INGRESOS HOY</Text>
            <View className="flex-row items-baseline mb-1">
              <Text className="text-white text-2xl font-black">$1,350</Text>
            </View>
            <Text className="text-emerald-500 text-xs font-bold">+2 pagos</Text>
          </View>

          <View className="flex-1 bg-impulse-gray border border-red-500/30 rounded-3xl p-5 relative overflow-hidden">
             <View className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-red-500/10" />
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest mb-2">POR COBRAR</Text>
            <View className="flex-row items-baseline mb-1">
               <Text className="text-white text-2xl font-black">$2,050</Text>
            </View>
            <Text className="text-red-500 text-xs font-bold">2 atletas atrasados</Text>
          </View>
        </View>

        {/* HISTORIAL DE TRANSACCIONES */}
        <View className="px-5">
          <View className="flex-row justify-between items-end mb-6">
            <Text className="text-white text-lg font-black">Últimos Movimientos</Text>
            <TouchableOpacity>
              <Text className="text-emerald-500 text-xs font-bold">Ver todo</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-[#111] border border-white/5 rounded-[32px] p-2">
            {transactions.map((txn, index) => (
              <View 
                key={txn.id} 
                className={`flex-row items-center p-4 ${index !== transactions.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                {/* Icono de Estado */}
                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                  txn.status === 'pagado' ? 'bg-emerald-500/10' : 
                  txn.status === 'pendiente' ? 'bg-orange-500/10' : 'bg-red-500/10'
                }`}>
                  <IconSymbol 
                    name={txn.status === 'pagado' ? "checkmark" : txn.status === 'pendiente' ? "clock.fill" : "exclamationmark.triangle.fill"} 
                    size={20} 
                    color={txn.status === 'pagado' ? "#10B981" : txn.status === 'pendiente' ? "#FF9500" : "#EF4444"} 
                  />
                </View>

                {/* Info Transacción */}
                <View className="flex-1">
                  <Text className="text-white font-black text-base">{txn.name}</Text>
                  <Text className="text-gray-500 text-xs font-medium">{txn.type}</Text>
                  <Text className="text-gray-600 text-[10px] mt-1">{txn.date}</Text>
                </View>

                {/* Monto y Cobro */}
                <View className="items-end">
                  <Text className="text-white font-black text-lg">{txn.amount}</Text>
                  {txn.status !== 'pagado' && (
                    <TouchableOpacity className="bg-white/10 px-3 py-1.5 rounded-full mt-1">
                      <Text className="text-white text-[10px] font-bold">Recordar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* BOTÓN FLOTANTE: REGISTRAR PAGO */}
      <View className="absolute bottom-6 left-6 right-6 z-20">
        <TouchableOpacity 
          activeOpacity={0.9}
          className="bg-emerald-500 flex-row items-center justify-center py-5 rounded-full shadow-2xl shadow-emerald-500/40"
        >
          <View className="bg-emerald-950/20 p-1 rounded-full mr-2">
             <IconSymbol name="plus" size={16} color="#000" />
          </View>
          <Text className="text-emerald-950 font-black text-sm tracking-[2px]">
            NUEVO INGRESO
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}