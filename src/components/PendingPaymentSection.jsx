import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { getFinanceRecords, markRecordPaid } from "../services/finance";
import { formatCurrency } from "../utils/date";

const PAYMENT_METHODS = [
  { id: "PIX", label: "Pix" },
  { id: "CASH", label: "Dinheiro" },
  { id: "CREDIT_CARD", label: "Cartão de Crédito" },
  { id: "DEBIT_CARD", label: "Cartão de Débito" },
  { id: "TRANSFER", label: "Transferência" },
  { id: "OTHER", label: "Outro" },
];

function recordAmount(record) {
  if (record?.finalAmount != null) {
    return Number(record.finalAmount) || 0;
  }

  const amount = Number(record?.amount ?? 0);
  const discount = Number(record?.discount ?? 0);

  return Math.max(amount - discount, 0);
}

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Modal para marcar UM pagamento como pago.
 */
function MarkPaidModal({
  visible,
  record,
  onClose,
  onConfirm,
}) {
  const [method, setMethod] = useState("PIX");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setMethod("PIX");
      setSubmitting(false);
    }
  }, [visible, record?.id]);

  if (!record) {
    return null;
  }

  async function handleConfirm() {
    if (!method) {
      Alert.alert(
        "Forma de pagamento",
        "Selecione uma forma de pagamento."
      );
      return;
    }

    try {
      setSubmitting(true);

      await onConfirm(record.id, method);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={submitting ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Marcar como pago
          </Text>

          <Text style={styles.modalSubtitle}>
            {record.clientName
              ? `${record.clientName} · `
              : ""}
            {record.serviceName || "Serviço"}
          </Text>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>
              Valor a receber
            </Text>

            <Text style={styles.amountValue}>
              {formatCurrency(recordAmount(record))}
            </Text>
          </View>

          <Text style={styles.label}>
            Forma de pagamento
          </Text>

          <View style={styles.methodList}>
            {PAYMENT_METHODS.map((item) => {
              const selected = method === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  disabled={submitting}
                  style={[
                    styles.methodOption,
                    selected &&
                      styles.methodOptionSelected,
                  ]}
                  onPress={() =>
                    setMethod(item.id)
                  }
                >
                  <View
                    style={[
                      styles.radio,
                      selected &&
                        styles.radioSelected,
                    ]}
                  >
                    {selected && (
                      <View style={styles.radioDot} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.methodText,
                      selected &&
                        styles.methodTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.modalCancelText}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalConfirm}
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.modalConfirmText}>
                  Confirmar pagamento
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Lista somente pagamentos pendentes.
 */
export default function PendingPaymentsSection({
  refreshSignal = 0,
  onChanged,
}) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      /*
       * O filtro é enviado para o backend.
       */
      const response = await getFinanceRecords({
        status: "PENDING",
      });

      /*
       * Alguns backends podem ignorar o parâmetro
       * status e devolver outros registros.
       *
       * Por isso filtramos NOVAMENTE no frontend.
       *
       * Isso impede que agendamentos PAID,
       * CANCELLED etc. apareçam aqui.
       */
      const data = Array.isArray(response)
        ? response
        : Array.isArray(response?.records)
        ? response.records
        : Array.isArray(response?.data)
        ? response.data
        : [];

      const pendingOnly = data.filter((record) => {
        const status = String(
          record?.paymentStatus ??
            record?.status ??
            ""
        ).toUpperCase();

        return status === "PENDING";
      });

      const sorted = [...pendingOnly].sort(
        (a, b) => {
          const dateA = new Date(
            a?.createdAt ||
              a?.appointmentDate ||
              0
          ).getTime();

          const dateB = new Date(
            b?.createdAt ||
              b?.appointmentDate ||
              0
          ).getTime();

          return dateA - dateB;
        }
      );

      setRecords(sorted);
    } catch (error) {
      console.log(
        "[PendingPaymentsSection] Erro:",
        error?.response?.data || error
      );

      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Atualiza quando a tela recebe foco.
   */
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load, refreshSignal])
  );

  /*
   * Marca apenas o registro selecionado como pago.
   */
  async function handleMarkPaid(
    id,
    paymentMethod
  ) {
    try {
      await markRecordPaid(id, {
        paymentMethod,
      });

      /*
       * Remove imediatamente da lista.
       */
      setRecords((previous) =>
        previous.filter(
          (record) => record.id !== id
        )
      );

      setSelected(null);

      /*
       * Atualiza os cards/gráficos da tela Financeiro.
       */
      if (typeof onChanged === "function") {
        await onChanged();
      }
    } catch (error) {
      console.log(
        "[PendingPaymentsSection] Erro ao pagar:",
        error?.response?.data || error
      );

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Não foi possível atualizar o pagamento.";

      Alert.alert("Erro", message);
    }
  }

  const totalPending = records.reduce(
    (total, record) =>
      total + recordAmount(record),
    0
  );

  return (
    <View style={styles.section}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.sectionTitle}>
            Pagamentos pendentes
          </Text>

          <Text style={styles.sectionSubtitle}>
            Registros que ainda não foram pagos
          </Text>
        </View>

        {records.length > 0 && (
          <Text style={styles.totalText}>
            {formatCurrency(totalPending)}
          </Text>
        )}
      </View>

      {/* LOADING */}
      {loading && records.length === 0 ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="small"
            color="#CE9DBB"
          />

          <Text style={styles.loadingText}>
            Carregando pagamentos...
          </Text>
        </View>
      ) : records.length === 0 ? (
        /* VAZIO */
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>
              ✓
            </Text>
          </View>

          <Text style={styles.emptyTitle}>
            Tudo em dia!
          </Text>

          <Text style={styles.emptyText}>
            Não existem pagamentos pendentes.
          </Text>
        </View>
      ) : (
        /* LISTA */
        <View style={styles.list}>
          {records.map((record) => {
            const amount =
              recordAmount(record);

            const client =
              record.clientName ||
              record.client?.name ||
              "Cliente";

            const service =
              record.serviceName ||
              record.service?.name ||
              "Serviço";

            const staff =
              record.staffName ||
              record.staff?.name ||
              "";

            return (
              <View
                key={String(record.id)}
                style={styles.card}
              >
                <View style={styles.cardInfo}>
                  <Text
                    style={styles.cardClient}
                    numberOfLines={1}
                  >
                    {client}
                  </Text>

                  <Text
                    style={styles.cardService}
                    numberOfLines={1}
                  >
                    {service}
                  </Text>

                  <View style={styles.detailsRow}>
                    {staff ? (
                      <Text
                        style={styles.cardDetail}
                        numberOfLines={1}
                      >
                        {staff}
                      </Text>
                    ) : null}

                    {record.createdAt ? (
                      <Text
                        style={styles.cardDate}
                      >
                        {formatDate(
                          record.createdAt
                        )}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <Text style={styles.cardAmount}>
                    {formatCurrency(amount)}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.payButton}
                    onPress={() =>
                      setSelected(record)
                    }
                  >
                    <Text
                      style={styles.payButtonText}
                    >
                      Marcar como pago
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* MODAL */}
      <MarkPaidModal
        visible={!!selected}
        record={selected}
        onClose={() => setSelected(null)}
        onConfirm={handleMarkPaid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    maxWidth: 500,
    marginTop: 10,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  headerInfo: {
    flex: 1,
    marginRight: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9E7B92",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 3,
  },

  totalText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E67E22",
    marginTop: 2,
  },

  loadingCard: {
    minHeight: 70,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    color: "#888",
  },

  emptyCard: {
    backgroundColor: "#FDFDFD",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  emptyIconText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4CAF50",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#555",
  },

  emptyText: {
    fontSize: 13,
    color: "#999",
    marginTop: 3,
    textAlign: "center",
  },

  list: {
    width: "100%",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  cardInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },

  cardClient: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },

  cardService: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },

  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 8,
  },

  cardDetail: {
    flexShrink: 1,
    fontSize: 11,
    color: "#999",
  },

  cardDate: {
    fontSize: 11,
    color: "#999",
  },

  cardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  cardAmount: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#E67E22",
    marginBottom: 7,
  },

  payButton: {
    backgroundColor: "#CE9DBB",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  payButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 11,
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#333",
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 5,
    marginBottom: 16,
  },

  amountBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 13,
    borderRadius: 10,
    marginBottom: 18,
  },

  amountLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },

  amountValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2E7D32",
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#444",
    marginBottom: 10,
  },

  methodList: {
    gap: 8,
    marginBottom: 20,
  },

  methodOption: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },

  methodOptionSelected: {
    borderColor: "#CE9DBB",
    backgroundColor: "#FDF5F9",
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  radioSelected: {
    borderColor: "#CE9DBB",
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#CE9DBB",
  },

  methodText: {
    fontSize: 14,
    color: "#555",
  },

  methodTextSelected: {
    color: "#9E7B92",
    fontWeight: "bold",
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
  },

  modalCancel: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  modalCancelText: {
    color: "#777",
    fontWeight: "600",
  },

  modalConfirm: {
    minWidth: 145,
    minHeight: 42,
    backgroundColor: "#CE9DBB",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  modalConfirmText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
});
