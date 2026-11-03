import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import HorizontalBarChart from "./HorizontalBarChart";
import DistributionTable from "./DistributionTable";

const INK = "#12303A";

function formatUpdatedAt(date) {
  if (!date) return "";
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Uma "página" do dashboard, na ordem:
 * título -> período -> cartão de total -> gráfico -> botão Ver Tabela -> status.
 *
 * @param {{
 *   title: string,
 *   headerColor: string,
 *   barColor: string,
 *   buttonColor: string,
 *   periodLabel: string,
 *   totalText: string,
 *   data: { label: string, value: number }[],
 *   labelTitle: string,
 *   valueTitle: string,
 *   integer?: boolean,
 *   formatValue?: (n: number) => string,
 *   formatTick?: (n: number) => string,
 *   loading?: boolean,
 *   error?: unknown,
 *   updatedAt?: Date | null,
 * }} props
 */
export default function MetricPage({
  title,
  headerColor,
  barColor,
  buttonColor,
  periodLabel,
  totalText,
  data,
  labelTitle,
  valueTitle,
  integer = false,
  formatValue,
  formatTick,
  loading = false,
  error = null,
  updatedAt = null,
}) {
  const [showTable, setShowTable] = useState(false);
  const hasData = data.length > 0;

  let status = "";
  let statusIsError = false;
  if (loading) {
    status = "Atualizando…";
  } else if (error) {
    status =
      "Não foi possível atualizar. Puxe a tela para baixo para tentar de novo.";
    statusIsError = true;
  } else if (updatedAt) {
    status = `Atualizado às ${formatUpdatedAt(updatedAt)}`;
  }

  return (
    <View style={styles.page}>
      <View style={[styles.header, { backgroundColor: headerColor }]}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.period}>Período: {periodLabel}</Text>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalValue}>{totalText}</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Distribuição no período</Text>
          <Text style={styles.chartSubtitle}>
            Ordem decrescente · Desempate alfabético
          </Text>

          {loading && !hasData ? (
            <ActivityIndicator color={barColor} style={styles.loading} />
          ) : !hasData ? (
            <Text style={styles.empty}>
              Nenhum dado encontrado neste período.
            </Text>
          ) : showTable ? (
            <DistributionTable
              data={data}
              labelTitle={labelTitle}
              valueTitle={valueTitle}
              formatValue={formatValue}
            />
          ) : (
            <HorizontalBarChart
              data={data}
              color={barColor}
              integer={integer}
              formatValue={formatValue}
              formatTick={formatTick}
            />
          )}
        </View>

        {hasData && (
          <TouchableOpacity
            style={[styles.tableButton, { borderColor: buttonColor }]}
            onPress={() => setShowTable((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={showTable ? "Ver gráfico" : "Ver tabela"}
            activeOpacity={0.7}
          >
            <Text style={styles.tableButtonText}>
              {showTable ? "Ver Gráfico" : "Ver Tabela"}
            </Text>
          </TouchableOpacity>
        )}

        {!!status && (
          <Text
            style={[styles.status, statusIsError && styles.statusError]}
            accessibilityLiveRegion="polite"
          >
            {status}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width: "100%",
    maxWidth: 500,
  },
  header: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: INK,
  },
  sheet: {
    marginTop: -18,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderColor: "#E6ECEE",
    padding: 16,
  },
  period: {
    fontSize: 14,
    color: INK,
    marginBottom: 12,
  },
  totalCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E6ECEE",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: "#5C6B71",
  },
  totalValue: {
    fontSize: 26,
    fontWeight: "700",
    color: INK,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: "#F6F8F8",
    borderRadius: 18,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: INK,
  },
  chartSubtitle: {
    fontSize: 12,
    color: "#5C6B71",
    marginTop: 2,
    marginBottom: 16,
  },
  loading: {
    marginVertical: 24,
  },
  empty: {
    fontSize: 14,
    color: "#5C6B71",
    textAlign: "center",
    marginVertical: 24,
  },
  tableButton: {
    minHeight: 48,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  tableButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: INK,
  },
  status: {
    marginTop: 12,
    fontSize: 12,
    color: "#5C6B71",
    textAlign: "center",
  },
  statusError: {
    color: "#B3261E",
  },
});
