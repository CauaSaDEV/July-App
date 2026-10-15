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
import { createUser } from "../services/users";

const ROLES = [
  { value: "STAFF", label: "Funcionário(a)" },
  { value: "MANAGER", label: "Gerente" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Funcionários não fazem login, mas o backend exige uma senha no cadastro.
// Geramos uma aleatória que ninguém vê nem usa.
function generateRandomPassword(length = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(length);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

export default function UserFormModal({ visible, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName("");
    setEmail("");
    setPassword("");
    setRole("STAFF");
  }, [visible]);

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Atenção", "Informe o nome.");
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      Alert.alert("Atenção", "Informe um e-mail válido.");
      return;
    }
    const isManagerRole = role === "MANAGER";
    if (isManagerRole && (password.length < 6 || password.length > 100)) {
      Alert.alert("Atenção", "A senha deve ter entre 6 e 100 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        password: isManagerRole ? password : generateRandomPassword(),
        role,
      });
      onSaved();
      onClose();
    } catch (err) {
      // erro (ex: e-mail já em uso) já mostrado pelo interceptor global
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Novo usuário</Text>

          <Text style={styles.label}>Nome</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome completo" />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="usuario@salon.local"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {role === "MANAGER" && (
            <>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          <Text style={styles.label}>Perfil</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[styles.roleOption, role === r.value && styles.roleOptionActive]}
                onPress={() => setRole(r.value)}
              >
                <Text style={[styles.roleText, role === r.value && styles.roleTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {role === "STAFF" && (
            <Text style={styles.hint}>
              Funcionários não acessam o app. São cadastrados apenas para serem escalados nos agendamentos.
            </Text>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Criar usuário</Text>}
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
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  hint: { fontSize: 12, color: "#888", lineHeight: 17, marginTop: 4 },
  roleOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  roleOptionActive: { backgroundColor: "#f4c5e9", borderColor: "#D1779F" },
  roleText: { color: "#888", fontWeight: "600" },
  roleTextActive: { color: "#9E7B92" },
  submitButton: {
    backgroundColor: "#D1779F",
    borderRadius: 15,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelButton: { alignItems: "center", padding: 14, marginTop: 8 },
  cancelButtonText: { color: "#999", fontSize: 14 },
});