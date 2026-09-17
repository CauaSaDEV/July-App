import React, { useState } from "react";
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
} from "react-native";
import { createRetroactiveAppointment } from "../services/appointments";

const PAYMENT_METHODS = [
  { id: "PIX", label: "Pix" },
  { id: "CASH", label: "Dinheiro" },
  { id: "CREDIT_CARD", label: "Cartão de Crédito" },
  { id: "DEBIT_CARD", label: "Cartão de Débito" },
  { id: "TRANSFER", label: "Transferência" },
  { id: "OTHER", label: "Outro" },
];

export default function RetroactiveAppointmentModal({
  visible,
  onClose,
  onSuccess,
  clients = [],
  staffs = [],
  services = [],
}) {
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [startAt, setStartAt] = useState(""); // Ex: 2026-02-20T14:00:00Z
  const [endAt, setEndAt] = useState("");   // Ex: 2026-02-20T15:00:00Z
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selectedClient || !selectedStaff || !startAt || !endAt || !amount) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        clientId: selectedClient,
        staffId: selectedStaff,
        serviceItemId: selectedService || null,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        amount: parseFloat(amount),
        discount: parseFloat(discount || 0),
        paymentMethod,
        paymentStatus: "PAID",
        receivedAt: new Date(startAt).toISOString(),
      };

      await createRetroactiveAppointment(payload);
      Alert.alert("Sucesso", "Atendimento retroativo registrado!");
      onSuccess?.();
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Erro ao registrar lançamento.";
      Alert.alert("Erro", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Lançamento Retroativo</Text>
        
        {/* Formulário de Seleção e Valores */}
        <Text style={styles.label}>Valor do Atendimento (R$):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
        />

        <Text style={styles.label}>Desconto (R$):</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="0.00"
          value={discount}
          onChangeText={setDiscount}
        />

        <Text style={styles.label}>Forma de Pagamento:</Text>
        <View style={styles.methodsContainer}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodChip,
                paymentMethod === method.id && styles.methodChipSelected,
              ]}
              onPress={() => setPaymentMethod(method.id)}
            >
              <Text
                style={[
                  styles.methodText,
                  paymentMethod === method.id && styles.methodTextSelected,
                ]}
              >
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Salvar Registros</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#FFF", flexGrow: 1 },
  title: { fontSize: 20, fontWeight: "bold", color: "#9E7B92", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#444", marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#DDD", borderRadius: 8, padding: 10, fontSize: 15 },
  methodsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 10 },
  methodChip: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: "#DDD" },
  methodChipSelected: { backgroundColor: "#FDF5F9", borderColor: "#CE9DBB" },
  methodText: { fontSize: 13, color: "#555" },
  methodTextSelected: { color: "#9E7B92", fontWeight: "bold" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 20 },
  cancelBtn: { padding: 12 },
  cancelText: { color: "#777" },
  submitBtn: { backgroundColor: "#CE9DBB", padding: 12, borderRadius: 8 },
  submitText: { color: "#FFF", fontWeight: "bold" },
});