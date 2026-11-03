import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { getNiceScale } from "../utils/chartData";

const AXIS_LABEL_WIDTH = 64;

/**
 * Gráfico de barras horizontais.
 * - rótulo acima da barra (sem truncar) e valor alinhado à direita
 * - cor única na série
 * - eixo iniciando em zero, com linha de base e marcas de escala
 *
 * @param {{
 *   data: { label: string, value: number }[],
 *   color: string,
 *   integer?: boolean,
 *   formatValue?: (n: number) => string,
 *   formatTick?: (n: number) => string,
 * }} props
 */
export default function HorizontalBarChart({
  data,
  color,
  integer = false,
  formatValue = String,
  formatTick = String,
}) {
  const maxValue = useMemo(
    () => data.reduce((max, item) => Math.max(max, item.value), 0),
    [data],
  );

  const { max: top, ticks } = useMemo(
    () => getNiceScale(maxValue, { integer }),
    [maxValue, integer],
  );

  const summary = data
    .map((item) => `${item.label}: ${formatValue(item.value)}`)
    .join(", ");

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Gráfico de barras. ${summary}`}
    >
      {data.map((item, index) => {
        // proporcional ao zero; só garante 1,5% para valores > 0 continuarem visíveis
        const pct =
          item.value > 0 ? Math.max((item.value / top) * 100, 1.5) : 0;

        return (
          <View key={`${item.label}-${index}`} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{formatValue(item.value)}</Text>
            </View>

            <View style={styles.track}>
              {ticks.map((tick, i) => (
                <View
                  key={tick}
                  style={[
                    styles.tick,
                    i === ticks.length - 1
                      ? { right: 0 }
                      : { left: `${(tick / top) * 100}%` },
                  ]}
                />
              ))}

              <View
                style={[
                  styles.bar,
                  { width: `${pct}%`, backgroundColor: color },
                ]}
              />

              {/* linha de base no zero, por cima da barra */}
              <View style={styles.baseLine} />
            </View>
          </View>
        );
      })}

      <View style={styles.axis}>
        {ticks.map((tick, i) => {
          const isFirst = i === 0;
          const isLast = i === ticks.length - 1;

          return (
            <Text
              key={tick}
              style={[
                styles.axisLabel,
                isFirst && { left: 0, textAlign: "left" },
                isLast && { right: 0, textAlign: "right" },
                !isFirst &&
                  !isLast && {
                    left: `${(tick / top) * 100}%`,
                    marginLeft: -AXIS_LABEL_WIDTH / 2,
                  },
              ]}
            >
              {formatTick(tick)}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 14,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: "#1F2D33",
    marginRight: 12,
  },
  value: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2D33",
  },
  track: {
    height: 16,
    justifyContent: "center",
  },
  tick: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#DCE3E5",
  },
  bar: {
    height: 12,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  baseLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 2,
    backgroundColor: "#7C8B91",
  },
  axis: {
    height: 20,
    marginTop: 2,
  },
  axisLabel: {
    position: "absolute",
    top: 4,
    width: AXIS_LABEL_WIDTH,
    fontSize: 11,
    color: "#5C6B71",
    textAlign: "center",
  },
});
