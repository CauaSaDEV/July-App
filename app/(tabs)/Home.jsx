import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useState, useCallback } from "react";
import { useAuth } from "../../src/hooks/useAuth";
import { useHomeData } from "../../src/hooks/useHomeData";
import { formatCurrency, formatTime } from "../../src/utils/date";

const { width } = Dimensions.get("window");

const ROLE_LABELS = {
  MANAGER: "Gerente",
  STAFF: "Funcionário(a)",
};

export default function Home() {
  const { user, refetch: refetchAuth } = useAuth();
  const {
    nextAppointments = [],
    scheduledCount = 0,
    doneCount = 0,
    canceledCount = 0,
    financeSummary,
    loading: dataLoading,
    error: dataError,
    refetch: refetchData,
  } = useHomeData(user?.role);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAuth?.(), refetchData?.()]);
    setRefreshing(false);
  }, [refetchAuth, refetchData]);

  const firstName = user?.name?.split(" ")[0] ?? "Usuário";

  // Garante valores financeiros numéricos (R$ 0,00 se nulo)
  const totalReceived = financeSummary?.totalReceived ?? 0;
  const totalPending = financeSummary?.totalPending ?? 0;

  return (
    <ScrollView
      style={{ backgroundColor: "#ffffff" }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CE9DBB" />}
    >
      {/* BOAS-VINDAS */}
      <View style={styles.welcomeBox}>
        <Text style={styles.title}>Olá, {firstName}💅🏻</Text>
        {user?.role && <Text style={styles.roleTag}>{ROLE_LABELS[user.role] ?? user.role}</Text>}
      </View>

      {/* CARD 1: AGENDAMENTOS */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agendados hoje</Text>
          <Text style={styles.cardData}>{scheduledCount} pendente{scheduledCount === 1 ? "" : "s"}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Concluídos hoje</Text>
          <Text style={styles.cardData}>{doneCount} finalizado{doneCount === 1 ? "" : "s"}</Text>
        </View>
      </View>

 {/* CARD 2: FINANCEIRO (APENAS GERENTES E STAFFS VISUALIZAM) */}
{(user?.role === "MANAGER" || user?.role === "STAFF") && (
  <View style={styles.cardContainer}>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recebido no mês</Text>
      <Text style={styles.cardData}>{formatCurrency(totalReceived)}</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Pendente</Text>
      <Text style={styles.cardData}>{formatCurrency(totalPending)}</Text>
    </View>
  </View>
)}
      {/* CARD DE CANCELADOS (SE HOUVER) */}
      {canceledCount > 0 && (
        <View style={styles.cardContainer}>
          <View style={[styles.card, styles.cardFull]}>
            <Text style={styles.cardTitle}>Cancelados hoje</Text>
            <Text style={styles.cardData}>{canceledCount}</Text>
          </View>
        </View>
      )}

      {/* SEÇÃO: PRÓXIMOS AGENDAMENTOS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos agendamentos</Text>

        {dataLoading ? (
          <ActivityIndicator size="small" color="#CE9DBB" style={{ marginTop: 10 }} />
        ) : nextAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum agendamento pendente para hoje.</Text>
          </View>
        ) : (
          nextAppointments.map((appt, index) => (
            <View key={appt.id ?? index} style={styles.appointmentRow}>
              <View style={styles.appointmentTimeBox}>
                <Text style={styles.appointmentTime}>{formatTime(appt.startAt)}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentClient}>{appt.clientName ?? "Cliente"}</Text>
                <Text style={styles.appointmentDetail}>
                  {appt.serviceName ?? "Serviço não informado"}
                  {appt.staffName ? ` · ${appt.staffName}` : ""}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
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
  subtitle: {
    fontSize: 14,
    color: "#ffffff",
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
    backgroundColor: "#f9f9f9",
    padding: 20,
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
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#CE9DBB",
    marginBottom: 5,
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
});