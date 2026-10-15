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
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import api from "../src/services/api";
import { getMe } from "../src/services/Auth";

const { width } = Dimensions.get("window");

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (email === "" || password === "") {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);

    try {
      console.log("[login] enviando requisição...");
      const response = await api.post("/auth/login", {
        email: email,
        password: password,
      });
      console.log("[login] resposta recebida:", JSON.stringify(response.data));

      const token = response.data.token;
      if (!token) {
        console.log("[login] ATENÇÃO: token veio vazio/undefined na resposta.");
        Alert.alert("Erro", "O servidor respondeu, mas não retornou um token válido.");
        return;
      }

      await SecureStore.setItemAsync("token", token);

      // Funcionários (STAFF) não acessam o app: só gerentes fazem login.
      const me = await getMe();
      if (me?.role !== "MANAGER") {
        await SecureStore.deleteItemAsync("token");
        Alert.alert("Acesso negado", "Apenas gerentes podem acessar o app.");
        return;
      }

      console.log("[login] token salvo com sucesso, navegando para Home...");
      router.replace("/(tabs)/Home");
    } catch (error) {
      // Se o erro veio de uma resposta HTTP (4xx/5xx) ou de rede, o interceptor
      // em src/services/api.js já mostra um Alert automaticamente.
      // Se for um erro de outro tipo (ex: SecureStore, navegação), mostramos aqui.
      const isAxiosError = !!error?.isAxiosError;
      console.log(
        "[login] erro capturado:",
        isAxiosError ? "axios" : "outro",
        error?.response?.status,
        error?.response?.data ?? error?.message ?? error
      );
      if (!isAxiosError) {
        Alert.alert("Erro inesperado", String(error?.message ?? error));
      }
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
        keyboardsShouldPersistTaps="handled"
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
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            secureTextEntry
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
    padding: width * 0.5,
  },
  formBox: {
    backgroundColor: "#ffffff",
    width: width * 0.9,
    maxWidth: 400,
    padding: 30,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 50,
    height: 50,
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#9E7B92",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#CE9DBB",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
    borderRadius: 15,
  },
  button: {
    backgroundColor: "#D1779F",
    padding: 14,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 10,
    borderRadius: 15,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  ScrollViewContent: {
    backgroundColor: "#f4c5e9",
  },
});