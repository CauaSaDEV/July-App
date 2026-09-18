import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
} from "react-native";
import { formatTime } from "../utils/date";

const { height } = Dimensions.get("window");

export default function MetricDetailModal({
  visible,
  title,
  appointments = [],
  onClose,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Fechar</Text>
          </TouchableOpacity>
        </View>

        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum agendamento encontrado.</Text>
          </View>
        ) : (
          <FlatList
            data={appointments}
            keyExtractor={(item, index) => item?.id ?? String(index)}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item }) => {
              const clientName =
                item?.clientName || item?.client?.name || "Cliente";
              const serviceName =
                item?.serviceName ||
                item?.service?.name ||
                item?.serviceItem?.name ||
                "Serviço não informado";
              const staffName = item?.staffName || item?.staff?.name;
              const isScheduled = item?.status === "SCHEDULED";

              return (
                <View style={styles.appointmentCard}>
                  <View style={styles.row}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>
                        {formatTime(item?.startAt)}
                      </Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.clientName}>{clientName}</Text>
                      <Text style={styles.serviceDetail}>
                        {serviceName} {staffName ? `· ${staffName}` : ""}
                      </Text>
                      <Text
                        style={[
                          styles.statusTag,
                          { color: getStatusColor(item?.status) },
                        ]}
                      >
                        {getStatusLabel(item?.status)}
                      </Text>
                    </View>
                  </View>

                  {isScheduled && (onConfirm || onCancel) && (
                    <View style={styles.buttonsRow}>
                      {onConfirm && (
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={() => {
                            onClose();
                            onConfirm(item.id);
                          }}
                        >
                          <Text style={styles.confirmButtonText}>Finalizar</Text>
                        </TouchableOpacity>
                      )}

                      {onCancel && (
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => {
                            onClose();
                            onCancel(item.id);
                          }}
                        >
                          <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

function getStatusColor(status) {
  if (status === "DONE") return "#4CAF50";
  if (status === "CANCELED") return "#999999";
  return "#D1779F";
}

function getStatusLabel(status) {
  if (status === "DONE") return "Concluído";
  if (status === "CANCELED") return "Cancelado";
  return "Agendado";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: height * 0.05,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#9E7B92",
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  closeText: {
    color: "#D1779F",
    fontWeight: "600",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#999999",
    fontSize: 15,
  },
  listContainer: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBadge: {
    backgroundColor: "#f4c5e9",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#9E7B92",
  },
  info: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
  serviceDetail: {
    fontSize: 13,
    color: "#777777",
    marginTop: 2,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 4,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#CE9DBB",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 13,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#F2D6D6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#B23B3B",
    fontWeight: "bold",
    fontSize: 13,
  },
});