import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function RutinasScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Rutinas</ThemedText>
          <ThemedText style={styles.subtitle}>Elige tu enfoque de hoy</ThemedText>
        </View>

        {/* Tarjeta de Rutina Recomendada */}
        <TouchableOpacity style={styles.recommendedCard}>
          <ThemedText style={styles.recommendedTag}>Recomendado para ti</ThemedText>
          <View style={styles.recommendedHeader}>
            <View>
              <ThemedText style={styles.routineTitle}>Pecho y Hombro</ThemedText>
              <ThemedText style={styles.routineSubtitle}>Coach Juano • Intermedio</ThemedText>
            </View>
            <View style={styles.coachAvatarPlaceholder}>
              <IconSymbol name="person.fill" size={20} color="#00E5FF" />
            </View>
          </View>
          <View style={styles.routineStats}>
            <ThemedText style={styles.statText}>120 min | Fuerza</ThemedText>
          </View>
        </TouchableOpacity>

        {/* Cuadrícula de Categorías (2 columnas) */}
        <View style={styles.gridContainer}>
          {/* Fila 1 */}
          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.gridItem}>
              <ThemedText style={styles.gridItemTitle}>Pecho y Hombro</ThemedText>
              <ThemedText style={styles.gridItemSubtitle}>Push</ThemedText>
              <View style={[styles.gridLine, { backgroundColor: '#00E5FF' }]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem}>
              <ThemedText style={styles.gridItemTitle}>Espalda y Bíceps</ThemedText>
              <ThemedText style={styles.gridItemSubtitle}>Pull</ThemedText>
              <View style={[styles.gridLine, { backgroundColor: '#FF9500' }]} />
            </TouchableOpacity>
          </View>

          {/* Fila 2 */}
          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.gridItem}>
              <ThemedText style={styles.gridItemTitle}>Pierna</ThemedText>
              <ThemedText style={styles.gridItemSubtitle}>Leg Day</ThemedText>
              <View style={[styles.gridLine, { backgroundColor: '#FF2D55' }]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem}>
              <ThemedText style={styles.gridItemTitle}>Full Body</ThemedText>
              <ThemedText style={styles.gridItemSubtitle}>Completo</ThemedText>
              <View style={[styles.gridLine, { backgroundColor: '#5856D6' }]} />
            </TouchableOpacity>
          </View>

          {/* Fila 3 */}
          <View style={styles.gridRow}>
            <TouchableOpacity style={styles.gridItem}>
              <ThemedText style={styles.gridItemTitle}>ABS</ThemedText>
              <ThemedText style={styles.gridItemSubtitle}>Core</ThemedText>
              <View style={[styles.gridLine, { backgroundColor: '#34C759' }]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem}>
              <ThemedText style={styles.gridItemTitle}>Cardio</ThemedText>
              <ThemedText style={styles.gridItemSubtitle}>Resistencia</ThemedText>
              <View style={[styles.gridLine, { backgroundColor: '#FF3B30' }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner de Nuevos Ejercicios HYROX */}
        <TouchableOpacity style={styles.hyroxBanner}>
          <ThemedText style={styles.hyroxTitle}>Nuevos Ejercicios</ThemedText>
          <ThemedText style={styles.hyroxLogo}>H Y R O X</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginBottom: 25 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 5 },
  recommendedCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 25,
    borderWidth: 1, borderColor: '#222', shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  recommendedTag: { fontSize: 12, color: '#00E5FF', fontWeight: 'bold', marginBottom: 10 },
  recommendedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routineTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  routineSubtitle: { fontSize: 14, color: '#AAA', marginTop: 4 },
  coachAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  routineStats: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#333' },
  statText: { fontSize: 12, color: '#888' },
  gridContainer: { marginBottom: 25 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  gridItem: { flex: 0.48, backgroundColor: '#111', borderRadius: 16, padding: 15, borderWidth: 1, borderColor: '#222' },
  gridItemTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  gridItemSubtitle: { fontSize: 12, color: '#888', marginBottom: 15 },
  gridLine: { height: 3, width: 30, borderRadius: 2 },
  hyroxBanner: { backgroundColor: '#1A1A1A', borderRadius: 16, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  hyroxTitle: { fontSize: 14, color: '#AAA', marginBottom: 5 },
  hyroxLogo: { fontSize: 24, fontWeight: '900', letterSpacing: 8, color: '#FFF' }
});