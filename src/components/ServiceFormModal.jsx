import { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { createService, updateService } from "../services/catalog";

/**
 * @param {object|null} service serviço a editar; null = criação
 */
export default function ServiceFormModal({ visible, service, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!service;

  useEffect(() => {
    if (!visible) return;
    setName(service?.name ?? "");
    setPrice(service?.defaultPrice != null ? String(service.defaultPrice) : "");
    setDuration(service?.durationMinutes != null ? String(service.durationMinutes) : "");
  }, [visible, service]);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Atenção", "Informe o nome do serviço.");
      return;
    }

    const priceNumber = Number(price.replace(",", "."));
    if (!priceNumber || priceNumber <= 0) {
      Alert.alert("Atenção", "Informe um preço válido, maior que zero.");
      return;
    }

    const durationNumber = parseInt(duration, 10);
    if (!durationNumber || durationNumber <= 0) {
      Alert.alert("Atenção", "Informe uma duração válida (em minutos), maior que zero.");
      return;
    }

    const payload = {
      name: name.trim(),
      defaultPrice: priceNumber,
      durationMinutes: durationNumber,
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateService(service.id, payload);
      } else {
        await createService(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      // erro já mostrado pelo interceptor global em src/services/api.js
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{isEditing ? "Editar serviço" : "Novo serviço"}</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ex: Alongamento"
            placeholderTextColor= "#000000"
          />

          <Text style={styles.label}>Preço padrão (R$)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            placeholder="120.00"
            placeholderTextColor= "#000000"

            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Duração (minutos)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="60"
            placeholderTextColor= "#000000"

            keyboardType="number-pad"
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? "Salvar alterações" : "Criar serviço"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 22, fontWeight: "bold", color: "#9E7B92", marginBottom: 20 },
  label: { fontSize: 13, color: "#CE9DBB", marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#f9f9f9",
    fontSize: 15,
    color: "#333",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#D1779F",
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelButton: { alignItems: "center", padding: 14, marginTop: 8 },
  cancelButtonText: { color: "#999", fontSize: 14 },
});