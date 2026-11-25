import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useAuth } from "../../src/hooks/useAuth";
import { useServiceCatalog } from "../../src/hooks/useServiceCatalog";
import { deactivateService } from "../../src/services/catalog";
import { formatCurrency } from "../../src/utils/date";
import SearchableList from "../../src/components/SearchableList";
import ServiceFormModal from "../../src/components/ServiceFormModal";
import InactiveList from "../../src/components/InactiveList";
import StatusToggle from "../../src/components/StatusToggle";

export default function Servicos() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";

  const { query, setQuery, services, loading, refetch } = useServiceCatalog();

  const [formVisible, setFormVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Controla se estamos vendo os ativos (false) ou o componente de inativos (true)
  const [showInactive, setShowInactive] = useState(false);

  function openCreate() {
    setEditingService(null);
    setFormVisible(true);
  }

  function openEdit(service) {
    if (!isManager) return;
    setEditingService(service);
    setFormVisible(true);
  }

  function handleDeactivate(service) {
    Alert.alert(
      "Desativar serviço",
      `Tem certeza que deseja desativar "${service.name}"? Ele deixará de aparecer como opção em novos agendamentos.`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateService(service.id);
              refetch();
            } catch (err) {
              // erro já mostrado pelo interceptor global
            }
          },
        },
      ],
    );
  }

  // Lista apenas dos ativos para quando showInactive for false
  const activeItems = services
    .filter((s) => s.active !== false)
    .map((s) => ({
      ...s,
      label: s.name,
    }));

  const statusToggle = (
    <StatusToggle showInactive={showInactive} onChange={setShowInactive} />
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
        paddingBottom: 0,
      }}
    >
      {/* Se showInactive for true, renderiza O SEU COMPONENTE */}
      {showInactive ? (
        <InactiveList
          services={services}
          loading={loading}
          query={query}
          onSearchChange={setQuery}
          onRefresh={refetch}
          onEdit={openEdit}
          isManager={isManager}
          belowSearch={statusToggle}
        />
      ) : (
        <SearchableList
          items={activeItems}
          loading={loading}
          search={query}
          onSearchChange={setQuery}
          filterLocally={false}
          searchPlaceholder="Buscar serviço"
          iconSize={24}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={refetch}
          belowSearch={statusToggle}
          emptyText={
            query
              ? "Nenhum serviço encontrado."
              : "Nenhum serviço ativo cadastrado."
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => openEdit(item)}
              disabled={!isManager}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                </View>
                <Text style={styles.detail}>
                  {formatCurrency(item.defaultPrice)} · {item.durationMinutes}{" "}
                  min
                </Text>
              </View>

              {isManager && (
                <TouchableOpacity
                  style={styles.deactivateButton}
                  onPress={() => handleDeactivate(item)}
                >
                  <Text style={styles.deactivateButtonText}>Desativar</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {isManager && !showInactive && (
        <TouchableOpacity style={styles.fab} onPress={openCreate}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      <ServiceFormModal
        visible={formVisible}
        service={editingService}
        onClose={() => setFormVisible(false)}
        onSaved={refetch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 12,
    zIndex: 10,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemActive: {
    backgroundColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 15,
    color: "#444",
  },
  dropdownItemTextActive: {
    fontWeight: "700",
    color: "#000",
  },
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: { fontSize: 15, fontWeight: "600", color: "#333" },
  detail: { fontSize: 13, color: "#666", marginTop: 4 },
  deactivateButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deactivateButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "#FF6B6B",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 110,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D1779F",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: { color: "#fff", fontSize: 30, lineHeight: 32 },
});
