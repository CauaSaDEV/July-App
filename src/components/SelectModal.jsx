import { useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

/**
 * items: [{ id, label, subtitle? }]
 */
export default function SelectModal({ visible, title, items, loading, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <TextInput
          style={styles.search}
          placeholder="Buscar..."
          value={search}
          onChangeText={setSearch}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#CE9DBB" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.empty}>Nada encontrado.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item);
                  setSearch("");
                }}
              >
                <Text style={styles.itemLabel}>{item.label}</Text>
                {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
              </TouchableOpacity>
            )}
          />
        )}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: "bold", color: "#9E7B92", marginBottom: 16 },
  search: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  itemLabel: { fontSize: 15, color: "#333", fontWeight: "600" },
  itemSubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
  closeButton: {
    marginTop: 12,
    backgroundColor: "#f4c5e9",
    borderRadius: 15,
    padding: 14,
    alignItems: "center",
  },
  closeButtonText: { color: "#9E7B92", fontWeight: "bold", fontSize: 15 },
});
