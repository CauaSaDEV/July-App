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
import { finishAppointment } from "../../src/services/appointments";
import { formatTime } from "../../src/utils/date";
import MetricDetailModal from "../../src/components/MetricDetailModal";
import FinishAppointmentModal from "../../src/components/FinishAppointmentModal";

const { width } = Dimensions.get("window");

const ROLE_LABELS = {
  MANAGER: "Gerente",
  STAFF: "Funcionário(a)",
};

export default function Home() {
  const { user, refetch: refetchAuth } = useAuth();
  const {
    appointments = [],
    nextAppointments = [],
    scheduledCount = 0,
    doneCount = 0,
    canceledCount = 0,
    loading: dataLoading,
    refetch: refetchData,
  } = useHomeData(user?.role);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedApptToFinish, setSelectedApptToFinish] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Configuração do Modal de Métricas
  const [metricModalConfig, setMetricModalConfig] = useState({
    visible: false,
    title: "",
    data: [],
  });

  useFocusEffect(
    useCallback(() => {
      if (user?.role) {
        refetchData();
      }
    }, [user?.role, refetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAuth?.(), refetchData?.()]);
    setRefreshing(false);
  }, [refetchAuth, refetchData]);

  // Executa a finalização e atualiza os dados da Home
  async function handleConfirmFinish(id, paymentDetails) {
  Alert.alert(
  "Finalizar agendamento",
  "Tem certeza que quer finalizar este agendamento?",
  [
    {
      text: "Voltar",
      style: "cancel",
      onPress: () => {
        // Modal continua aberto, usuário volta ao modal de pagamento
      }
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
            throw err;
          } finally {
            setSubmitting(false);
          }
        }
      }
    ]
  );
}

  // Abre os detalhes conforme o card selecionado
  function openMetricModal(type) {
    if (type === "SCHEDULED") {
      setMetricModalConfig({
        visible: true,
        title: "Agendados hoje",
        data: appointments.filter((a) => a?.status === "SCHEDULED"),
      });
    } else if (type === "DONE") {
      setMetricModalConfig({
        visible: true,
        title: "Concluídos hoje",
        data: appointments.filter((a) => a?.status === "DONE"),
      });
    } else if (type === "CANCELED") {
      setMetricModalConfig({
        visible: true,
        title: "Cancelados hoje",
        data: appointments.filter((a) => a?.status === "CANCELED"),
      });
    }
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

      {/* CARDS INTERATIVOS DE MÉTRICAS */}
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => openMetricModal("SCHEDULED")}
        >
          <Text style={styles.cardTitle}>Agendados hoje</Text>
          <Text style={styles.cardData}>
            {scheduledCount} pendente{scheduledCount === 1 ? "" : "s"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => openMetricModal("DONE")}
        >
          <Text style={styles.cardTitle}>Concluídos hoje</Text>
          <Text style={styles.cardData}>
            {doneCount} finalizado{doneCount === 1 ? "" : "s"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* CARD DE CANCELADOS (SE HOUVER) */}
      {canceledCount > 0 && (
        <View style={styles.cardContainer}>
          <TouchableOpacity
            style={[styles.card, styles.cardFull]}
            onPress={() => openMetricModal("CANCELED")}
          >
            <Text style={styles.cardTitle}>Cancelados hoje</Text>
            <Text style={styles.cardData}>
              {canceledCount} cancelamento{canceledCount === 1 ? "" : "s"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SEÇÃO: PRÓXIMOS AGENDAMENTOS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Agendamentos da Semana</Text>

        {dataLoading ? (
          <ActivityIndicator
            size="small"
            color="#CE9DBB"
            style={{ marginTop: 10 }}
          />
        ) : nextAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Nenhum agendamento pendente para hoje.
            </Text>
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
              <View key={appt.id ?? index} style={styles.appointmentRow}>
                <View style={styles.appointmentTimeBox}>
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

                {/* BOTÃO FINALIZAR */}
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={() => setSelectedApptToFinish(appt)}
                >
                  <Text style={styles.finishText}>Finalizar</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* MODAL DE DETALHES DOS CARDS */}
      <MetricDetailModal
        visible={metricModalConfig.visible}
        title={metricModalConfig.title}
        appointments={metricModalConfig.data}
        onClose={() =>
          setMetricModalConfig((prev) => ({ ...prev, visible: false }))
        }
        onConfirm={(id) => {
          const appt = appointments.find((a) => a.id === id);
          if (appt) setSelectedApptToFinish(appt);
        }}
      />

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
  cardContainer: {
    width: "100%",
    maxWidth: 500,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 15,
  },
  card: {
    flex: 1,
    minHeight: 90,
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardFull: {
    width: "100%",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#CE9DBB",
    marginBottom: 6,
  },
  cardData: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
  },
  section: {
    width: "100%",
    maxWidth: 500,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9E7B92",
    marginBottom: 12,
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
  appointmentRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
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
  finishButton: {
    backgroundColor: "#CE9DBB",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
  },
  finishText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
});