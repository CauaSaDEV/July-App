import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { useAuth } from "../../src/hooks/useAuth";
import { useUsers } from "../../src/hooks/UseUser";
import { activateUser, deactivateUser } from "../../src/services/users";
import SearchableList from "../../src/components/SearchableList";
import UserFormModal from "../../src/components/UseFormModal";
import ResetPasswordModal from "../../src/components/ResetPasswordModal";

const ROLE_LABELS = {
  MANAGER: "Gerente",
  STAFF: "Funcionário(a)",
};

export default function Usuarios() {
  const { user: me, loading: authLoading } = useAuth();
  const isManager = me?.role === "MANAGER";

  // só busca a lista se for MANAGER (STAFF receberia 403)
  const { query, setQuery, users, loading, refetch } = useUsers(isManager);

  const [formVisible, setFormVisible] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);

  if (authLoading) return null;

  if (!isManager) {
    return (
      <View style={styles.restricted}>
        <Text style={styles.restrictedTitle}>Acesso restrito</Text>
        <Text style={styles.restrictedText}>
          Somente gerentes podem gerenciar usuários.
        </Text>
      </View>
    );
  }

  function handleDeactivate(target) {
    Alert.alert(
      "Desativar usuário",
      `Desativar "${target.name}"? Ele não conseguirá mais acessar o app.`,
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: async () => {
            try {
              await deactivateUser(target.id);
              refetch();
            } catch (err) {
              // erro já mostrado pelo interceptor global
            }
          },
        },
      ]
    );
  }

  async function handleActivate(target) {
    try {
      await activateUser(target.id);
      refetch();
    } catch (err) {
      // erro já mostrado pelo interceptor global
    }
  }

  const items = users.map((u) => ({ ...u, label: u.name }));

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 20, paddingBottom: 0 }}>
      <SearchableList
        items={items}
        loading={loading}
        search={query}
        onSearchChange={setQuery}
        filterLocally={false}
        searchPlaceholder="Buscar por nome ou e-mail..."
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={refetch}
        emptyText={query ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
        renderItem={({ item }) => {
          const isSelf = item.id === me?.id;
          const inactive = item.active === false;

          return (
            <View style={[styles.row, inactive && styles.rowInactive]}>
              <View style={styles.rowHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() ?? "?"}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  {isSelf && <Text style={styles.selfTag}>(você)</Text>}
                </View>
                <Text style={styles.detail}>{item.email}</Text>
                <View style={styles.badges}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{ROLE_LABELS[item.role] ?? item.role}</Text>
                  </View>
                  {inactive && (
                    <View style={styles.inactiveBadge}>
                      <Text style={styles.inactiveBadgeText}>Inativo</Text>
                    </View>
                  )}
                </View>
              </View>

              </View>

              <View style={styles.actionsRow}>
                {item.role === "MANAGER" && (
                  <TouchableOpacity
                    style={styles.passwordButton}
                    onPress={() => setPasswordUser(item)}
                  >
                    <Text style={styles.buttonText}>Senha</Text>
                  </TouchableOpacity>
                )}

                {!isSelf && !inactive && (
                  <TouchableOpacity
                    style={styles.deactivateButton}
                    onPress={() => handleDeactivate(item)}
                  >
                    <Text style={styles.buttonText}>Desativar</Text>
                  </TouchableOpacity>
                )}

                {!isSelf && inactive && (
                  <TouchableOpacity
                    style={styles.activateButton}
                    onPress={() => handleActivate(item)}
                  >
                    <Text style={styles.buttonText}>Ativar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setFormVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <UserFormModal
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSaved={refetch}
      />

      <ResetPasswordModal
        visible={!!passwordUser}
        user={passwordUser}
        onClose={() => setPasswordUser(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  restricted: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, backgroundColor: "#fff" },
  restrictedTitle: { fontSize: 18, fontWeight: "bold", color: "#9E7B92", marginBottom: 8 },
  restrictedText: { fontSize: 14, color: "#888", textAlign: "center" },
  row: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rowInactive: { opacity: 0.6 },
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
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "600", color: "#333" },
  selfTag: { fontSize: 12, color: "#CE9DBB", marginLeft: 6 },
  detail: { fontSize: 12, color: "#888", marginTop: 2 },
  badges: { flexDirection: "row", marginTop: 6, gap: 6 },
  roleBadge: { backgroundColor: "#f4c5e9", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeText: { fontSize: 11, color: "#9E7B92", fontWeight: "600" },
  inactiveBadge: { backgroundColor: "#eee", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  inactiveBadgeText: { fontSize: 11, color: "#888", fontWeight: "600" },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  passwordButton: {
    flex: 1,
    backgroundColor: "#CE9DBB",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  deactivateButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  activateButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
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