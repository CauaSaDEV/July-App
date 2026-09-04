import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Clientes() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tela de Clientes 📋</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    fontSize: 18,
    color: "#9E7B92",
    fontWeight: "bold",
  },
});
