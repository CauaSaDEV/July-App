import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import SearchableList from "./SearchableList";

/**
 * items: [{ id, label, subtitle? }]
 *
 * Por dentro, usa o SearchableList (filtro local) pra busca + lista.
 * A key força o SearchableList a "reiniciar" (limpar o campo de busca)
 * toda vez que o modal reabre.
 */
export default function SelectModal({ visible, title, items, loading, onSelect, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>

        <SearchableList
          key={visible ? "open" : "closed"}
          items={items}
          loading={loading}
          filterLocally
          searchPlaceholder="Buscar..."
          keyExtractor={(item) => item.id}
          emptyText="Nada encontrado."
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              {item.subtitle ? <Text style={styles.itemSubtitle}>{item.subtitle}</Text> : null}
            </TouchableOpacity>
          )}
        />

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
  item: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  itemLabel: { fontSize: 15, color: "#333", fontWeight: "600" },
  itemSubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  closeButton: {
    marginTop: 12,
    backgroundColor: "#f4c5e9",
    borderRadius: 15,
    padding: 14,
    alignItems: "center",
  },
  closeButtonText: { color: "#9E7B92", fontWeight: "bold", fontSize: 15 },
});