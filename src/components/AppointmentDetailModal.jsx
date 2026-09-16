import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { cancelAppointment } from "../services/appointments";
import { formatTime } from "../utils/date";

const STATUS_LABELS = {
  SCHEDULED: "Agendado",
  DONE: "Concluído",
  CANCELED: "Cancelado",
};

const STATUS_COLORS = {
  SCHEDULED: "#D1779F",
  DONE: "#4CAF50",
  CANCELED: "#999999",
};

export default function AppointmentDetailModal({ visible, appointment, onClose, onChanged, isManager }) {
  const [loading, setLoading] = useState(false);

  if (!appointment) return null;

  function handleCancel() {
    Alert.alert("Cancelar agendamento", "Tem certeza que deseja cancelar este agendamento?", [
      { text: "Voltar", style: "cancel" },
      {
        text: "Cancelar agendamento",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await cancelAppointment(appointment.id);
            onChanged();
            onClose();
          } catch (err) {
            // erro já mostrado pelo interceptor global
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  const statusColor = STATUS_COLORS[appointment.status] ?? "#999";

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {STATUS_LABELS[appointment.status] ?? appointment.status}
            </Text>
          </View>

          <Text style={styles.time}>
            {formatTime(appointment.startAt)} – {formatTime(appointment.endAt)}
          </Text>
          <Text style={styles.client}>{appointment.clientName}</Text>
          {appointment.serviceName && <Text style={styles.detail}>{appointment.serviceName}</Text>}
          {isManager && appointment.staffName && (
            <Text style={styles.detail}>Profissional: {appointment.staffName}</Text>
          )}
          {appointment.notes ? <Text style={styles.notes}>{appointment.notes}</Text> : null}

          {appointment.status === "SCHEDULED" && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancelar agendamento</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 24 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400 },
  statusBadge: { alignSelf: "flex-start", borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12, marginBottom: 12 },
  statusText: { fontSize: 12, fontWeight: "bold" },
  time: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 4 },
  client: { fontSize: 16, color: "#9E7B92", fontWeight: "600", marginBottom: 4 },
  detail: { fontSize: 14, color: "#666", marginBottom: 2 },
  notes: { fontSize: 13, color: "#999", marginTop: 8, fontStyle: "italic" },
  cancelButton: { backgroundColor: "#E57373", borderRadius: 15, padding: 14, alignItems: "center", marginTop: 20 },
  cancelButtonText: { color: "#fff", fontWeight: "bold" },
  closeButton: { alignItems: "center", padding: 12, marginTop: 8 },
  closeButtonText: { color: "#999" },
});