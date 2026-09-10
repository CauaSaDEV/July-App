import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
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
  const { user, loading: authLoading, error: authError, refetch: refetchAuth } = useAuth();
  const {
    nextAppointments,
    scheduledCount,
    doneCount,
    canceledCount,
    financeSummary,
    loading: dataLoading,
    error: dataError,
    refetch: refetchData,
  } = useHomeData(user?.role);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAuth(), refetchData()]);
    setRefreshing(false);
  }, [refetchAuth, refetchData]);

  const loading = authLoading || (dataLoading && !refreshing);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#CE9DBB" />
      </View>
    );
  }

  if (authError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Não foi possível carregar seus dados. Faça login novamente.</Text>
      </View>
    );
  }

  const firstName = user?.name?.split(" ")[0] ?? "";
  const isManager = user?.role === "MANAGER";

  return (
    <ScrollView
      style={{ backgroundColor: "#ffffff" }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#CE9DBB" />}
    >
      <View style={styles.welcomeBox}>
        <Text style={styles.title}>Olá, {firstName}💅🏻!</Text>
        <Text style={styles.subtitle}>Aqui vc pode acompanhar suas atividades e mensagens.</Text>
        {user?.role && <Text style={styles.roleTag}>{ROLE_LABELS[user.role] ?? user.role}</Text>}
      </View>

      {dataError && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>Não foi possível carregar todos os dados agora.</Text>
        </View>
      )}

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

      {canceledCount > 0 && (
        <View style={styles.cardContainer}>
          <View style={[styles.card, styles.cardFull]}>
            <Text style={styles.cardTitle}>Cancelados hoje</Text>
            <Text style={styles.cardData}>{canceledCount}</Text>
          </View>
        </View>
      )}

      {isManager && financeSummary && (
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recebido no mês</Text>
            <Text style={styles.cardData}>{formatCurrency(financeSummary.totalReceived)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Pendente</Text>
            <Text style={styles.cardData}>{formatCurrency(financeSummary.totalPending)}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos agendamentos</Text>

        {nextAppointments.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum agendamento pendente para hoje.</Text>
        ) : (
          nextAppointments.map((appt) => (
            <View key={appt.id} style={styles.appointmentRow}>
              <View style={styles.appointmentTimeBox}>
                <Text style={styles.appointmentTime}>{formatTime(appt.startAt)}</Text>
              </View>
              <View style={styles.appointmentInfo}>
                <Text style={styles.appointmentClient}>{appt.clientName}</Text>
                <Text style={styles.appointmentDetail}>
                  {appt.serviceName ?? "Serviço não informado"}
                  {isManager && appt.staffName ? ` · ${appt.staffName}` : ""}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#9E7B92",
    fontSize: 14,
    textAlign: "center",
  },
  warningBox: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFF4E5",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  warningText: {
    color: "#8A6D3B",
    fontSize: 13,
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#CE9DBB",
    marginBottom: 5,
  },
  cardData: {
    fontSize: 14,
    color: "#666",
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
