import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Dinheiro" },
  { id: "PIX", label: "Pix" },
  { id: "CREDIT_CARD", label: "Cartão de Crédito" },
  { id: "DEBIT_CARD", label: "Cartão de Débito" },
  { id: "TRANSFER", label: "Transferência" },
  { id: "OTHER", label: "Outro" },
];

const PAYMENT_STATUSES = [
  { id: "PAID", label: "Pago" },
  { id: "PENDING", label: "Pendente" },
];

// Aceita "120", "120,50" e "120.50". Vazio vira null.
function parseMoney(text) {
  if (!text || !text.trim()) return null;
  return parseFloat(text.trim().replace(",", "."));
}

function formatBRL(value) {
  return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

export default function FinishAppointmentModal({
  visible,
  appointment,
  onClose,
  onConfirm,
}) {
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [paymentStatus, setPaymentStatus] = useState("PAID");
  const [amountText, setAmountText] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // O GET /appointments não retorna preço, então pode vir vazio.
  // Nesse caso o campo fica em branco e o backend usa o defaultPrice do serviço.
  const knownPrice =
    appointment?.price ??
    appointment?.service?.price ??
    appointment?.serviceItem?.price ??
    null;

  useEffect(() => {
    if (visible) {
      setPaymentMethod("PIX");
      setPaymentStatus("PAID");
      setAmountText(
        knownPrice != null ? String(knownPrice).replace(".", ",") : ""
      );
      setDiscountText("");
    }
  }, [visible, appointment?.id]);

  const amount = parseMoney(amountText);
  const discount = parseMoney(discountText) ?? 0;
  const total = amount != null ? amount - discount : null;
  const isPending = paymentStatus === "PENDING";

  async function handleFinish() {
    if (amount != null && (isNaN(amount) || amount < 0)) {
      Alert.alert("Atenção", "Informe um valor válido.");
      return;
    }
    if (isNaN(discount) || discount < 0) {
      Alert.alert("Atenção", "Informe um desconto válido.");
      return;
    }
    if (amount != null && discount > amount) {
      Alert.alert("Atenção", "O desconto não pode ser maior que o valor.");
      return;
    }
    if (amount == null && discount > 0) {
      Alert.alert("Atenção", "Informe o valor para aplicar o desconto.");
      return;
    }
    if (!isPending && !paymentMethod) {
      Alert.alert("Atenção", "Selecione uma forma de pagamento.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        paymentStatus,
        // PENDING exige paymentMethod nulo
        paymentMethod: isPending ? null : paymentMethod,
        discount,
      };
      // Sem valor informado: o backend usa o defaultPrice do serviço
      if (amount != null) payload.amount = amount;

      await onConfirm(appointment.id, payload);
      onClose();
    } catch (error) {
      console.error("Erro ao finalizar:", error);
    } finally {
      setSubmitting(false);
    }
  }

  if (!appointment) return null;

  const clientName =
    appointment.clientName || appointment.client?.name || "Cliente";
  const serviceName =
    appointment.serviceName ||
    appointment.service?.name ||
    appointment.serviceItem?.name ||
    "Serviço";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalContent}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>Finalizar Atendimento</Text>
            <Text style={styles.subtitle}>
              {clientName} · {serviceName}
            </Text>

            <View style={styles.moneyRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.label}>Valor (R$)</Text>
                <TextInput
                  style={styles.input}
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="decimal-pad"
                  placeholder="Preço do serviço"
                  placeholderTextColor="#999"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.label}>Desconto (R$)</Text>
                <TextInput
                  style={styles.input}
                  value={discountText}
                  onChangeText={setDiscountText}
                  keyboardType="decimal-pad"
                  placeholder="0,00"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Valor Total:</Text>
              <Text style={styles.amountValue}>
                {total != null && !isNaN(total)
                  ? formatBRL(Math.max(total, 0))
                  : "Preço do serviço"}
              </Text>
            </View>

            <Text style={styles.label}>Situação do pagamento:</Text>
            <View style={styles.statusRow}>
              {PAYMENT_STATUSES.map((status) => {
                const isSelected = paymentStatus === status.id;
                return (
                  <TouchableOpacity
                    key={status.id}
                    style={[
                      styles.statusOption,
                      isSelected && styles.methodOptionSelected,
                    ]}
                    onPress={() => setPaymentStatus(status.id)}
                  >
                    <Text
                      style={[
                        styles.methodText,
                        isSelected && styles.methodTextSelected,
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!isPending && (
              <>
                <Text style={styles.label}>Forma de Pagamento:</Text>
                <View style={styles.methodList}>
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.methodOption,
                          isSelected && styles.methodOptionSelected,
                        ]}
                        onPress={() => setPaymentMethod(method.id)}
                      >
                        <Text
                          style={[
                            styles.methodText,
                            isSelected && styles.methodTextSelected,
                          ]}
                        >
                          {method.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleFinish}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.confirmText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    marginBottom: 16,
  },
  moneyRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#000",
    backgroundColor: "#FFF",
  },
  amountBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statusOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  methodList: {
    gap: 8,
    marginBottom: 20,
  },
  methodOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFF",
  },
  methodOptionSelected: {
    borderColor: "#CE9DBB",
    backgroundColor: "#FDF5F9",
  },
  methodText: {
    fontSize: 14,
    color: "#555",
  },
  methodTextSelected: {
    color: "#9E7B92",
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelText: {
    color: "#777",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#CE9DBB",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});