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
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  getFinanceRecords,
  getFinanceSummary,
} from "../../src/services/finance";
import {
  getExpensesSummary,
  getExpenseEntries,
  createExpenseEntry,
  cancelExpenseEntry,
  getExpenseCategories,
  createExpenseCategory,
} from "../../src/services/expenses";

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
  red: "#D9534F",
};

const METODOS = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CREDIT_CARD: "Crédito",
  DEBIT_CARD: "Débito",
  TRANSFER: "Transferência",
  OTHER: "Outro",
};

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n${msg}`);
  else Alert.alert(title, msg);
}

function confirmar(title, msg, onYes) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${msg}`)) onYes();
    return;
  }
  Alert.alert(title, msg, [
    { text: "Não", style: "cancel" },
    { text: "Sim", style: "destructive", onPress: onYes },
  ]);
}

function fmtData(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function parseValor(texto) {
  const n = Number(String(texto).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function Financeiro() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pendingRecords, setPendingRecords] = useState([]);
  const [paidRecords, setPaidRecords] = useState([]);
  const [summary, setSummary] = useState(null);

  // Despesas
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [expenseEntries, setExpenseEntries] = useState([]);

  const [showValues, setShowValues] = useState(true);

  // Modal nova despesa
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    categoryId: null,
    paymentMethod: "PIX",
    newCategory: "",
  });

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

      const [
        pendingResponse,
        paidResponse,
        summaryResponse,
        expSummaryResponse,
        expEntriesResponse,
      ] = await Promise.all([
        getFinanceRecords({ status: "PENDING" }),
        getFinanceRecords({
          status: "PAID",
          receivedStart: start,
          receivedEnd: end,
        }),
        getFinanceSummary(start, end),
        getExpensesSummary(start, end),
        getExpenseEntries({ start, end }),
      ]);

      setPendingRecords(
        Array.isArray(pendingResponse)
          ? pendingResponse.filter((r) => r?.paymentStatus === "PENDING")
          : []
      );
      setPaidRecords(
        Array.isArray(paidResponse)
          ? paidResponse.filter((r) => r?.paymentStatus === "PAID")
          : []
      );
      setSummary(summaryResponse || null);
      setExpenseSummary(expSummaryResponse || null);
      setExpenseEntries(
        Array.isArray(expEntriesResponse) ? expEntriesResponse : []
      );
    } catch (error) {
      console.log(
        "[Financeiro] Erro ao carregar financeiro:",
        error?.response?.data || error
      );
      setPendingRecords([]);
      setPaidRecords([]);
      setSummary(null);
      setExpenseSummary(null);
      setExpenseEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFinance();
    }, [loadFinance])
  );

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

  const totalReceived = Number(summary?.totalReceived ?? 0);
  const totalPending = Number(summary?.totalPending ?? 0);
  const totalExpenses = Number(expenseSummary?.total ?? 0);

  // Saldo real: o que entrou menos o que saiu
  const balance = totalReceived - totalExpenses;
  // Saldo previsto: considera também o que ainda vai entrar
  const forecast = totalReceived + totalPending - totalExpenses;

  /*
   * =========================================================
   * GRÁFICOS (inalterados)
   * =========================================================
   */

  const serviceChart = useMemo(() => {
    const grouped = {};
    paidRecords.forEach((record) => {
      const name =
        record.serviceName || record.service?.name || "Serviço não informado";
      grouped[name] = (grouped[name] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [paidRecords]);

  const maxServiceCount =
    serviceChart.length > 0 ? Math.max(...serviceChart.map((i) => i.count)) : 0;

  const servicesByStaff = useMemo(() => {
    const grouped = {};
    paidRecords.forEach((record) => {
      const name = record.staffName || record.staff?.name || "Sem funcionário";
      grouped[name] = (grouped[name] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [paidRecords]);

  const maxServicesByStaff =
    servicesByStaff.length > 0
      ? Math.max(...servicesByStaff.map((i) => i.count))
      : 0;

  const staffChart = useMemo(() => {
    const grouped = {};
    paidRecords.forEach((record) => {
      const name = record.staffName || record.staff?.name || "Sem funcionário";
      const amount =
        record.finalAmount != null
          ? Number(record.finalAmount)
          : Number(record.amount ?? 0) - Number(record.discount ?? 0);
      grouped[name] = (grouped[name] || 0) + amount;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [paidRecords]);

  const maxStaffValue =
    staffChart.length > 0 ? Math.max(...staffChart.map((i) => i.value)) : 0;

  const totalServices = paidRecords.length;

  // Despesas por categoria
  const expenseByCategory = expenseSummary?.byCategory ?? [];
  const maxExpenseCategory =
    expenseByCategory.length > 0
      ? Math.max(...expenseByCategory.map((c) => Number(c.total ?? 0)))
      : 0;

  function displayValue(value) {
    return showValues ? formatCurrency(value) : "••••••";
  }

  /*
   * =========================================================
   * DESPESAS: AÇÕES
   * =========================================================
   */

  async function openExpenseModal() {
    setForm({
      title: "",
      amount: "",
      categoryId: null,
      paymentMethod: "PIX",
      newCategory: "",
    });
    setModalVisible(true);
    try {
      const cats = await getExpenseCategories({ active: true });
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      setCategories([]);
    }
  }

  async function addCategory() {
    const name = form.newCategory.trim();
    if (!name) return;
    try {
      const created = await createExpenseCategory({ name });
      setCategories((prev) => [...prev, created]);
      setForm((f) => ({ ...f, categoryId: created.id, newCategory: "" }));
    } catch (e) {
      // erro HTTP tratado pelo interceptor
    }
  }

  async function saveExpense() {
    const amount = parseValor(form.amount);
    if (!form.title.trim()) return notify("Atenção", "Informe a descrição.");
    if (!Number.isFinite(amount) || amount <= 0)
      return notify("Atenção", "Informe um valor válido.");
    if (!form.categoryId) return notify("Atenção", "Escolha uma categoria.");

    const now = new Date();
    setSaving(true);
    try {
      await createExpenseEntry({
        categoryId: form.categoryId,
        title: form.title.trim(),
        amount,
        discount: 0,
        paymentMethod: form.paymentMethod,
        paymentStatus: "PAID",
        occurredAt: now.toISOString(),
        competenceMonth: now.getMonth() + 1,
        competenceYear: now.getFullYear(),
      });
      setModalVisible(false);
      loadFinance();
    } catch (e) {
      // erro HTTP tratado pelo interceptor
    } finally {
      setSaving(false);
    }
  }

  function cancelExpense(item) {
    confirmar("Cancelar despesa", `Cancelar "${item.title}"?`, async () => {
      try {
        await cancelExpenseEntry(item.id);
        loadFinance();
      } catch (e) {}
    });
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
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
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Financeiro</Text>
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowValues((prev) => !prev)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={showValues ? "eye-outline" : "eye-off-outline"}
                size={23}
                color={COLORS.dark}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Visão geral de recebimentos e despesas do mês
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
            {/* RECEBIDO / PENDENTE */}
            <View style={styles.cardsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Total recebido</Text>
                <Text style={styles.receivedValue}>
                  {displayValue(totalReceived)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Total pendente</Text>
                <Text style={styles.pendingValue}>
                  {displayValue(totalPending)}
                </Text>
              </View>
            </View>

            {/* DESPESAS / SALDO */}
            <View style={styles.cardsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Despesas</Text>
                <Text style={styles.expenseValue}>
                  {displayValue(totalExpenses)}
                </Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricTitle}>Saldo (recebido − despesas)</Text>
                <Text
                  style={[
                    styles.receivedValue,
                    { color: balance >= 0 ? COLORS.green : COLORS.red },
                  ]}
                >
                  {displayValue(balance)}
                </Text>
              </View>
            </View>

            {/* RESUMO GERAL COM TODOS OS VALORES */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumo geral do mês</Text>

              <SummaryRow
                label="Recebido"
                value={displayValue(totalReceived)}
                color={COLORS.green}
              />
              <SummaryRow
                label="A receber (pendente)"
                value={displayValue(totalPending)}
                color={COLORS.orange}
              />
              <SummaryRow
                label="Despesas"
                value={`− ${displayValue(totalExpenses)}`}
                color={COLORS.red}
              />

              <View style={styles.divider} />

              <SummaryRow
                label="Saldo atual"
                value={displayValue(balance)}
                color={balance >= 0 ? COLORS.green : COLORS.red}
                bold
              />
              <SummaryRow
                label="Saldo previsto"
                value={displayValue(forecast)}
                color={forecast >= 0 ? COLORS.dark : COLORS.red}
                bold
              />
            </View>

            {/* TOTAL DE SERVIÇOS */}
            <View style={styles.singleMetricCard}>
              <View>
                <Text style={styles.metricTitle}>Serviços realizados</Text>
                <Text style={styles.servicesTotal}>{totalServices}</Text>
              </View>
              <View style={styles.serviceIcon}>
                <Ionicons name="cut-outline" size={26} color={COLORS.primary} />
              </View>
            </View>

            {/* SERVIÇOS POR FUNCIONÁRIO */}
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
                    {servicesByStaff.map((item, index) => (
                      <BarRow
                        key={`${item.name}-${index}`}
                        name={item.name}
                        label={`${item.count} ${
                          item.count === 1 ? "serviço" : "serviços"
                        }`}
                        ratio={
                          maxServicesByStaff > 0
                            ? item.count / maxServicesByStaff
                            : 0
                        }
                        color={COLORS.primary}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* FATURAMENTO POR FUNCIONÁRIO */}
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
                    {staffChart.map((item, index) => (
                      <BarRow
                        key={`${item.name}-${index}`}
                        name={item.name}
                        label={displayValue(item.value)}
                        ratio={maxStaffValue > 0 ? item.value / maxStaffValue : 0}
                        color={COLORS.green}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* SERVIÇOS REALIZADOS */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Serviços realizados</Text>
              <Text style={styles.sectionSubtitle}>
                Quantidade de cada serviço realizado
              </Text>

              {serviceChart.length === 0 ? (
                <EmptyChart />
              ) : (
                <View style={styles.chartCard}>
                  <View style={styles.chartInner}>
                    {serviceChart.map((item, index) => (
                      <BarRow
                        key={`${item.name}-${index}`}
                        name={item.name}
                        label={String(item.count)}
                        ratio={
                          maxServiceCount > 0 ? item.count / maxServiceCount : 0
                        }
                        color={COLORS.blue}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* ================================================= */}
            {/* DESPESAS */}
            {/* ================================================= */}

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Despesas</Text>
                  <Text style={styles.sectionSubtitle}>
                    Gastos lançados neste mês
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={openExpenseModal}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addButtonText}>Nova</Text>
                </TouchableOpacity>
              </View>

              {/* Por categoria */}
              {expenseByCategory.length > 0 && (
                <View style={[styles.chartCard, { marginBottom: 12 }]}>
                  <View style={styles.chartInner}>
                    {expenseByCategory.map((c, index) => (
                      <BarRow
                        key={`${c.categoryId}-${index}`}
                        name={c.categoryName}
                        label={displayValue(c.total)}
                        ratio={
                          maxExpenseCategory > 0
                            ? Number(c.total ?? 0) / maxExpenseCategory
                            : 0
                        }
                        color={COLORS.red}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Lista de lançamentos */}
              {expenseEntries.length === 0 ? (
                <EmptyChart />
              ) : (
                expenseEntries.map((d) => {
                  const canceled = d.paymentStatus === "CANCELED";
                  return (
                    <View
                      key={d.id}
                      style={[styles.expenseItem, canceled && { opacity: 0.5 }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.expenseTitle} numberOfLines={1}>
                          {d.title}
                        </Text>
                        <Text style={styles.expenseSub}>
                          {d.categoryName ? `${d.categoryName} · ` : ""}
                          {fmtData(d.occurredAt)}
                          {d.paymentMethod
                            ? ` · ${METODOS[d.paymentMethod] ?? d.paymentMethod}`
                            : ""}
                        </Text>
                        {canceled && (
                          <Text style={styles.canceledTag}>Cancelada</Text>
                        )}
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.expenseAmount}>
                          {displayValue(d.total ?? d.amount)}
                        </Text>
                        {!canceled && (
                          <TouchableOpacity
                            onPress={() => cancelExpense(d)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.cancelLink}>Cancelar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* PAGAMENTOS PENDENTES */}
            <View style={styles.section}>
              <PendingPaymentsSection
                refreshSignal={refreshing ? 1 : 0}
                onChanged={loadFinance}
              />
            </View>

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>

      {/* ================================================= */}
      {/* MODAL NOVA DESPESA */}
      {/* ================================================= */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova despesa</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.dark} />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Conta de energia"
                value={form.title}
                onChangeText={(t) => setForm((f) => ({ ...f, title: t }))}
                placeholderTextColor={"#333"}

              />

              <Text style={styles.label}>Valor (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                keyboardType="decimal-pad"
                value={form.amount}
                onChangeText={(t) => setForm((f) => ({ ...f, amount: t }))}
                placeholderTextColor={"#333"}
              />

              <Text style={styles.label}>Categoria</Text>
              <View style={styles.chipsWrap}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.chip,
                      form.categoryId === c.id && styles.chipActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, categoryId: c.id }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.categoryId === c.id && styles.chipTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                {categories.length === 0 && (
                  <Text style={styles.hint}>
                    Nenhuma categoria ainda. Crie uma abaixo.
                  </Text>
                )}
              </View>

              <View style={styles.newCatRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Nova categoria"
                  value={form.newCategory}
                  onChangeText={(t) => setForm((f) => ({ ...f, newCategory: t }))}
                  placeholderTextColor={"#333"}

                />
                <TouchableOpacity style={styles.newCatBtn} onPress={addCategory}>
                  <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>
                Forma de pagamento
              </Text>
              <View style={styles.chipsWrap}>
                {Object.entries(METODOS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.chip,
                      form.paymentMethod === key && styles.chipActive,
                    ]}
                    onPress={() => setForm((f) => ({ ...f, paymentMethod: key }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        form.paymentMethod === key && styles.chipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={saveExpense}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Salvar despesa</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}


function BarRow({ name, label, ratio, color }) {
  return (
    <View style={styles.barItem}>
      <View style={styles.barHeader}>
        <Text style={styles.staffName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.countValue}>{label}</Text>
      </View>
      <View style={styles.barBackground}>
        <View
          style={[
            styles.bar,
            {
              width: `${Math.max(ratio * 100, 3)}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
}

function SummaryRow({ label, value, color, bold }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: "bold" }]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

function EmptyChart() {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name="bar-chart-outline" size={28} color="#CCC" />
      <Text style={styles.emptyText}>Nenhum dado encontrado.</Text>
    </View>
  );
}



const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },

  container: {
    width: "100%",
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
    paddingBottom: 150,
    alignItems: "center",
  },

  header: { width: "100%", maxWidth: 500, marginBottom: 20 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.dark },
  eyeButton: {
    marginLeft: 10,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: { fontSize: 13, color: COLORS.secondary, marginTop: 4 },
  loading: { marginTop: 40 },

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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  metricTitle: { fontSize: 13, fontWeight: "600", color: COLORS.secondary },
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
  expenseValue: {
    fontSize: 21,
    fontWeight: "bold",
    color: COLORS.red,
    marginTop: 12,
  },

  summaryCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  summaryLabel: { fontSize: 14, color: COLORS.text },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#E8E8E8", marginVertical: 8 },

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
    shadowOffset: { width: 0, height: 1 },
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

  section: { width: "100%", maxWidth: 500, marginTop: 8, marginBottom: 20 },
  sectionHeaderRow: { flexDirection: "row", alignItems: "flex-start" },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: COLORS.dark },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 3,
    marginBottom: 12,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D1779F",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 4 },

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
  chartInner: { width: "92%", maxWidth: 450, alignSelf: "center" },
  barItem: { width: "100%", marginBottom: 18 },
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
  countValue: { fontSize: 13, fontWeight: "bold", color: COLORS.dark },
  barBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#F0E6EC",
    borderRadius: 10,
    overflow: "hidden",
  },
  bar: { height: "100%", borderRadius: 10 },

  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  expenseTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  expenseSub: { fontSize: 12, color: COLORS.secondary, marginTop: 2 },
  expenseAmount: { fontSize: 15, fontWeight: "bold", color: COLORS.red },
  cancelLink: {
    fontSize: 12,
    color: COLORS.secondary,
    marginTop: 6,
    textDecorationLine: "underline",
  },
  canceledTag: { fontSize: 11, color: COLORS.secondary, marginTop: 2 },

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
  emptyText: { fontSize: 14, color: "#999", marginTop: 8 },

  bottomSpacer: { height: 40 },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalBox: {
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.dark },
  label: {
    fontSize: 13,
    color: COLORS.primary,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: "#333",
    marginBottom: 12,
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#D1779F", borderColor: "#D1779F" },
  chipText: { fontSize: 13, color: COLORS.text },
  chipTextActive: { color: "#fff", fontWeight: "bold" },
  hint: { fontSize: 12, color: COLORS.secondary },
  newCatRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  newCatBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    backgroundColor: "#D1779F",
    padding: 14,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});