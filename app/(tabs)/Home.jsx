import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function Home() {
  return (
    <ScrollView 
      style={{ backgroundColor: "#ffffff" }} 
      contentContainerStyle={styles.container}
    >
      <View style={styles.welcomeBox}>
        <Text style={styles.title}>Olá, Bem-vindo! 🎉</Text>
        <Text style={styles.subtitle}>Este é o seu painel principal.</Text>
      </View>

      {/* Exemplo de Grid/Cards Responsivos */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Atividades</Text>
          <Text style={styles.cardData}>5 pendentes</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mensagens</Text>
          <Text style={styles.cardData}>2 novas</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: width * 0.05, // 5% de margem responsiva nas laterais
    alignItems: "center",
  },
  welcomeBox: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#f4c5e9",
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#9E7B92",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#ffffff",
  },
  cardContainer: {
    width: "100%",
    maxWidth: 500,
    flexDirection: "row", // Deixa os cards lado a lado se couberem
    justifyContent: "space-between",
    gap: 15,
  },
  card: {
    flex: 1, // Faz os cards dividirem o tamanho da tela igualmente
    backgroundColor: "#f9f9f9",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 2, // Sombra no Android
    shadowColor: "#000", // Sombra no iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#CE9DBB",
    marginBottom: 5,
  },
  cardData: {
    fontSize: 14,
    color: "#666",
  },
});
