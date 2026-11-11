import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useState } from "react";
import { useClients } from "../../src/hooks/useClients";
import ClientFormModal from "../../src/components/ClientFormModal";
import SearchableList from "../../src/components/SearchableList"; // <-- Ajuste o caminho se necessário

export default function Clientes() {
  const { query, setQuery, clients, loading, refetch } = useClients();

  const [formVisible, setFormVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  function openCreate() {
    setEditingClient(null);
    setFormVisible(true);
  }

  function openEdit(client) {
    setEditingClient(client);
    setFormVisible(true);
  }

  return (
    <View style={styles.container}>
      <SearchableList
        items={clients}
        loading={loading}
        search={query}
        onSearchChange={setQuery}
        filterLocally={false}
        searchPlaceholder="Buscar por nome, telefone, e e-mail"
        iconSize={24}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refetch}
        emptyText={query ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openEdit(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() ?? "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>{item.phone}</Text>
              {item.email ? <Text style={styles.detailMuted}>{item.email}</Text> : null}
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openCreate}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <ClientFormModal
        visible={formVisible}
        client={editingClient}
        onClose={() => setFormVisible(false)}
        onSaved={refetch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f4c5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#9E7B92", fontWeight: "bold", fontSize: 16 },
  name: { fontSize: 15, fontWeight: "600", color: "#333" },
  detail: { fontSize: 13, color: "#666", marginTop: 2 },
  detailMuted: { fontSize: 12, color: "#999", marginTop: 1 },
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
