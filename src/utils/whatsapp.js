import { Linking, Alert, Platform } from "react-native";

export function abrirWhatsApp(telefone, mensagem = "") {
  const digitos = String(telefone ?? "").replace(/\D/g, "");

  if (digitos.length < 10) {
    const aviso = "Este cliente não tem um telefone válido cadastrado.";
    Platform.OS === "web" ? window.alert(aviso) : Alert.alert("Sem telefone", aviso);
    return;
  }

  // 10 ou 11 dígitos = DDD + número, então adiciona o código do Brasil
  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;

  Linking.openURL(url).catch(() => {
    const aviso = "Não foi possível abrir o WhatsApp.";
    Platform.OS === "web" ? window.alert(aviso) : Alert.alert("Erro", aviso);
  });
}