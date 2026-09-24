import { useMemo, useState } from "react";
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator } from "react-native";

/**
 * Busca + lista reutilizável.
 *
 * Dois modos de uso:
 * 1) Filtro local: passa só `items` (com campo `label`) e deixa o componente
 *    filtrar sozinho por texto digitado (ex: SelectModal, listas já carregadas).
 * 2) Busca remota: passa `search` + `onSearchChange` controlados de fora
 *    (ex: tela de Clientes/Serviços, que busca via API com debounce).
 *    Nesse caso passe `filterLocally={false}` pra não filtrar duas vezes.
 */
export default function SearchableList({
  items,
  loading = false,
  search,
  onSearchChange,
  filterLocally = true,
  searchPlaceholder = "Buscar...",
  keyExtractor,
  renderItem,
  emptyText = "Nada encontrado.",
  refreshing,
  onRefresh,
  style,
}) {
  const [internalSearch, setInternalSearch] = useState("");
  const isControlled = typeof search === "string" && !!onSearchChange;
  const searchValue = isControlled ? search : internalSearch;

  const displayedItems = useMemo(() => {
    if (!filterLocally) return items;
    if (!searchValue.trim()) return items;
    const q = searchValue.toLowerCase();
    return items.filter((item) => (item.label ?? "").toLowerCase().includes(q));
  }, [items, searchValue, filterLocally]);

  function handleChange(text) {
    if (isControlled) {
      onSearchChange(text);
    } else {
      setInternalSearch(text);
    }
  }

  return (
    <View style={[{ flex: 1 }, style]}>
      <TextInput
        style={styles.search}
        placeholder={searchPlaceholder}
        value={searchValue}
        onChangeText={handleChange}
      />

      {loading && displayedItems.length === 0 ? (
        <ActivityIndicator size="large" color="#CE9DBB" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={displayedItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 15,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  list: { paddingBottom: 20 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});