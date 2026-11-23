import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";
import { useHomeData } from "../../src/hooks/useHomeData";
import { formatTime, formatWeekdayDate } from "../../src/utils/date";
import FinishAppointmentModal from "../../src/components/FinishAppointmentModal";
import {
  finishAppointment,
  cancelAppointment,
} from "../../src/services/appointments";

const { width } = Dimensions.get("window");

const ROLE_LABELS = {
  MANAGER: "Gerente",
  STAFF: "Funcionário(a)",
};

const PERIOD_OPTIONS = [
  { key: "DAY", label: "Dia", title: "Agendamentos de Hoje" },
  { key: "WEEK", label: "Semana", title: "Agendamentos da Semana" },
  { key: "MONTH", label: "Mês", title: "Agendamentos do Mês" },
];

export default function Home() {
  const [viewMode, setViewMode] = useState("WEEK");
  const [periodOpen, setPeriodOpen] = useState(false);

  const { user, refetch: refetchAuth } = useAuth();
  const {
    nextAppointments = [],
    loading: dataLoading,
    refetch: refetchData,
  } = useHomeData(user?.role, viewMode);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedApptToFinish, setSelectedApptToFinish] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.role) {
        refetchData();
      }
    }, [user?.role, refetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAuth?.(), refetchData?.()]);
    setRefreshing(false);
  }, [refetchAuth, refetchData]);

  async function handleConfirmFinish(id, paymentDetails) {
    Alert.alert(
      "Finalizar agendamento",
      "Tem certeza que quer finalizar este agendamento?",
      [
        {
          text: "Voltar",
          style: "cancel",
        },
        {
          text: "Finalizar",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            try {
              await finishAppointment(id, paymentDetails);
              Alert.alert("Sucesso", "Agendamento finalizado com sucesso!");
              setSelectedApptToFinish(null);
              refetchData();
            } catch (err) {
              Alert.alert("Erro", "Não foi possível finalizar o agendamento.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }

  function handleCancelAppointment(id) {
    Alert.alert(
      "Cancelar agendamento",
      "Tem certeza que quer cancelar este agendamento?",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar agendamento",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              await cancelAppointment(id);
              Alert.alert("Cancelado", "Agendamento cancelado com sucesso!");
              refetchData();
            } catch (err) {
              Alert.alert("Erro", "Não foi possível cancelar o agendamento.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "Usuário";

  return (
    <ScrollView
      style={{ backgroundColor: "#ffffff" }}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#CE9DBB"
        />
      }
    >
      {/* BOAS-VINDAS */}
      <View style={styles.welcomeBox}>
        <Text style={styles.title}>Olá, {firstName}💅🏻</Text>
        {user?.role && (
          <Text style={styles.roleTag}>
            {ROLE_LABELS[user.role] ?? user.role}
          </Text>
        )}
      </View>

      {/* SEÇÃO: PRÓXIMOS AGENDAMENTOS */}
      <View style={styles.section}>
        {/* TÍTULO COM DROPDOWN DE PERÍODO */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            style={styles.titleTrigger}
            onPress={() => setPeriodOpen((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>
              {PERIOD_OPTIONS.find((o) => o.key === viewMode)?.title}
            </Text>
            <Text style={styles.dropdownArrow}>{periodOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {periodOpen && (
            <View style={styles.dropdownList}>
              {PERIOD_OPTIONS.map((item, index) => {
                const isActive = viewMode === item.key;
                const isLast = index === PERIOD_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isActive && styles.dropdownItemActive,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      setViewMode(item.key);
                      setPeriodOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isActive && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isActive && <Text style={styles.dropdownCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {dataLoading ? (
          <ActivityIndicator
            size="small"
            color="#CE9DBB"
            style={{ marginTop: 10 }}
          />
        ) : nextAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum agendamento marcado.</Text>
          </View>
        ) : (
          nextAppointments.map((appt, index) => {
            const clientName =
              appt.clientName || appt.client?.name || "Cliente";
            const serviceName =
              appt.serviceName ||
              appt.service?.name ||
              appt.serviceItem?.name ||
              "Serviço não informado";
            const staffName = appt.staffName || appt.staff?.name;

            return (
              <View key={appt.id ?? index} style={styles.appointmentCard}>
                {/* LINHA SUPERIOR: HORÁRIO E DETALHES */}
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentTimeBox}>
                    <Text style={styles.appointmentDay}>
                      {formatWeekdayDate(appt.startAt)}
                    </Text>
                    <Text style={styles.appointmentTime}>
                      {formatTime(appt.startAt)}
                    </Text>
                  </View>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentClient}>{clientName}</Text>
                    <Text style={styles.appointmentDetail}>
                      {serviceName}
                      {staffName ? ` · ${staffName}` : ""}
                    </Text>
                  </View>
                </View>

                {/* BOTÕES DE AÇÃO NA PARTE INFERIOR */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelAppointment(appt.id)}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.finishButton}
                    onPress={() => setSelectedApptToFinish(appt)}
                    disabled={submitting}
                  >
                    <Text style={styles.finishText}>Finalizar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* MODAL DE SELEÇÃO DE PAGAMENTO E FINALIZAÇÃO */}
      <FinishAppointmentModal
        visible={!!selectedApptToFinish}
        appointment={selectedApptToFinish}
        onClose={() => setSelectedApptToFinish(null)}
        onConfirm={handleConfirmFinish}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: width * 0.05,
    alignItems: "center",
  },
  welcomeBox: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#f4c5e9",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#9E7B92",
    marginBottom: 5,
  },
  roleTag: {
    marginTop: 8,
    fontSize: 12,
    color: "#9E7B92",
    fontWeight: "600",
  },
  section: {
    width: "100%",
    maxWidth: 500,
    marginTop: 10,
  },
  sectionHeader: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  titleTrigger: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9E7B92",
  },
  emptyCard: {
    backgroundColor: "#fdfdfd",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  appointmentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  appointmentTimeBox: {
    backgroundColor: "#f4c5e9",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  appointmentTime: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#9E7B92",
    textAlign: "center",
  },
  appointmentDay: {
    fontSize: 11,
    color: "#9E7B92",
    textAlign: "center",
    textTransform: "capitalize",
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentClient: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  appointmentDetail: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  finishButton: {
    flex: 1,
    backgroundColor: "#CE9DBB",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  finishText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },

  /* DROPDOWN DE PERÍODO */
  dropdownArrow: {
    fontSize: 11,
    color: "#888",
    marginLeft: 8,
  },
  dropdownList: {
    marginTop: 8,
    alignSelf: "flex-end",
    minWidth: 130,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  dropdownItemActive: {
    backgroundColor: "#f5f5f5",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#555",
  },
  dropdownItemTextActive: {
    fontWeight: "bold",
    color: "#333",
  },
  dropdownCheck: {
    marginLeft: 12,
    color: "#555",
    fontWeight: "bold",
  },
});