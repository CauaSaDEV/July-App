 import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cancelAppointment } from "../services/appointments";
import { formatTime } from "../utils/date";

const STATUS_CONFIG = {
  SCHEDULED: {
    label: "Agendado",
    color: "#CE9DBB",
    icon: "calendar-outline",
  },
  DONE: {
    label: "Concluído",
    color: "#4CAF50",
    icon: "checkmark-circle-outline",
  },
  CANCELED: {
    label: "Cancelado",
    color: "#888888",
    icon: "close-circle-outline",
  },
};

export default function AppointmentDetailModal({
  visible,
  appointment,
  onClose,
  onChanged,
  isManager,
}) {
  const [loading, setLoading] = useState(false);

  if (!appointment) return null;

  const statusInfo = STATUS_CONFIG[appointment.status] ?? {
    label: appointment.status,
    color: "#888888",
    icon: "information-circle-outline",
  };

  function handleSafeClose() {
    if (!loading) {
      onClose();
    }
  }

  function confirmCancel() {
    Alert.alert(
      "Cancelar agendamento",
      `Tem certeza que deseja cancelar o horário de ${appointment.clientName}?`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Sim, cancelar",
          style: "destructive",
          onPress: executeCancel,
        },
      ]
    );
  }

  async function executeCancel() {
    setLoading(true);
    try {
      await cancelAppointment(appointment.id);
      onChanged();
      onClose();
    } catch (err) {
      // Erro tratado pelo interceptor global da API
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleSafeClose}
    >
      {/* Backdrop clicável para fechar */}
      <Pressable style={styles.backdrop} onPress={handleSafeClose}>
        {/* Card (Pressable interno impede que o clique no card feche o modal) */}
        <Pressable
          style={styles.card}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho: Badge de Status + Botão X */}
          <View style={styles.header}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${statusInfo.color}20` },
              ]}
            >
              <Ionicons
                name={statusInfo.icon}
                size={14}
                color={statusInfo.color}
                style={styles.statusIcon}
              />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSafeClose}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Nome do Cliente em destaque */}
          <Text style={styles.clientName}>{appointment.clientName}</Text>

          {/* Lista de Detalhes */}
          <View style={styles.detailsList}>
            <DetailRow
              icon="time-outline"
              text={`${formatTime(appointment.startAt)} – ${formatTime(appointment.endAt)}`}
              bold
            />

            {appointment.serviceName && (
              <DetailRow icon="cut-outline" text={appointment.serviceName} />
            )}

            {isManager && appointment.staffName && (
              <DetailRow
                icon="person-outline"
                text={`Profissional: ${appointment.staffName}`}
              />
            )}
          </View>

          {/* Bloco de Observações */}
          {appointment.notes ? (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>"{appointment.notes}"</Text>
            </View>
          ) : null}

          {/* Ações */}
          <View style={styles.actionsContainer}>
            {appointment.status === "SCHEDULED" && (
              <TouchableOpacity
                style={[styles.cancelButton, loading && styles.disabledButton]}
                onPress={confirmCancel}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#fff"
                      style={styles.cancelIcon}
                    />
                    <Text style={styles.cancelButtonText}>
                      Cancelar agendamento
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleSafeClose}
              disabled={loading}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Subcomponente interno para padronizar as linhas de detalhe */
function DetailRow({ icon, text, bold = false }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={16} color="#9E7B92" style={styles.detailIcon} />
      <Text style={[styles.detailText, bold && styles.detailTextBold]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  clientName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222222",
    marginBottom: 8,
  },
  detailsList: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#666666",
  },
  detailTextBold: {
    fontWeight: "bold",
    color: "#333333",
  },
  notesBox: {
    padding: 12,
    marginTop: 8,
    backgroundColor: "#F9F6F8",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#CE9DBB",
  },
  notesText: {
    fontSize: 13,
    color: "#666666",
    fontStyle: "italic",
  },
  actionsContainer: {
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: "#FF6B6B",
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  disabledButton: {
    opacity: 0.7,
  },
  cancelIcon: {
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  closeButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  closeButtonText: {
    color: "#888888",
    fontWeight: "bold",
    fontSize: 14,
  },
});