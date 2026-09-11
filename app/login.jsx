import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../src/services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (cleanEmail === "" || cleanPassword === "") {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      // 1. Apaga token antigo caso exista
      await SecureStore.deleteItemAsync("token");
      console.log("[login] enviando requisição...", { email: cleanEmail });

      const response = await api.post("/auth/login", {
        email: cleanEmail,
        password: cleanPassword,
      });

      console.log("[login] resposta recebida:", JSON.stringify(response.data));

      const token = response.data.token;
      if (!token) {
        console.log("[login] ATENÇÃO: token veio vazio/undefined na resposta.");
        Alert.alert("Erro", "O servidor respondeu, mas não retornou um token válido.");
        return;
      }

      await SecureStore.setItemAsync("token", token);
      console.log("[login] token salvo com sucesso, navegando para Home...");

      router.replace("/(tabs)/Home");
    } catch (error) {
      const isAxiosError = !!error?.isAxiosError;
      console.log(
        "[login] erro capturado:",
        isAxiosError ? "axios" : "outro",
        error?.response?.status,
        error?.response?.data ?? error?.message ?? error
      );

      const errorMessage =
        error?.response?.data?.message ??
        error?.response?.data ??
        "E-mail ou senha incorretos. Verifique seus dados.";

      Alert.alert("Erro ao entrar", String(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ backgroundColor: "#f4c5e9" }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formBox}>
          <Image
            source={require("../assets/favicon.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Login</Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f4c5e9",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  formBox: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 16,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#9E7B92",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#9E7B92",
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2D0DC",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#D1779F",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});