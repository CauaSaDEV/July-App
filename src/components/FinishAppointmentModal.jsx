import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";

const PAYMENT_METHODS = [
  { id: "CASH", label: "Dinheiro" },
  { id: "PIX", label: "Pix" },
  { id: "CREDIT_CARD", label: "Cartão de Crédito" },
  { id: "DEBIT_CARD", label: "Cartão de Débito" },
  { id: "TRANSFER", label: "Transferência"},
  { id: "OTHER", label: "Outro"}
];

export default function FinishAppointmentModal({
  visible,
  appointment,
  onClose,
  onConfirm,
}) {
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [submitting, setSubmitting] = useState(false);

  const amount =
    appointment?.price ??
    appointment?.service?.price ??
    appointment?.serviceItem?.price ??
    0;

  useEffect(() => {
    if (visible) {
      setPaymentMethod("PIX");
    }
  }, [visible]);

  async function handleFinish() {
    if (!paymentMethod) {
      Alert.alert("Atenção", "Selecione uma forma de pagamento.");
      return;
    }

    setSubmitting(true);

    try {
      await onConfirm(appointment.id, {
        paymentMethod,
        amount: Number(amount),
      });
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
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Finalizar Atendimento</Text>
          <Text style={styles.subtitle}>
            {clientName} · {serviceName}
          </Text>

          {/* Exibição do Valor */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Valor Total:</Text>
            <Text style={styles.amountValue}>
              R$ {Number(amount).toFixed(2).replace(".", ",")}
            </Text>
          </View>

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
        </View>
      </View>
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