import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { Calendar } from "react-native-calendars";
import { useAuth } from "../../src/hooks/useAuth";
import { useAppointmentsCalendar } from "../../src/hooks/useAppointmentsCalendar";
import { formatTime } from "../../src/utils/date";
import AppointmentFormModal from "../../src/components/AppointmentFormModal";
import AppointmentDetailModal from "../../src/components/AppointmentDetailModal";
import RetroactiveLaunchModal from "../../src/components/RetroactiveLaunchModal";

import { getClients } from "../../src/services/clients";
import { getServiceCatalog } from "../../src/services/catalog";
import { getUsers } from "../../src/services/users";

const STATUS_COLORS = {
  SCHEDULED: "#D1779F",
  DONE: "#4CAF50",
  CANCELED: "#bbbbbb",
};

export default function Agendamentos() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";

  const {
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    markedDates,
    dayAppointments,
    loading,
    refetch,
  } = useAppointmentsCalendar();

  const [formVisible, setFormVisible] = useState(false);
  const [retroactiveVisible, setRetroactiveVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Listas de apoio para o lançamento retroativo
  const [clients, setClients] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    loadAuxData();
  }, []);

  async function loadAuxData() {
    try {
      const [clientRes, serviceRes, userRes] = await Promise.all([
        getClients(),
        getServiceCatalog(),
        getUsers(),
      ]);

      setClients(
        clientRes.map((c) => ({
          id: c.id,
          label: c.name,
          subtitle: c.phone,
        }))
      );

      setServices(
        serviceRes
          .filter((s) => s.active !== false)
          .map((s) => ({
            id: s.id,
            label: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            subtitle: `R$ ${s.price ?? "0.00"}`,
          }))
      );

      setStaffs(
        userRes
          .filter((u) => u.active !== false)
          .map((u) => ({
            id: u.id,
            label: u.name,
            subtitle: u.role,
          }))
      );
    } catch (err) {
      // Trato via interceptor da API
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Calendar
        current={selectedDate}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        onMonthChange={(month) =>
          setCurrentMonth(new Date(month.year, month.month - 1, 1))
        }
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: "#D1779F",
          todayTextColor: "#D1779F",
          arrowColor: "#D1779F",
          dotColor: "#D1779F",
        }}
      />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Agendamentos do dia</Text>
        {loading && <ActivityIndicator size="small" color="#CE9DBB" />}
      </View>

      <FlatList
        data={dayAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>Nenhum agendamento neste dia.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => setSelectedAppointment(item)}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: STATUS_COLORS[item.status] ?? "#ccc" },
              ]}
            />
            <View style={styles.rowTimeBox}>
              <Text style={styles.rowTime}>{formatTime(item.startAt)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowClient}>{item.clientName}</Text>
              <Text style={styles.rowDetail}>
                {item.serviceName ?? "Sem serviço"}
                {isManager && item.staffName ? ` · ${item.staffName}` : ""}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Botão Secundário para Lançamento Retroativo */}
      {isManager && (
        <TouchableOpacity
          style={styles.fabRetroactive}
          onPress={() => setRetroactiveVisible(true)}
        >
          <Text style={styles.fabRetroactiveText}>⏱️</Text>
        </TouchableOpacity>
      )}

      {/* Botão Principal Novo Agendamento */}
      <TouchableOpacity style={styles.fab} onPress={() => setFormVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Agendamento Padrão */}
      <AppointmentFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        dateKey={selectedDate}
        isManager={isManager}
        currentUser={user}
        onCreated={refetch}
      />

      {/* Modal Lançamento Retroativo */}
      <RetroactiveLaunchModal
        visible={retroactiveVisible}
        onClose={() => setRetroactiveVisible(false)}
        onSuccess={refetch}
        clients={clients}
        staffs={staffs}
        services={services}
      />

      {/* Detalhes do Agendamento */}
      <AppointmentDetailModal
        visible={!!selectedAppointment}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onChanged={refetch}
        isManager={isManager}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listTitle: { fontSize: 16, fontWeight: "bold", color: "#9E7B92" },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { textAlign: "center", color: "#999", marginTop: 30 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  rowTimeBox: {
    backgroundColor: "#f4c5e9",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  rowTime: { fontSize: 13, fontWeight: "bold", color: "#9E7B92" },
  rowClient: { fontSize: 14, fontWeight: "600", color: "#333" },
  rowDetail: { fontSize: 12, color: "#888", marginTop: 2 },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 110,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D1779F",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: { color: "#fff", fontSize: 30, lineHeight: 32 },
  fabRetroactive: {
    position: "absolute",
    right: 24,
    bottom: 180,
    width: 56,
    height: 56,
    borderRadius: 24,
    backgroundColor: "#FAF0F5",
    borderWidth: 1,
    borderColor: "#CE9DBB",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fabRetroactiveText: { fontSize: 20 },
});