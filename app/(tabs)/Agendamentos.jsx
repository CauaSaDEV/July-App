import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { useState, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/hooks/useAuth";
import AgendaCalendar from "../../src/components/AppointmentCalendar";
import { useAppointmentsCalendar } from "../../src/hooks/useAppointmentsCalendar";
import { formatTime } from "../../src/utils/date";
import { abrirWhatsApp } from "../../src/utils/whatsapp";
import AppointmentFormModal from "../../src/components/AppointmentFormModal";
import AppointmentDetailModal from "../../src/components/AppointmentDetailModal";
import RetroactiveLaunchModal from "../../src/components/RetroactiveLaunchModal";
import { getClients } from "../../src/services/clients";
import { getServiceCatalog } from "../../src/services/catalog";
import { getUsers } from "../../src/services/users";

const STATUS_COLORS = {
  SCHEDULED: "#D1779F",
  DONE: "#4CAF50",
  CANCELED: "#bbbbbb",
};

export default function Agendamentos() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";

  const {
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    markedDates,
    dayAppointments,
    loading,
    refetch,
  } = useAppointmentsCalendar();

  const [formVisible, setFormVisible] = useState(false);
  const [retroactiveVisible, setRetroactiveVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [clients, setClients] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [services, setServices] = useState([]);

  // Menu em leque do botão "+"
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      loadAuxData();
      refetch();
    }, [])
  );

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

  function openNewAppointment() {
    closeMenu();
    setFormVisible(true);
  }

  function openRetroactive() {
    closeMenu();
    setRetroactiveVisible(true);
  }

  // Botões do leque (o retroativo aparece só para gerentes).
  // x e y = posição final do botão em relação ao "+" (valores negativos sobem/vão para a esquerda)
  const FAN_ITEMS = [
    {
      key: "new",
      icon: "calendar-outline",
      label: "Novo agendamento",
      x: 0,
      y: -70,
      onPress: openNewAppointment,
    },
    ...(isManager
      ? [
          {
            key: "retroactive",
            icon: "time-outline",
            label: "Lançamento retroativo",
            x: 0,
            y: -130,
            onPress: openRetroactive,
          },
        ]
      : []),
  ];

  function getPhone(item) {
    const cliente = clients.find((c) => c.id === item.clientId);
    return cliente?.subtitle;
  }

  function lembrarPeloWhatsApp(item) {
    const hora = formatTime(item.startAt);
    const [ano, mes, dia] = selectedDate.split("-");
    const mensagem =
      `Olá ${item.clientName}! Passando para lembrar do seu horário` +
      `${item.serviceName ? ` de ${item.serviceName}` : ""}` +
      ` no dia ${dia}/${mes}/${ano} às ${hora}. Podemos confirmar?`;
    abrirWhatsApp(getPhone(item), mensagem);
  }

  async function loadAuxData() {
    try {
      const [clientRes, serviceRes, userRes] = await Promise.all([
        getClients(),
        getServiceCatalog(),
        getUsers(),
      ]);

      setClients(
        clientRes.map((c) => ({
          id: c.id,
          label: c.name,
          subtitle: c.phone,
        }))
      );

      setServices(
        serviceRes
          .filter((s) => s.active !== false)
          .map((s) => ({
            id: s.id,
            label: s.name,
            price: s.defaultPrice ?? s.price,
            durationMinutes: s.durationMinutes,
            subtitle: `R$ ${s.defaultPrice ?? s.price ?? "0.00"}`,
          }))
      );

      setStaffs(
        userRes
          .filter((u) => u.active !== false)
          .map((u) => ({
            id: u.id,
            label: u.name,
            subtitle: u.role,
          }))
      );
    } catch (err) {
      // Tratado via interceptor da API
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <AgendaCalendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onMonthChange={setCurrentMonth}
        markedDates={markedDates}
      />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Agendamentos do dia</Text>
        {loading && <ActivityIndicator size="small" color="#CE9DBB" />}
      </View>

      <FlatList
        data={dayAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>Nenhum agendamento neste dia.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => setSelectedAppointment(item)}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: STATUS_COLORS[item.status] ?? "#fcfcfc" },
              ]}
            />
            <View style={styles.rowTimeBox}>
              <Text style={styles.rowTime}>{formatTime(item.startAt)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowClient}>{item.clientName}</Text>
              <Text style={styles.rowDetail}>
                {item.serviceName ?? "Sem serviço"}
                {isManager && item.staffName ? ` · ${item.staffName}` : ""}
              </Text>
            </View>

            {item.status === "SCHEDULED" && (
              <TouchableOpacity
                style={styles.whatsBtn}
                onPress={() => lembrarPeloWhatsApp(item)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Toque fora do leque para fechar */}
      {menuOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={closeMenu}
        />
      )}

      {/* Botões do leque (ficam atrás do "+") */}
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
            <View style={styles.fanLabelBox}>
              <Text style={styles.fanLabel}>{item.label}</Text>
            </View>
            <TouchableOpacity
              style={styles.fanButton}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <Ionicons name={item.icon} size={22} color="#eeeeee" />
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Botão Principal (abre/fecha o leque) */}
      <TouchableOpacity style={styles.fab} onPress={toggleMenu} activeOpacity={0.85}>
        <Animated.Text
          style={[
            styles.fabText,
            {
              transform: [
                {
                  rotate: menuAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "45deg"],
                  }),
                },
              ],
            },
          ]}
        >
          +
        </Animated.Text>
      </TouchableOpacity>

      {/* Modal Agendamento Padrão */}
      <AppointmentFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        dateKey={selectedDate}
        isManager={isManager}
        currentUser={user}
        onCreated={refetch}
      />

      {/* Modal Lançamento Retroativo */}
      <RetroactiveLaunchModal
        visible={retroactiveVisible}
        onClose={() => setRetroactiveVisible(false)}
        onSuccess={refetch}
        clients={clients}
        staffs={staffs}
        services={services}
      />

      {/* Detalhes do Agendamento */}
      <AppointmentDetailModal
        visible={!!selectedAppointment}
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onChanged={refetch}
        isManager={isManager}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  listTitle: { fontSize: 16, fontWeight: "bold", color: "#9E7B92" },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  empty: { textAlign: "center", color: "#999", marginTop: 30 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  rowTimeBox: {
    backgroundColor: "#f4c5e9",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 12,
  },
  rowTime: { fontSize: 13, fontWeight: "bold", color: "#9E7B92" },
  rowClient: { fontSize: 14, fontWeight: "600", color: "#333" },
  rowDetail: { fontSize: 12, color: "#888", marginTop: 2 },
  whatsBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#E8F8EE",
  },

  /* BOTÃO PRINCIPAL */
  fab: {
    position: "absolute",
    right: 24,
    bottom: 110,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d3c5cb",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 11,
  },
  fabText: { color: "#fff", fontSize: 30, lineHeight: 32 },

  /* MENU EM LEQUE */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  fanItem: {
    position: "absolute",
    right: 24,
    bottom: 110,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  fanButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FAF0F5",
    borderWidth: 1,
    borderColor: "#eeeeee",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fanLabelBox: {
    position: "absolute",
    right: 64, // à esquerda do botão
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  fanLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9E7B92",
    width: 150,
    textAlign: "right",
  },
});