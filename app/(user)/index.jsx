import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function HomeScreen() {
  const { user } = useAuth(); // 2. Extrae el usuario logueado
  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera y Saludo */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.greeting}>
            ¡Hola {user?.displayName || "Atleta"}!
          </ThemedText>
          <TouchableOpacity style={styles.profileIconButton}>
            <IconSymbol name="dumbbell.fill" size={24} color="#00E5FF" />
          </TouchableOpacity>
        </View>

        {/* Selector de Mes y Días (Maqueta visual del Figma) */}
        <View style={styles.calendarSection}>
          <ThemedText style={styles.monthText}>MARZO 2026</ThemedText>
          <View style={styles.daysRow}>
            {/* Día asistido (Verde) */}
            <View style={[styles.dayBox, styles.dayPassed]}>
              <ThemedText style={styles.dayLetter}>J</ThemedText>
              <IconSymbol name="checkmark" size={16} color="#FFF" />
            </View>

            {/* Día con falta (Rojo) */}
            <View style={[styles.dayBox, styles.dayMissed]}>
              <ThemedText style={styles.dayLetter}>V</ThemedText>
              <IconSymbol name="xmark" size={16} color="#FFF" />
            </View>

            {/* Día actual (Neón Cyan) */}
            <View style={[styles.dayBox, styles.dayActive]}>
              <ThemedText style={styles.dayLetter}>S</ThemedText>
              <ThemedText style={styles.dayNumberActive}>21</ThemedText>
            </View>

            {/* Día futuro */}
            <View style={[styles.dayBox, styles.dayFuture]}>
              <ThemedText style={styles.dayLetter}>D</ThemedText>
              <ThemedText style={styles.dayNumberFuture}>22</ThemedText>
            </View>
          </View>
        </View>

        {/* Tarjetas de Recordatorio de Clases y Coach */}
        <ThemedView style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainerCyan}>
              <IconSymbol name="figure.mind.and.body" size={24} color="#FFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <ThemedText style={styles.cardTitle}>
                ¡Hoy tienes Clase de Pilates!
              </ThemedText>
              <ThemedText style={styles.cardSubtitle}>
                10:00 AM con Ana
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        <ThemedView style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.iconContainerOrange}>
              <IconSymbol name="person.fill" size={24} color="#FFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <ThemedText style={styles.cardTitle}>
                Entrenamiento hoy
              </ThemedText>
              <ThemedText style={styles.cardSubtitle}>Coach Carlos</ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Botón Principal (Call to Action) */}
        <TouchableOpacity style={styles.mainButton}>
          <ThemedText style={styles.mainButtonText}>
            Tu Rutina de Hoy – ¡Empezar!
          </ThemedText>
        </TouchableOpacity>

        {/* Sección de Consejos */}
        <View style={styles.tipsContainer}>
          <ThemedText style={styles.tipsTitle}>Consejos de Salud</ThemedText>
          <ThemedText style={styles.tipsText}>
            No olvides hidratarte durante tu rutina. Lleva siempre contigo una
            botella de agua.
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A", // Fondo oscuro del MVP
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "bold",
  },
  profileIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 229, 255, 0.1)", // Fondo cyan con opacidad
    justifyContent: "center",
    alignItems: "center",
  },
  calendarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  dayBox: {
    width: 50,
    height: 65,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dayPassed: {
    backgroundColor: "#28A745", // Verde
  },
  dayMissed: {
    backgroundColor: "#DC3545", // Rojo
  },
  dayActive: {
    backgroundColor: "#00E5FF", // Neón Cyan
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  dayFuture: {
    backgroundColor: "#1A1A1A",
  },
  dayLetter: {
    fontSize: 12,
    marginBottom: 5,
    color: "#FFF",
  },
  dayNumberActive: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000", // Contraste sobre el cyan
  },
  dayNumberFuture: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#888",
  },
  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainerCyan: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(0, 229, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  iconContainerOrange: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#AAA",
  },
  mainButton: {
    backgroundColor: "#00E5FF",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  tipsContainer: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: "#888",
    lineHeight: 20,
  },
});
