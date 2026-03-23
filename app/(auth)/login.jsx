import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuthenticate = async () => {
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(err.message || "Error al autenticar. Revisa tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <IconSymbol name="bolt.fill" size={50} color="#00E5FF" />
          </View>
          <ThemedText type="title" style={styles.title}>
            IMPULSE LAB
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {isLogin
              ? "Inicia sesión para entrenar"
              : "Crea tu cuenta y empieza hoy"}
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              placeholderTextColor="#888"
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          ) : null}

          <TouchableOpacity
            style={styles.mainButton}
            onPress={handleAuthenticate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <ThemedText style={styles.mainButtonText}>
                {isLogin ? "Iniciar Sesión" : "Registrarse"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          </ThemedText>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <ThemedText style={styles.footerLink}>
              {isLogin ? "Regístrate" : "Inicia Sesión"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 25 },
  header: { alignItems: "center", marginBottom: 40 },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: { fontSize: 32, fontWeight: "900", letterSpacing: 2, color: "#FFF" },
  subtitle: { fontSize: 14, color: "#888", marginTop: 5 },
  formContainer: { width: "100%" },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 12,
    padding: 16,
    color: "#FFF",
    marginBottom: 15,
    fontSize: 16,
  },
  mainButton: {
    backgroundColor: "#00E5FF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainButtonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  errorText: { color: "#FF3B30", marginBottom: 10, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  footerText: { color: "#888", fontSize: 14 },
  footerLink: { color: "#00E5FF", fontWeight: "bold", fontSize: 14 },
});
