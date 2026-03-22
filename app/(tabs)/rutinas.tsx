import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet } from 'react-native';

export default function RutinasScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>Rutinas</ThemedText>
      <ThemedText style={styles.subtitle}>Elige tu enfoque de hoy</ThemedText>
      
      {/* Aquí insertaremos el componente ParallaxScrollView y las tarjetas de rutinas */}
      <ThemedView style={styles.placeholder}>
        <ThemedText>Listado de rutinas en construcción...</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Espacio para la barra de estado superior
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 5,
    marginBottom: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  }
});