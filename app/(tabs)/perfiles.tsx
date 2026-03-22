import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function PerfilScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera del Perfil */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Perfil <Text style={{color: '#00E5FF'}}>Roberto</Text></ThemedText>
        </View>

        <View style={styles.profileInfoContainer}>
          <View style={styles.avatarContainer}>
             <IconSymbol name="person.crop.circle.fill" size={70} color="#333" />
          </View>
          <View style={styles.profileDetails}>
            <ThemedText style={styles.userName}>Roberto Carlos Benítez Rizzo</ThemedText>
            <ThemedText style={styles.userLocation}>Puebla, MX</ThemedText>
            <ThemedText style={styles.userLevel}>Nivel: Intermedio</ThemedText>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton}>
          <ThemedText style={styles.editButtonText}>Editar Perfil</ThemedText>
        </TouchableOpacity>

        {/* Tarjeta de Progreso General */}
        <ThemedView style={styles.statsCard}>
          <View style={styles.progressHeader}>
            <ThemedText style={styles.cardTitle}>Progreso general semanal</ThemedText>
            <ThemedText style={styles.progressPercentage}>75%</ThemedText>
          </View>
          
          {/* Barra de progreso */}
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '75%' }]} />
          </View>

          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Rutinas completadas:</ThemedText>
            <ThemedText style={styles.statValue}>12</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Racha actual:</ThemedText>
            <View style={styles.streakBadge}>
              <ThemedText style={styles.statValue}>5 días</ThemedText>
              <IconSymbol name="flame.fill" size={16} color="#00E5FF" style={{marginLeft: 5}}/>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Tiempo total:</ThemedText>
            <ThemedText style={styles.statValue}>14 hrs</ThemedText>
          </View>
        </ThemedView>

        {/* Tarjeta de Objetivo Principal */}
        <ThemedView style={styles.statsCard}>
          <ThemedText style={styles.cardTitle}>Objetivo principal</ThemedText>
          <ThemedText style={styles.mainGoal}>Ganar masa muscular</ThemedText>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Frecuencia</ThemedText>
            <ThemedText style={styles.statValue}>5 días por semana</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <ThemedText style={styles.statLabel}>Tipo de entrenamiento</ThemedText>
            <ThemedText style={styles.goalAccent}>Fuerza + Hyrox</ThemedText>
          </View>
        </ThemedView>

        {/* Tarjeta de Logros */}
        <ThemedView style={styles.statsCard}>
          <ThemedText style={styles.cardTitle}>Logros</ThemedText>
          <View style={styles.achievementRow}>
            <ThemedText style={styles.statLabel}>5 días seguidos</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.achievementRow}>
            <ThemedText style={styles.statLabel}>Primera rutina completa</ThemedText>
          </View>
          <View style={styles.divider} />
          <View style={styles.achievementRow}>
            <ThemedText style={styles.statLabel}>10 clases tomadas</ThemedText>
          </View>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

// Nota: Importar Text de react-native arriba para el título compuesto
import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  header: { marginBottom: 25 },
  title: { fontSize: 28, fontWeight: 'bold' },
  profileInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  profileDetails: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 2 },
  userLocation: { fontSize: 14, color: '#AAA', marginBottom: 2 },
  userLevel: { fontSize: 14, color: '#00E5FF', fontWeight: '600' },
  editButton: { backgroundColor: '#1A1A1A', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#333' },
  editButtonText: { color: '#FFF', fontWeight: 'bold' },
  statsCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  cardTitle: { fontSize: 16, color: '#FFF', fontWeight: 'bold', marginBottom: 10 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressPercentage: { color: '#00E5FF', fontWeight: 'bold', fontSize: 16 },
  progressBarBackground: { height: 8, backgroundColor: '#222', borderRadius: 4, marginBottom: 20 },
  progressBarFill: { height: 8, backgroundColor: '#00E5FF', borderRadius: 4, shadowColor: '#00E5FF', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  statLabel: { color: '#AAA', fontSize: 14 },
  statValue: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  streakBadge: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#222', marginVertical: 10 },
  mainGoal: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  goalAccent: { color: '#00E5FF', fontSize: 14, fontWeight: 'bold' },
  achievementRow: { paddingVertical: 5 }
});