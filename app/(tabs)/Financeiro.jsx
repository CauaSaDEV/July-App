import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  getFinanceRecords,
  getFinanceSummary,
} from "../../src/services/finance";

import PendingPaymentsSection from "../../src/components/PendingPaymentSection";
import { formatCurrency } from "../../src/utils/date";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#CE9DBB",
  dark: "#9E7B92",
  background: "#FFFFFF",
  card: "#F9F9F9",
  text: "#333333",
  secondary: "#888888",
  green: "#4CAF50",
  orange: "#E67E22",
  blue: "#6C8EBF",
  purple: "#9B7EBD",
};

export default function Financeiro() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pendingRecords, setPendingRecords] = useState([]);
  const [paidRecords, setPaidRecords] = useState([]);

  const [summary, setSummary] = useState(null);

  // Controla o olhinho
  const [showValues, setShowValues] = useState(true);

  /*
   * =========================================================
   * CARREGAR FINANCEIRO
   * =========================================================
   */

  const loadFinance = useCallback(async () => {
    try {
      setLoading(true);

      const now = new Date();

      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0
      ).toISOString();

      const end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      ).toISOString();

      const [pendingResponse, paidResponse, summaryResponse] =
        await Promise.all([
          /*
           * SOMENTE PENDENTES
           */
          getFinanceRecords({
            status: "PENDING",
          }),

          /*
           * SOMENTE PAGOS
           */
          getFinanceRecords({
            status: "PAID",
            receivedStart: start,
            receivedEnd: end,
          }),

          /*
           * RESUMO DO MÊS
           */
          getFinanceSummary(start, end),
        ]);

      /*
       * Segurança extra.
       *
       * Nunca deixamos registros de outro status
       * entrarem nos gráficos.
       */

      const pending = Array.isArray(pendingResponse)
        ? pendingResponse.filter(
            (record) => record?.paymentStatus === "PENDING"
          )
        : [];

      const paid = Array.isArray(paidResponse)
        ? paidResponse.filter(
            (record) => record?.paymentStatus === "PAID"
          )
        : [];

      setPendingRecords(pending);
      setPaidRecords(paid);
      setSummary(summaryResponse || null);
    } catch (error) {
      console.log(
        "[Financeiro] Erro ao carregar financeiro:",
        error?.response?.data || error
      );

      setPendingRecords([]);
      setPaidRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Atualiza quando entra na tela.
   */

  useFocusEffect(
    useCallback(() => {
      loadFinance();
    }, [loadFinance])
  );

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadFinance();
    } finally {
      setRefreshing(false);
    }
  }

  /*
   * =========================================================
   * TOTAIS
   * =========================================================
   */

  const totalReceived = Number(
    summary?.totalReceived ?? 0
  );

  const totalPending = Number(
    summary?.totalPending ?? 0
  );

  /*
   * =========================================================
   * SERVIÇOS REALIZADOS
   *
   * IMPORTANTE:
   *
   * Este gráfico NÃO depende do filtro de funcionário.
   * Ele sempre mostra o total geral.
   * =========================================================
   */

  const serviceChart = useMemo(() => {
    const grouped = {};

    paidRecords.forEach((record) => {
      const serviceName =
        record.serviceName ||
        record.service?.name ||
        "Serviço não informado";

      if (!grouped[serviceName]) {
        grouped[serviceName] = 0;
      }

      grouped[serviceName] += 1;
    });

    return Object.entries(grouped)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [paidRecords]);

  const maxServiceCount =
    serviceChart.length > 0
      ? Math.max(
          ...serviceChart.map((item) => item.count)
        )
      : 0;

  /*
   * =========================================================
   * SERVIÇOS POR FUNCIONÁRIO
   * =========================================================
   */

  const servicesByStaff = useMemo(() => {
    const grouped = {};

    paidRecords.forEach((record) => {
      const staffName =
        record.staffName ||
        record.staff?.name ||
        "Sem funcionário";

      if (!grouped[staffName]) {
        grouped[staffName] = 0;
      }

      grouped[staffName] += 1;
    });

    return Object.entries(grouped)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [paidRecords]);

  const maxServicesByStaff =
    servicesByStaff.length > 0
      ? Math.max(
          ...servicesByStaff.map((item) => item.count)
        )
      : 0;

  /*
   * =========================================================
   * FATURAMENTO POR FUNCIONÁRIO
   * =========================================================
   */

  const staffChart = useMemo(() => {
    const grouped = {};

    paidRecords.forEach((record) => {
      const staffName =
        record.staffName ||
        record.staff?.name ||
        "Sem funcionário";

      const amount =
        record.finalAmount != null
          ? Number(record.finalAmount)
          : Number(record.amount ?? 0) -
            Number(record.discount ?? 0);

      if (!grouped[staffName]) {
        grouped[staffName] = 0;
      }

      grouped[staffName] += amount;
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [paidRecords]);

  const maxStaffValue =
    staffChart.length > 0
      ? Math.max(
          ...staffChart.map((item) => item.value)
        )
      : 0;

  /*
   * =========================================================
   * TOTAL DE SERVIÇOS
   * =========================================================
   */

  const totalServices = paidRecords.length;

  /*
   * =========================================================
   * VALOR FORMATADO
   * =========================================================
   */

  function displayValue(value) {
    return showValues
      ? formatCurrency(value)
      : "••••••";
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            Financeiro 
          </Text>

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() =>
              setShowValues((prev) => !prev)
            }
            hitSlop={{
              top: 12,
              bottom: 12,
              left: 12,
              right: 12,
            }}
          >
            <Ionicons
              name={
                showValues
                  ? "eye-outline"
                  : "eye-off-outline"
              }
              size={23}
              color={COLORS.dark}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Visão geral dos recebimentos
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
          style={styles.loading}
        />
      ) : (
        <>
          {/* ================================================= */}
          {/* CARDS FINANCEIROS */}
          {/* ================================================= */}

          <View style={styles.cardsRow}>
            {/* TOTAL RECEBIDO */}

            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>
                Total recebido
              </Text>

              <Text style={styles.receivedValue}>
                {displayValue(totalReceived)}
              </Text>
            </View>

            {/* TOTAL PENDENTE */}

            <View style={styles.metricCard}>
              <Text style={styles.metricTitle}>
                Total pendente
              </Text>

              <Text style={styles.pendingValue}>
                {displayValue(totalPending)}
              </Text>
            </View>
          </View>

          {/* ================================================= */}
          {/* TOTAL DE SERVIÇOS */}
          {/* ================================================= */}

          <View style={styles.singleMetricCard}>
            <View>
              <Text style={styles.metricTitle}>
                Serviços realizados
              </Text>

              <Text style={styles.servicesTotal}>
                {totalServices}
              </Text>
            </View>

            <View style={styles.serviceIcon}>
              <Ionicons
                name="cut-outline"
                size={26}
                color={COLORS.primary}
              />
            </View>
          </View>

          {/* ================================================= */}
          {/* SERVIÇOS POR FUNCIONÁRIO */}
          {/* ================================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Serviços realizados por funcionário
            </Text>

            <Text style={styles.sectionSubtitle}>
              Quantidade de atendimentos concluídos
            </Text>

            {servicesByStaff.length === 0 ? (
              <EmptyChart />
            ) : (
              <View style={styles.chartCard}>
                <View style={styles.chartInner}>
                  {servicesByStaff.map(
                    (item, index) => {
                      const percentage =
                        maxServicesByStaff > 0
                          ? item.count /
                            maxServicesByStaff
                          : 0;

                      return (
                        <View
                          key={`${item.name}-${index}`}
                          style={styles.barItem}
                        >
                          <View style={styles.barHeader}>
                            <Text
                              style={styles.staffName}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>

                            <Text
                              style={styles.countValue}
                            >
                              {item.count}{" "}
                              {item.count === 1
                                ? "serviço"
                                : "serviços"}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.barBackground
                            }
                          >
                            <View
                              style={[
                                styles.bar,
                                {
                                  width: `${Math.max(
                                    percentage * 100,
                                    3
                                  )}%`,
                                  backgroundColor:
                                    COLORS.primary,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    }
                  )}
                </View>
              </View>
            )}
          </View>

          {/* ================================================= */}
          {/* FATURAMENTO POR FUNCIONÁRIO */}
          {/* ================================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Faturamento por funcionário
            </Text>

            <Text style={styles.sectionSubtitle}>
              Valor recebido por profissional
            </Text>

            {staffChart.length === 0 ? (
              <EmptyChart />
            ) : (
              <View style={styles.chartCard}>
                <View style={styles.chartInner}>
                  {staffChart.map(
                    (item, index) => {
                      const percentage =
                        maxStaffValue > 0
                          ? item.value /
                            maxStaffValue
                          : 0;

                      return (
                        <View
                          key={`${item.name}-${index}`}
                          style={styles.barItem}
                        >
                          <View style={styles.barHeader}>
                            <Text
                              style={styles.staffName}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>

                            <Text
                              style={styles.staffValue}
                            >
                              {displayValue(item.value)}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.barBackground
                            }
                          >
                            <View
                              style={[
                                styles.bar,
                                {
                                  width: `${Math.max(
                                    percentage * 100,
                                    3
                                  )}%`,
                                  backgroundColor:
                                    COLORS.green,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    }
                  )}
                </View>
              </View>
            )}
          </View>

          {/* ================================================= */}
          {/* SERVIÇOS REALIZADOS */}
          {/* ================================================= */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Serviços realizados
            </Text>

            <Text style={styles.sectionSubtitle}>
              Quantidade de cada serviço realizado
            </Text>

            {serviceChart.length === 0 ? (
              <EmptyChart />
            ) : (
              <View style={styles.chartCard}>
                <View style={styles.chartInner}>
                  {serviceChart.map(
                    (item, index) => {
                      const percentage =
                        maxServiceCount > 0
                          ? item.count /
                            maxServiceCount
                          : 0;

                      return (
                        <View
                          key={`${item.name}-${index}`}
                          style={styles.barItem}
                        >
                          <View style={styles.barHeader}>
                            <Text
                              style={styles.staffName}
                              numberOfLines={1}
                            >
                              {item.name}
                            </Text>

                            <Text
                              style={styles.countValue}
                            >
                              {item.count}
                            </Text>
                          </View>

                          <View
                            style={
                              styles.barBackground
                            }
                          >
                            <View
                              style={[
                                styles.bar,
                                {
                                  width: `${Math.max(
                                    percentage * 100,
                                    3
                                  )}%`,
                                  backgroundColor:
                                    COLORS.blue,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    }
                  )}
                </View>
              </View>
            )}
          </View>

          {/* ================================================= */}
          {/* PAGAMENTOS PENDENTES */}
          {/* ================================================= */}

          <View style={styles.section}>
            <PendingPaymentsSection
              refreshSignal={refreshing ? 1 : 0}
              onChanged={loadFinance}
            />
          </View>

          {/* ================================================= */}
          {/* ESPAÇO DA NAVBAR */}
          {/* ================================================= */}

          <View style={styles.bottomSpacer} />
        </>
      )}
    </ScrollView>
  );
}

/*
 * ===========================================================
 * ESTADO VAZIO DOS GRÁFICOS
 * ===========================================================
 */

function EmptyChart() {
  return (
    <View style={styles.emptyCard}>
      <Ionicons
        name="bar-chart-outline"
        size={28}
        color="#CCC"
      />

      <Text style={styles.emptyText}>
        Nenhum dado encontrado.
      </Text>
    </View>
  );
}

/*
 * ===========================================================
 * ESTILOS
 * ===========================================================
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    width: "100%",
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
    paddingBottom: 150,
    alignItems: "center",
  },

  /*
   * HEADER
   */

  header: {
    width: "100%",
    maxWidth: 500,
    marginBottom: 20,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.dark,
  },

  eyeButton: {
    marginLeft: 10,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  subtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 4,
  },

  loading: {
    marginTop: 40,
  },

  /*
   * CARDS
   */

  cardsRow: {
    width: "100%",
    maxWidth: 500,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  metricCard: {
    flex: 1,
    minHeight: 105,

    backgroundColor: COLORS.card,

    borderRadius: 15,

    padding: 16,

    borderWidth: 1,
    borderColor: "#EEEEEE",

    elevation: 2,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  metricTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.secondary,
  },

  receivedValue: {
    fontSize: 21,
    fontWeight: "bold",
    color: COLORS.green,
    marginTop: 12,
  },

  pendingValue: {
    fontSize: 21,
    fontWeight: "bold",
    color: COLORS.orange,
    marginTop: 12,
  },

  singleMetricCard: {
    width: "100%",
    maxWidth: 500,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: COLORS.card,

    borderRadius: 15,

    padding: 16,

    marginBottom: 20,

    borderWidth: 1,
    borderColor: "#EEEEEE",

    elevation: 2,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },

  servicesTotal: {
    fontSize: 25,
    fontWeight: "bold",
    color: COLORS.dark,
    marginTop: 8,
  },

  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,

    backgroundColor: "#F4E4EE",

    alignItems: "center",
    justifyContent: "center",
  },

  /*
   * SEÇÕES
   */

  section: {
    width: "100%",
    maxWidth: 500,
    marginTop: 8,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.dark,
  },

  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 3,
    marginBottom: 12,
  },

  /*
   * CARDS DOS GRÁFICOS
   */

  chartCard: {
    width: "100%",

    backgroundColor: COLORS.card,

    borderRadius: 15,

    paddingVertical: 20,
    paddingHorizontal: 16,

    borderWidth: 1,
    borderColor: "#EEEEEE",

    alignItems: "center",
  },

  /*
   * Conteúdo interno centralizado
   */

  chartInner: {
    width: "92%",
    maxWidth: 450,
    alignSelf: "center",
  },

  barItem: {
    width: "100%",
    marginBottom: 18,
  },

  barHeader: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 7,
  },

  staffName: {
    flex: 1,

    fontSize: 13,
    fontWeight: "600",

    color: COLORS.text,

    marginRight: 10,
  },

  staffValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.dark,
  },

  countValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: COLORS.dark,
  },

  barBackground: {
    width: "100%",
    height: 10,

    backgroundColor: "#F0E6EC",

    borderRadius: 10,

    overflow: "hidden",
  },

  bar: {
    height: "100%",
    borderRadius: 10,
  },

  /*
   * VAZIO
   */

  emptyCard: {
    width: "100%",

    backgroundColor: "#FDFDFD",

    padding: 22,

    borderRadius: 12,

    borderWidth: 1,
    borderColor: "#F0F0F0",

    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },

  /*
   * ESPAÇO FINAL
   */

  bottomSpacer: {
    height: 40,
  },
});
