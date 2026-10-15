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
import { createExpenseCategory } from "../services/expenses";

export default function ExpenseCategoryModal({ visible, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName("");
      setDescription("");
    }
  }, [visible]);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Atenção", "Informe o nome da categoria.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createExpenseCategory({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      // erro já mostrado pelo interceptor global
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Nova categoria</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome (ex: Energia)"
          />
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição (opcional)"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Criar categoria</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400 },
  title: { fontSize: 18, fontWeight: "bold", color: "#9E7B92", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f9f9f9",
    fontSize: 15,
    marginBottom: 12,
  },
  submitButton: { backgroundColor: "#D1779F", borderRadius: 15, padding: 14, alignItems: "center", marginTop: 4 },
  submitText: { color: "#fff", fontWeight: "bold" },
  cancelButton: { alignItems: "center", padding: 12, marginTop: 8 },
  cancelText: { color: "#999" },
});