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
import { createClient, updateClient } from "../services/clients";

function formatPhone(value) {
  if (!value) return "";

  const digits = value.replace(/\D/g, "");

  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

const PHONE_REGEX = /^\(\d{2}\)\s9?\d{4}-\d{4}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @param {object|null} client cliente a editar; null = criação
 */
export default function ClientFormModal({ visible, client, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!client;

  useEffect(() => {
    if (!visible) return;
    setName(client?.name ?? "");
    setPhone(formatPhone(client?.phone ?? "")); // Aplica a máscara nos dados já existentes ao editar
    setEmail(client?.email ?? "");
    setNotes(client?.notes ?? "");
  }, [visible, client]);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Atenção", "Informe o nome do cliente.");
      return;
    }

    const cleanPhone = phone.trim();

    // Corrigido a sintaxe do Alert
    if (!cleanPhone) {
      Alert.alert("Atenção", "Informe o telefone do cliente.");
      return;
    }

    // Validação do formato formatado (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (!PHONE_REGEX.test(cleanPhone)) {
      Alert.alert("Atenção", "Informe um número de telefone válido com DDD (Ex: (71) 99999-9999).");
      return;
    }

    const cleanEmail = email.trim();
    if (cleanEmail && !EMAIL_REGEX.test(cleanEmail)) {
      Alert.alert("Atenção", "Informe um e-mail em formato válido (Ex: cliente@exemplo.com).");
      return;
    }

    const payload = {
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail || undefined,
      notes: notes.trim() || undefined,
    };

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateClient(client.id, payload);
      } else {
        await createClient(payload);
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
          <Text style={styles.title}>{isEditing ? "Editar cliente" : "Novo cliente"}</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nome completo"
          />

          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            placeholder="(71) 99999-9999"
            keyboardType="phone-pad"
            maxLength={15}
          />

          <Text style={styles.label}>E-mail (opcional)</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="cliente@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Observações (opcional)</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Preferências, alergias, etc."
            multiline
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? "Salvar alterações" : "Criar cliente"}
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