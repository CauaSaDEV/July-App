import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEK = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const COLORS = {
  primary: "#D1779F",
  soft: "#FAF0F5",
  text: "#4A3A44",
  muted: "#B8A3B0",
  border: "#F3E6EE",
  grid: "#DDD",
};

const pad = (n) => String(n).padStart(2, "0");
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parse(dateKey) {
  return {
    year: Number(dateKey.slice(0, 4)),
    month: Number(dateKey.slice(5, 7)) - 1,
  };
}

export default function AgendaCalendar({
  selectedDate,
  onSelectDate,
  onMonthChange,
  markedDates = {},
}) {
  const [view, setView] = useState(parse(selectedDate));

  // Acompanha a data selecionada se ela mudar para outro mês
  useEffect(() => {
    const p = parse(selectedDate);
    setView((v) => (v.year === p.year && v.month === p.month ? v : p));
  }, [selectedDate]);

  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  function changeMonth(offset) {
    const d = new Date(view.year, view.month + offset, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    onMonthChange?.(d);
  }

  function goToday() {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
    onMonthChange?.(d);
    onSelectDate(todayKey);
  }

  // Monta a grade do mês
  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <View style={styles.card}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrow}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.titleBox}>
          <Text style={styles.month}>{MONTHS[view.month]}</Text>
          <Text style={styles.year}>{view.year}</Text>
        </View>

        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
        <Text style={styles.todayBtnText}>Hoje</Text>
      </TouchableOpacity>

      {/* Dias da semana */}
      <View style={styles.weekRow}>
        {WEEK.map((w) => (
          <Text key={w} style={styles.weekText}>{w}</Text>
        ))}
      </View>

      {/* Grade */}
      <View style={styles.grid}>
        {rows.map((row, r) => (
          <View key={r} style={styles.gridRow}>
            {row.map((day, c) => {
              const cellBorders = [
                styles.cell,
                c < 6 && styles.cellBorderRight,
                r < rows.length - 1 && styles.cellBorderBottom,
              ];

              if (!day) return <View key={c} style={cellBorders} />;

              const key = toKey(view.year, view.month, day);
              const isSelected = key === selectedDate;
              const isToday = key === todayKey;
              const info = markedDates[key];

              const dots =
                info?.dots ??
                (info?.marked
                  ? [{ color: info.dotColor ?? COLORS.primary }]
                  : []);

              return (
                <TouchableOpacity
                  key={c}
                  style={[cellBorders, isSelected && styles.selectedCell]}
                  onPress={() => onSelectDate(key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && { color: COLORS.primary, fontWeight: "700" },
                      isSelected && { fontWeight: "700" },
                    ]}
                  >
                    {day}
                  </Text>

                  <View style={styles.dotsRow}>
                    {dots.slice(0, 3).map((d, i) => (
                      <View
                        key={i}
                        style={[styles.dot, { backgroundColor: d.color }]}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBox: { alignItems: "center" },
  month: { fontSize: 18, fontWeight: "700", color: COLORS.text },
  year: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  todayBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 0,
    backgroundColor: "#E0E0E0",
  },
  todayBtnText: { fontSize: 12, fontWeight: "600", color: "#000" },
  weekRow: { flexDirection: "row" },
  weekText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.muted,
    marginTop: 12,
    marginBottom: 4,
  },

  // Grade com linhas
  grid: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.grid,
  },
  gridRow: { flexDirection: "row" },
  cell: {
    width: `${100 / 7}%`,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  cellBorderRight: { borderRightWidth: 1, borderRightColor: COLORS.grid },
  cellBorderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.grid },
  selectedCell: { backgroundColor: COLORS.soft },

  dayText: { fontSize: 15, fontWeight: "500", color: COLORS.text },
  dotsRow: { flexDirection: "row", gap: 2, height: 5, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 1 },
});