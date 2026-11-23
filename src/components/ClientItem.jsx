import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colorFromString } from "../utils/randomColor";

export default function ClientItem({ client }) {
  const color = colorFromString(String(client.id));

  return (
    <View style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name="person" size={22} color="#fff" />
      </View>
      <Text>{client.name}</Text>
    </View>
  );
}