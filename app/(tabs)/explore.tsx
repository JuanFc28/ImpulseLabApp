import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ClasesScreen() {
  // Estado para simular la navegación entre pestañas internas
  const [activeTab, setActiveTab] = useState('Clases');
  // Estado para simular qué pasa cuando el usuario reserva una clase (Mock del Frontend)
  const [claseReservada, setClaseReservada] = useState(false);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Tu Calendario</ThemedText>
          <ThemedText style={styles.subtitle}>Consulta tu asistencia y clases</ThemedText>
        </View>

        {/* Maqueta del Calendario Mensual */}
        <View style={styles.calendarContainer}>
          <View style={styles.monthSelector}>
            <IconSymbol name="chevron.left" size={20} color="#00E5FF" />
            <ThemedText style={styles.monthText}>Marzo 2026</ThemedText>
            <IconSymbol name="chevron.right" size={20} color="#00E5FF" />
          </View>
          <View style={styles.calendarGrid}>
            <ThemedText style={styles.placeholderText}>
              [Aquí integraremos el componente de calendario interactivo]
            </ThemedText>
          </View>
        </View>

        {/* Racha y Gamificación */}
        <View style={styles.streakContainer}>
          <IconSymbol name="flame.fill" size={20} color="#00E5FF" />
          <ThemedText style={styles.streakText}>5 días seguidos entrenando</ThemedText>
          <IconSymbol name="checkmark.circle.fill" size={20} color="#00E5FF" />
        </View>

        {/* Toggle Clases / Coachs */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, activeTab === 'Clases' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('Clases')}
          >
            <ThemedText style={[styles.toggleText, activeTab === 'Clases' && styles.toggleTextActive]}>
              Clases
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toggleButton, activeTab === 'Coachs' && styles.toggleButtonActive]}
            onPress={() => setActiveTab('Coachs')}
          >
            <ThemedText style={[styles.toggleText, activeTab === 'Coachs' && styles.toggleTextActive]}>
              Coachs
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Título de Sección */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Clases Disponibles</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>Elige tu clase, profesor y horario</ThemedText>
        </View>

        {/* Tarjeta de Clase 1 (Pilates) - Con lógica de UI para el QR */}
        <ThemedView style={styles.classCard}>
          <View style={styles.classInfoRow}>
            <View style={styles.classIconContainer}>
              <IconSymbol name="figure.mind.and.body" size={24} color="#FFF" />
            </View>
            <View style={styles.classDetails}>
              <ThemedText style={styles.className}>Pilates</ThemedText>
              <ThemedText style={styles.classTeacher}>Prof. Maria Gonzalez</ThemedText>
              <ThemedText style={styles.classSchedule}>Lun-Mie 9:00 AM - 10:00 AM</ThemedText>
            </View>
          </View>
          
          {/* Aquí mostramos cómo cambia la UI al reservar (Requisito Control Académico) */}
          {!claseReservada ? (
            <TouchableOpacity style={styles.reserveButton} onPress={() => setClaseReservada(true)}>
              <ThemedText style={styles.reserveButtonText}>Reservar</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.qrButton}>
              <IconSymbol name="qrcode" size={20} color="#000" />
              <ThemedText style={styles.qrButtonText}> Generar QR de Acceso</ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Tarjeta de Clase 2 (Ballet) */}
        <ThemedView style={styles.classCard}>
          <View style={styles.classInfoRow}>
            <View style={[styles.classIconContainer, { backgroundColor: '#0055FF' }]}>
              <IconSymbol name="music.note" size={24} color="#FFF" />
            </View>
            <View style={styles.classDetails}>
              <ThemedText style={styles.className}>Ballet</ThemedText>
              <ThemedText style={styles.classTeacher}>Prof. Carmen Ruiz</ThemedText>
              <ThemedText style={styles.classSchedule}>Lun-Mie 11:00 AM - 12:00 PM</ThemedText>
            </View>
          </View>
          <TouchableOpacity style={styles.reserveButton}>
            <ThemedText style={styles.reserveButtonText}>Reservar</ThemedText>
          </TouchableOpacity>
        </ThemedView>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00E5FF',
    letterSpacing: 1,
  },
  calendarGrid: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#444',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 25,
  },
  streakText: {
    marginHorizontal: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#333',
  },
  toggleText: {
    color: '#888',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  classCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#222',
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  classIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  classDetails: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  classTeacher: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 2,
  },
  classSchedule: {
    fontSize: 12,
    color: '#00E5FF',
  },
  reserveButton: {
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reserveButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  qrButton: {
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  qrButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  }
});