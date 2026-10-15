import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { resetUserPassword } from "../services/users";

/**
 * @param {object|null} user usuário que terá a senha redefinida
 */
export default function ResetPasswordModal({ visible, user, onClose }) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) setPassword("");
  }, [visible]);

  async function handleSubmit() {
    if (password.length < 6 || password.length > 100) {
      Alert.alert("Atenção", "A senha deve ter entre 6 e 100 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await resetUserPassword(user.id, password);
      Alert.alert("Pronto", "Senha redefinida com sucesso.");
      onClose();
    } catch (err) {
      // erro já mostrado pelo interceptor global
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.subtitle}>{user.name}</Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Nova senha (mín. 6 caracteres)"
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Salvar nova senha</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400 },
  title: { fontSize: 18, fontWeight: "bold", color: "#9E7B92" },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 16, marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f9f9f9",
    fontSize: 15,
    marginBottom: 16,
  },
  submitButton: { backgroundColor: "#D1779F", borderRadius: 15, padding: 14, alignItems: "center" },
  submitButtonText: { color: "#fff", fontWeight: "bold" },
  cancelButton: { alignItems: "center", padding: 12, marginTop: 8 },
  cancelButtonText: { color: "#999" },
});