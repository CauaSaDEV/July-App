import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useAuth } from "../../src/hooks/useAuth";
import { useServiceCatalog } from "../../src/hooks/useServiceCatalog";
import { deactivateService } from "../../src/services/catalog";
import { formatCurrency } from "../../src/utils/date";
import SearchableList from "../../src/components/SearchableList";
import ServiceFormModal from "../../src/components/ServiceFormModal";

export default function Servicos() {
  const { user } = useAuth();
  const isManager = user?.role === "MANAGER";

  const { query, setQuery, services, loading, refetch } = useServiceCatalog();

  const [formVisible, setFormVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);

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
      ]
    );
  }

  const items = services.map((s) => ({
    ...s,
    label: s.name,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 20, paddingBottom: 0 }}>
      <SearchableList
        items={items}
        loading={loading}
        search={query}
        onSearchChange={setQuery}
        filterLocally={false}
        searchPlaceholder="Buscar serviço..."
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refetch}
        emptyText={query ? "Nenhum serviço encontrado." : "Nenhum serviço cadastrado ainda."}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, item.active === false && styles.rowInactive]}
            onPress={() => openEdit(item)}
            disabled={!isManager}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.active === false && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Inativo</Text>
                  </View>
                )}
              </View>
              <Text style={styles.detail}>
                {formatCurrency(item.defaultPrice)} · {item.durationMinutes} min
              </Text>
            </View>

            {isManager && item.active !== false && (
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

      {isManager && (
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
  deactivateButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  deactivateButtonText: { 
    color: "#FFFFFF",
     fontSize: 12,
      fontWeight: "600",
       backgroundColor: '#FF6B6B',
    borderWidth: 4,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderColor: '#FF6B6B',
        
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