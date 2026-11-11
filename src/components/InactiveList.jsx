import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { deactivateService } from "../services/catalog"; // Ajuste para sua função de ativar, se houver
import { formatCurrency } from "../utils/date";
import SearchableList from "./SearchableList";

export default function InactiveList({
  services = [],
  loading,
  query,
  onSearchChange,
  onRefresh,
  onEdit,
  isManager = false,
}) {
  // Filtra apenas os serviços onde active é false
  const inactiveItems = services
    .filter((s) => s.active === false)
    .map((s) => ({
      ...s,
      label: s.name,
    }));

  function handleActivate(service) {
    Alert.alert(
      "Ativar serviço",
      `Tem certeza que deseja ativar "${service.name}"? Ele irá aparecer como opção em novos agendamentos.`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Ativar",
          onPress: async () => {
            try {
              await deactivateService(service.id);
              if (onRefresh) onRefresh();
            } catch (err) {
              // erro já mostrado pelo interceptor global
            }
          },
        },
      ]
    );
  }

  return (
    <SearchableList
      items={inactiveItems}
      loading={loading}
      search={query}
      onSearchChange={onSearchChange}
      filterLocally={false}
      searchPlaceholder="Buscar serviço inativo"
      iconSize={24}
      keyExtractor={(item) => item.id}
      refreshing={loading}
      onRefresh={onRefresh}
      emptyText={
        query
          ? "Nenhum serviço inativo encontrado."
          : "Nenhum serviço inativo no momento."
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.row, styles.rowInactive]}
          onPress={() => onEdit && onEdit(item)}
          disabled={!isManager}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Inativo</Text>
              </View>
            </View>
            <Text style={styles.detail}>
              {formatCurrency(item.defaultPrice)} · {item.durationMinutes} min
            </Text>
          </View>

          {isManager && (
            <TouchableOpacity
              style={styles.activateButton}
              onPress={() => handleActivate(item)}
            >
              <Text style={styles.activateButtonText}>Ativar</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  rowInactive: {
    opacity: 0.6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: { fontSize: 15, fontWeight: "600", color: "#333" },
  detail: { fontSize: 13, color: "#666", marginTop: 4 },
  badge: {
    backgroundColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, color: "#888", fontWeight: "600" },
  activateButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  activateButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "#4CAF50",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
});
