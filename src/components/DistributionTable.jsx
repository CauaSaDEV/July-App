import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * Versão em tabela do gráfico ("Ver Tabela").
 *
 * @param {{
 *   data: { label: string, value: number }[],
 *   labelTitle: string,
 *   valueTitle: string,
 *   formatValue?: (n: number) => string,
 * }} props
 */
export default function DistributionTable({
  data,
  labelTitle,
  valueTitle,
  formatValue = String,
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <View accessibilityRole="list">
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.labelCell, styles.headerText]}>
          {labelTitle}
        </Text>
        <Text style={[styles.cell, styles.valueCell, styles.headerText]}>
          {valueTitle}
        </Text>
        <Text style={[styles.cell, styles.shareCell, styles.headerText]}>
          %
        </Text>
      </View>

      {data.map((item, index) => {
        const share = total > 0 ? Math.round((item.value / total) * 100) : 0;

        return (
          <View key={`${item.label}-${index}`} style={styles.row}>
            <Text style={[styles.cell, styles.labelCell]}>{item.label}</Text>
            <Text style={[styles.cell, styles.valueCell, styles.bold]}>
              {formatValue(item.value)}
            </Text>
            <Text style={[styles.cell, styles.shareCell]}>{share}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E6ECEE",
  },
  headerRow: {
    paddingTop: 0,
    borderBottomColor: "#C9D3D6",
  },
  cell: {
    fontSize: 14,
    color: "#1F2D33",
  },
  labelCell: {
    flex: 1,
    marginRight: 8,
  },
  valueCell: {
    minWidth: 96,
    textAlign: "right",
  },
  shareCell: {
    width: 44,
    textAlign: "right",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5C6B71",
  },
  bold: {
    fontWeight: "700",
  },
});
