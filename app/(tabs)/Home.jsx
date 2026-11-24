// ============================================================================
// IMPORTS
// ============================================================================
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
  Animated,
} from "react-native";
import { useState, useCallback, useRef } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../../src/hooks/useAuth";
import { useHomeData } from "../../src/hooks/useHomeData";
import { formatTime, formatWeekdayDate } from "../../src/utils/date";
import FinishAppointmentModal from "../../src/components/FinishAppointmentModal";
import {
  finishAppointment,
  cancelAppointment,
} from "../../src/services/appointments";

// ============================================================================
// CONSTANTES
// ============================================================================
const { width } = Dimensions.get("window");

const ROLE_LABELS = {
  MANAGER: "Gerente",
  STAFF: "Funcionário(a)",
};

const PERIOD_OPTIONS = [
  { key: "DAY", label: "Dia", title: "Agendamentos de Hoje" },
  { key: "WEEK", label: "Semana", title: "Agendamentos da Semana" },
  { key: "MONTH", label: "Mês", title: "Agendamentos do Mês" },
];

// ============================================================================
// COMPONENTE
// ============================================================================
export default function Home() {
  // --------------------------------------------------------------------------
  // Navegação
  // --------------------------------------------------------------------------
  const router = useRouter();

  // --------------------------------------------------------------------------
  // Dados (hooks)
  // --------------------------------------------------------------------------
  const [viewMode, setViewMode] = useState("WEEK");

  const { user, refetch: refetchAuth, logout } = useAuth();
  const {
    nextAppointments = [],
    loading: dataLoading,
    refetch: refetchData,
  } = useHomeData(user?.role, viewMode);

  // --------------------------------------------------------------------------
  // Estados de interface
  // --------------------------------------------------------------------------
  const [periodOpen, setPeriodOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApptToFinish, setSelectedApptToFinish] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Menu em leque
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  // --------------------------------------------------------------------------
  // Efeitos e atualização
  // --------------------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      if (user?.role) {
        refetchData();
      }
    }, [user?.role, refetchData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAuth?.(), refetchData?.()]);
    setRefreshing(false);
  }, [refetchAuth, refetchData]);

  // --------------------------------------------------------------------------
  // Handlers: menu em leque
  // --------------------------------------------------------------------------
  function toggleMenu() {
    const toValue = menuOpen ? 0 : 1;
    setMenuOpen(!menuOpen);
    Animated.spring(menuAnim, {
      toValue,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }

  function closeMenu() {
    setMenuOpen(false);
    Animated.timing(menuAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }

  function goToUsers() {
    closeMenu();
    // Se o arquivo da tela em app/ tiver outro nome, ajuste a rota aqui
    router.navigate("/Usuarios");
    console.log("ok")
  }

  function handleLogout() {
    closeMenu();
    Alert.alert("Sair da conta", "Tem certeza que quer sair?", [
      { text: "Voltar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } finally {
            router.replace("/login"); // ajuste para a rota da sua tela de login
          }
        },
      },
    ]);
  }

  // Posição final de cada botão do leque (relativa à engrenagem)
  const FAN_ITEMS = [
    {
      key: "users",
      icon: "people-outline",
      label: "Usuários",
      x: -55,
      y: 0,
      onPress: goToUsers,
    },
    {
      key: "logout",
      icon: "log-out-outline",
      label: "Sair",
      x: -25,
      y: 52,
      onPress: handleLogout,
      danger: true,
    },
  ];

  // --------------------------------------------------------------------------
  // Handlers: agendamentos
  // --------------------------------------------------------------------------
  async function handleConfirmFinish(id, paymentDetails) {
    Alert.alert(
      "Finalizar agendamento",
      "Tem certeza que quer finalizar este agendamento?",
      [
        {
          text: "Voltar",
          style: "cancel",
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
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }

  function handleCancelAppointment(id) {
    Alert.alert(
      "Cancelar agendamento",
      "Tem certeza que quer cancelar este agendamento?",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Cancelar agendamento",
          style: "destructive",
          onPress: async () => {
            try {
              setSubmitting(true);
              await cancelAppointment(id);
              Alert.alert("Cancelado", "Agendamento cancelado com sucesso!");
              refetchData();
            } catch (err) {
              Alert.alert("Erro", "Não foi possível cancelar o agendamento.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  }

  // --------------------------------------------------------------------------
  // Valores derivados
  // --------------------------------------------------------------------------
  const firstName = user?.name?.split(" ")[0] ?? "Usuário";

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
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

        {/* Botões do leque (ficam atrás da engrenagem) */}
        {FAN_ITEMS.map((item) => {
          const translateX = menuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, item.x],
          });
          const translateY = menuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, item.y],
          });
          const scale = menuAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 1],
          });

          return (
            <Animated.View
              key={item.key}
              pointerEvents={menuOpen ? "auto" : "none"}
              style={[
                styles.fanItem,
                {
                  opacity: menuAnim,
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.fanButton,
                  item.danger && styles.fanButtonDanger,
                ]}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? "#fff" : "#9E7B92"}
                />
              </TouchableOpacity>
              <Text style={styles.fanLabel}>{item.label}</Text>
            </Animated.View>
          );
        })}

        {/* Engrenagem */}
        <TouchableOpacity
          style={styles.gearButton}
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Animated.View
            style={{
              transform: [
                {
                  rotate: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "90deg"],
                  }),
                },
              ],
            }}
          >
            <Ionicons name="settings-outline" size={22} color="#9E7B92" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* SEÇÃO: PRÓXIMOS AGENDAMENTOS */}
      <View style={styles.section}>
        {/* TÍTULO COM DROPDOWN DE PERÍODO */}
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            style={styles.titleTrigger}
            onPress={() => setPeriodOpen((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>
              {PERIOD_OPTIONS.find((o) => o.key === viewMode)?.title}
            </Text>
            <Text style={styles.dropdownArrow}>{periodOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>

          {periodOpen && (
            <View style={styles.dropdownList}>
              {PERIOD_OPTIONS.map((item, index) => {
                const isActive = viewMode === item.key;
                const isLast = index === PERIOD_OPTIONS.length - 1;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dropdownItem,
                      isActive && styles.dropdownItemActive,
                      isLast && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      setViewMode(item.key);
                      setPeriodOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        isActive && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isActive && <Text style={styles.dropdownCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {dataLoading ? (
          <ActivityIndicator
            size="small"
            color="#CE9DBB"
            style={{ marginTop: 10 }}
          />
        ) : nextAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum agendamento marcado.</Text>
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
              <View key={appt.id ?? index} style={styles.appointmentCard}>
                {/* LINHA SUPERIOR: HORÁRIO E DETALHES */}
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentTimeBox}>
                    <Text style={styles.appointmentDay}>
                      {formatWeekdayDate(appt.startAt)}
                    </Text>
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
                </View>

                {/* BOTÕES DE AÇÃO NA PARTE INFERIOR */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelAppointment(appt.id)}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.finishButton}
                    onPress={() => setSelectedApptToFinish(appt)}
                    disabled={submitting}
                  >
                    <Text style={styles.finishText}>Finalizar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

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

// ============================================================================
// ESTILOS
// ============================================================================
const styles = StyleSheet.create({
  /* CONTAINER */
  container: {
    flexGrow: 1,
    padding: width * 0.05,
    alignItems: "center",
  },

  /* BOAS-VINDAS */
  welcomeBox: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#f4c5e9",
    padding: 20,
    paddingRight: 70, // espaço para a engrenagem
    minHeight: 130, // mantém o leque dentro do painel (necessário para tocar no Android)
    borderRadius: 15,
    marginBottom: 20,
    zIndex: 10,
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

  /* MENU EM LEQUE */
  gearButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  fanItem: {
    position: "absolute",
    top: 12,
    right: 0,
    width: 64,
    alignItems: "center",
    zIndex: 1,
  },
  fanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fanButtonDanger: { backgroundColor: "#FF6B6B" },
  fanLabel: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "600",
    color: "#9E7B92",
  },

  /* SEÇÃO DE AGENDAMENTOS */
  section: {
    width: "100%",
    maxWidth: 500,
    marginTop: 10,
  },
  sectionHeader: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  titleTrigger: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#9E7B92",
  },

  /* ESTADO VAZIO */
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

  /* CARD DE AGENDAMENTO */
  appointmentCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  appointmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
    textAlign: "center",
  },
  appointmentDay: {
    fontSize: 11,
    color: "#9E7B92",
    textAlign: "center",
    textTransform: "capitalize",
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

  /* BOTÕES DE AÇÃO */
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  finishButton: {
    flex: 1,
    backgroundColor: "#CE9DBB",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  finishText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },

  /* DROPDOWN DE PERÍODO */
  dropdownArrow: {
    fontSize: 11,
    color: "#888",
    marginLeft: 8,
  },
  dropdownList: {
    marginTop: 8,
    alignSelf: "flex-end",
    minWidth: 130,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  dropdownItemActive: {
    backgroundColor: "#f5f5f5",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#555",
  },
  dropdownItemTextActive: {
    fontWeight: "bold",
    color: "#333",
  },
  dropdownCheck: {
    marginLeft: 12,
    color: "#555",
    fontWeight: "bold",
  },
});